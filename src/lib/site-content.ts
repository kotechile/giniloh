/**
 * Typed runtime view of the split manifest.
 *
 * The slug lists themselves live in `src/data/ownership.mjs`, NOT here — because `astro.config.mjs`
 * also needs them (to generate the 301 map for moved URLs) and is evaluated before TypeScript is
 * available. One copy, two loaders. Do not restate the lists in this file.
 *
 * This module is the only thing that decides whose index a post lands in, and every WordPress read
 * in `lib/wordpress.ts` funnels through it.
 */
import {
	GINILOH_ORIGIN,
	AICHIEVE_ORIGIN,
	GINILOH_POST_SLUGS,
	AICHIEVE_POST_SLUGS,
	MOVED_TOOL_PATHS,
	AICHIEVE_TOOL_PATHS
} from '../data/ownership.mjs';

export { MOVED_TOOL_PATHS, AICHIEVE_TOOL_PATHS, GINILOH_ORIGIN, AICHIEVE_ORIGIN };

/** Posts that belong to giniloh.com. */
export const OWNED_POST_SLUGS: ReadonlySet<string> = new Set<string>(GINILOH_POST_SLUGS);

/** Posts that belong to aichieve.net and must never render here. */
export const FOREIGN_POST_SLUGS: ReadonlySet<string> = new Set<string>(AICHIEVE_POST_SLUGS);

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
