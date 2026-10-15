#!/usr/bin/env node
/**
 * Generates the nginx 301 map for everything that moved to aichieve.net in the 2026 split.
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

import { AICHIEVE_POST_SLUGS, AICHIEVE_ORIGIN, MOVED_TOOL_PATHS } from '../src/data/ownership.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'nginx-redirects.conf');

const lines = [];
const push = (s = '') => lines.push(s);

const today = new Date().toISOString().slice(0, 10);

push('# GENERATED FILE — do not edit by hand.');
push('#');
push('# 301 map for everything that moved from giniloh.com to aichieve.net in the 2026 split.');
push(`# Source: src/data/ownership.mjs · generated ${today}`);
push('#');
push(`# ${AICHIEVE_POST_SLUGS.length} articles, ${MOVED_TOOL_PATHS.length} tool pages. These URLs are indexed and`);
push('# carry search equity, so they get a real 301 header here rather than the 200-with-meta-refresh');
push('# that Astro\'s static redirect stubs emit. Regenerate with `npm run redirects`.');
push('');
push('# ── Moved tool pages ──────────────────────────────────────────────────────────────────');
for (const { from, to } of MOVED_TOOL_PATHS) {
	push(`location = ${from} { return 301 ${to}; }`);
}
push('');
push('# ── Moved articles (same slug, different host) ────────────────────────────────────────');
for (const slug of AICHIEVE_POST_SLUGS) {
	push(`location = /${slug}/ { return 301 ${AICHIEVE_ORIGIN}/${slug}/; }`);
}
push('');

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`wrote nginx-redirects.conf — ${AICHIEVE_POST_SLUGS.length + MOVED_TOOL_PATHS.length} 301 rules`);
