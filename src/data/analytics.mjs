/**
 * Analytics configuration for giniloh.com — committed, not just environment.
 *
 * WHY THIS IS A FILE
 * The site had analytics only because `BaseLayout.astro` carried a hardcoded fallback id, and the
 * Dockerfile never declared `PUBLIC_ANALYTICS_*` as build args, so the values in Coolify could not
 * reach `astro build` even when they were set. That is the shape that left two sibling properties
 * shipping with no analytics at all while reporting "no traffic": an id that lives only in a build
 * argument nobody declared fails silently, and an unmeasured site looks exactly like an unvisited one.
 *
 * The website id is a public identifier — it is in the served HTML of every page — so versioning it
 * costs nothing and removes the failure mode. Environment variables still win, for a staging build or
 * a re-hosted Umami instance.
 *
 * Self-hosted Umami: the tracker and its collector both live on umami.aichieve.net, which is the
 * origin the script posts to by default. Moving the instance means editing `src` here.
 */
export const ANALYTICS = {
	/** Umami tracker. Self-hosted — not cloud.umami.is. */
	src: 'https://umami.aichieve.net/script.js',
	/** Umami → Websites → giniloh.com → Tracking code. One id PER PROPERTY: a shared id scoped to a
	 *  sibling's host drops this property's events without raising an error. */
	websiteId: 'b1931776-404b-4a39-aa69-f258a07d16f2',
	/** Umami refuses to record a pageview from a host not in this list. `www` is included because it
	 *  301s to the apex — the beacon fires on whichever host the reader landed on first. */
	domains: 'giniloh.com,www.giniloh.com'
};
