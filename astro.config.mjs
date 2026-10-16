// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// Two sources, deliberately:
//   ownership.mjs           -- what is genuinely configuration (moved tool paths)
//   ownership.generated.mjs -- content ownership, DERIVED from WordPress `vertical` terms x
//                              Supabase `vertical_sites` by scripts/routing-sync.mjs
//
// Plain ESM precisely so this file can read them: astro.config is evaluated by Node before
// TypeScript is available, and hardcoding a second copy of the slug lists here is how the redirect
// map silently drifts out of sync with the content split.
import { MOVED_TOOL_PATHS, AICHIEVE_ORIGIN } from './src/data/ownership.mjs';
import { FOREIGN_TARGETS } from './src/data/ownership.generated.mjs';

/**
 * 301 map for everything that now lives on another property.
 *
 * These URLs are indexed and carry real search equity. Without this map they do not redirect —
 * they simply stop being built, so this site answers 404 for articles that used to rank and hands
 * Google nothing to follow. That is the single most expensive way to get this split wrong, which is
 * why both halves are derived rather than typed out:
 *
 *   the slug list    from the WordPress vertical
 *   the destination  from vertical_sites.frontend_url
 *
 * Previously every foreign post was sent to AICHIEVE_ORIGIN. That was correct only while aichieve
 * was the sole sibling; the moment a third property existed it would have 301'd wellroost's posts
 * to aichieve.
 */
const movedPostRedirects = Object.fromEntries(
	Object.entries(FOREIGN_TARGETS).map(([slug, origin]) => [`/${slug}/`, `${origin}/${slug}/`])
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
