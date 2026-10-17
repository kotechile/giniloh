/**
 * Validates routing.mjs against the live CMS and the existing ownership manifest.
 * Throwaway: not part of the build. Run with `node scripts/validate-routing.mjs`.
 */
import { resolveTarget, auditRouting, CATEGORY_ROUTES, PROPERTIES } from '../src/data/routing.mjs';
import { readFileSync } from 'node:fs';

const CMS = 'https://cms.giniloh.com';
const get = async (u) => (await fetch(u)).json();

const cats = await get(`${CMS}/wp-json/wp/v2/categories?per_page=100&hide_empty=0`);
const idToSlug = new Map(cats.map((c) => [c.id, c.slug]));

const posts = [];
for (const page of [1, 2]) {
	posts.push(...(await get(`${CMS}/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=slug,categories`)));
}
const withSlugs = posts.map((p) => ({
	slug: p.slug,
	categories: (p.categories ?? []).map((id) => idToSlug.get(id)).filter(Boolean)
}));

// Existing manifest, for regression comparison
const own = readFileSync(new URL('../src/data/ownership.mjs', import.meta.url), 'utf8');
const listOf = (n) => new Set([...own.match(new RegExp(`${n}\\s*=\\s*\\[([\\s\\S]*?)\\n\\];`))[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
const AI = listOf('AICHIEVE_POST_SLUGS');
const GI = listOf('GINILOH_POST_SLUGS');
const SELF = 'giniloh';

let mismatch = [];
let matched = 0;
for (const p of withSlugs) {
	const expected = AI.has(p.slug) ? 'aichieve' : GI.has(p.slug) ? 'giniloh' : null;
	if (!expected) continue;
	const got = resolveTarget(p);
	if (got === expected) matched++;
	else mismatch.push({ slug: p.slug, expected, got, categories: p.categories });
}

const audit = auditRouting(withSlugs);
console.log(`manifest: ${AI.size} aichieve / ${GI.size} giniloh`);
console.log(`routing matches manifest: ${matched}/${AI.size + GI.size}`);
console.log(`DISAGREEMENTS: ${mismatch.length}`);
for (const m of mismatch.slice(0, 10)) console.log('  ', m);

console.log(`\nall CMS posts resolved: ${audit.total - audit.unrouted.length}/${audit.total}`);
console.log(`unrouted: ${audit.unrouted.length}`);
for (const s of audit.unrouted) console.log('   ', s);

console.log(`\nposts whose own categories disagree (priority decided them): ${audit.conflicting.length}`);
for (const c of audit.conflicting.slice(0, 8)) console.log(`    ${c.slug} → ${c.resolvesTo}  [${c.categories.join(', ')}]`);

console.log('\nper-property totals:');
const tally = {};
for (const p of withSlugs) {
	const t = resolveTarget(p) ?? 'UNROUTED';
	tally[t] = (tally[t] ?? 0) + 1;
}
console.log(' ', JSON.stringify(tally));

// What a third domain would cost
console.log('\nthird-domain cost:');
console.log(`  properties: ${Object.keys(PROPERTIES).length} → ${Object.keys(PROPERTIES).length + 1} (one row)`);
console.log(`  category rules: ${CATEGORY_ROUTES.length} → +N for the categories it owns`);
console.log('  edits to the OTHER properties\' code: 0  (they never enumerated slugs)');
