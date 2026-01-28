import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
    site: isProd ? 'https://webisko.github.io' : undefined,
    base: isProd ? '/In-Lexi-Studio' : '/',
    integrations: [react(), tailwind()],
});
