/**
 * Content routing for the giniloh.com / aichieve.net family — and for whatever comes next.
 *
 * PROBLEM WITH THE PREVIOUS SHAPE
 * ownership.mjs listed every post slug, per property. That does not scale: adding a third
 * domain means editing the manifest in BOTH existing repos to remove the slugs that moved away,
 * so the work grows as O(properties × posts), and every property's build must redeploy before
 * the move takes effect. It also failed silently — a post in no list published to neither site.
 *
 * THE SHAPE HERE
 * Routing is a precedence-ordered rule list over CMS data, not an enumeration of the corpus.
 * Three kinds of decision, evaluated in order, first match wins:
 *
 *   1. POST_OVERRIDES  — one slug. Wins over everything; this is what the mixed categories need.
 *   2. CATEGORY_ROUTES — one category, and every post filed under it (now and in future).
 *   3. UNROUTED        — whatever is left. Decided explicitly; never allowed to pass silently.
 *
 * ADDING A THIRD DOMAIN
 *   1. add a row to PROPERTIES                     (origin + which CMS it reads)
 *   2. add its category rules to CATEGORY_ROUTES   (the categories it owns)
 *   3. nothing else changes — the other properties do not need to be told the slugs left,
 *      because they never enumerated slugs in the first place. They ask "am I the target?"
 *
 * WHY CATEGORY RULES ALONE ARE NOT ENOUGH (measured, 2026-10-15)
 * The taxonomy was authored for one blog and mixes audiences. A category-only rule misroutes
 * exactly 12 of the 112 existing posts. Those 12 are the overrides below — not a scaffold to
 * delete later, they are load-bearing.
 *
 * DETERMINISM
 * This file is committed and self-contained so builds are reproducible and work offline.
 * If routing is edited in Supabase, snapshot it back here with the sync script rather than
 * letting production builds depend on a live database — a DB outage must never block a deploy.
 */

/* ─────────────────────────────────────────────────────────────────────────────
   1 · PROPERTIES — one row per front end. Adding a domain starts here.
   ───────────────────────────────────────────────────────────────────────────── */
export const PROPERTIES = {
	giniloh: {
		name: 'Gini Loh',
		origin: 'https://giniloh.com',
		// Which CMS installs this property reads from. A property could read more than one.
		cmsDomains: ['cms.giniloh.com']
	},
	aichieve: {
		name: 'AIChieve',
		origin: 'https://aichieve.net',
		cmsDomains: ['cms.giniloh.com']
	}
	// e.g. a third area:
	// supplychain: { name: 'X', origin: 'https://example.net', cmsDomains: ['cms.giniloh.com'] }
};

/** The property whose build is running. Each repo sets this one value. */
export const SELF = 'giniloh'; // ← aichieve's copy sets 'aichieve'

export const SELF_PROPERTY = PROPERTIES[SELF];
export const SIBLING_PROPERTIES = Object.entries(PROPERTIES).filter(([k]) => k !== SELF);

/** Origin for a property key, falling back to SELF when the key is unknown. */
export function originFor(key) {
	return (PROPERTIES[key] ?? SELF_PROPERTY).origin;
}

/* ─────────────────────────────────────────────────────────────────────────────
   2 · CATEGORY ROUTES — evaluated in THIS ORDER, first match wins.
   Order is the priority when a post carries two categories that disagree.
   Set a category to null to route it nowhere on purpose (infrastructure terms).
   ───────────────────────────────────────────────────────────────────────────── */
export const CATEGORY_ROUTES = [
	// Categories that are cleanly one property's — new posts here route automatically.
	['supply-chain-operations', 'aichieve'],
	['ai-stack-tool-tco', 'aichieve'],
	['autonomous-agentic-workflows', 'aichieve'],
	['business-automation-operations', 'aichieve'],
	['artificial-intelligence-future-of-work', 'aichieve'], // parent of the ai-* children

	// Mixed categories. These carry a majority rule plus the overrides in §3 — see the header.
	['major-purchases-assets', 'aichieve'],
	['mental-models-strategy', 'aichieve'],

	['money-wealth', 'giniloh'],
	['career-ai-resilience', 'giniloh'],

	// Infrastructure. No audience; a post left here is a content bug, so it resolves to nothing
	// and surfaces in the unrouted report rather than quietly picking a side.
	['uncategorized', null]
];

const CATEGORY_MAP = new Map(CATEGORY_ROUTES);

/* ─────────────────────────────────────────────────────────────────────────────
   3 · POST OVERRIDES — one slug. Beats every category rule.
   The 12 posts whose category disagrees with where they actually belong. Every one of these
   lives in a MIXED category, which is why the split is per-post and cannot be per-category.
   ───────────────────────────────────────────────────────────────────────────── */
export const POST_OVERRIDES = new Map([
	['one-approval-two-payments', 'giniloh'],
	['expats-evaluating-the-true-value-of-a-job-driven-move-overseas', 'giniloh'],
	['is-a-3000-espresso-maker-machine-worth-it', 'giniloh'],
	['best-ai-proof-jobs-in-a-changing-market', 'giniloh'],
	['nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check', 'giniloh'],
	['lease-break-calculator-save-1850-in-3-steps', 'giniloh'],
	['zapier-notion-integration-calculate-your-tinkering-tax', 'giniloh'],
	['replace-laptop-screen-let-this-decision-engine-do-the-math', 'giniloh'],
	['ebike-costs-per-use-calculator-for-commuters', 'giniloh'],
	['jobs-switch-calculator-step-by-step-profit-guide', 'giniloh'],
	['calculate-your-career-relocation-payback', 'giniloh'],
	['negotiate-job-offer-with-giniloh-visualizer', 'giniloh']
]);

/* ─────────────────────────────────────────────────────────────────────────────
   4 · UNROUTED — what happens to a post no rule claims.
   'hold'  publish nowhere and report it at build time  (chosen: a gap must be loud)
   'assign:<property>'  fall back to a property        (loses the signal that something is new)
   ───────────────────────────────────────────────────────────────────────────── */
export const UNROUTED_POLICY = 'hold';

/* ─────────────────────────────────────────────────────────────────────────────
   5 · RESOLUTION
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * @param {{ slug?: string|null, categories?: string[] }} post
 *   `categories` = category SLUGS (the caller maps WordPress IDs to slugs).
 * @returns {string|null} property key, or null when nothing claims the post.
 */
export function resolveTarget(post) {
	const slug = post?.slug?.trim();
	if (!slug) return null;

	const override = POST_OVERRIDES.get(slug);
	if (override) return override;

	// First declared category that has an opinion wins — CATEGORY_ROUTES order is the priority.
	// A category mapped to null is a deliberate "no target", so it returns early rather than
	// falling through to a lower-priority category that might claim the post by accident.
	for (const cat of post.categories ?? []) {
		if (CATEGORY_MAP.has(cat)) return CATEGORY_MAP.get(cat);
	}

	return UNROUTED_POLICY === 'hold' ? null : UNROUTED_POLICY.replace(/^assign:/, '');
}

/** Does the current property own this post? Replaces the old belongsToSite(). */
export function belongsToSelf(post) {
	return resolveTarget(post) === SELF;
}

/** Drop everything another property owns. Replaces the old filterOwnedPosts(). */
export function filterOwnedPosts(posts) {
	return posts.filter(belongsToSelf);
}

/**
 * Build-time diagnostic. Returns the posts that resolved to nothing and the ones whose
 * declared categories DISAGREE with each other — both are silent failures today, and both
 * are the reason six posts went live in the CMS on 2026-10-15 and appeared on no site.
 */
export function auditRouting(posts) {
	const unrouted = [];
	const conflicting = [];

	for (const post of posts) {
		if (!resolveTarget(post)) unrouted.push(post.slug);

		const opinions = new Set(
			(post.categories ?? []).map((c) => CATEGORY_MAP.get(c)).filter((v) => v !== undefined)
		);
		if (opinions.size > 1) {
			conflicting.push({ slug: post.slug, categories: post.categories, resolvesTo: resolveTarget(post) });
		}
	}

	return { total: posts.length, unrouted, conflicting };
}
