---
applyTo: 'api/**/*.js,prisma/**/*.prisma,prisma/**/*.js'
---

# Backend (Express + Prisma) instructions

- Keep API contracts backward-compatible unless the task explicitly includes a contract change.
- Respect backend URL structure from `api/server.js` (`/api`, `/uploads`, proxy `/app` prefix stripping).
- Keep upload/media processing behavior consistent with current Sharp + Multer pipeline.
- For Prisma schema changes:
  - update `prisma/schema.prisma`,
  - generate client with `npx prisma generate`,
  - create migration only when requested.
- Do not hardcode credentials, SMTP keys, JWT secrets, or API keys in code.
- Prefer surgical changes in `api/routes.js`; avoid broad refactors in unrelated endpoints.
