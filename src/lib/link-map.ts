/**
 * Ownership-aware resolution of internal links found inside WordPress article bodies.
 *
 * Mirror of AICHIEVE/src/lib/link-map.ts with the roles swapped. Article HTML is authored in the
 * shared CMS and carries plain internal links like
 * `href="https://cms.giniloh.com/gpu-hour-price-set-by-memory/"`. `wordpress.ts` rewrites those to
 * front-end paths, and it used to rewrite EVERY one to a site-relative path. That was correct
 * while there was one site; after the 2026 split it silently produced broken links, because the
 * target may now live on the sibling property.
 *
 * Measured at split time: 5 broken links on giniloh.com (2 articles) and 30 on aichieve.net
 * (16 articles).
 *
 * The rule:
 *   · target owned by THIS property   -> site-relative   ("/calculators/lease-break/")
 *   · target owned by the SIBLING     -> absolute        ("https://aichieve.net/tools/…")
 *   · target unknown to both          -> left relative; a dead link in the content, and
 *                                        inventing a destination would be worse
 *
 * The moved-tool mapping comes from `data/ownership.mjs`, so the redirect map that `astro.config`
 * generates and the links rewritten inside article bodies can never disagree.
 */
import { calculatorTools } from './calculators/metadata';
import {
	OWNED_POST_SLUGS,
	FOREIGN_POST_SLUGS,
	OWNED_CATEGORY_SLUGS,
	SIBLING_SITE,
	MOVED_TOOL_PATHS
} from './site-content';

const OWNED_CATEGORIES = new Set<string>(OWNED_CATEGORY_SLUGS);
const OWN_TOOL_PATHS = new Set<string>(calculatorTools.map((tool) => tool.href));

/** Paths that are no longer served here and now belong to the other property, absolute. */
const MOVED_TO_SIBLING: Record<string, string> = Object.fromEntries(
	MOVED_TOOL_PATHS.map(({ from, to }) => [from, to])
);

/** The PRO app directory moved to aichieve as part of the split. */
const APP_DIRECTORY_ALIASES = ['/showcase/', '/pro-apps/', '/apps/'];

/** Hosts that can appear in authored content and should be treated as internal. */
export const INTERNAL_HOSTS = ['cms.giniloh.com', 'giniloh.com', 'www.giniloh.com', 'aichieve.net', 'www.aichieve.net'];

/** Strip query/hash, the CMS dated-permalink prefix, and force a trailing slash. */
export function normalisePath(raw: string): string {
	let path = raw.split(/[?#]/)[0].trim();
	if (!path.startsWith('/')) path = `/${path}`;
	path = path.replace(/\/{2,}/g, '/');
	// The CMS serves /2026/06/12/slug/; the front end serves /slug/.
	path = path.replace(/^\/\d{4}\/\d{2}\/\d{2}\//, '/');
	if (path.length > 1 && !path.endsWith('/')) path += '/';
	return path;
}

/** Resolve one internal path to its correct destination for THIS property. */
export function resolveInternalLink(rawPath: string): string {
	const path = normalisePath(rawPath);
	const segment = path.replace(/^\//, '').replace(/\/$/, '');
	if (!segment) return '/';

	// Content that was written against the post-split world: send it straight to the new home.
	if (MOVED_TO_SIBLING[path]) return MOVED_TO_SIBLING[path];
	if (APP_DIRECTORY_ALIASES.includes(path)) return `${SIBLING_SITE.origin}/apps/`;

	// Tools owned here are matched exactly, before the generic rules, because
	// `/calculators/lease-break/` is also a plausible "slug" shape.
	if (OWN_TOOL_PATHS.has(path)) return path;
	// The local calculator hub itself.
	if (path === '/calculators/') return path;

	// Articles. The taxonomy is fully partitioned between the two properties, so anything not
	// owned here belongs to the sibling.
	const category = path.match(/^\/(?:categories|category)\/([^/]+)\/$/);
	if (category) {
		const slug = category[1];
		return OWNED_CATEGORIES.has(slug)
			? `/articles/${slug}/`
			: `${SIBLING_SITE.origin}/categories/${slug}/`;
	}

	// Posts.
	const post = path.match(/^\/([^/]+)\/$/);
	if (post) {
		const slug = post[1];
		if (OWNED_POST_SLUGS.has(slug)) return `/${slug}/`;
		if (FOREIGN_POST_SLUGS.has(slug)) return `${SIBLING_SITE.origin}/${slug}/`;
		// Not published on either property — a dead link in the content. Leave it visible rather
		// than inventing a destination.
		return `/${slug}/`;
	}

	return path;
}
