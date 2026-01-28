import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
    site: 'https://webisko.github.io',
    base: process.env.GITHUB_ACTIONS === 'true' ? '/In-Lexi-Studio' : '/',
    integrations: [react(), tailwind()],
});
