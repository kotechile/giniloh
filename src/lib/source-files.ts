import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_DIR = process.cwd();

function findExistingFile(candidates: string[]) {
	for (const candidate of candidates) {
		const absolutePath = resolve(ROOT_DIR, candidate);
		if (existsSync(absolutePath)) {
			return absolutePath;
		}
	}

	return null;
}

export function resolveCategoryCsvPath() {
	return findExistingFile([
		'wordpress_categories.csv',
		'wordpress _categories.csv',
		'categories.csv',
		'Documents/_giniloh_front_end/wordpress_categories.csv',
		'Documents/_giniloh_front_end/wordpress _categories.csv',
		'Documents/_giniloh_front_end/categories.csv'
	]);
}

export function resolveOverviewPath() {
	return findExistingFile([
		'giniloh_overview.md',
		'giniloh overview.md',
		'overview.md',
		'Documents/_giniloh_front_end/giniloh_overview.md',
		'Documents/_giniloh_front_end/giniloh overview.md',
		'Documents/_giniloh_front_end/overview.md'
	]);
}
