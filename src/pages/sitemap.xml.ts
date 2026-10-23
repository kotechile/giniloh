import type { APIRoute } from 'astro';
import { calculatorTools } from '../lib/calculators/metadata';
import { getContentCategorySlugs } from '../lib/categories';
import { fetchAllPosts } from '../lib/wordpress';
import { CAREER_INDEX_PATH, publishedCareerEntries } from '../lib/careers';

/**
 * The one sitemap this property serves.
 *
 * `robots.txt` declares `/sitemap.xml`, and this route is what answers it. `@astrojs/sitemap` used to
 * emit a second, unreferenced `sitemap-index.xml` + `sitemap-0.xml` alongside it — two answers to
 * "what is on this site", drifting apart, with only one of them read by crawlers. That integration is
 * gone; this file is the only authority.
 *
 * Two rules that were learned the hard way, and that `scripts/verify.mjs` now enforces:
 *
 *  1. Every URL here must be a page that exists and canonicalises to itself. The career entries come
 *     from `src/lib/careers.ts` — the same module the `[slug]` route builds paths from — precisely so
 *     the sitemap cannot advertise a URL shape the routes do not serve.
 *  2. `lastmod` appears only where the content system gives a real modification date. Stamping every
 *     URL with `today` taught crawlers the field is noise, and they then ignore it sitewide.
 */

const staticPaths = ['/', '/calculators/', '/articles/', '/about/', '/author/gini-loh/', CAREER_INDEX_PATH];

function urlEntry(site: URL, path: string, lastmod?: string) {
	const loc = path.startsWith('http://') || path.startsWith('https://') ? path : new URL(path, site).toString();
	const lastmodTag = lastmod ? `\n\t\t<lastmod>${lastmod}</lastmod>` : '';
	return `\t<url>\n\t\t<loc>${loc}</loc>${lastmodTag}\n\t</url>`;
}

/** WordPress gives an ISO timestamp; the sitemap protocol wants a date. */
function isoDate(raw: string | undefined | null): string | undefined {
	if (!raw) return undefined;
	const date = raw.includes('T') ? raw.split('T')[0] : raw;
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
}

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = site ?? new URL('https://giniloh.com');
	const [categories, posts] = await Promise.all([getContentCategorySlugs(), fetchAllPosts()]);

	const entries: string[] = [];

	// 1. Static pages. Undated on purpose: these are hubs, and a hub's "last modified" is whatever the
	// build clock says, which is not information.
	for (const path of staticPaths) {
		entries.push(urlEntry(baseUrl, path));
	}

	// 2. Apps & Showcase deliberately ABSENT.
	//
	// This sitemap used to list six apps.aichieve.net URLs (/showcase, /ledgerlink, /facturgate,
	// /parcelproof, /caseproof, /spendproof). They all resolve, but the sitemap protocol requires
	// every <loc> to be on the SAME host as the sitemap: Google discards cross-host entries and
	// reports them as errors against the property, so those six bought nothing and cost a broken
	// sitemap. They belong in a sitemap served by apps.aichieve.net.

	// 3. Main calculators. No per-tool date exists in the metadata, so none is invented.
	for (const tool of calculatorTools) {
		entries.push(urlEntry(baseUrl, tool.href));
	}

	// 4. Career AI Resilience occupation pages — the published subset only.
	//
	// `publishedCareerEntries()` is the same list `[slug].astro` builds from, so the 93 codes with no
	// O*NET task inventory (no longer built) cannot leak in here, and the paths carry no
	// `/occupations/` segment because the path is defined in exactly one place.
	for (const entry of publishedCareerEntries()) {
		entries.push(urlEntry(baseUrl, entry.path));
	}

	// 5. Article category hubs.
	for (const category of categories) {
		entries.push(urlEntry(baseUrl, `/articles/${category.slug}/`));
	}

	// 6. WordPress posts. These are the only URLs with an honest lastmod.
	for (const post of posts) {
		entries.push(urlEntry(baseUrl, `/${post.slug}/`, isoDate(post.modified) ?? isoDate(post.date)));
	}

	// Dedupe by <loc>: a path can legitimately arrive from two sources (a calculator's metadata href
	// and the career index), and listing it twice is a crawl-report error for no gain.
	const seen = new Set<string>();
	const unique = entries.filter((entry) => {
		const loc = entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
		if (!loc || seen.has(loc)) return false;
		seen.add(loc);
		return true;
	});

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...unique,
		'</urlset>'
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
