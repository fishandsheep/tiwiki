# Repository Guidelines

## Project Structure & Module Organization

This is a Nuxt 4 + Vue 3 static site for a Chinese Dota2 TI encyclopedia. Frontend code lives in `app/`: `pages/` defines routes, `components/` holds flat auto-imported components, `composables/` joins and shapes data, `types/ti.ts` defines shared TypeScript models, and `assets/css/main.css` contains design tokens and global styles. Server-side data access is in `server/`: Nitro API routes in `server/api/`, Drizzle setup in `server/db/`, business queries in `server/services/ti.ts`, and TypeScript tests in `server/tests/`. Python crawler code is under `scripts/crawler/`, with crawler tests in `scripts/crawler/tests/`. SQLite data is committed at `data/ti.db`.

## Build, Test, and Development Commands

- `npm install`: install Node dependencies and run `nuxt prepare`.
- `npm run dev`: start local Nuxt dev server, usually `http://localhost:3000`.
- `npm run generate`: static-generate site into `.output/public` using `data/ti.db`.
- `npm run preview`: preview generated production output locally.
- `npm run db:migrate`: run Drizzle schema migration from `scripts/db/migrate.ts`.
- `npm run db:refresh`: run Python crawler refresh through `.venv/bin/python3`.
- `npm test`: run both server and crawler test suites.

For crawler work, create the Python environment first:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/crawler/requirements.txt
```

## Coding Style & Naming Conventions

Use TypeScript ESM, Vue single-file components, and Nuxt conventions. Keep component names flat because `nuxt.config.ts` sets `pathPrefix: false`; prefer `<AppHeader/>`, `<TiCard/>`, and `<PlayerChampionRanking/>`. Use 2-space indentation in TS, Vue, CSS, and Python files. Keep route filenames aligned with Nuxt routing, such as `app/pages/ti/[id].vue` and `server/api/tournaments/[id].get.ts`. Prefer shared data logic in composables or `server/services/ti.ts` over duplicating queries in pages.

## Testing Guidelines

Server tests use Node's built-in test runner through `tsx --test server/tests/**/*.test.ts`. Python crawler tests use `unittest` discovery with files named `test_*.py`. Add tests beside the relevant layer: API/service behavior in `server/tests/`, parsing and crawler behavior in `scripts/crawler/tests/`. Run `npm test` before submitting changes that touch data loading, API output, or parsing.

## Commit & Pull Request Guidelines

Recent history uses short, imperative subjects, for example `Refine esports theme and mobile TI pages` and `Fix rankings mobile visibility`. Keep commits focused and describe the user-visible change or data update. PRs should include a concise summary, test results, linked issues when applicable, and screenshots for UI changes. For data refreshes, note whether `data/ti.db` was regenerated with `npm run db:refresh`.

## Data & Deployment Notes

`data/ti.db` is source data for static generation and is intentionally committed. The recommended deployment path is `npm run generate` to `.output/public`; avoid runtime database assumptions unless explicitly changing the Nitro SSR deployment model.
