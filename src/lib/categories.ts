import { readFile } from 'node:fs/promises';
import { resolveCategoryCsvPath } from './source-files';
import { fetchAllCategories } from './wordpress';

export interface CategoryRecord {
	id: string;
	name: string;
	slug: string;
	description: string;
	level: number;
	parentCategoryId: string | null;
	wordpressCategoryId: number | null;
	wordpressSiteDomain: string | null;
	postCount: number | null;
	children: CategoryRecord[];
}

const FALLBACK_CATEGORIES: CategoryRecord[] = [
	{
		id: 'wordpress-categories-unavailable',
		name: 'WordPress Categories Unavailable',
		slug: 'wordpress-categories-unavailable',
		description:
			'TODO: configure PUBLIC_WORDPRESS_API_BASE and ensure the WordPress REST API is reachable so the category menu and pages can load live taxonomy data.',
		level: 1,
		parentCategoryId: null,
		wordpressCategoryId: null,
		wordpressSiteDomain: null,
		postCount: null,
		children: []
	}
];

function parseCsvLine(line: string): string[] {
	const row: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++; // Skip next quote
			} else {
				inQuotes = !inQuotes;
			}
		} else if (char === ',' && !inQuotes) {
			row.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	row.push(current.trim());
	return row;
}

function parseCsv(csvText: string): Record<string, string>[] {
	const lines = csvText.split(/\r?\n/);
	if (lines.length < 2) return [];

	const headers = parseCsvLine(lines[0]);
	const records: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const values = parseCsvLine(line);
		const record: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			record[headers[j]] = values[j] ?? '';
		}
		records.push(record);
	}

	return records;
}

let categoryCache: Promise<CategoryRecord[]> | undefined;

async function loadCategories() {
	const liveCategories = await fetchAllCategories(100);
	if (!liveCategories.length) {
		try {
			const csvPath = resolveCategoryCsvPath();
			if (csvPath) {
				const csvContent = await readFile(csvPath, 'utf8');
				const parsed = parseCsv(csvContent);
				const csvRecords: CategoryRecord[] = parsed.map((row) => {
					const wpId = row.wordpress_category_id ? parseInt(row.wordpress_category_id, 10) : null;
					return {
						id: row.id,
						name: row.name,
						slug: row.slug,
						description: row.description,
						level: row.level ? parseInt(row.level, 10) : 1,
						parentCategoryId: row.parent_category_id === 'null' || !row.parent_category_id ? null : row.parent_category_id,
						wordpressCategoryId: isNaN(Number(wpId)) ? null : wpId,
						wordpressSiteDomain: row.wordpress_site_domain === 'null' || !row.wordpress_site_domain ? null : row.wordpress_site_domain,
						postCount: 0,
						children: []
					};
				});
				return csvRecords.filter((category) => category.name && category.slug && category.slug !== 'uncategorized');
			}
		} catch (error) {
			console.error('Failed to load categories from CSV:', error);
		}
		return FALLBACK_CATEGORIES;
	}

	const records: CategoryRecord[] = liveCategories
		.filter((category) => !category.parent)
		.map((category) => ({
			id: String(category.id),
			name: category.name,
			slug: category.slug,
			description: category.description,
			level: 1,
			parentCategoryId: null,
			wordpressCategoryId: category.id,
			wordpressSiteDomain: null,
			postCount: category.count,
			children: []
		}))
		.filter((category) => category.name && category.slug && category.slug !== 'uncategorized');

	return records;
}

export async function getAllCategories() {
	categoryCache ??= loadCategories();
	return categoryCache;
}

export async function getTopLevelCategories() {
	const categories = await getAllCategories();
	return categories
		.filter((category) => !category.parentCategoryId)
		.sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCategoryBySlug(slug: string) {
	const categories = await getAllCategories();
	return categories.find((category) => category.slug === slug) ?? null;
}
