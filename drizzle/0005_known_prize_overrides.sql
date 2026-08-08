INSERT INTO field_overrides (
  entity_type, entity_id, field_name, value_json, reason, source_url, updated_at
) VALUES
  (
    'tournament', 'ti1', 'prize_pool_usd', '1600000',
    'Liquipedia no longer exposes the historical prizepool transclusion; preserve the reviewed total.',
    'https://liquipedia.net/dota2/The_International/2011', '2026-08-08T00:00:00Z'
  ),
  (
    'tournament', 'ti2', 'prize_pool_usd', '1600000',
    'Liquipedia no longer exposes the historical prizepool transclusion; preserve the reviewed total.',
    'https://liquipedia.net/dota2/The_International/2012', '2026-08-08T00:00:00Z'
  )
ON CONFLICT(entity_type, entity_id, field_name) DO UPDATE SET
  value_json = excluded.value_json,
  reason = excluded.reason,
  source_url = excluded.source_url,
  updated_at = excluded.updated_at;
