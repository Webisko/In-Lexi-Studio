---
name: cms-api-debug
description: Diagnose and fix issues in Express CMS API routes, auth flow, uploads, and endpoint contract mismatches in this repository.
---

# CMS API Debug

Use this skill when the task mentions broken API behavior, auth errors, upload failures, or mismatch between frontend and API responses.

## Procedure

1. Identify impacted route(s) in `api/routes.js` and matching client consumption in `src/lib/api.ts`.
2. Verify prefix behavior from `api/server.js` (`/app` stripping, `/api` mount, `/uploads` static).
3. Keep changes contract-safe unless breaking changes are explicitly requested.
4. Validate by starting backend with `node app.js` and checking targeted endpoint paths.
5. If response shape changes are necessary, update both API and frontend mapping in one pass.

## Guardrails

- Do not leak or hardcode secrets from environment variables.
- Do not refactor unrelated endpoints while fixing one issue.
- Prefer minimal patches and preserve current route naming.
