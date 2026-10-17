/**
 * The one figure each article is actually about.
 *
 * Hand-authored on purpose. A build-time extractor was prototyped and measured before being
 * rejected: of the 17 posts whose body carries a key-takeaways block, 14 contain two or more
 * distinct figures (one contains more than 50) and exactly one contains a single figure, so an
 * extractor could emit a callout for 1 post in 17 — while being a machine for quoting one number
 * out of context on a site whose pitch is that its numbers are trustworthy.
 *
 * Nothing here is trusted on faith. `getKeyStat()` checks that `value` appears verbatim in that
 * post's own content at build time; if it does not, the callout is dropped and the build log says
 * so. So a figure can only appear if the article it came from still says it.
 *
 * To add one: read the article, find the single figure it turns on, and copy the digits exactly as
 * the article writes them. If a post has two equally central figures, it has none — pick neither
 * rather than guess which one matters.
 */
export const KEY_STATS = [
	{
		slug: 'self-hosting-break-even-one-hour-a-year',
		value: '1.26 hours',
		label: 'of upkeep a year before a $5/mo plan wins'
	},
	{
		slug: 'your-raise-dies-at-51-5-hours',
		value: '51.5 hours',
		label: 'a week — where the median raise dies'
	}
];
