#!/usr/bin/env node
/**
 * Generates the nginx 301 map for every URL on this property that has moved: the 2026 split's
 * articles and tools, and the editorial-hub category rename (/categories/ -> /articles/).
 *
 * WHY THIS EXISTS ALONGSIDE astro.config.mjs
 * Astro's `redirects` config produces a static HTML stub with `<meta http-equiv="refresh">`.
 * That works, and it is portable to any host — but it answers **200**, not 301. For the 86
 * articles that moved, those URLs are indexed and carry search equity, and a 200-with-refresh
 * is a weaker and slower signal than a 301 header.
 *
 * nginx serves this site in production, so the real 301s are emitted here. The Astro redirects
 * stay as the portable fallback for any non-nginx host. Both are generated from
 * `src/data/ownership.mjs`, so they cannot disagree about where a URL went.
 *
 * Category paths come from CATEGORY_DISPOSITIONS in the same file, so the 301 header and
 * astro.config's portable stub cannot disagree about where a URL went.
 *
 * Output: ./nginx-redirects.conf — a fragment of `location` blocks, meant to be `include`d
 * INSIDE the server block in default.conf. It is deliberately not named `*.conf` under conf.d/,
 * because nginx auto-includes `conf.d/*.conf` at the http level, where a bare `location` is a
 * syntax error.
 *
 * Run by the Dockerfile before the build. Safe to run locally; writes a single file.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { MOVED_TOOL_PATHS, CATEGORY_DISPOSITIONS } from '../src/data/ownership.mjs';
import { FOREIGN_TARGETS } from '../src/data/ownership.generated.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'nginx-redirects.conf');

/**
 * Category paths, from ONE list (CATEGORY_DISPOSITIONS):
 *   /categories/            -> /articles/            the hub was renamed
 *   /categories/<in scope>/ -> /articles/<slug>/     its topic pages moved with it
 *   /categories/<out of scope>/ -> the sibling property
 * The third line is why this matters: those URLs answer 200 today with a page that says
 * "No articles", and they are indexed.
 */
const categoryRules = [
	['/categories/', '/articles/'],
	...CATEGORY_DISPOSITIONS.map(({ slug, keep, to }) =>
		keep ? [`/categories/${slug}/`, `/articles/${slug}/`] : [`/categories/${slug}/`, to]
	)
];

const lines = [];
const push = (s = '') => lines.push(s);

const today = new Date().toISOString().slice(0, 10);

push('# GENERATED FILE — do not edit by hand.');
push('#');
push('# 301 map for everything that moved off giniloh.com in the 2026 split.');
push(`# Source: src/data/ownership.generated.mjs (derived from WordPress verticals) · ${today}`);
push('#');
push(`# ${Object.keys(FOREIGN_TARGETS).length} articles, ${MOVED_TOOL_PATHS.length} tool pages, ${categoryRules.length} category paths.`);
push('# These URLs are indexed and carry search equity, so they get a real 301 header here rather than');
push('# the 200-with-meta-refresh that Astro\'s static redirect stubs emit. Regenerate with `npm run redirects`.');
push('');
push('# ── Moved tool pages ──────────────────────────────────────────────────────────────────');
for (const { from, to } of MOVED_TOOL_PATHS) {
	push(`location = ${from} { return 301 ${to}; }`);
}
push('');
push('# ── Category paths ────────────────────────────────────────────────────────────────────');
for (const [from, to] of categoryRules) {
	push(`location = ${from} { return 301 ${to}; }`);
}
push('');
push('# ── Moved articles (same slug, different host) ────────────────────────────────────────');
for (const [slug, origin] of Object.entries(FOREIGN_TARGETS)) {
	push(`location = /${slug}/ { return 301 ${origin}/${slug}/; }`);
}
push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(
	`wrote nginx-redirects.conf — ${Object.keys(FOREIGN_TARGETS).length + MOVED_TOOL_PATHS.length + categoryRules.length} 301 rules`
);
