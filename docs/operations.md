# Operations runbook

## Refresh SLA

- Off season: inspect the latest source monthly.
- Qualifiers through TI completion: refresh daily.
- Confirmed results: update within 24 hours and complete two-source verification within 72 hours.

## Safe refresh

`npm run db:refresh` first copies the current database, then migrates and fully refreshes the temporary copy. It records field values, source revisions, a refresh manifest, and applies reviewed overrides. Data audit, static generation, route/link/SEO verification all run against that candidate before one atomic replacement of `data/ti.db`. Any error leaves the previous database byte-for-byte unchanged. `--offline` uses local snapshots and never accesses the network. Media is not fetched unless explicitly placed into review mode, and reviewed media is never automatically published.

## Release

CI must pass tests, typecheck, data audit, static generation, static-output verification, link/route assertions, dependency audit, and critical browser journeys. Deploy `.output/public` only. Roll back by redeploying the previous successful commit.

Scheduled automation may create a data PR with the diff and audit result. It must not push directly to `main`; changes to champion, runner-up, prize pool, dates, or location require human approval.

## Incident response

If `/admin`, `/api/*`, a server bundle, or a database file becomes publicly reachable, treat it as a production incident: restore the last static deployment, verify the static artifact, rotate any affected credentials, review access logs, and only then resume publishing.
