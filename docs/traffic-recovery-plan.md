# Traffic recovery plan — giniloh.com / aichieve.net / wellroost.com

Measured 2026-10-23 against the live origins and the WordPress CMS. Every number below is from a
live request or a repo read, not an estimate.

---

## 1. What is actually wrong

Four facts, in order of leverage.

### 1.1 giniloh.com: 1,016 pages declare a canonical that 404s

`src/pages/calculators/career-ai-resilience/[slug].astro:228` builds the canonical from a path that
does not exist:

```
/calculators/career-ai-resilience/occupations/<slug>/     ← canonical, returns 404
/calculators/career-ai-resilience/<slug>/                 ← real page, returns 200
```

Measured: 8 of 8 sampled career pages canonicalize to a 404; the canonical target itself returns
404; 0 sitemap entries contain `/occupations/`. The route has no `/occupations/` segment anywhere.

That is 1,016 of giniloh's 1,077 sitemap URLs — 94% — telling Google "the real page is somewhere
else", and the somewhere-else is a 404. Google resolves that as *fetch ok → canonical → 404 → drop*.
It is the single reason giniloh.com has a sitemap full of pages and nothing in the index.

### 1.2 giniloh.com: those same 1,016 pages are orphaned

`public/data/careers/index.json` is read in exactly two places: the sitemap generator and the
`[slug]` route's `getStaticPaths`. No page links to an occupation. The hub at
`/calculators/career-ai-resilience/` emits **zero** links to child pages — its 30-odd links are nav,
footer, and four article links.

So the only path to these pages is the sitemap, and the sitemap entry accuses itself of being a
duplicate of a 404. Two independent defects pointing the same way.

This matters more than the count suggests: the page titles are `Will AI Replace <Occupation>?` —
1,016 pages aimed at a query family with real, everyday search demand. **The highest-demand pages
on the estate are the ones that cannot be indexed.**

### 1.3 aichieve.net and wellroost.com have no analytics at all

Verified in the served HTML: no analytics script tag on either site.

- `AICHIEVE/src/layouts/BaseLayout.astro:30` defaults the website id to `''`, so
  `shouldTrack` is `false` and the tag is never emitted.
- `wellroost front end/.env` has no `PUBLIC_ANALYTICS_*` variables whatsoever.
- giniloh.com is instrumented (Umami id `9ac06c91…`, `data-domains=giniloh.com,www.giniloh.com`).

**"No traffic on all three sites" is currently unfalsifiable for two of them.** You cannot tell
"nobody came" from "nobody counted", and you cannot measure any of the fixes below. This is the
cheapest thing on the list and it gates everything else.

### 1.4 The content is three weeks old on brand-new domains

WordPress holds 169 published posts: 11 in June, 6 in July, 7 in September, **145 in October 2026**.
Sitemap surface: aichieve 149 URLs, wellroost 51, giniloh 1,077 (of which 1,016 broken, 61 sound).

Zero organic traffic at ~3 weeks on three DR-0 domains with no backlinks is the expected outcome,
not a malfunction. Nothing in this plan will produce traffic inside 30 days. What it can do is
remove the reasons you would *still* have nothing at day 90.

---

## 2. What is NOT wrong (checked, so we don't spend the week here)

Gemini's first three checks all pass. Do not re-investigate them.

| Check | Result |
|---|---|
| DNS A / www on all three | `72.61.72.70`, correct, no stray spelling (`wellroost.com` is right everywhere) |
| HTTPS / TLS | clean, `nginx/1.30.6`, no 502s, no Traefik errors |
| `/robots.txt` | 200 on all three, `Allow: /`, declares the correct host's sitemap |
| `/sitemap.xml` | 200 on all three; giniloh 1,077 URLs, aichieve 149, wellroost 51 |
| Host scope of sitemaps | all `<loc>` on the sitemap's own host (cross-host entries were fixed earlier) |
| `noindex` | absent from every crawled page; `/calculators/embed/*` carries it by design and is excluded from the sitemap |
| SSR / View Source | real HTML. Career page: 78 KB, 1,980 words, H1 present. aichieve/wellroost articles: 1,060–1,531 words |
| Canonical on homepages and core pages | correct and self-referential on all three |
| Article structured data | aichieve and wellroost ship full `Article` + `BreadcrumbList` + `Organization` + `Person` |
| Google site verification | TXT record present on all three domains (`google-site-verification=…`) |

Two real but smaller crawl defects, both giniloh:

- `src/pages/sitemap.xml.ts:34` stamps `lastmod` = today on every static page, every calculator and
  all 1,016 career pages. 1,046 of 1,077 entries carry the same date. A `lastmod` that changes daily
  teaches crawlers the field is noise and they ignore it sitewide.
- giniloh has **two sitemap authorities**: the hand-written `/sitemap.xml` (declared in robots.txt,
  the one Google reads) and `@astrojs/sitemap`'s `sitemap-index.xml` + `sitemap-0.xml`. Two answers
  to "what is on this site" drift. Pick one.

---

## 3. The plan

### P0 — Repair (day 1, roughly 2 hours)

| # | Fix | Where | Verify |
|---|---|---|---|
| 1 | Drop the `/occupations/` segment from the career canonical | `src/pages/calculators/career-ai-resilience/[slug].astro:228` | sample 20 live career URLs, assert canonical == request URL, 20/20 |
| 2 | Give the 1,016 occupation pages an internal link surface: an A–Z index at `/calculators/career-ai-resilience/index/`, linked from the hub and from `/calculators/`, plus "related occupations" (the same 2-digit O*NET family, derivable from `code` in `index.json`) at the foot of each page. Use a path that does **not** sit under the `[slug]` route space, or Astro will have two routes claiming it | new route + `career-ai-resilience.astro` | every sitemap career URL appears in a served page's link set |
| 3 | Real `lastmod`: static/hub pages get none; calculators get the metadata file's date; articles keep the WordPress `modified` they already use | `src/pages/sitemap.xml.ts:34` | no single date covers more than ~20% of entries |
| 4 | One sitemap authority: keep the hand-written `/sitemap.xml` (it is the declared one and it already filters correctly), stop emitting `@astrojs/sitemap`, or alias it to the same output. Do not leave both | `astro.config.mjs` | `/sitemap-index.xml` either 404s or is byte-identical in URL set |
| 5 | Instrument aichieve.net and wellroost.com: their own Umami website ids, `data-domains` set per host | `AICHIEVE/.env`, `wellroost front end/.env`, and give AICHIEVE's layout a non-empty default or a hard build error | script tag present in served HTML; a visit shows up in Umami within 60s |
| 6 | Real social card: `og:image` is `https://wellroost.com/favicon.svg` on every wellroost page, which renders as a blank box in LinkedIn/Reddit/Slack previews — and the distribution plan in P4 depends on those previews | `wellroost front end` layout | OpenGraph debugger returns a 1200×630 image |

P0 items 1–4 touch only giniloh; 5–6 are the other two properties. None of them is a redesign.

### P1 — Make the defect unshippable (day 2)

The canonical bug survived because nothing asserts that a page agrees with its own URL. Add that to
the existing gate rather than to a checklist:

Extend `scripts/verify.mjs` (and mirror it in the two sibling repos) with, at minimum:

- every `<loc>` in the declared sitemap returns 200 (sample 50, or all when under 200);
- **every sampled URL's canonical equals the URL that served it** — this is the assertion that would
  have caught 1,016 broken pages on the day they shipped;
- no URL in the sitemap carries `noindex`;
- no single `lastmod` value covers more than 20% of entries;
- the homepage canonical host equals the property's host, not a sibling's.

Wire it to the deploy, not to a memory. `npm run verify` already exists; make it fail loud.

### P2 — Get what exists into the index (days 1–14)

1. Confirm the three Domain properties exist in Search Console (the TXT records are already in DNS,
   so ownership is either done or one click away — do not add a fourth verification method).
2. After P0 deploys, submit each `/sitemap.xml`, then URL-Inspect and *Request indexing* on:
   giniloh `/`, one repaired career page, `/calculators/lease-break/`; aichieve `/`, two articles;
   wellroost `/`, `/calculators/remodeling-roi/`.
3. Do not resubmit daily. Watch the Page-indexing report for the shape of the failure:
   - *"Alternate page with proper canonical tag"* on the career URLs → the canonical fix did not deploy.
   - *"Crawled – currently not indexed"* on all of them → the problem is quality/authority, go to P3.
   - *"Discovered – currently not indexed"* → crawl budget; the internal links from P0 item 2 are the fix.

### P3 — Earn rankings on demand that exists (weeks 2–8)

The constraint after P0 is not page count, it is authority and intent match.

1. **Lead with the career pages, not with new calculators.** 1,016 pages answering "will AI replace
   X" is the only place in this estate where a query family with real volume is already built.
   Measured text similarity between two occupation pages is 0.40 with ~27% of the text sitting in
   long common blocks (page shell plus shared methodology copy) — so the pages are more
   differentiated than they first look, and the fix is not a rewrite. It is two things: the internal
   links that make them crawlable, and one occupation-specific paragraph above the fold so the first
   screen is not the shared template. Ship that for the top 50 occupations by employment first.
2. **Calculator intent wrappers** — the part of Gemini's advice worth keeping, now with real counts.
   All 18 calculator pages across giniloh and wellroost were checked:
   - **`FAQPage` JSON-LD: 0 of 18.**
   - **Static scenario table: 5 of 18.**
   - **Under 400 words of static text: 6 of 18** — `build-vs-buy` (274), `gpu-breakeven` (237),
     `rent-vs-buy` (282), `rsu-hold-vs-sell` (309), `secondary-tender-calculator` (337),
     `w2-vs-1099-scorp-calculator` (365). These are the thin ones; the rest already carry 550–1,240
     words and do not need padding.

   Fix the six thin pages first, then add a worked-methodology section and 4–5 `FAQPage` questions to
   all 18. One reusable component, applied once.

3. **Scenario URLs: yes, but as pre-filled variants of the ten real calculators**, not as new
   invented paths. `/calculators/remodeling-roi?kitchen=60000&value=420000`-style state is not
   indexable; a static route that pre-fills the same engine is. Pick variants where the phrase is
   something a person types ("break a lease with 4 months left", "repair or replace 12-year-old AC"),
   not invented long-tails with no demand behind them.
4. **aichieve has the hardest problem and should be scoped accordingly.** 149 pages on "agentic AI",
   "demand sensing", "control tower" competes with Gartner, McKinsey and SAP. The winnable slice is
   operational arithmetic with a number in the answer — forecast bias in dollars, service-level →
   working-capital inflection, build-vs-buy payback. That is also what the calculators already do.

### P4 — Distribution (weeks 1–4, does not wait for Google)

Google will not send a 3-week-old DR-0 domain traffic. Referrals are how the first sessions (and the
first engagement signals) arrive:

- Fix `og:image` first (P0 item 6), or every share below renders as a blank card.
- One LinkedIn post per week per property, built on a real calculator output screenshot and a specific
  number — not a link drop.
- Reddit: answer recent, math-specific questions in r/HomeImprovement, r/personalfinance,
  r/RealEstate, r/supplychain with the actual arithmetic in the comment. Link only when it adds
  something the comment does not already contain; drive-by links get removed and can get the domain
  flagged.
- Directories: submit wellroost (a free homeowner tool) to the tool directories that accept free
  tools. aichieve is B2B — the equivalent is LinkedIn, not Product Hunt.

---

## 4. What "working" looks like

| When | Signal | Where |
|---|---|---|
| Day 1 | all three sites report sessions; career canonical 20/20 self-referential | Umami, `npm run verify` |
| Day 3 | 1,016 career URLs accepted, canonical matches request | GSC URL Inspection |
| Day 7 | `site:giniloh.com` returns career pages for the first time | GSC coverage + search |
| Day 14 | 50–200 real sessions from LinkedIn/Reddit, per property | Umami |
| Day 30 | first impressions on 5–8 word queries, positions 20–60 | GSC Performance |
| Day 90 | 300+ organic sessions/month/property; that is a real signal | Umami |

If day-30 impressions are still zero *after* the canonical fix has been verified live, the answer is
authority, and the plan becomes links and content depth — not more technical work.

---

## 5. Where I disagree with Gemini

- **"Verify DNS & SSL / 502s"** — all clean. Already done, no action.
- **"Check for hidden noindex"** — none. Done.
- **"Pass the View Source SSR test"** — passes. The HTML is server-rendered; the calculators are
  islands inside real pages.
- **"Pivot to zero-volume scenario URLs"** — half right, and it points away from the best asset. You
  already own 1,016 pages on a query family with demand; they are broken and orphaned. Fix and feed
  those before inventing long-tails nobody types.
- **"Manufacture 500 visitors"** — right instinct, wrong order. Sessions you cannot measure (no
  analytics on two sites) teach you nothing, and shares with a favicon as the card image do not get
  clicked.

## 6. Decisions I need from Jorge

1. **Career pages: invest or retire?** 1,016 O*NET pages on a personal-finance domain is either your
   best organic asset or a topical-dilution liability. My read: invest in the top ~50 by employment,
   `noindex` and drop from the sitemap anything unscored (93 of 1,016 have no score) or below a
   demand floor. Say the word and P0 ships with that shape.
2. **Umami: cloud or self-hosted?** Cloud is one id per site and zero ops; self-hosted keeps visitor
   data on the VPS you already pay for. Either works — I need the website ids for aichieve and
   wellroost.
3. **P0 scope now, or plan-first?** P0 items 1–4 are giniloh-only, small, and independently
   verifiable. I can ship them in this session and report the before/after canonical counts.
