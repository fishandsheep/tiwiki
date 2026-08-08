CREATE TABLE IF NOT EXISTS team_aliases (
  alias TEXT PRIMARY KEY NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  source TEXT NOT NULL DEFAULT 'curated'
);

CREATE TABLE IF NOT EXISTS player_aliases (
  alias TEXT PRIMARY KEY NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(id),
  source TEXT NOT NULL DEFAULT 'curated'
);

CREATE TABLE IF NOT EXISTS team_lineage (
  predecessor_team_id TEXT NOT NULL REFERENCES teams(id),
  successor_team_id TEXT NOT NULL REFERENCES teams(id),
  changed_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (predecessor_team_id, successor_team_id)
);

CREATE TABLE IF NOT EXISTS field_provenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('official', 'liquipedia', 'wikipedia', 'curated')),
  source_url TEXT NOT NULL,
  source_revision TEXT,
  fetched_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'single-source'
    CHECK (verification_status IN ('single-source', 'verified', 'pending')),
  note TEXT NOT NULL DEFAULT '',
  UNIQUE (entity_type, entity_id, field_name, source_kind, source_url)
);

CREATE TABLE IF NOT EXISTS field_overrides (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value_json TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_url TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, field_name)
);

CREATE TABLE IF NOT EXISTS refresh_runs (
  id TEXT PRIMARY KEY NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  source_revision TEXT,
  parser_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'passed', 'failed')),
  manifest_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS media_rights (
  asset_path TEXT PRIMARY KEY NOT NULL,
  file_page_url TEXT,
  author TEXT,
  source_url TEXT,
  license TEXT,
  permission_note TEXT,
  source_revision TEXT,
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('verified', 'unverified', 'blocked'))
);

INSERT OR IGNORE INTO team_aliases (alias, team_id, source) VALUES
  ('made-in-thailand', 'mith-trust', 'TI1 canonical correction'),
  ('Made in Thailand', 'mith-trust', 'TI1 canonical correction'),
  ('mortal-teamwork', 'mtw', 'TI2 canonical correction'),
  ('Mortal Teamwork', 'mtw', 'TI2 canonical correction');

UPDATE placements SET team_id = 'mith-trust'
WHERE tournament_id = 'ti1' AND team_id = 'made-in-thailand';

UPDATE placements SET team_id = 'mtw'
WHERE tournament_id = 'ti2' AND team_id = 'mortal-teamwork';

UPDATE tournaments SET prize_pool_usd = 1600000 WHERE id IN ('ti1', 'ti2');

UPDATE teams SET logo = '' WHERE id IN ('tnc-pro-team', 'nouns-esports');

INSERT OR IGNORE INTO field_provenance (
  entity_type, entity_id, field_name, source_kind, source_url, fetched_at, verification_status
)
SELECT 'tournament', id, field_name, 'liquipedia', liquipedia_url, fetched_at, 'single-source'
FROM tournaments
CROSS JOIN (
  SELECT 'start_date' AS field_name UNION ALL
  SELECT 'end_date' UNION ALL
  SELECT 'prize_pool_usd' UNION ALL
  SELECT 'champion_team_id' UNION ALL
  SELECT 'runner_up_team_id'
)
WHERE trim(coalesce(liquipedia_url, '')) != '';

INSERT OR IGNORE INTO media_rights (asset_path, source_url, status)
SELECT logo, logo_source_url, 'unverified' FROM teams WHERE logo LIKE '/media/%';

INSERT OR IGNORE INTO media_rights (asset_path, source_url, status)
SELECT avatar, avatar_source_url, 'unverified' FROM players WHERE avatar LIKE '/media/%';
