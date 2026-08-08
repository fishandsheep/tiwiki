import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { auditDatabase } from '../../scripts/db/audit'

function createFixture() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE tournaments (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      ti_no INTEGER NOT NULL,
      year INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      country TEXT,
      city TEXT,
      venue TEXT,
      prize_pool_usd INTEGER,
      champion_team_id TEXT,
      runner_up_team_id TEXT,
      liquipedia_url TEXT,
      fetched_at TEXT,
      summary_zh TEXT
    );
    CREATE TABLE teams (id TEXT PRIMARY KEY, logo TEXT);
    CREATE TABLE players (id TEXT PRIMARY KEY, avatar TEXT);
    CREATE TABLE participants (
      id INTEGER PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id)
    );
    CREATE TABLE placements (
      id INTEGER PRIMARY KEY,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      rank INTEGER NOT NULL,
      prize_usd INTEGER
    );
    CREATE TABLE media_rights (
      asset_path TEXT PRIMARY KEY,
      file_page_url TEXT,
      author TEXT,
      source_url TEXT,
      license TEXT,
      permission_note TEXT,
      source_revision TEXT,
      status TEXT NOT NULL
    );
    CREATE TABLE field_provenance (
      entity_type TEXT,
      entity_id TEXT,
      field_name TEXT,
      source_kind TEXT,
      source_url TEXT,
      source_revision TEXT,
      fetched_at TEXT,
      verification_status TEXT
    );
  `)
  db.exec(`
    INSERT INTO teams VALUES ('champion', '/media/teams/champion.png');
    INSERT INTO teams VALUES ('runner-up', '');
    INSERT INTO tournaments VALUES (
      'ti-test', 'completed', 99, 2099,
      '2099-08-01', '2099-08-31', 'Testland', 'Test City', 'Test Arena', 1600000,
      'champion', 'runner-up', 'https://liquipedia.net/dota2/Test', '2099-08-01T00:00:00Z',
      'A verified tournament fixture.'
    );
    INSERT INTO participants VALUES (1, 'ti-test', 'champion');
    INSERT INTO participants VALUES (2, 'ti-test', 'runner-up');
    INSERT INTO placements VALUES (1, 'ti-test', 'champion', 1, 1000000);
    INSERT INTO placements VALUES (2, 'ti-test', 'runner-up', 2, 600000);
    INSERT INTO media_rights VALUES (
      '/media/teams/champion.png', 'https://example.test/file', 'Author',
      'https://example.test/source', 'CC BY 4.0', 'Permission confirmed', '42', 'verified'
    );
  `)
  for (const field of ['start_date', 'end_date', 'country', 'city', 'venue', 'prize_pool_usd', 'champion_team_id', 'runner_up_team_id']) {
    db.prepare('INSERT INTO field_provenance VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      'tournament', 'ti-test', field, 'liquipedia', 'https://liquipedia.net/dota2/Test',
      '42', '2099-08-01T00:00:00Z', 'verified',
    )
  }
  const mediaRoot = mkdtempSync(join(tmpdir(), 'tiwiki-audit-'))
  mkdirSync(join(mediaRoot, 'media/teams'), { recursive: true })
  writeFileSync(join(mediaRoot, 'media/teams/champion.png'), 'fixture')
  return { db, mediaRoot }
}

test('data audit accepts a coherent completed tournament', () => {
  const fixture = createFixture()
  try {
    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, true, report.errors.join('\n'))
    assert.deepEqual(report.errors, [])
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})

test('data audit rejects unknown completed prize pools and placement aliases outside participants', () => {
  const fixture = createFixture()
  try {
    fixture.db.prepare('UPDATE tournaments SET prize_pool_usd = NULL WHERE id = ?').run('ti-test')
    fixture.db.prepare('INSERT INTO teams VALUES (?, ?)').run('split-alias', '')
    fixture.db.prepare('UPDATE placements SET team_id = ? WHERE rank = 2').run('split-alias')

    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('completed tournament ti-test has no confirmed prize pool')))
    assert.ok(report.errors.some((error) => error.includes('placement team split-alias is not a participant of ti-test')))
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})

test('data audit rejects broken local media references', () => {
  const fixture = createFixture()
  try {
    fixture.db.prepare('UPDATE teams SET logo = ? WHERE id = ?').run('/media/teams/missing.png', 'champion')
    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('missing local media /media/teams/missing.png')))
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})

test('data audit rejects unverified media and paths escaping the public media root', () => {
  const fixture = createFixture()
  try {
    fixture.db.prepare('UPDATE media_rights SET status = ?').run('unverified')
    fixture.db.prepare('UPDATE teams SET logo = ? WHERE id = ?').run('/media/../../secret.png', 'champion')
    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('escapes public media root')))
    assert.ok(report.errors.some((error) => error.includes('has no verified rights record')))
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})

test('data audit rejects missing core fields and incomplete provenance', () => {
  const fixture = createFixture()
  try {
    fixture.db.prepare('UPDATE tournaments SET city = ?').run('')
    fixture.db.prepare("UPDATE field_provenance SET source_revision = '' WHERE field_name = 'prize_pool_usd'").run()
    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('missing core field city')))
    assert.ok(report.errors.some((error) => error.includes('incomplete provenance for prize_pool_usd')))
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})

test('data audit rejects completed participants without final placements', () => {
  const fixture = createFixture()
  try {
    fixture.db.prepare('INSERT INTO teams VALUES (?, ?)').run('former-team', '')
    fixture.db.prepare('INSERT INTO participants VALUES (?, ?, ?)').run(3, 'ti-test', 'former-team')
    const report = auditDatabase(fixture.db, {
      mediaRoot: fixture.mediaRoot,
      now: new Date('2099-08-02T00:00:00Z'),
    })
    assert.equal(report.ok, false)
    assert.ok(report.errors.some((error) => error.includes('participant team former-team has no final placement')))
  } finally {
    fixture.db.close()
    rmSync(fixture.mediaRoot, { recursive: true, force: true })
  }
})
