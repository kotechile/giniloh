import { readFile } from 'node:fs/promises';

import { resolveCategoryCsvPath } from './source-files';

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
		id: 'todo-placeholder',
		name: 'Category Data Pending',
		slug: 'category-data-pending',
		description:
			'TODO: add wordpress_categories.csv or wordpress _categories.csv so the navigation and category pages can use real WordPress category data.',
		level: 1,
		parentCategoryId: null,
		wordpressCategoryId: null,
		wordpressSiteDomain: null,
		postCount: null,
		children: []
	}
];

let categoryCache: Promise<CategoryRecord[]> | undefined;

function parseCsvRow(line: string) {
	const values: string[] = [];
	let current = '';
	let insideQuotes = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		const nextCharacter = line[index + 1];

		if (character === '"') {
			if (insideQuotes && nextCharacter === '"') {
				current += '"';
				index += 1;
			} else {
				insideQuotes = !insideQuotes;
			}
			continue;
		}

		if (character === ',' && !insideQuotes) {
			values.push(current);
			current = '';
			continue;
		}

		current += character;
	}

	values.push(current);
	return values.map((value) => value.trim());
}

function parseCsv(content: string) {
	const rows: string[] = [];
	let current = '';
	let insideQuotes = false;

	for (let index = 0; index < content.length; index += 1) {
		const character = content[index];
		const nextCharacter = content[index + 1];

		if (character === '"') {
			if (insideQuotes && nextCharacter === '"') {
				current += '"';
				index += 1;
			} else {
				insideQuotes = !insideQuotes;
			}
			continue;
		}

		if ((character === '\n' || character === '\r') && !insideQuotes) {
			if (current.trim()) {
				rows.push(current);
			}
			current = '';
			if (character === '\r' && nextCharacter === '\n') {
				index += 1;
			}
			continue;
		}

		current += character;
	}

	if (current.trim()) {
		rows.push(current);
	}

	return rows.map(parseCsvRow);
}

function normalizeDescription(value: string | undefined) {
	return (value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeNullableValue(value: string | undefined) {
	const normalized = (value ?? '').trim();
	if (!normalized || normalized.toLowerCase() === 'null') {
		return null;
	}

	return normalized;
}

async function loadCategories() {
	const csvPath = resolveCategoryCsvPath();
	if (!csvPath) {
		return FALLBACK_CATEGORIES;
	}

	const rawContent = await readFile(csvPath, 'utf8');
	const [headerRow = [], ...rows] = parseCsv(rawContent);
	const headers = headerRow.map((header) => header.trim());

	const records: CategoryRecord[] = rows
		.map((row) => {
			const entry = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));
			return {
				id: entry.id || entry.slug,
				name: (entry.name || 'Untitled Category').trim(),
				slug: (entry.slug || entry.name || 'untitled-category')
					.trim()
					.toLowerCase()
					.replace(/\s+/g, '-'),
				description: normalizeDescription(entry.description),
				level: Number(entry.level || '1') || 1,
				parentCategoryId: normalizeNullableValue(entry.parent_category_id),
				wordpressCategoryId: normalizeNullableValue(entry.wordpress_category_id)
					? Number(entry.wordpress_category_id)
					: null,
				wordpressSiteDomain: normalizeNullableValue(entry.wordpress_site_domain),
				postCount: normalizeNullableValue(entry.count) ? Number(entry.count) : null,
				children: []
			};
		})
		.filter((category) => category.name && category.slug);

	const categoryById = new Map(records.map((category) => [category.id, category]));

	for (const category of records) {
		if (category.parentCategoryId) {
			const parent = categoryById.get(category.parentCategoryId);
			if (parent) {
				parent.children.push(category);
			}
		}
	}

	return records;
}

export async function getAllCategories() {
	categoryCache ??= loadCategories();
	return categoryCache;
}

export async function getTopLevelCategories() {
	const categories = await getAllCategories();
	return categories.filter((category) => !category.parentCategoryId);
}

export async function getCategoryBySlug(slug: string) {
	const categories = await getAllCategories();
	return categories.find((category) => category.slug === slug) ?? null;
}
