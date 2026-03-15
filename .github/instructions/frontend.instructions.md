---
applyTo: 'src/**/*.astro,src/**/*.ts,src/**/*.tsx,src/**/*.css'
---

# Frontend (Astro + React) instructions

- Keep Astro pages as routing/layout layer and React components as UI islands.
- Preserve existing client directives (`client:load`, `client:visible`) unless task explicitly requests changing hydration.
- Use existing API helpers in `src/lib/api.ts` before adding new fetch logic.
- Do not hardcode absolute site paths; keep `import.meta.env.BASE_URL` compatibility.
- Reuse existing Tailwind utility patterns and avoid introducing new styling systems.
- If adding category-based gallery behavior, use shared store (`src/store/galleryStore.ts`) instead of local duplicated state.
- After frontend edits, prefer validating with `npm run build`.
