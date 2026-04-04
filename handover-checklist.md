# Handover checklist (Frontend + Mini-CMS)

## 1) Environment

- [ ] Use Node 22.x for release operations.
- [ ] Run `npm ci` successfully.
- [ ] Run `npx prisma generate` successfully.
- [ ] Run `npx prisma migrate status` and confirm "Database schema is up to date".

## 2) Frontend release gate

- [ ] Build with production-like env:
  - `PUBLIC_API_URL=https://inlexistudio.com/app/api`
  - `PUBLIC_BASE_URL=https://inlexistudio.com/app`
- [ ] Confirm `npm run build` succeeds with no route conflict warnings.
- [ ] Open and verify key pages: `/`, `/contact`, `/about`, `/approach`, `/portfolio`, `/wedding-photography`, `/portrait-photography`, `/product-photography`.

## 3) CMS/API release gate

- [ ] Start backend with `node app.js`.
- [ ] Smoke test API endpoints:
  - `/api/settings`
  - `/api/pages`
  - `/api/galleries`
  - `/api/testimonials`
- [ ] Confirm upload path handling works and no runtime errors appear in logs.

## 4) Data safety

- [ ] Create timestamped SQLite backup before release (`inlexistudio.db`).
- [ ] Verify restore path/procedure on a local copy.
- [ ] Keep `.env` only on target host (not committed).

## 5) Deploy readiness

- [ ] Confirm workflow file and target paths in `.github/workflows/deploy.yml`.
- [ ] Confirm deploy artifacts match expectations (`dist`, `api`, `prisma`, `admin`, `app.js`, package manifests).
- [ ] Confirm deploy restart step touches both `tmp/restart.txt` and `app.js` so Passenger reloads the updated backend process.
- [ ] Trigger deploy from `main` or `workflow_dispatch`.

## 6) Post-deploy smoke checks

- [ ] Frontend loads without console errors.
- [ ] Admin panel loads and login works.
- [ ] Content update in CMS is visible on frontend.
- [ ] If CMS save does not trigger frontend rebuild, inspect `domains/inlexistudio.com/cms-app/stderr.log` first and verify the Passenger process reloaded the newest backend code.
- [ ] Password reset flow works.

## 7) Settings singleton sanity

- [ ] Confirm API reads and writes use the first `Settings` row as the singleton record rather than assuming `id = 1`.
- [ ] If the `settings` table was recreated or restored, verify `/api/settings` and CMS settings save still work before handoff.

## 8) Client handoff pack

- [ ] Admin URL + role accounts verified.
- [ ] Short SOP for content editing and publishing.
- [ ] Incident path: where to check CI logs and server logs.
- [ ] Credentials rotated and stored in password manager.
