# Copilot instructions for this repo

## Project summary

- This repository contains one production web platform split into:
  - Astro frontend in `src/`.
  - Custom CMS backend (Express + Prisma + SQLite) in `api/` + `prisma/`.
  - Admin panel static app in `admin/`.
- Do not assume or plan WordPress integration in this project.
- Treat `in-lexi-studio-ai-studio/` as reference-only unless explicitly requested.

## Architecture map

- Frontend entry pages: `src/pages/index.astro`, `src/pages/[slug].astro`, `src/pages/contact.astro`.
- Frontend data layer: `src/lib/api.ts` (API fetch + URL normalization).
- Backend entry: `app.js` -> `api/server.js`.
- Backend routes: `api/routes.js`.
- Database schema/migrations: `prisma/schema.prisma`, `prisma/migrations/`.
- CI deploy: `.github/workflows/deploy.yml`.

## Always-follow rules

- Keep changes minimal and scoped to the user request.
- Preserve Astro hydration directives (`client:load`, `client:visible`) unless the task explicitly requires changing hydration behavior.
- Keep `import.meta.env.BASE_URL` compatibility; do not hardcode absolute paths for internal links/assets.
- Reuse existing API contracts in `api/routes.js` and client mapping in `src/lib/api.ts` before introducing new payload shapes.
- Do not add or modify secrets in tracked files; use environment variables only.

## Development commands

- Install dependencies: `npm ci` (preferred in clean environments) or `npm install`.
- Frontend dev server: `npm run dev`.
- Build frontend: `npm run build`.
- Preview built frontend: `npm run preview`.
- Format repository: `npm run format`.
- Format check (CI-style): `npm run format:check`.

## Backend & CMS notes

- Local backend run: `node app.js` (loads `api/server.js`).
- Backend serves uploads from `public/uploads` and API under `/api`.
- Proxy prefix handling is built into backend (`/app` stripping in `api/server.js`); preserve this logic when editing routing.
- When changing Prisma schema, run `npx prisma generate` and, if migration is part of task, `npx prisma migrate dev --name <migration_name>`.

## Validation checklist before finishing a task

- Run `npm run format:check` after code edits.
- If frontend behavior changed, run `npm run build`.
- If API or Prisma changed, ensure backend starts with `node app.js` and check impacted endpoint logic.
- If CI/deploy files changed, re-read `.github/workflows/deploy.yml` and verify no path regressions (`dist`, `api`, `prisma`, `admin`).

## Deployment context

- Push to `main` triggers deploy workflow.
- Workflow builds frontend and deploys:
  - `dist/` -> production frontend host.
  - `api/`, `prisma/`, `admin/`, `app.js`, package manifests -> CMS app host.
- Do not change deploy paths or Passenger bootstrap behavior unless explicitly requested.
