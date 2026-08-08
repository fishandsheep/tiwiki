import Database from 'better-sqlite3'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

import { auditDatabase } from './db/audit'

const coreFields = [
  'status', 'start_date', 'end_date', 'country', 'city', 'venue',
  'prize_pool_usd', 'champion_team_id', 'runner_up_team_id', 'fetched_at',
] as const

type CoreRow = { id: string } & Record<(typeof coreFields)[number], string | number | null>

function coreRows(db: Database.Database) {
  return db.prepare(`SELECT id, ${coreFields.join(', ')} FROM tournaments ORDER BY ti_no`).all() as CoreRow[]
}

const root = process.cwd()
const currentPath = resolve(root, 'data/ti.db')
const temporary = mkdtempSync(join(tmpdir(), 'tiwiki-refresh-report-'))
const baselinePath = join(temporary, 'baseline.db')

try {
  const baselineBytes = spawnSync('git', ['show', 'HEAD:data/ti.db'], {
    cwd: root,
    encoding: null,
    maxBuffer: 64 * 1024 * 1024,
  })
  if (baselineBytes.status !== 0 || !baselineBytes.stdout?.length) {
    throw new Error('cannot read baseline data/ti.db from HEAD')
  }
  writeFileSync(baselinePath, baselineBytes.stdout)

  const current = new Database(currentPath, { readonly: true, fileMustExist: true })
  const baseline = new Database(baselinePath, { readonly: true, fileMustExist: true })
  try {
    const before = new Map(coreRows(baseline).map((row) => [row.id, row]))
    const changes = coreRows(current).flatMap((row) => coreFields
      .filter((field) => before.get(row.id)?.[field] !== row[field])
      .map((field) => ({
        tournamentId: row.id,
        field,
        before: before.get(row.id)?.[field] ?? null,
        after: row[field],
      })))
    if (!changes.length) {
      console.log('no core data changes; refresh report unchanged')
    } else {
      const refresh = current.prepare(`
      SELECT completed_at, source_revision, parser_version, manifest_json
      FROM refresh_runs WHERE status = 'passed' ORDER BY completed_at DESC LIMIT 1
    `).get() as { completed_at: string; source_revision: string; parser_version: string; manifest_json: string }
    const audit = auditDatabase(current, { mediaRoot: resolve(root, 'public') })
    const report = {
      generatedAt: new Date().toISOString(),
      refresh: {
        completedAt: refresh.completed_at,
        sourceRevision: refresh.source_revision,
        parserVersion: refresh.parser_version,
        manifest: JSON.parse(refresh.manifest_json),
      },
      changes,
      audit,
      entityMappings: {
        teamAliases: (current.prepare('SELECT COUNT(*) AS count FROM team_aliases').get() as { count: number }).count,
        playerAliases: (current.prepare('SELECT COUNT(*) AS count FROM player_aliases').get() as { count: number }).count,
        teamLineage: (current.prepare('SELECT COUNT(*) AS count FROM team_lineage').get() as { count: number }).count,
      },
      media: {
        verified: (current.prepare("SELECT COUNT(*) AS count FROM media_rights WHERE status = 'verified'").get() as { count: number }).count,
        quarantined: (current.prepare("SELECT COUNT(*) AS count FROM media_rights WHERE status != 'verified'").get() as { count: number }).count,
      },
    }
    const reportDir = resolve(root, 'data/refresh-reports')
    mkdirSync(reportDir, { recursive: true })
    writeFileSync(resolve(reportDir, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`)
    const table = changes.map((change) => `| ${change.tournamentId} | ${change.field} | ${String(change.before)} | ${String(change.after)} |`).join('\n')
    writeFileSync(resolve(reportDir, 'latest.md'), `# Data refresh report

- Completed: ${refresh.completed_at}
- Parser: ${refresh.parser_version}
- Revisions: ${refresh.source_revision}
- Audit: ${audit.ok ? 'passed' : 'failed'}

| Tournament | Field | Before | After |
| --- | --- | --- | --- |
${table}
`)
      console.log(`wrote refresh report with ${changes.length} core changes`)
    }
  } finally {
    current.close()
    baseline.close()
  }
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
