// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// The split manifest. Plain ESM precisely so this file can read it: astro.config is evaluated by
// Node before TypeScript is available, and hardcoding a second copy of the slug lists here is how
// the redirect map would silently drift out of sync with the content split.
import { AICHIEVE_POST_SLUGS, AICHIEVE_ORIGIN, MOVED_TOOL_PATHS } from './src/data/ownership.mjs';

/**
 * 301 map for everything that moved to aichieve.net in the 2026 split.
 *
 * These URLs are indexed and carry real search equity. Without this map they do not redirect —
 * they simply stop being built, so giniloh.com answers 404 for 86 articles that used to rank and
 * hands Google nothing to follow. That is the single most expensive way to get this split wrong,
 * which is why the list is derived from the manifest rather than typed out.
 */
const movedPostRedirects = Object.fromEntries(
	AICHIEVE_POST_SLUGS.map((slug) => [`/${slug}/`, `${AICHIEVE_ORIGIN}/${slug}/`])
);

const movedToolRedirects = Object.fromEntries(
	MOVED_TOOL_PATHS.map(({ from, to }) => [from, to])
);

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://giniloh.com',
  redirects: {
    // Legacy WordPress pages
    '/home/about-us': '/about',
    '/home/about-us/': '/about',
    '/home/career': '/calculators/career-ai-resilience',
    '/home/career/': '/calculators/career-ai-resilience',
    '/tutorials/espresso-dial-in': '/calculators/coffee-arbitrage',
    '/tutorials/espresso-dial-in/': '/calculators/coffee-arbitrage',
    '/tutorials/coffee-beans': '/calculators/coffee-arbitrage',
    '/tutorials/coffee-beans/': '/calculators/coffee-arbitrage',

    // The PRO app directory is aichieve's now. These used to point at apps.giniloh.com.
    '/apps': `${AICHIEVE_ORIGIN}/apps/`,
    '/apps/': `${AICHIEVE_ORIGIN}/apps/`,
    '/showcase': `${AICHIEVE_ORIGIN}/apps/`,
    '/showcase/': `${AICHIEVE_ORIGIN}/apps/`,
    '/pro-apps': `${AICHIEVE_ORIGIN}/apps/`,
    '/pro-apps/': `${AICHIEVE_ORIGIN}/apps/`,

    // Moved out of here during the split — derived from data/ownership.mjs.
    ...movedToolRedirects,
    ...movedPostRedirects
  },
  integrations: [
    react(),
    sitemap()
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  }
});
