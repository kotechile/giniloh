#!/usr/bin/env node
/**
 * Deploy-contract verification for giniloh.com.
 *
 * WHY THIS EXISTS
 * `npm run check` and `npm run build` prove the site COMPILES. Nothing proved it was deployed
 * correctly, and the property was carrying three defects that every one of those commands reports
 * as green:
 *
 *   1. https://www.giniloh.com failed the TLS handshake (Traefik served its default cert — no router
 *      for the host, so no certificate was ever requested) while DNS resolved it to this box.
 *   2. The declared sitemap listed six apps.aichieve.net URLs. The sitemap protocol requires every
 *      <loc> to be on the SAME host as the sitemap; Google discards cross-host entries.
 *   3. Every nginx redirect emitted `Location: http://giniloh.com/...` — absolute, built from the
 *      internal listen port and scheme — downgrading each redirect to plain http for one hop.
 *
 * None of those break a build, and none are visible by loading the homepage. They are the deploy
 * contract, so they get assertions:
 *
 *     node scripts/verify.mjs                       # against http://localhost:8899
 *     node scripts/verify.mjs https://giniloh.com   # against production
 *     npm run verify -- https://giniloh.com
 *
 * Exit code 0 = the deploy honours its contract. Non-zero = it does not, with expected vs actual.
 * No dependencies, deliberately: it has to run anywhere the image runs.
 */
import { OWNED_POST_SLUGS_GENERATED, FOREIGN_POST_SLUGS_GENERATED, GENERATED_FOR } from '../src/data/ownership.generated.mjs';
import { ANALYTICS } from '../src/data/analytics.mjs';

const ORIGIN = (process.argv[2] || process.env.VERIFY_ORIGIN || 'http://localhost:8899').replace(/\/$/, '');
const CANONICAL_HOST = 'giniloh.com';
const TIMEOUT_MS = 20000;

let passed = 0;
const failures = [];

function ok(label, detail = '') {
	passed++;
	console.log(`  \u001b[32mPASS\u001b[0m  ${label}${detail ? `  ${detail}` : ''}`);
}

function fail(label, expected, actual) {
	failures.push({ label, expected, actual });
	console.log(`  \u001b[31mFAIL\u001b[0m  ${label}`);
	console.log(`        expected: ${expected}`);
	console.log(`        actual:   ${actual}`);
}

/** Fetch and report the final status, redirect target and body. */
async function probe(path, { follow = false } = {}) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(`${ORIGIN}${path}`, { redirect: follow ? 'follow' : 'manual', signal: controller.signal });
		return {
			status: res.status,
			location: res.headers.get('location'),
			contentType: res.headers.get('content-type') || '',
			body: follow || res.status === 200 ? await res.text() : ''
		};
	} catch (error) {
		return { status: 0, location: null, contentType: '', body: '', error: String(error) };
	} finally {
		clearTimeout(timer);
	}
}

// ── Checks ────────────────────────────────────────────────────────────────────────────────
async function checkCoreRoutes() {
	console.log('\nCore routes');
	const routes = [
		'/',
		'/calculators/',
		'/calculators/money-flow/',
		'/calculators/career-ai-resilience/',
		'/articles/',
		'/about/',
		'/author/gini-loh/'
	];
	for (const route of routes) {
		const r = await probe(route);
		if (r.status === 200) ok(route, '200');
		else fail(route, '200', r.error ? `no response (${r.error})` : `${r.status}`);
	}
}

async function checkAssets() {
	console.log('\nAssets');
	for (const asset of ['/favicon.svg', '/embed.js', '/sitemap.xml']) {
		const r = await probe(asset);
		if (r.status === 200) ok(asset, '200');
		else fail(asset, '200', `${r.status}`);
	}
}

/**
 * Crawl artifacts, and the host scope of the sitemap.
 *
 * The host-scope assertion is the one that matters here: this sitemap used to advertise six
 * apps.aichieve.net product URLs. They resolve perfectly well — which is why nobody noticed — but a
 * sitemap may only contain URLs from its own host, so Google threw those entries away and reported
 * them as errors against this property.
 */
async function checkCrawlArtifacts() {
	console.log('\nCrawl artifacts');

	const robots = await probe('/robots.txt');
	if (robots.status !== 200) {
		fail('/robots.txt', '200', `${robots.status}`);
	} else {
		ok('/robots.txt', '200');
		const declared = [...robots.body.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((m) => m[1]);
		if (declared.length === 0) fail('/robots.txt Sitemap line', 'at least one "Sitemap: <url>"', 'none found');
		for (const url of declared) {
			// Resolve against the host under test, so a local run proves the path too.
			const path = url.replace(/^https?:\/\/[^/]+/, '') || '/';
			const r = await probe(path);
			if (r.status === 200) ok(`robots.txt declares ${path}`, '200');
			else fail(`robots.txt declares ${path}`, '200', `${r.status}`);
		}
	}

	const sitemap = await probe('/sitemap.xml');
	if (sitemap.status !== 200) {
		fail('/sitemap.xml', '200', `${sitemap.status}`);
		return;
	}
	const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	if (locs.length === 0) {
		fail('/sitemap.xml contents', 'a urlset or sitemapindex with <loc> entries', 'zero <loc>');
		return;
	}
	ok('/sitemap.xml', `${locs.length} urls`);

	// Every URL must belong to this host. One foreign host is a protocol violation, not a nitpick:
	// the whole file is rejected for that host's URLs.
	const foreign = locs.filter((loc) => {
		try {
			const host = new URL(loc).host;
			return host !== CANONICAL_HOST && host !== new URL(ORIGIN).host;
		} catch {
			return true;
		}
	});
	if (foreign.length === 0) ok('every <loc> is on this host', CANONICAL_HOST);
	else fail('sitemap host scope', `all <loc> on ${CANONICAL_HOST}`, `${foreign.length} foreign: ${foreign.slice(0, 3).join(', ')}${foreign.length > 3 ? ', …' : ''}`);

	// An index that points at a dead chunk is worse than no index: crawlers cache the failure.
	if (/<sitemapindex/.test(sitemap.body)) {
		let total = 0;
		for (const loc of locs) {
			const path = loc.replace(/^https?:\/\/[^/]+/, '') || '/';
			const r = await probe(path);
			if (r.status !== 200) {
				fail(`sitemap chunk ${path}`, '200', `${r.status}`);
				continue;
			}
			total += (r.body.match(/<url>/g) || []).length;
			ok(`sitemap chunk ${path}`, '200');
		}
		if (total === 0) fail('sitemap chunk URLs', 'at least one <url>', 'zero across all chunks');
	}

	// A noindex page listed in a sitemap asks Google to index a page that tells it not to. The
	// calculator embeds are exactly that, and `src/pages/sitemap.xml.ts` builds its list from the
	// calculator metadata plus the career page set, neither of which contains an embed route.
	const embed = await probe('/calculators/embed/money-flow/');
	if (embed.status === 200) {
		const declared = locs.some((loc) => loc.includes('/calculators/embed/'));
		if (declared) fail('noindex embed pages excluded from sitemap', 'no /calculators/embed/ URLs', 'listed');
		else ok('noindex embed pages excluded from sitemap');
	}
}

/**
 * Redirects must not downgrade to http or leak an internal port.
 *
 * nginx builds an absolute Location from its own listen port and scheme unless `absolute_redirect`
 * is off, and Traefik is what terminates TLS — so `return 301 /about/` used to answer
 * `http://giniloh.com/about/`: plain http, then a second hop back to https.
 */
async function checkRedirects() {
	console.log('\nRedirects stay on https and keep the path');
	const cases = [
		['/2026/06/06/best-ai-proof-jobs-in-a-changing-market/', '/best-ai-proof-jobs-in-a-changing-market/'],
		['/home/about-us/', '/about/'],
		// The two calculators that moved to aichieve.net in the split. They are still built into this
		// site's dist, so a redirect that silently stopped firing would serve a stale copy here.
		['/calculators/gpu-compute/', '/tools/gpu-compute/']
	];
	for (const [from, expectedTarget] of cases) {
		const r = await probe(from);
		if (r.status !== 301) {
			fail(from, `301 -> ${expectedTarget}`, `${r.status}${r.error ? ` (${r.error})` : ''}`);
			continue;
		}
		const location = r.location || '';
		if (location.startsWith('http://')) {
			fail(`${from} Location`, 'https or relative', location);
			continue;
		}
		const target = location.replace(/^https?:\/\/[^/]+/, '');
		const hasPort = /^https?:\/\/[^/]*:\d+/.test(location);
		if (hasPort) fail(`${from} Location`, 'no internal port', location);
		else if (target !== expectedTarget) fail(`${from} Location`, expectedTarget, target);
		else ok(`${from} -> ${target}`, location.startsWith('/') ? '(relative)' : '(absolute)');
	}
}

/**
 * The content boundary, in this direction.
 *
 * Both properties read the same WordPress install. Here the foreign posts are the ones that moved
 * TO aichieve.net, so the contract is: never 200, and when redirected, land on the sibling — not on
 * a 404 and not on a copy of the article served from this host.
 */
async function checkBoundary() {
	console.log(`\nContent boundary (${FOREIGN_POST_SLUGS_GENERATED.length} posts moved to aichieve.net)`);
	if (GENERATED_FOR !== CANONICAL_HOST) fail('ownership manifest target', CANONICAL_HOST, GENERATED_FOR);
	else ok('ownership manifest target', GENERATED_FOR);

	const sample = [
		FOREIGN_POST_SLUGS_GENERATED[0],
		FOREIGN_POST_SLUGS_GENERATED[1],
		FOREIGN_POST_SLUGS_GENERATED[Math.floor(FOREIGN_POST_SLUGS_GENERATED.length / 2)],
		FOREIGN_POST_SLUGS_GENERATED[FOREIGN_POST_SLUGS_GENERATED.length - 1]
	].filter(Boolean);
	for (const slug of sample) {
		const r = await probe(`/${slug}/`);
		if (r.status === 200) {
			fail(`moved post /${slug.slice(0, 46)}…`, '301 to aichieve.net, or 404', '200 — served from this host');
			continue;
		}
		if (r.status === 301 || r.status === 302 || r.status === 308) {
			const target = r.location || '';
			if (/https:\/\/[^/]*aichieve\.net/.test(target)) ok(`/${slug.slice(0, 40)}… -> aichieve.net`);
			else fail(`moved post /${slug.slice(0, 40)}… Location`, 'aichieve.net', target || '(none)');
			continue;
		}
		if (r.status === 404) ok(`/${slug.slice(0, 46)}… 404`);
		else fail(`moved post /${slug.slice(0, 46)}…`, '301 to aichieve.net, or 404', `${r.status}`);
	}

	console.log(`Owned posts resolve (${OWNED_POST_SLUGS_GENERATED.length} owned)`);
	const owned = [
		OWNED_POST_SLUGS_GENERATED[0],
		OWNED_POST_SLUGS_GENERATED[Math.floor(OWNED_POST_SLUGS_GENERATED.length / 2)],
		OWNED_POST_SLUGS_GENERATED[OWNED_POST_SLUGS_GENERATED.length - 1]
	].filter(Boolean);
	for (const slug of owned) {
		const r = await probe(`/${slug}/`);
		if (r.status === 200) ok(`/${slug.slice(0, 46)}… 200`);
		else fail(`owned post /${slug}/`, '200', `${r.status}`);
	}
}

/** The canonical host baked into every page must be this property's origin. */
async function checkCanonicalHost() {
	console.log('\nCanonical host');
	const r = await probe('/');
	const match = r.body.match(/rel="canonical" href="([^"]+)"/);
	if (!match) {
		fail('canonical tag present on /', 'a rel="canonical" link', 'not found');
		return;
	}
	const canonical = match[1];
	try {
		const canonicalHost = new URL(canonical).host;
		const acceptableHosts = [CANONICAL_HOST, `www.${CANONICAL_HOST}`, new URL(ORIGIN).host];
		if (acceptableHosts.includes(canonicalHost)) ok(`canonical = ${canonical}`);
		else fail('canonical host', CANONICAL_HOST, canonical);
	} catch {
		fail('canonical is a valid URL', 'https://…', canonical);
	}
}

/**
 * www must not serve the site.
 *
 * www.<host> resolves to this box, so without a router and a redirect it is a second hostname
 * publishing every page — and before the fix it was worse than that: no router meant no
 * certificate, so https://www.giniloh.com died in the TLS handshake.
 */
async function checkWwwCanonicalisation() {
	console.log('\nwww canonicalisation');
	let host;
	try {
		host = new URL(ORIGIN).host;
	} catch {
		host = '';
	}
	const isLocal = !host || /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/.test(host) || /:\d+$/.test(host);
	if (isLocal) {
		console.log('  SKIP  local origin — no www host to test');
		return;
	}
	const apex = host.replace(/^www\./, '');
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let res;
	try {
		res = await fetch(`https://www.${apex}/`, { redirect: 'manual', signal: controller.signal });
	} catch (error) {
		fail(`https://www.${apex}/`, `301 -> https://${apex}/`, `no response (${error.message})`);
		return;
	} finally {
		clearTimeout(timer);
	}
	if (res.status !== 301 && res.status !== 308) {
		fail(`https://www.${apex}/`, `301 -> https://${apex}/`, `${res.status}${res.status === 200 ? ' (serving duplicate content)' : ''}`);
		return;
	}
	const location = res.headers.get('location') || '';
	let locationHost = '';
	try {
		locationHost = new URL(location).host;
	} catch {
		locationHost = location.replace(/^https?:\/\//, '').split('/')[0];
	}
	if (locationHost !== apex) {
		fail(`https://www.${apex}/ Location`, apex, location || '(none)');
		return;
	}
	ok(`https://www.${apex}/ -> ${location}`);
}

/**
 * Telemetry sinks are compiled into the bundle, so a missing build-time variable is invisible.
 *
 * This is the check that would have caught the actual failure: `PUBLIC_SUPABASE_URL`,
 * `PUBLIC_SUPABASE_ANON_KEY` and `PUBLIC_N8N_WEBHOOK_URL` are read through `import.meta.env`, and
 * Astro inlines them during `astro build`. Set them on the running container instead and the site
 * still builds, still renders, still answers 200 — it just silently drops every event and every
 * lead, and tells the visitor their report was queued. Nothing but the bundle can prove otherwise.
 */
async function checkTelemetryWiring() {
	console.log('\nTelemetry wiring');
	const page = await probe('/calculators/interactive-assets/');
	if (page.status !== 200) {
		fail('/calculators/interactive-assets/', '200', `${page.status}`);
		return;
	}
	const chunks = [...new Set([...page.body.matchAll(/\/_astro\/[^"']+\.js/g)].map((m) => m[0]))];
	if (chunks.length === 0) {
		fail('interactive-assets hydration chunk', 'at least one /_astro/*.js', 'none linked — the assets cannot record anything');
		return;
	}
	let bundle = '';
	for (const chunk of chunks) {
		const r = await probe(chunk);
		if (r.status === 200) bundle += r.body;
	}
	const supabase = /[a-z0-9]+\.supabase\.co/i.test(bundle);
	const webhook = /\/webhook\/vibe-telemetry/.test(bundle);
	if (supabase || webhook) {
		const sinks = [supabase ? 'supabase' : null, webhook ? 'n8n webhook' : null].filter(Boolean).join(' + ');
		ok('a telemetry sink is baked into the bundle', sinks);
	} else {
		fail(
			'telemetry sink in the bundle',
			'PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY, or PUBLIC_N8N_WEBHOOK_URL, present at BUILD time',
			'none inlined — every event and lead is dropped client-side, and the form still reports success'
		);
	}
}

/**
 * Every URL the sitemap advertises must be a page that exists AND agrees with itself.
 *
 * This is the assertion the estate was missing. All 1,016 career-occupation URLs returned 200 with
 * 2,000 words of real content, passed the host-scope check, were listed in the declared sitemap — and
 * every one of them declared `<link rel="canonical">` pointing at
 * `/calculators/career-ai-resilience/occupations/<slug>/`, a path no route has ever served, which
 * answered 404. Google resolves that as fetch ok -> canonical -> 404 -> drop, and 94% of the sitemap
 * was unindexable while every existing check stayed green.
 *
 * Status codes cannot see this. Only the canonical can.
 */
async function checkCanonicalAgreement() {
	console.log('\nSitemap URLs canonicalise to themselves');
	const sitemap = await probe('/sitemap.xml');
	if (sitemap.status !== 200) {
		fail('/sitemap.xml for canonical check', '200', `${sitemap.status}`);
		return;
	}
	const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

	// A canonical pointing at a path shape that was never routed is the specific failure; catch it by
	// name so a reintroduced segment fails loudly instead of quietly emptying the index again.
	const orphanedSegments = locs.filter((loc) => /\/career-ai-resilience\/occupations\//.test(loc));
	if (orphanedSegments.length === 0) ok('no sitemap URL uses the unrouted /occupations/ segment');
	else fail('sitemap URL shape', 'no /career-ai-resilience/occupations/ paths', `${orphanedSegments.length} listed, e.g. ${orphanedSegments[0]}`);

	// Spread the sample across the page types rather than taking the first N, which are all hubs.
	const buckets = [
		locs.filter((l) => /\/career-ai-resilience\/[^/]+\/$/.test(l)),
		locs.filter((l) => /\/calculators\/[^/]+\/$/.test(l) && !/career-ai-resilience/.test(l)),
		locs.filter((l) => /^https?:\/\/[^/]+\/[^/]+\/$/.test(l)),
		locs.filter((l) => /\/career-ai-resilience\/all-occupations\/$/.test(l))
	];
	const sample = [];
	for (const bucket of buckets) {
		if (bucket.length === 0) continue;
		sample.push(bucket[0], bucket[Math.floor(bucket.length / 2)]);
	}
	if (sample.length === 0) {
		fail('canonical sample', 'at least one URL per page type', 'no URLs matched any page type');
		return;
	}

	let mismatches = 0;
	for (const loc of sample) {
		const path = loc.replace(/^https?:\/\/[^/]+/, '') || '/';
		const r = await probe(path);
		if (r.status !== 200) {
			fail(`canonical ${path}`, '200', `${r.status}`);
			mismatches++;
			continue;
		}
		const canonical =
			r.body.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/)?.[1] ||
			r.body.match(/<link[^>]+href="([^"]+)"[^>]*rel="canonical"/)?.[1] ||
			'';
		if (!canonical) {
			fail(`canonical on ${path}`, 'a self-referential canonical', 'none in the served HTML');
			mismatches++;
			continue;
		}
		// Compare the path, and require the host to be this property's: on a non-public origin the
		// canonical is still baked as the production host, and that is correct, not a mismatch.
		const canonicalUrl = new URL(canonical, ORIGIN);
		const canonicalPath = canonicalUrl.pathname;
		if (canonicalUrl.host !== CANONICAL_HOST) {
			fail(`canonical host on ${path}`, CANONICAL_HOST, canonicalUrl.host);
			mismatches++;
		} else if (canonicalPath !== path) {
			fail(`canonical on ${path}`, path, canonicalPath);
			mismatches++;
		}
	}
	if (mismatches === 0) ok(`canonical agreement on ${sample.length} sampled URLs across ${buckets.filter((b) => b.length).length} page types`);

	// A uniform lastmod teaches crawlers the field is noise and they then ignore it sitewide. Posts
	// carry a real WordPress `modified`; everything else carries none.
	const lastmods = [...sitemap.body.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1].split('T')[0]);
	if (lastmods.length > 0) {
		const counts = new Map();
		for (const date of lastmods) counts.set(date, (counts.get(date) ?? 0) + 1);
		const [worstDate, worstCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
		const share = worstCount / locs.length;
		if (share > 0.2) {
			fail('sitemap lastmod spread', 'no single date on more than 20% of URLs', `${worstDate} on ${worstCount}/${locs.length} (${Math.round(share * 100)}%)`);
		} else {
			ok('sitemap lastmod spread', `${lastmods.length} dated URLs, worst date ${worstDate} at ${Math.round(share * 100)}%`);
		}
	}
}

/**
 * The property must measure itself.
 *
 * The analytics tag is gated on `PUBLIC_ANALYTICS_WEBSITE_ID`, a BUILD-time variable Astro inlines.
 * Set it on the running container instead of at build and the site still renders, still answers 200,
 * and records nothing — which reads from the outside exactly like "no traffic". Assert the served
 * HTML, since that is the only place the difference is visible.
 */
async function checkAnalyticsTag() {
	console.log('\nAnalytics tag');
	const home = await probe('/');
	if (home.status !== 200) {
		fail('/', '200', `${home.status}`);
		return;
	}
	const id = home.body.match(/data-website-id="([^"]*)"/)?.[1];
	if (!id) {
		fail('analytics tag on /', 'a script with data-website-id', 'none in the served HTML — this property is unmeasured');
		return;
	}
	// The exact id, not just "an id": the failure this replaces was two properties sharing one, or a
	// copy-paste of a sibling's. Either records visits against the wrong site and looks fine.
	if (id === ANALYTICS.websiteId) ok('analytics tag on /', id);
	else fail('analytics website id', `${ANALYTICS.websiteId} (giniloh.com)`, `${id} — wrong property or a stale build`);

	const src = home.body.match(/src="([^"]*)"[^>]*data-website-id/)?.[1] || home.body.match(/data-website-id[^>]*/)?.[0]?.match(/src="([^"]+)"/)?.[1] || '';
	if (src && new URL(src).host === new URL(ANALYTICS.src).host) ok('tracker is the self-hosted Umami', src);
	else fail('tracker host', new URL(ANALYTICS.src).host, src || '(not detected)');

	const domains = home.body.match(/data-domains="([^"]*)"/)?.[1] || '';
	if (domains.split(',').map((d) => d.trim()).includes(CANONICAL_HOST)) ok('analytics scoped to this host', domains);
	else fail('analytics data-domains', `a list including ${CANONICAL_HOST}`, domains || '(none)');
}

/**
 * A calculator page has to make sense without JavaScript.
 *
 * The crawler cannot move a slider, so a page whose only content is a React island is thin by
 * construction: six calculator pages here carried 237 to 365 words of served HTML and no structure
 * at all. What fixed that is the intent wrapper — method, worked numbers, questions — and the FAQPage
 * markup beside it. This asserts the wrapper survives, because the tempting thing for the next person
 * is to add a seventh calculator with just the island.
 */
async function checkCalculatorIntent() {
	console.log('\nCalculator pages are indexable without JavaScript');
	const sample = [
		'/calculators/gpu-breakeven/',
		'/calculators/build-vs-buy/',
		'/calculators/rent-vs-buy/',
		'/calculators/w2-vs-1099-scorp-calculator/'
	];
	for (const path of sample) {
		const r = await probe(path);
		if (r.status !== 200) {
			fail(path, '200', `${r.status}`);
			continue;
		}
		const text = r.body
			.replace(/<script[\s\S]*?<\/script>/gi, ' ')
			.replace(/<style[\s\S]*?<\/style>/gi, ' ')
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		const words = text.split(' ').filter(Boolean).length;
		const hasFaq = /"@type"\s*:\s*"FAQPage"/.test(r.body);
		const hasTable = /<table/.test(r.body);
		if (words < 700) fail(`${path} static words`, 'at least 700 words of served text', `${words}`);
		else if (!hasFaq) fail(`${path} FAQPage`, 'FAQPage JSON-LD', 'absent — no FAQ structured data');
		else if (!hasTable) fail(`${path} scenario table`, 'a <table> of pre-computed outcomes', 'absent');
		else ok(`${path}`, `${words} words, FAQPage + table`);
	}
}

async function main() {
	console.log(`\nVerifying deploy contract at ${ORIGIN}`);
	try {
		await checkCoreRoutes();
		await checkAssets();
		await checkTelemetryWiring();
		await checkCrawlArtifacts();
		await checkCanonicalAgreement();
		await checkAnalyticsTag();
		await checkCalculatorIntent();
		await checkRedirects();
		await checkBoundary();
		await checkCanonicalHost();
		await checkWwwCanonicalisation();
	} catch (error) {
		console.error(`\n\u001b[31mVerification aborted:\u001b[0m ${error.message}`);
		process.exit(2);
	}

	console.log(`\n${'-'.repeat(62)}`);
	if (failures.length === 0) {
		console.log(`\u001b[32mGREEN\u001b[0m — ${passed} checks passed against ${ORIGIN}`);
		process.exit(0);
	}
	console.log(`\u001b[31mRED\u001b[0m — ${passed} passed, ${failures.length} FAILED against ${ORIGIN}`);
	for (const f of failures) console.log(`  · ${f.label}: expected ${f.expected}, got ${f.actual}`);
	process.exit(1);
}

main();
