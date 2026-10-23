// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// Two sources, deliberately:
//   ownership.mjs           -- what is genuinely configuration (moved tool paths)
//   ownership.generated.mjs -- content ownership, DERIVED from WordPress `vertical` terms x
//                              Supabase `vertical_sites` by scripts/routing-sync.mjs
//
// Plain ESM precisely so this file can read them: astro.config is evaluated by Node before
// TypeScript is available, and hardcoding a second copy of the slug lists here is how the redirect
// map silently drifts out of sync with the content split.
import { MOVED_TOOL_PATHS, AICHIEVE_ORIGIN, CATEGORY_DISPOSITIONS } from './src/data/ownership.mjs';
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

/**
 * Category paths, derived from ONE list (CATEGORY_DISPOSITIONS in data/ownership.mjs):
 *
 *   the hub itself   /categories/  -> /articles/     (the IA rename)
 *   in-scope topics  /categories/<slug>/ -> /articles/<slug>/
 *   out of scope     /categories/<slug>/ -> the sibling property
 *
 * The third line is the one that matters for trust: those URLs are indexed and used to answer 200
 * with a page reading "No articles". A 301 sends the reader and Google to where that content
 * actually lives instead of into a dead end.
 */
const categoryRedirects = Object.fromEntries([
	['/categories/', '/articles/'],
	...CATEGORY_DISPOSITIONS.map(({ slug, keep, to }) =>
		keep ? [`/categories/${slug}/`, `/articles/${slug}/`] : [`/categories/${slug}/`, to]
	)
]);

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'https://giniloh.com',
  redirects: {
    // ONE key per path. Astro normalises trailing slashes, so `/apps` and `/apps/` resolve to the
    // same route; listing both produced nine "route is defined twice" router warnings on every
    // build, which a future Astro turns into a hard error. The nginx server block matches the same
    // paths with `/?$`, so the slash form keeps 301-ing at the edge regardless.
    // Legacy WordPress pages
    '/home/about-us': '/about',
    '/home/career': '/calculators/career-ai-resilience',
    '/tutorials/espresso-dial-in': '/calculators/coffee-arbitrage',
    '/tutorials/coffee-beans': '/calculators/coffee-arbitrage',

    // The PRO app directory is aichieve's now. These used to point at apps.giniloh.com.
    '/apps': `${AICHIEVE_ORIGIN}/apps/`,
    '/showcase': `${AICHIEVE_ORIGIN}/apps/`,
    '/pro-apps': `${AICHIEVE_ORIGIN}/apps/`,

    // The editorial hub was renamed: /categories/ -> /articles/ (see docs/navigation-ia-plan.md).
    ...categoryRedirects,

    // Moved out of here during the split — derived from data/ownership.mjs.
    ...movedToolRedirects,
    ...movedPostRedirects,

    // The two vertical-hub tool paths a first pass published before the calculator URLs were
    // settled. The canonical engine URLs are /calculators/<slug>/; keep the old paths working.
    '/career-capital/tools/w2-vs-1099-scorp-calculator': '/calculators/w2-vs-1099-scorp-calculator/',
    '/portfolio-capital/tools/rsu-hold-vs-sell': '/calculators/rsu-hold-vs-sell/'
  },
  integrations: [
    react()
    // `@astrojs/sitemap` used to sit here and emitted `sitemap-index.xml` + `sitemap-0.xml`, neither
    // of which robots.txt declares. The declared sitemap is `src/pages/sitemap.xml.ts` (it is the one
    // that can filter the noindex `/calculators/embed/*` routes and carry a real per-post lastmod), so
    // the generated pair was a second, unreferenced answer to "what is on this site". One authority.
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client']
    }
  }
});
