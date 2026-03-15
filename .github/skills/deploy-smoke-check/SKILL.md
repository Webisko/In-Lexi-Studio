---
name: deploy-smoke-check
description: Verify CI/deploy-impacting changes and run a focused pre-handoff smoke check for this repository's GitHub Actions deployment flow.
user-invocable: true
---

# Deploy Smoke Check

Use this skill when editing workflow files, deployment paths, runtime startup behavior, or build commands.

## Procedure

1. Re-read `.github/workflows/deploy.yml` and confirm changed files still map to expected deploy targets.
2. Confirm local command assumptions:
   - `npm ci` / `npm install`
   - `npm run build`
   - `npm run format:check`
3. If backend/runtime changed, ensure `app.js` still boots `api/server.js` and startup assumptions remain valid.
4. Summarize deployment risk in handoff (low/medium/high) with exact reason.

## Guardrails

- Do not alter server paths or Passenger bootstrap without explicit user request.
- Keep secret handling in GitHub Actions via `${{ secrets.* }}` only.
