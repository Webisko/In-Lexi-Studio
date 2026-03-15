---
name: astro-page-delivery
description: Implement or adjust Astro pages and React islands while preserving hydration, base URL compatibility, and existing data flow patterns.
---

# Astro Page Delivery

Use this skill for changes in `src/pages`, `src/components`, and page data mapping.

## Procedure

1. Locate page entry (`src/pages/*.astro`) and related React islands used in that route.
2. Reuse existing API layer from `src/lib/api.ts` instead of adding ad-hoc fetch logic.
3. Preserve hydration directives (`client:load`, `client:visible`) unless task requires a change.
4. Keep links and asset paths compatible with `import.meta.env.BASE_URL`.
5. Validate with `npm run build` for any frontend behavior/layout change.

## Guardrails

- Do not introduce new UI frameworks.
- Do not change global layout behavior unless requested.
- Keep Tailwind style conventions consistent with existing code.
