import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { calculatorTools } from '../lib/calculators/metadata';
import { getAllCategories } from '../lib/categories';
import { fetchAllPosts } from '../lib/wordpress';

const staticPaths = ['/', '/calculators/', '/categories/', '/about/', '/author/gini-loh/'];

function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function urlEntry(site: URL, path: string, lastmod?: string) {
	const loc = path.startsWith('http://') || path.startsWith('https://')
		? path
		: new URL(path, site).toString();
	return `\t<url>\n\t\t<loc>${loc}</loc>\n\t\t<lastmod>${lastmod}</lastmod>\n\t</url>`;
}

export const GET: APIRoute = async ({ site }) => {
	const baseUrl = site ?? new URL('https://giniloh.com');
	const [categories, posts] = await Promise.all([getAllCategories(), fetchAllPosts()]);
	
	const today = new Date().toISOString().split('T')[0];
	const entries: string[] = [];

	// 1. Static Pages
	for (const path of staticPaths) {
		entries.push(urlEntry(baseUrl, path, today));
	}

	// 2. Apps & Showcase (apps.giniloh.com)
	const appUrls = [
		'https://apps.giniloh.com',
		'https://apps.giniloh.com/showcase',
		'https://apps.giniloh.com/LedgerLink',
		'https://apps.giniloh.com/FacturGate',
		'https://apps.giniloh.com/ParcelProof',
		'https://apps.giniloh.com/CaseProof',
		'https://apps.giniloh.com/SpendProof'
	];
	for (const appUrl of appUrls) {
		entries.push(urlEntry(baseUrl, appUrl, today));
	}

	// 3. Main Calculators
	for (const tool of calculatorTools) {
		entries.push(urlEntry(baseUrl, tool.href, today));
	}

	// 3. Career AI Resilience Occupation Pages
	try {
		const careersIndexPath = path.resolve('./public/data/careers/index.json');
		if (fs.existsSync(careersIndexPath)) {
			const careers = JSON.parse(fs.readFileSync(careersIndexPath, 'utf-8'));
			const slugsSeen = new Set<string>();
			for (const item of careers) {
				let slug = slugify(item.title || '');
				if (slugsSeen.has(slug)) {
					slug = `${slug}-${(item.code || '').replace('.', '-')}`;
				}
				slugsSeen.add(slug);
				entries.push(urlEntry(baseUrl, `/calculators/career-ai-resilience/${slug}/`, today));
			}
		}
	} catch (e) {
		console.warn('Could not load career occupations for sitemap:', e);
	}

	// 4. Categories
	for (const category of categories) {
		entries.push(urlEntry(baseUrl, `/categories/${category.slug}/`, today));
	}

	// 5. WordPress Article Posts
	for (const post of posts) {
		const rawDate = post.modified || post.date || today;
		const formattedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
		entries.push(urlEntry(baseUrl, `/${post.slug}/`, formattedDate));
	}

	const body = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...entries,
		'</urlset>'
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8'
		}
	});
};
