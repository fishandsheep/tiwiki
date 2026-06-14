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
  description_zh TEXT DEFAULT '',
  liquipedia_url TEXT
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY NOT NULL,
  handle TEXT NOT NULL,
  real_name TEXT,
  country TEXT,
  region TEXT,
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
  UNIQUE (tournament_id, team_id, player_id)
);
`)

db.close()
console.log(`migrated ${dbPath}`)
