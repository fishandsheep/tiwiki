import test from 'node:test'
import assert from 'node:assert/strict'
import Database from 'better-sqlite3'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { AdminConflictError, AdminValidationError, createAdminService } from '../services/admin'
import { readFileSync } from 'node:fs'

function createTestDb() {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE tournaments (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      ti_no INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_zh TEXT,
      year INTEGER NOT NULL,
      start_date TEXT,
      end_date TEXT,
      country TEXT,
      city TEXT,
      venue TEXT,
      prize_pool_usd INTEGER DEFAULT 0,
      champion_team_id TEXT,
      runner_up_team_id TEXT,
      summary_zh TEXT DEFAULT '',
      china_summary TEXT DEFAULT '',
      liquipedia_url TEXT,
      wikipedia_url TEXT,
      fetched_at TEXT
    );

    CREATE TABLE teams (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      name_zh TEXT,
      region TEXT,
      country TEXT,
      logo TEXT DEFAULT '',
      logo_source_url TEXT DEFAULT '',
      description_zh TEXT DEFAULT '',
      liquipedia_url TEXT
    );

    CREATE TABLE players (
      id TEXT PRIMARY KEY NOT NULL,
      handle TEXT NOT NULL,
      real_name TEXT,
      country TEXT,
      region TEXT,
      avatar TEXT DEFAULT '',
      avatar_source_url TEXT DEFAULT '',
      position TEXT,
      homepage_url TEXT DEFAULT '',
      liquipedia_url TEXT
    );

    CREATE TABLE placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      rank INTEGER NOT NULL,
      prize_usd INTEGER DEFAULT 0,
      is_china_team INTEGER DEFAULT 0,
      UNIQUE (tournament_id, team_id)
    );

    CREATE TABLE participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      region TEXT,
      country TEXT,
      invite_type TEXT,
      seed TEXT,
      UNIQUE (tournament_id, team_id)
    );

    CREATE TABLE rosters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      player_id TEXT NOT NULL REFERENCES players(id),
      role TEXT,
      player_country TEXT DEFAULT '',
      UNIQUE (tournament_id, team_id, player_id)
    );
  `)
  db.prepare('insert into teams (id, name, region) values (?, ?, ?)').run('wings', 'Wings Gaming', 'China')
  db.prepare('insert into teams (id, name, region) values (?, ?, ?)').run('dc', 'Digital Chaos', 'North America')
  db.prepare('insert into players (id, handle, country) values (?, ?, ?)').run('shadow', 'Shadow', 'China')
  db.prepare('insert into tournaments (id, status, ti_no, name, year) values (?, ?, ?, ?, ?)').run(
    'ti6',
    'completed',
    6,
    'The International 2016',
    2016,
  )
  return db
}

test('admin service lists table rows and metadata', () => {
  const db = createTestDb()
  const admin = createAdminService(db)

  const meta = admin.getMeta()
  assert.ok(meta.tables.some((table) => table.name === 'teams' && table.rowCount === 2))
  assert.ok(meta.options.teams.some((option) => option.value === 'wings'))
  const participants = meta.tables.find((table) => table.name === 'participants')
  const rosters = meta.tables.find((table) => table.name === 'rosters')
  assert.ok(participants)
  assert.ok(rosters)
  assert.ok(!participants.fields.some((field) => field.name === 'team_logo' || field.name === 'team_logo_source_url'))
  assert.ok(!rosters.fields.some((field) => field.name === 'player_avatar' || field.name === 'player_avatar_source_url'))
  const players = meta.tables.find((table) => table.name === 'players')
  assert.ok(players)
  assert.ok(!players.fields.some((field) => field.name === 'homepage_url'))
  assert.equal(players.fields.find((field) => field.name === 'avatar')?.type, 'text')

  const list = admin.listRows('teams', { search: 'Wings', pageSize: 10 })
  assert.equal(list.total, 1)
  assert.equal(list.rows[0].id, 'wings')
  db.close()
})

test('admin service creates and updates simple rows', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)

  const created = await admin.createRow('players', {
    id: 'blink',
    handle: 'Blink',
    country: 'China',
    position: '',
    liquipedia_url: 'https://liquipedia.net/dota2/Blink',
  })
  assert.equal(created?.id, 'blink')
  assert.equal(created?.position, null)
  assert.equal(created?.homepage_url, '')
  assert.equal(created?.liquipedia_url, 'https://liquipedia.net/dota2/Blink')

  const updated = await admin.updateRow('players', 'blink', { handle: 'Blinker', country: 'CN', homepage_url: 'https://example.com/blink' })
  assert.equal(updated?.handle, 'Blinker')
  assert.equal(updated?.country, 'CN')
  assert.equal(updated?.homepage_url, '')
  db.close()
})

test('admin service reports avatar source network failures as validation errors', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => Promise.reject(new TypeError('fetch failed'))) as typeof fetch

  try {
    await assert.rejects(
      () => admin.updateRow('players', 'shadow', { avatar_source_url: 'https://example.com/avatar.png' }),
      AdminValidationError,
    )
  } finally {
    globalThis.fetch = originalFetch
    db.close()
  }
})

test('admin service keeps original avatar format for local file sources', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)
  const tempDir = mkdtempSync(join(tmpdir(), 'tiwiki-avatar-test-'))
  const originalCwd = process.cwd()
  const playerId = 'avatar-test-fixture'
  const pngPath = join(tempDir, 'avatar.png')
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQAAAAA3bvkkAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRAAB3YoTpAAAAAd0SU1FB+oGFw85L5eM/xwAAAAKSURBVAjXY2gAAACCAIHdQ2r0AAAAAElFTkSuQmCC',
    'base64',
  )
  writeFileSync(pngPath, pngBytes)
  db.prepare('insert into players (id, handle, country) values (?, ?, ?)').run(playerId, 'Avatar Fixture', 'CN')
  process.chdir(resolve(originalCwd))

  try {
    const updated = await admin.updateRow('players', playerId, { avatar_source_url: pathToFileURL(pngPath).toString() })
    assert.equal(updated?.avatar_source_url, pathToFileURL(pngPath).toString())
    assert.match(String(updated?.avatar), /^\/media\/liquipedia\/players\/avatar-test-fixture\.(png|apng)$/)
  } finally {
    process.chdir(originalCwd)
    rmSync(tempDir, { recursive: true, force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.png'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.apng'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.jpg'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.jpeg'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.webp'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.gif'), { force: true })
    rmSync(resolve(originalCwd, 'public/media/liquipedia/players/avatar-test-fixture.svg'), { force: true })
    db.close()
  }
})

test('admin service writes jpeg avatars with high-quality encoding', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)
  const tempDir = mkdtempSync(join(tmpdir(), 'tiwiki-avatar-jpeg-test-'))
  const originalCwd = process.cwd()
  const playerId = 'avatar-jpeg-fixture'
  const jpegPath = join(tempDir, 'avatar.jpg')
  const jpegBytes = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAAAAAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAACAAIBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==',
    'base64',
  )
  writeFileSync(jpegPath, jpegBytes)
  db.prepare('insert into players (id, handle, country) values (?, ?, ?)').run(playerId, 'JPEG Fixture', 'CN')
  const outputPath = resolve(originalCwd, `public/media/liquipedia/players/${playerId}.jpg`)

  try {
    const updated = await admin.updateRow('players', playerId, { avatar_source_url: pathToFileURL(jpegPath).toString() })
    assert.equal(updated?.avatar, `/media/liquipedia/players/${playerId}.jpg`)
    const info = readFileSync(outputPath)
    assert.ok(info.length > 0)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
    rmSync(outputPath, { force: true })
    db.close()
  }
})

test('admin service handles relational rows and boolean normalization', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)

  const placement = await admin.createRow('placements', {
    tournament_id: 'ti6',
    team_id: 'wings',
    rank: '1',
    prize_usd: '9123456',
    is_china_team: true,
  })

  assert.equal(placement?.rank, 1)
  assert.equal(placement?.is_china_team, 1)
  db.close()
})

test('admin service returns validation and conflict errors', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)

  await assert.rejects(() => admin.createRow('teams', { id: 'x' }), AdminValidationError)
  await assert.rejects(
    () => admin.createRow('placements', { tournament_id: 'missing', team_id: 'wings', rank: 1 }),
    AdminConflictError,
  )
  await assert.rejects(() => admin.createRow('teams', { id: 'wings', name: 'Duplicate' }), AdminConflictError)
  db.close()
})

test('admin service blocks deleting referenced rows', async () => {
  const db = createTestDb()
  const admin = createAdminService(db)
  await admin.createRow('placements', { tournament_id: 'ti6', team_id: 'wings', rank: 1 })

  assert.throws(() => admin.deleteRow('teams', 'wings'), AdminConflictError)
  assert.deepEqual(admin.deleteRow('placements', 1), { ok: true })
  assert.deepEqual(admin.deleteRow('teams', 'wings'), { ok: true })
  db.close()
})
