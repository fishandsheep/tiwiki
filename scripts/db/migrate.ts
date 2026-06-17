import Database from 'better-sqlite3'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

const dbPath = resolve(process.cwd(), 'data/ti.db')
mkdirSync(dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS tournaments (
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

CREATE TABLE IF NOT EXISTS teams (
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

CREATE TABLE IF NOT EXISTS players (
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

CREATE TABLE IF NOT EXISTS placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  rank INTEGER NOT NULL,
  prize_usd INTEGER DEFAULT 0,
  is_china_team INTEGER DEFAULT 0,
  UNIQUE (tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  region TEXT,
  country TEXT,
  invite_type TEXT,
  seed TEXT,
  UNIQUE (tournament_id, team_id)
);

CREATE TABLE IF NOT EXISTS rosters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  team_id TEXT NOT NULL REFERENCES teams(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  role TEXT,
  player_country TEXT DEFAULT '',
  UNIQUE (tournament_id, team_id, player_id)
);
`)

function addColumnIfMissing(table: string, column: string, definition: string) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  if (existing.some((row) => row.name === column)) return
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
}

addColumnIfMissing('teams', 'logo_source_url', "TEXT DEFAULT ''")
addColumnIfMissing('players', 'avatar', "TEXT DEFAULT ''")
addColumnIfMissing('players', 'avatar_source_url', "TEXT DEFAULT ''")
addColumnIfMissing('players', 'homepage_url', "TEXT DEFAULT ''")
addColumnIfMissing('rosters', 'player_country', "TEXT DEFAULT ''")

db.exec(`
  UPDATE players
  SET homepage_url = liquipedia_url
  WHERE (homepage_url IS NULL OR homepage_url = '')
    AND liquipedia_url IS NOT NULL
    AND liquipedia_url != '';
`)

function columnsFor(table: string) {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>).map((row) => row.name)
}

function dropLegacyParticipantMediaColumns() {
  const columns = columnsFor('participants')
  if (!columns.includes('team_logo') && !columns.includes('team_logo_source_url')) return

  db.exec(`
    UPDATE teams
    SET logo = (
      SELECT participants.team_logo
      FROM participants
      WHERE participants.team_id = teams.id
        AND participants.team_logo IS NOT NULL
        AND participants.team_logo != ''
      ORDER BY CASE WHEN participants.team_logo LIKE '/media/%' THEN 0 ELSE 1 END, participants.id DESC
      LIMIT 1
    )
    WHERE (logo IS NULL OR logo = '')
      AND EXISTS (
        SELECT 1
        FROM participants
        WHERE participants.team_id = teams.id
          AND participants.team_logo IS NOT NULL
          AND participants.team_logo != ''
      );

    UPDATE teams
    SET logo_source_url = (
      SELECT participants.team_logo_source_url
      FROM participants
      WHERE participants.team_id = teams.id
        AND participants.team_logo_source_url IS NOT NULL
        AND participants.team_logo_source_url != ''
      ORDER BY participants.id DESC
      LIMIT 1
    )
    WHERE (logo_source_url IS NULL OR logo_source_url = '')
      AND EXISTS (
        SELECT 1
        FROM participants
        WHERE participants.team_id = teams.id
          AND participants.team_logo_source_url IS NOT NULL
          AND participants.team_logo_source_url != ''
      );

    CREATE TABLE participants_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      region TEXT,
      country TEXT,
      invite_type TEXT,
      seed TEXT,
      UNIQUE (tournament_id, team_id)
    );

    INSERT INTO participants_new (id, tournament_id, team_id, region, country, invite_type, seed)
    SELECT id, tournament_id, team_id, region, country, invite_type, seed
    FROM participants;

    DROP TABLE participants;
    ALTER TABLE participants_new RENAME TO participants;
  `)
}

function dropLegacyRosterMediaColumns() {
  const columns = columnsFor('rosters')
  if (!columns.includes('player_avatar') && !columns.includes('player_avatar_source_url')) return

  db.exec(`
    UPDATE players
    SET avatar = (
      SELECT rosters.player_avatar
      FROM rosters
      WHERE rosters.player_id = players.id
        AND rosters.player_avatar IS NOT NULL
        AND rosters.player_avatar != ''
      ORDER BY CASE WHEN rosters.player_avatar LIKE '/media/%' THEN 0 ELSE 1 END, rosters.id DESC
      LIMIT 1
    )
    WHERE (avatar IS NULL OR avatar = '')
      AND EXISTS (
        SELECT 1
        FROM rosters
        WHERE rosters.player_id = players.id
          AND rosters.player_avatar IS NOT NULL
          AND rosters.player_avatar != ''
      );

    UPDATE players
    SET avatar_source_url = (
      SELECT rosters.player_avatar_source_url
      FROM rosters
      WHERE rosters.player_id = players.id
        AND rosters.player_avatar_source_url IS NOT NULL
        AND rosters.player_avatar_source_url != ''
      ORDER BY rosters.id DESC
      LIMIT 1
    )
    WHERE (avatar_source_url IS NULL OR avatar_source_url = '')
      AND EXISTS (
        SELECT 1
        FROM rosters
        WHERE rosters.player_id = players.id
          AND rosters.player_avatar_source_url IS NOT NULL
          AND rosters.player_avatar_source_url != ''
      );

    CREATE TABLE rosters_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id),
      team_id TEXT NOT NULL REFERENCES teams(id),
      player_id TEXT NOT NULL REFERENCES players(id),
      role TEXT,
      player_country TEXT DEFAULT '',
      UNIQUE (tournament_id, team_id, player_id)
    );

    INSERT INTO rosters_new (id, tournament_id, team_id, player_id, role, player_country)
    SELECT id, tournament_id, team_id, player_id, role, player_country
    FROM rosters;

    DROP TABLE rosters;
    ALTER TABLE rosters_new RENAME TO rosters;
  `)
}

db.transaction(() => {
  dropLegacyParticipantMediaColumns()
  dropLegacyRosterMediaColumns()
})()

db.close()
console.log(`migrated ${dbPath}`)
