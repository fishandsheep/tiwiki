ALTER TABLE field_provenance ADD COLUMN value_json TEXT;
ALTER TABLE field_provenance ADD COLUMN observed_value_json TEXT;
ALTER TABLE participants ADD COLUMN display_name TEXT;

UPDATE participants
SET display_name = (
  SELECT teams.name FROM teams WHERE teams.id = participants.team_id
)
WHERE trim(coalesce(display_name, '')) = '';

UPDATE field_provenance
SET value_json = CASE field_name
  WHEN 'start_date' THEN (SELECT json_quote(start_date) FROM tournaments WHERE id = entity_id)
  WHEN 'end_date' THEN (SELECT json_quote(end_date) FROM tournaments WHERE id = entity_id)
  WHEN 'country' THEN (SELECT json_quote(country) FROM tournaments WHERE id = entity_id)
  WHEN 'city' THEN (SELECT json_quote(city) FROM tournaments WHERE id = entity_id)
  WHEN 'venue' THEN (SELECT json_quote(venue) FROM tournaments WHERE id = entity_id)
  WHEN 'prize_pool_usd' THEN (SELECT CAST(prize_pool_usd AS TEXT) FROM tournaments WHERE id = entity_id)
  WHEN 'champion_team_id' THEN (SELECT json_quote(champion_team_id) FROM tournaments WHERE id = entity_id)
  WHEN 'runner_up_team_id' THEN (SELECT json_quote(runner_up_team_id) FROM tournaments WHERE id = entity_id)
END
WHERE entity_type = 'tournament';

UPDATE field_provenance SET observed_value_json = value_json WHERE observed_value_json IS NULL;

INSERT OR IGNORE INTO field_provenance (
  entity_type, entity_id, field_name, source_kind, source_url,
  source_revision, fetched_at, verification_status, value_json, observed_value_json
)
SELECT 'tournament', id, field_name, 'liquipedia', liquipedia_url,
       NULL, fetched_at, 'single-source',
       CASE field_name
         WHEN 'country' THEN json_quote(country)
         WHEN 'city' THEN json_quote(city)
         WHEN 'venue' THEN json_quote(venue)
       END,
       CASE field_name
         WHEN 'country' THEN json_quote(country)
         WHEN 'city' THEN json_quote(city)
         WHEN 'venue' THEN json_quote(venue)
       END
FROM tournaments
CROSS JOIN (
  SELECT 'country' AS field_name UNION ALL
  SELECT 'city' UNION ALL
  SELECT 'venue'
)
WHERE trim(coalesce(liquipedia_url, '')) != '';
