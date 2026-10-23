import fs from 'node:fs';
import path from 'node:path';

/**
 * One source of truth for the career-occupation page set.
 *
 * WHY THIS IS A MODULE AND NOT THREE COPIES
 * `public/data/careers/index.json` used to be read independently by the sitemap generator and by
 * the `[slug]` route, each with its own copy of the same `slugify`. The copies drifted: the sitemap
 * emitted 1,017 career URLs while the route built 1,016 pages, and the canonical on every one of
 * those pages pointed at `/calculators/career-ai-resilience/occupations/<slug>/` — a path no route
 * has ever served. 94% of the sitemap was canonicalising to a 404.
 *
 * Everything that needs the occupation list (sitemap, `[slug]`, the A–Z index, related links) now
 * goes through here, so the path a page is built at and the path the sitemap advertises cannot
 * disagree.
 */

export const CAREERS_DIR = './public/data/careers';
export const CAREERS_INDEX_PATH = path.resolve(CAREERS_DIR, 'index.json');
export const CAREER_HUB_PATH = '/calculators/career-ai-resilience/';
export const CAREER_INDEX_PATH = '/calculators/career-ai-resilience/all-occupations/';

/** The subset of an index record this module needs. Detail pages read the per-code file. */
export interface CareerItem {
	code: string;
	title: string;
	description: string;
	scored: boolean;
	risk_score: number | null;
	tasks_count: number;
	salary: number | null;
	employment: number | null;
	employment_band: string;
	[key: string]: unknown;
}

/** An index record plus the slug it is published at. */
export interface CareerEntry extends CareerItem {
	slug: string;
	path: string;
}

export function slugifyOccupation(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function occupationPath(slug: string): string {
	return `${CAREER_HUB_PATH}${slug}/`;
}

let cache: CareerItem[] | null = null;

export function loadCareerIndex(): CareerItem[] {
	if (cache) return cache;
	cache = JSON.parse(fs.readFileSync(CAREERS_INDEX_PATH, 'utf-8')) as CareerItem[];
	return cache;
}

let entriesCache: CareerEntry[] | null = null;

/**
 * Every index record with its published path.
 *
 * Slugs are assigned in file order over the FULL list, exactly as the route did before this module
 * existed — filtering first would reshuffle the duplicate-suffix order and silently move pages.
 */
export function loadCareerEntries(): CareerEntry[] {
	if (entriesCache) return entriesCache;
	const seen = new Set<string>();
	entriesCache = loadCareerIndex().map((item) => {
		let slug = slugifyOccupation(item.title);
		if (seen.has(slug)) slug = `${slug}-${item.code.replace('.', '-')}`;
		seen.add(slug);
		return { ...item, slug, path: occupationPath(slug) };
	});
	return entriesCache;
}

/**
 * The pages that actually exist.
 *
 * `scored: false` means O*NET publishes no task inventory for the code (residual "All Other"
 * categories and military branches) — those pages carry no task table, no score and no unique
 * substance, so they are not built and are not advertised. 93 of 1,016 fall here.
 */
export function publishedCareerEntries(): CareerEntry[] {
	return loadCareerEntries().filter((entry) => entry.scored);
}

/** Largest occupations first — the order the A–Z index leads with and the P3 content queue uses. */
export function byEmploymentDesc(a: CareerEntry, b: CareerEntry): number {
	return (b.employment ?? -1) - (a.employment ?? -1);
}

export function topCareers(limit = 50): CareerEntry[] {
	return publishedCareerEntries().filter((e) => (e.employment ?? 0) > 0).sort(byEmploymentDesc).slice(0, limit);
}

/**
 * Occupations in the same O*NET family (the two digits before the dash) — the internal-link surface
 * that keeps 900+ pages from being reachable only through the sitemap.
 */
export function relatedCareers(entry: CareerEntry, limit = 6): CareerEntry[] {
	const family = entry.code.slice(0, 2);
	return publishedCareerEntries()
		.filter((other) => other.code !== entry.code && other.code.slice(0, 2) === family)
		.sort(byEmploymentDesc)
		.slice(0, limit);
}

/** Group published pages alphabetically, for the A–Z index. */
export function careersByLetter(): { letter: string; entries: CareerEntry[] }[] {
	const groups = new Map<string, CareerEntry[]>();
	for (const entry of publishedCareerEntries()) {
		const letter = entry.title.charAt(0).toUpperCase();
		if (!groups.has(letter)) groups.set(letter, []);
		groups.get(letter)!.push(entry);
	}
	return [...groups.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([letter, entries]) => ({
			letter,
			entries: entries.sort((a, b) => a.title.localeCompare(b.title))
		}));
}
