import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig(({ mode }) => ({
    site: 'https://webisko.github.io',
    base: mode === 'production' ? '/In-Lexi-Studio' : '/',
    integrations: [react(), tailwind()],
}));
