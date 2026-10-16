/**
 * Typed runtime view of content ownership.
 *
 * Ownership is DERIVED, not hand-written: each WordPress post carries a `vertical` term, and
 * Supabase `vertical_sites` maps vertical -> site_domain. `scripts/routing-sync.mjs` resolves that
 * and writes `src/data/ownership.generated.mjs`, which is what this module reads.
 *
 * So adding a property, or moving a post, is now a DATA change — insert a vertical_sites row and
 * re-run the sync. No edits to any front-end repo. Previously this was a per-repo slug list, which
 * meant adding a third property required editing the manifests in BOTH existing ones and a
 * forgotten slug published to no site at all.
 *
 * WHY THE GENERATED FILE AND NOT A LIVE READ
 * Builds must be deterministic and must never depend on a network service being up. The sync is a
 * deliberate step; the build reads its committed output.
 *
 * `ownership.mjs` still holds what is genuinely configuration (origins, moved tool paths) and its
 * hand-written slug lists remain as the assertion baseline: `npm run routing:check` fails if the
 * derived answer would make a currently-published post silently LEAVE this site.
 */
import {
	GINILOH_ORIGIN,
	AICHIEVE_ORIGIN,
	MOVED_TOOL_PATHS,
	AICHIEVE_TOOL_PATHS
} from '../data/ownership.mjs';
import {
	OWNED_POST_SLUGS_GENERATED,
	FOREIGN_POST_SLUGS_GENERATED
} from '../data/ownership.generated.mjs';

export { MOVED_TOOL_PATHS, AICHIEVE_TOOL_PATHS, GINILOH_ORIGIN, AICHIEVE_ORIGIN };

/** Posts that belong to giniloh.com — derived from verticals. */
export const OWNED_POST_SLUGS: ReadonlySet<string> = new Set<string>(OWNED_POST_SLUGS_GENERATED);

/** Posts that belong to another property and must never render here. */
export const FOREIGN_POST_SLUGS: ReadonlySet<string> = new Set<string>(FOREIGN_POST_SLUGS_GENERATED);

/** The other property. Used for cross-links and the 301 map, never rendered as content. */
export const SIBLING_SITE = {
	name: 'AIChieve',
	origin: AICHIEVE_ORIGIN
} as const;

/** Top-level WordPress category slugs this site's navigation and index pages may show. */
export const OWNED_CATEGORY_SLUGS = [
	'major-purchases-assets',
	'mental-models-strategy',
	'money-wealth'
] as const;

export function belongsToSite(post: { slug?: string | null }): boolean {
	const slug = post?.slug?.trim();
	return typeof slug === 'string' && slug.length > 0 && OWNED_POST_SLUGS.has(slug);
}

/** Drop everything the other property owns. Applied to every WordPress read. */
export function filterOwnedPosts<T extends { slug?: string | null }>(posts: T[]): T[] {
	return posts.filter(belongsToSite);
}

/** Absolute URL of this post on the sibling property. */
export function siblingUrlFor(post: { slug?: string | null }): string {
	const slug = post?.slug?.trim();
	return slug ? `${SIBLING_SITE.origin}/${slug}/` : SIBLING_SITE.origin;
}
