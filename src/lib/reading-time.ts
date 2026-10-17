/**
 * Reading time, derived from the post's own body.
 *
 * This replaces the card's invented metrics: PostCard.astro (since deleted) printed
 * an "Exp. ROI" percentage and an "Effort" rating that were a function of the
 * TITLE'S LENGTH. Nothing shown to a reader may be computed from anything except
 * the content itself.
 */
export function estimateReadingMinutes(html: string | null | undefined, wordsPerMinute = 220): number | null {
	const text = (html ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/&[a-z#0-9]+;/gi, ' ');
	const words = text.split(/\s+/).filter(Boolean).length;
	// null, not 0 or 1: if the body is not in the payload we have not measured anything, and
	// "1 min read" would be a number we invented. The caller renders nothing in that case.
	if (words < 50) return null;
	return Math.max(1, Math.round(words / wordsPerMinute));
}
