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
  team_logo TEXT DEFAULT '',
  team_logo_source_url TEXT DEFAULT '',
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
  player_avatar TEXT DEFAULT '',
  player_avatar_source_url TEXT DEFAULT '',
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
addColumnIfMissing('participants', 'team_logo', "TEXT DEFAULT ''")
addColumnIfMissing('participants', 'team_logo_source_url', "TEXT DEFAULT ''")
addColumnIfMissing('rosters', 'player_avatar', "TEXT DEFAULT ''")
addColumnIfMissing('rosters', 'player_avatar_source_url', "TEXT DEFAULT ''")
addColumnIfMissing('rosters', 'player_country', "TEXT DEFAULT ''")

db.close()
console.log(`migrated ${dbPath}`)
