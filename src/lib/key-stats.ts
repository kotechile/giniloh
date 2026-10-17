import { KEY_STATS } from '../data/key-stats.mjs';

export interface KeyStat {
	value: string;
	label: string;
}

const bySlug = new Map<string, { slug: string; value: string; label: string }>(
	KEY_STATS.map((entry) => [entry.slug, entry])
);

const alreadyWarned = new Set<string>();

function plainText(html: string) {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&#8217;|&rsquo;/g, '\u2019')
		.replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
		.replace(/\s+/g, ' ');
}

/**
 * The one figure a post is about, or null.
 *
 * Returns null when the post has no authored entry (the normal case — most articles turn on an
 * argument rather than a number) and when the authored value is no longer present in the post's
 * content. The second case warns rather than throwing: dropping the callout is always the safe
 * outcome, and a stale figure must never be published just because the build stayed green.
 */
export function getKeyStat(post: { slug: string; content?: string }): KeyStat | null {
	const entry = bySlug.get(post.slug);
	if (!entry) return null;

	if (!plainText(post.content ?? '').includes(entry.value)) {
		if (!alreadyWarned.has(entry.slug)) {
			alreadyWarned.add(entry.slug);
			console.warn(
				`[key-stats] ${entry.slug}: "${entry.value}" is no longer present in the post content, so its callout is omitted. ` +
					`Update src/data/key-stats.mjs or remove the entry.`
			);
		}
		return null;
	}

	return { value: entry.value, label: entry.label };
}
