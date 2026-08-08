UPDATE teams
SET logo = ''
WHERE logo IN (SELECT asset_path FROM media_rights WHERE status != 'verified');

UPDATE players
SET avatar = ''
WHERE avatar IN (SELECT asset_path FROM media_rights WHERE status != 'verified');
