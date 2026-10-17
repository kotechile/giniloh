#!/usr/bin/env node
/**
 * Gates the stat callouts.
 *
 * Two rules, because the two page shapes can honestly be checked to different depths:
 *
 *  1. Authorship — every figure rendered on any page must correspond to an entry in
 *     src/data/key-stats.mjs, so nothing reaches a page that an editor did not write down.
 *  2. Traceability — on the article's own page, the figure must appear in the page body as well as
 *     in the callout. That is the strong check: it proves the article still says the number the
 *     card quotes. It cannot be run on list pages, where the body is absent by design — asserting
 *     it there was the first version of this gate and it was simply wrong.
 *
 * The build already drops a callout whose value is missing from the post content
 * (see src/lib/key-stats.ts); this is the independent, post-build check on that promise.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { KEY_STATS } from '../src/data/key-stats.mjs';

const DIST = process.argv[2] || 'dist';
const allowed = new Set(KEY_STATS.map((entry) => entry.value));

function* pages(dir) {
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) yield* pages(path);
		else if (name.endsWith('.html')) yield path;
	}
}

function bodyOf(html) {
	return html
		.replace(/<script[\s\S]*?<\/script>/g, ' ')
		.replace(/<style[\s\S]*?<\/style>/g, ' ')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/\s+/g, ' ');
}

let unauthored = 0;
let untraceable = 0;
let renderedTotal = 0;

for (const path of pages(DIST)) {
	const html = readFileSync(path, 'utf8');
	const values = new Set([...html.matchAll(/data-key-stat="([^"]+)"/g)].map((m) => m[1]));
	for (const value of values) {
		renderedTotal += 1;
		if (!allowed.has(value)) {
			unauthored += 1;
			console.error(`  FAIL ${path.replace(DIST, '')}: renders "${value}", which is not in src/data/key-stats.mjs`);
		}
	}
}

let checked = 0;
for (const entry of KEY_STATS) {
	const articlePath = join(DIST, entry.slug, 'index.html');
	if (!existsSync(articlePath)) continue;
	const html = readFileSync(articlePath, 'utf8');
	if (!html.includes(`data-key-stat="${entry.value}"`)) continue; // no callout rendered: nothing claimed
	checked += 1;
	if (bodyOf(html).split(entry.value).length - 1 < 2) {
		untraceable += 1;
		console.error(`  FAIL ${entry.slug}: callout "${entry.value}" does not appear in the article body`);
	}
}

const failures = unauthored + untraceable;
console.log(
	failures
		? `\n${failures} stat problem(s): ${unauthored} unauthored, ${untraceable} untraceable`
		: `all ${renderedTotal} rendered stat callout(s) authored; ${checked} verified against their article body`
);
process.exit(failures ? 1 : 0);
