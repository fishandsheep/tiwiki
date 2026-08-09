CREATE TABLE media_rights_new (
  asset_path TEXT PRIMARY KEY NOT NULL,
  file_page_url TEXT,
  author TEXT,
  source_url TEXT,
  license TEXT,
  permission_note TEXT,
  source_revision TEXT,
  status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (status IN ('verified', 'unverified', 'blocked', 'restored'))
);

INSERT INTO media_rights_new (
  asset_path, file_page_url, author, source_url, license,
  permission_note, source_revision, status
)
SELECT
  asset_path, file_page_url, author, source_url, license,
  permission_note, source_revision, status
FROM media_rights;

DROP TABLE media_rights;
ALTER TABLE media_rights_new RENAME TO media_rights;
