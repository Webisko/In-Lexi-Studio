---
applyTo: 'admin/**/*.html,admin/**/*.js,admin/**/*.css'
---

# Admin panel instructions

- Treat `admin/` as production UI for CMS operators; prioritize stability over rewrites.
- Keep framework choice unchanged (vanilla JS + current CDN dependencies).
- Preserve login/session flow compatibility with backend auth endpoints.
- Avoid introducing heavy build tooling to `admin/` unless user explicitly requests migration.
- When editing forms, verify payload fields still match backend expectations.
