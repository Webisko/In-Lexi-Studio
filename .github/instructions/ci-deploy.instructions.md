---
applyTo: '.github/workflows/**/*.yml,.github/workflows/**/*.yaml,Dockerfile,docker-compose.yml'
---

# CI / deploy instructions

- Keep deploy path mappings stable unless task explicitly changes infrastructure.
- Preserve artifact boundaries:
  - frontend output from `dist/`,
  - backend/runtime files from `api/`, `prisma/`, `admin/`, `app.js`, package manifests.
- Never commit secrets to workflow files; use GitHub Actions secrets.
- When changing workflow commands, ensure Node version and command order remain coherent (`npm ci` -> `npm run build` -> deploy).
