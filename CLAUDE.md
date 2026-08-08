# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Chinese-language Dota2 TI (The International) encyclopedia. Nuxt 4 + Vue 3 SSG site. All detail pages are prerendered to static HTML at build time; **runtime never touches the database**. Deploy target is Vercel via `nuxt generate` → `.output/public`.

## Commands

```bash
npm install              # postinstall auto-runs `nuxt prepare`
npm run dev              # dev server, http://localhost:3000
npm run generate         # SSG → .output/public (bakes ti.db into static HTML)
npm run preview          # serve generated output locally

npm run db:migrate       # Drizzle create/migrate (run on schema change or first setup)
npm run db:refresh       # run Python crawler to refresh data/ti.db (needs .venv)
npm run db:refresh-player-avatars  # download/process player avatars from avatar_source_url (accepts optional player ID args)
npm run data:audit       # release-blocking data invariants
npm run typecheck        # Nuxt/Vue TypeScript boundary
npm run verify:static    # reject admin/API/DB production artifacts

npm test                 # server + crawler suites
npm run test:server      # tsx --test server/tests/**/*.test.ts
npm run test:crawler     # python -m unittest over scripts/crawler/tests
```

Single server test file: `npx tsx --test server/tests/ti.test.ts`
Single test by name: `npx tsx --test --test-name-pattern="<substring>" server/tests/**/*.test.ts`

Crawler needs a Python env (npm scripts hardcode `.venv/bin/python3`):
```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/crawler/requirements.txt
```

## Architecture

### Data flow (the central model)

```
Liquipedia ──▶ scripts/crawler (Python) ──▶ data/ti.db
                                              │  Drizzle, read at build time
                              server/api/* ◀──┘  (prerendered into HTML)
                                     │
                              composables ($fetch) ──▶ pages ──▶ static HTML
```

- `data/ti.db` is a **committed** SQLite snapshot and build source, not a cache. Refresh through the temporary-DB audit pipeline; do not leave it half-refreshed.
- `server/db/client.ts` opens it with `journal_mode=WAL`, `foreign_keys=ON`. WAL only matters at build time (Node), never at runtime.
- Read routes are invoked during prerender, not at request time. Production publishes `.output/public` only and verification rejects runtime API or database artifacts.
- `better-sqlite3` is a native module that rebuilds at build time only. This is why SSG (not SSR) is the deployment model — it sidesteps Lambda native-binary and read-only-FS/WAL problems. See README "部署 Vercel" before changing this.

### Fact vs. curated data (do not overwrite)

The crawler writes **fact** fields from Liquipedia. Human-curated Chinese content is preserved across refreshes — `upsert_dataset` in `scripts/crawler/load.py` keeps existing non-empty values for:
- `tournaments.summaryZh`, `tournaments.chinaSummary`
- `teams.nameZh`, `teams.descriptionZh`
- third-party media source URLs remain reference metadata; unverified binaries are not public assets

Refresh facts through `npm run db:refresh`. Record reviewed factual exceptions in `field_overrides`; do not directly overwrite crawler facts in `ti.db`. A refresh will not clobber curated narrative fields or reviewed overrides.

### Seed files vs. runtime data

`app/data/tournaments.json` and `app/data/teams.json` are **crawler seed inputs** (canonical TI year list + team identity), referenced from `scripts/crawler/constants.py`. They are NOT read by the frontend. Don't confuse them with DB contents.

### China-team single source of truth

Whether a team counts as Chinese is decided only by `placements.is_china_team`. The crawler derives it from `CHINA_TEAM_ALIASES` in `scripts/crawler/constants.py`. Do not maintain a parallel list elsewhere.

### Route IDs

`routeIdFor(t)` in `server/services/ti.ts`: cancelled TIs (2020) are routed by `year`; all others by `tiNo`. Detail page is `/ti/:id` (e.g. `/ti/6`). Keep this consistent when adding tournament lookups.

### Media

Third-party media is not publishable by default. Optional review downloads go to `data/media-review/`; only assets with verified author/source/license/revision records may move into public output. Unverified media uses initials/placeholders.

### Admin data editor

The admin routes, service, and page form a local CRUD editor. **It has no auth**: use only through `npm run dev`, bound to `127.0.0.1`. Production removes the page and fails closed on management requests. SSR and remote admin are unsupported.

## Conventions

- **Flat component names** via `components: [{ path: '~/components', pathPrefix: false }]`. Use `<TiCard/>`, `<AppHeader/>`, `<PlayerChampionRanking/>` — not `<TiTiCard/>` or `<RankingPlayerChampionRanking/>`.
- **Shared query/formatting logic** lives in `server/services/ti.ts` (server) and `app/composables/tiData.ts` (client helpers like `formatUsd`, `placementLabel`, `formatDateRange`). Do not duplicate SQL or formatting inside pages/components.
- **2-space indentation** across TS, Vue, CSS, Python.
- **Types**: canonical models live in `shared/types/ti.ts`; `app/types/ti.ts` is a compatibility re-export. Server code imports the shared boundary directly.
- Design tokens (dark theme, colors stored as RGB channels for Tailwind alpha) live in `app/assets/css/main.css`; design spec in `DESIGN.md`.
- Commit style: short imperative subjects (`Refine esports theme and mobile TI pages`, `data: refresh ti.db`).

## Python in this repo

Project scripts pin `.venv/bin/python3` and `requirements.txt`. The user's global preference is `uv`; for this repo, prefer `uv pip install -r scripts/crawler/requirements.txt` into `.venv`, but the npm scripts assume the `.venv/bin/python3` path exists.
