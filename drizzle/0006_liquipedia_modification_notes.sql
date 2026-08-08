UPDATE field_provenance
SET note = 'Parsed and normalized from upstream wikitext by crawler-v2'
WHERE source_kind = 'liquipedia' AND trim(coalesce(note, '')) = '';
