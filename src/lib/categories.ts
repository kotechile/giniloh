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

let categoryCache: Promise<CategoryRecord[]> | undefined;

async function loadCategories() {
	const liveCategories = await fetchAllCategories(100);
	if (!liveCategories.length) {
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
