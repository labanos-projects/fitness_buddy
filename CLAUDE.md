# CLAUDE.md — fitness_buddy

Personal fitness/workout app. **React + Vite** frontend deployed to GitHub Pages
with a custom domain (`CNAME`), backed by PHP endpoints on `labanos.dk` that
talk to a shared MySQL database. Uses Google **Gemini** to generate exercise
illustrations and the **Rive** runtime for animated motion graphics.

## Stack
- **Frontend:** React 19 + Vite (`package.json`, `vite.config.js`, `eslint.config.js`). Source under `src/`. Entry: `index.html`.
- **Build/run:**
  - `npm run dev` — local dev server
  - `npm run build` — production build
  - `npm run lint` — ESLint
  - `npm run generate:art` — `scripts/generate-illustrations.js`, calls Gemini to produce exercise frames
- **Backend:** PHP under `php/`. Each endpoint is self-contained today; tracked task to extract a shared `db_connect.php` matching the DI pattern.
- **Database:** MySQL on `labanos.dk`. Shared instance with `di` and `investtracker` (one schema, all tables together). Auth/users table is shared with `investtracker` — there is no separate fitness_buddy user table.
- **Default branch:** `main`.
- **Deploy:** Vite build artifacts served from GitHub Pages; PHP uploaded to one.com's web root manually (no CI).

## Notable dependencies
- `@google/generative-ai` — Gemini client for image generation
- `@rive-app/react-canvas` — Rive animation runtime
- `nosleep.js` — keeps screen awake during workouts
- `react` / `react-dom` v19, `vite` v7

See `RIVE_GUIDE.md` for the Rive integration notes.

## Environment variables
From `.env.example` (loaded by Vite as `VITE_*` and by Node scripts directly):
- `VITE_API_BASE` — base URL of the PHP backend (e.g., `https://labanos.dk`)
- `GEMINI_API_KEY` — for the local illustration generator
- `API_TOKEN` — investtracker bearer token (re-used; same `users.api_token`)

## File layout
- `src/` — React source
- `public/` — static assets
- `scripts/generate-illustrations.js` — Gemini-driven art generator
- `php/auto-illustrate.php`, `php/compose-workout.php`, `php/illustrations.php`, `php/image.php`, `php/models.php`, `php/regenerate.php` — backend endpoints
- `php/fb_auth_check.php` — `require_auth($pdo)` helper (byte-identical to `investtracker/php/auth_check.php`)
- `vite.config.js`, `eslint.config.js`
- `IDEAS.md`, `PROGRESS.md`, `RIVE_GUIDE.md` — design/progress docs
- `README.md` — short intro

## Tables this app owns
- `exercise_illustrations` — generated illustration frames (`exercise_id`, `frame_number`, `image_base64`, `mime_type`, `prompt_used`, timestamps; `UNIQUE (exercise_id, frame_number)`).
- Shares `users` with `investtracker` for auth (`api_token` bearer).
- Other tables may exist (workouts/exercises themselves) — read the relevant endpoint (`compose-workout.php`, `auto-illustrate.php`) to confirm before assuming.

## Conventions
- PHP endpoints use **PDO**, `utf8mb4`, JSON responses, wide-open CORS.
- Auth: bearer token in `Authorization` header against `users.api_token`. Reads sometimes public; writes call `require_auth($pdo)`.
- The Gemini key is read from `php/config.local.php` (on the server, not in git) or from `GEMINI_API_KEY` env. Don't hardcode it.
- React 19 + Vite — keep imports ESM, prefer functional components and hooks.
- ESLint is configured; run `npm run lint` before pushing.

## Database — how I (Claude) work with it
- The DB is shared across all three projects on labanos.dk MySQL. Credentials live in each `php/*.php` file on the server (filled in from `%%PLACEHOLDERS%%` at deploy time). Once the shared `db_connect.php` refactor lands, only that file will carry the connection. **Never commit real credentials to this repo.**
- For my own ad-hoc access I use a **dedicated MySQL user**, separate from the app user, connected via SSH tunnel from your local machine. Connection details (host/user/db, key path) live in env vars on your machine and in your global CLAUDE.md — not in this repo.
- **Safety rule (I follow this every session):**
  - `SELECT` queries — I run them freely.
  - `INSERT` / `UPDATE` / `DELETE` — I first show you the matching rows (`SELECT … WHERE …` preview) and the exact write statement, and wait for your explicit "yes" in chat before executing.
  - `DROP` / `ALTER` / `TRUNCATE` / `GRANT` — I refuse to run these from chat; raise as a PR or migration instead.
- Schema changes for fitness_buddy-owned tables: extend the `CREATE TABLE IF NOT EXISTS` blocks inside the relevant endpoint (e.g., `illustrations.php` self-creates `exercise_illustrations`). If/when we add a shared migrator, move them there.

## Working agreements
- **Branch & PR flow:** I branch from `main` as `claude/<short-topic>`, commit small focused changes, open a PR, and wait for your review. I never push directly to `main`.
- **Issues:** if I find something worth doing but out of scope, I open a GitHub issue.
- **PROGRESS.md / IDEAS.md / TODO.md:** I read them at the start of any non-trivial session. PROGRESS.md captures what's been built; IDEAS.md is the backlog of unbuilt ideas.

## Quick start for me
1. Read `PROGRESS.md` and `IDEAS.md` for current state.
2. For backend tasks, peek at the relevant `php/*.php` for the query patterns and table shape.
3. For frontend tasks, `src/` is the source; `npm run dev` for local.
4. Open a branch from `main`, make the change, push, open a PR.
