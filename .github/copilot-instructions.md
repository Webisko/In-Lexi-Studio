# Copilot instructions for this repo

## Big picture

- This is an Astro frontend (currently the main page is the root Astro page) that composes multiple React components. It’s expected to grow into a multi-page site under the Astro pages directory.
- The client’s 3 core services are separate landing pages/routes: `/wedding`, `/portrait`, `/product` (implemented as Astro pages under `src/pages`).
- React components use Tailwind for styling and Framer Motion for animation (e.g., Hero, GallerySlider).
- Global UI state for the gallery category is kept in a Nanostores atom and read in React via `useStore`.
- Content is currently mocked in a shared data module (text + image URLs). This is intended to be replaced by a headless WordPress backend providing content (galleries/photos/texts) via an API.
- Global styles and Tailwind layers are defined in the global stylesheet.

## Project conventions & patterns

- Astro pages import React components and attach client directives like `client:load` or `client:visible` (see the root page). Preserve these directives when moving components or changing hydration behavior.
- Gallery navigation uses the shared `currentCategory` atom; update the store (via `setCategory`) instead of local state if you add new category-aware components.
- When creating links, account for `import.meta.env.BASE_URL` (see GallerySlider) to keep GitHub Pages base-path compatibility.

## Headless WordPress notes

- WordPress is the content backend (client edits content in WP); this repo is the Astro frontend.
- Content in WP uses ACF fields on multiple pages; model data fetching to map ACF → frontend view models.
- All site content is public (no logged-in areas expected in the frontend).
- WP currently uses LiteSpeed Cache and QUIC.cloud CDN; avoid frontend changes that hardcode absolute asset paths or break CDN-friendly URLs.
- **TBD**: REST API vs WPGraphQL (and any custom endpoints).
- **TBD**: SSG vs SSR strategy in Astro (build-time fetch vs runtime fetch).

## Build & dev workflows

- Dev server: `npm run dev`
- Production build: `npm run build`
- Preview build: `npm run preview`
- Format (Prettier + Tailwind class sorting): `npm run format`
- Check formatting (CI-friendly): `npm run format:check`
  (Commands defined in the root package manifest.)

## Integration notes

- Site base path is configured for GitHub Pages in the Astro config; don’t hardcode absolute `/` paths for assets or links.
