import Database from 'better-sqlite3'
import { existsSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export interface DataAuditOptions {
  mediaRoot: string
  now?: Date
  ongoingMaxAgeDays?: number
}

export interface DataAuditReport {
  ok: boolean
  errors: string[]
  warnings: string[]
}

type TournamentRow = {
  id: string
  status: string
  start_date: string | null
  end_date: string | null
  country: string | null
  city: string | null
  venue: string | null
  prize_pool_usd: number | null
  champion_team_id: string | null
  runner_up_team_id: string | null
  liquipedia_url: string | null
  fetched_at: string | null
}

function localMediaErrors(
  sqlite: Database.Database,
  table: 'teams' | 'players',
  field: 'logo' | 'avatar',
  mediaRoot: string,
) {
  const errors: string[] = []
  const warnings: string[] = []
  const warnedPaths = new Set<string>()
  const mediaBase = resolve(mediaRoot, 'media')
  const rights = sqlite.prepare(`
    select status, file_page_url, author, source_url, license, permission_note, source_revision
    from media_rights where asset_path = ?
  `)
  const rows = sqlite
    .prepare(`select id, ${field} as media from ${table} where ${field} like '/media/%'`)
    .all() as Array<{ id: string; media: string }>
  for (const row of rows) {
    const path = resolve(mediaRoot, row.media.replace(/^\/+/, ''))
    if (path !== mediaBase && !path.startsWith(`${mediaBase}${sep}`)) {
      errors.push(`${table} ${row.id} media path ${row.media} escapes public media root`)
    }
    if (!existsSync(path)) errors.push(`${table} ${row.id} references missing local media ${row.media}`)
    const record = rights.get(row.media) as Record<string, string | null> | undefined
    const complete = record?.status === 'verified'
      && ['file_page_url', 'author', 'source_url', 'license', 'permission_note', 'source_revision']
        .every((field) => record[field]?.trim())
    const restored = record?.status === 'restored'
      && record.source_url?.trim()
      && record.permission_note?.trim()
    if (!complete && !restored) errors.push(`${table} ${row.id} media ${row.media} has no verified rights record`)
    if (restored) warnedPaths.add(row.media)
  }
  if (warnedPaths.size) {
    warnings.push(`${table} has ${warnedPaths.size} media assets restored from the historical archive and pending rights verification`)
  }
  return { errors, warnings }
}

export function auditDatabase(sqlite: Database.Database, options: DataAuditOptions): DataAuditReport {
  const errors: string[] = []
  const warnings: string[] = []
  const now = options.now ?? new Date()
  const ongoingMaxAgeMs = (options.ongoingMaxAgeDays ?? 2) * 24 * 60 * 60 * 1000

  const foreignKeys = sqlite.prepare('pragma foreign_key_check').all() as Array<{ table: string; rowid: number }>
  for (const row of foreignKeys) errors.push(`foreign key violation in ${row.table} row ${row.rowid}`)

  const tournaments = sqlite.prepare(`
    select id, status, start_date, end_date, country, city, venue,
           prize_pool_usd, champion_team_id, runner_up_team_id,
           liquipedia_url, fetched_at
    from tournaments
  `).all() as TournamentRow[]

  const placementExists = sqlite.prepare(`
    select 1 from placements where tournament_id = ? and team_id = ? and rank = ? limit 1
  `)
  const provenanceForField = sqlite.prepare(`
    select source_url, source_revision, fetched_at, verification_status
    from field_provenance
    where entity_type = 'tournament' and entity_id = ? and field_name = ?
    order by case source_kind
      when 'official' then 1 when 'curated' then 2 when 'liquipedia' then 3 else 4 end
  `)
  for (const tournament of tournaments) {
    const requiredFields = tournament.status === 'cancelled'
      ? []
      : ['start_date', 'end_date', 'country', 'city'] as const
    for (const field of requiredFields) {
      if (!tournament[field]?.trim()) errors.push(`tournament ${tournament.id} missing core field ${field}`)
    }
    if (tournament.status === 'completed') {
      if (tournament.prize_pool_usd == null || tournament.prize_pool_usd <= 0) {
        errors.push(`completed tournament ${tournament.id} has no confirmed prize pool`)
      }
      if (!tournament.champion_team_id || !placementExists.get(tournament.id, tournament.champion_team_id, 1)) {
        errors.push(`completed tournament ${tournament.id} has no matching champion placement`)
      }
      if (!tournament.runner_up_team_id || !placementExists.get(tournament.id, tournament.runner_up_team_id, 2)) {
        errors.push(`completed tournament ${tournament.id} has no matching runner-up placement`)
      }
    }
    const provenanceFields = tournament.status === 'cancelled'
      ? []
      : tournament.status === 'completed'
        ? [...requiredFields, 'prize_pool_usd', 'champion_team_id', 'runner_up_team_id']
        : requiredFields
    for (const field of provenanceFields) {
      const sources = provenanceForField.all(tournament.id, field) as Array<{
        source_url: string | null
        source_revision: string | null
        fetched_at: string | null
        verification_status: string | null
      }>
      if (!sources.some((source) => source.source_url?.trim()
        && source.source_revision?.trim()
        && source.fetched_at?.trim()
        && source.verification_status?.trim())) {
        errors.push(`tournament ${tournament.id} has incomplete provenance for ${field}`)
      }
    }
    if (!tournament.liquipedia_url?.trim()) {
      errors.push(`tournament ${tournament.id} has no source URL`)
    }
    if (tournament.status === 'ongoing') {
      const fetchedAt = tournament.fetched_at ? new Date(tournament.fetched_at) : null
      if (!fetchedAt || Number.isNaN(fetchedAt.getTime()) || now.getTime() - fetchedAt.getTime() > ongoingMaxAgeMs) {
        errors.push(`ongoing tournament ${tournament.id} exceeds freshness SLA`)
      }
    }
  }

  const outsideParticipants = sqlite.prepare(`
    select placements.tournament_id as tournament_id, placements.team_id as team_id
    from placements
    left join participants
      on participants.tournament_id = placements.tournament_id
     and participants.team_id = placements.team_id
    where participants.id is null
  `).all() as Array<{ tournament_id: string; team_id: string }>
  for (const row of outsideParticipants) {
    errors.push(`placement team ${row.team_id} is not a participant of ${row.tournament_id}`)
  }

  const participantsWithoutPlacement = sqlite.prepare(`
    select participants.tournament_id as tournament_id, participants.team_id as team_id
    from participants
    inner join tournaments on tournaments.id = participants.tournament_id
    left join placements
      on placements.tournament_id = participants.tournament_id
     and placements.team_id = participants.team_id
    where tournaments.status = 'completed' and placements.id is null
  `).all() as Array<{ tournament_id: string; team_id: string }>
  for (const row of participantsWithoutPlacement) {
    errors.push(`participant team ${row.team_id} has no final placement in ${row.tournament_id}`)
  }

  for (const media of [
    localMediaErrors(sqlite, 'teams', 'logo', options.mediaRoot),
    localMediaErrors(sqlite, 'players', 'avatar', options.mediaRoot),
  ]) {
    errors.push(...media.errors)
    warnings.push(...media.warnings)
  }

  const missingSummaries = sqlite.prepare(`
    select count(*) as count from tournaments
    where status != 'cancelled' and trim(coalesce(summary_zh, '')) = ''
  `).get() as { count: number }
  if (missingSummaries.count) warnings.push(`${missingSummaries.count} tournaments have no curated Chinese summary`)

  return { ok: errors.length === 0, errors, warnings }
}

function runCli() {
  const dbPath = resolve(process.cwd(), process.argv[2] || 'data/ti.db')
  const sqlite = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const report = auditDatabase(sqlite, { mediaRoot: resolve(process.cwd(), 'public') })
    for (const warning of report.warnings) console.warn(`warning: ${warning}`)
    for (const error of report.errors) console.error(`error: ${error}`)
    if (!report.ok) process.exitCode = 1
    else console.log('data audit passed')
  } finally {
    sqlite.close()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) runCli()
