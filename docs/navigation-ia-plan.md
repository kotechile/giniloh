# Navigation & information architecture — plan

Status: **Phases 1 + 2 shipped** (`/categories/` → `/articles/`, curated taxonomy, 301s). Phases 3–6
pending. Verified results and corrections are recorded below.

## What shipped in Phases 1 + 2

- **One term, one destination.** Nav, hero CTA, footer, hub title/schema, 404, author page and About
  copy now all say **Articles** and all point at `/articles/`. The third term ("Guides") and the
  footer's duplicate entry are gone.
- **The route moved at both levels.** `/categories/` → `/articles/`, and each topic page to
  `/articles/<slug>/`. Real **301 headers** for all ten paths in `nginx-redirects.conf` (106 rules
  total) plus Astro's portable meta-refresh stubs, both generated from one list.
- **Out-of-scope categories removed by editorial decision, not by empty-post inference.**
  `CATEGORY_DISPOSITIONS` in `src/data/ownership.mjs` keeps five topics and retires four:
  `supply-chain-operations` (301 → aichieve's page, verified 200 there) and `ai-stack-tool-tco`,
  `autonomous-agentic-workflows`, `business-automation-operations` (301 → aichieve's hub; they 404 on
  that property, so a hub is the honest target rather than a 404 of our own making).
- **Counts are now owned counts.** Every reader-facing category list reads
  `getContentCategories()`, which recomputes `postCount` from posts this property actually owns and
  drops any category left with nothing to show. The `≥1 owned post` rule sits under the curation as a
  safety net.
- **Verified after the change:** build green at **1076 pages** (exactly 4 fewer, matching the four
  retired categories); **0 pages render "No articles"** (was 4); 5 topic pages built; contrast gate
  **0 of 894** elements below AA across the 7 changed pages; layout gate **OVERFLOW=0px** on
  `/articles/`, `/` and money-flow at 500px.

---

Reviewing the inbound UI/UX critique against the actual build. Every claim below was verified against
`dist/` and `src/`; where the critique and the code disagree, the code wins.

---

## What the critique got right (verified)

| Claim | Evidence |
|---|---|
| Three different terms for one destination | Nav **Categories** → `/categories/` (`SiteNav.astro:12`); hero **"Read the guides"** → `/categories/` (`HeroGlass.astro:41`); footer **Guides** → `/#guides` — a *homepage anchor*, not the archive (`Footer.astro:80`); footer **Categories** → `/categories/` (`Footer.astro:95`) |
| The hub is a taxonomy, not a destination | `/categories/` is a pillar grid: eyebrow "Decision Pillars", H1 "Explore Our Frameworks", 9 cards each with "Explore Pillar →" (`categories/index.astro:90-160`) |
| Readers must click a pillar to see any titles | Confirmed: the hub shows no post titles at all, only pillar cards and subcategory chips |
| Footer carries a duplicated/deprecated link set | `Footer.astro:79-96`: Home / Dashboard, Guides, Calculators, Apps **PRO**, Categories, About |
| Harmonise CTAs + 301 on rename | Agreed |
| The stat examples are real | `$47.66` and `1.26 Hours` each appear in 4 built pages, so the stat-callout ask is grounded in real content, not invented |

## What I would change about the critique

**1. Unify on "Guides", not "Articles".** The critique allows either. "Guides" is already the site's
dominant term — hero CTA, footer body copy, both About descriptions, and the author page heading
("Guides Authored by Gini Loh"). Adopting "Articles" would introduce a *third* name for the same thing
and devalue existing copy; "guides" is also more specific than "articles" and matches what the content
actually is (decision-support long-form). **Recommendation: Guides.**

**2. Decline the header "Launch Calculator" pill.** The nav is a compact floating island with four
labelled items, one of which is already *Calculators*. Adding a high-contrast pill duplicates that
destination and creates a second loud element competing with the brand mark in the smallest possible
chrome. The single loud action belongs in the hero, where it has room to be the loudest thing on screen.
If the goal is to raise the tool hub's prominence, the honest fix is to make the hero's primary CTA the
unambiguous loud action — not to add a fifth nav element.

## What the critique missed (and matters more)

**1. The hub's numbers were wrong on every card, and one card led to a dead end.** This is the finding
that matters most, and it is bigger than the version of it I first reported.

Measured on the pre-change build: the hub advertised counts taken straight from WordPress's `count`
field — which counts the **shared install**, both properties' posts:

| Pillar card (as rendered) | Advertised | Reality on this property |
|---|---|---|
| Artificial Intelligence & Future of Work | 48 Articles | ~7 |
| Major Purchases & Assets | 14 Articles | 5 |
| Mental Models & Strategy | 14 Articles | 6 |
| Money & Wealth | 11 Articles | 11 |
| **Supply Chain & Operations** | **34 Articles** | **0 — the page said "No articles"** |

The property owns 26 posts in total, so **121 advertised across five cards** was materially false on
every one of them. Supply Chain & Operations was the worst case: a top-level card promising 34 articles
whose destination rendered the literal text "No articles".

Three further dead ends were reached as subcategory chips — `ai-stack-tool-tco`,
`autonomous-agentic-workflows`, `business-automation-operations` — all enterprise topics whose posts
belong to `aichieve.net` under the split doctrine in `src/data/ownership.mjs`. Together with Supply
Chain they were the four categories retired in Phase 2.

The root cause is one line of trust: `postCount` came from `cat.count` (the shared CMS) while the pillar
page listed only *owned* posts. The hub promised what the page could not deliver.

**2. The newsletter form is a fake.** `Footer.astro:38`:

```html
onsubmit="event.preventDefault(); alert('Transmission logged. Welcome to the System.');"
```

There is no endpoint and no API key for one. For an audience that came here *because* the site does
honest maths, a fake success dialog is a trust problem, not a polish problem.

**3. Footer copy is jargon.** "System Map", "Active Modules", "Sync" (the newsletter button),
"System Operational", "Home / Dashboard". The mental-model card is genuinely good and distinctive —
the labels around it are not. "Active Modules" for topic links in particular tells a reader nothing.

**4. Two different cross-property destinations.** Footer "Apps PRO" → `apps.aichieve.net/showcase`
(`Footer.astro:82`); the homepage hand-off section → `aichieve.net/tools/` (`index.astro:178`). Same
idea, two URLs.

---

## Decisions needed

1. **Term: "Guides"** (recommended) or "Articles"?
2. **Route: rename to `/guides/` with 301s, or keep `/categories/` and change labels only?**
   Recommendation: rename, at both levels (hub + the 9 pillar pages). A nav labelled "Guides" that
   lands on `/categories/career-ai-resilience/` recreates the exact cognitive friction being fixed. This
   repo already generates real nginx 301s (`scripts/generate-nginx-redirects.mjs` + `default.conf`), and
   `validate-routing.mjs` exists to check the result — so the risk is manageable and verifiable rather
   than theoretical. Fallback if you'd rather not touch indexed URLs: labels only, ~10 minutes, zero risk.

---

## Phases

**Phase 1 — one term, everywhere. ✅ SHIPPED.**
Nav label; hero CTA ("Read the guides" → "Browse articles"); hub title/H1/description; `CollectionPage`
+ `BreadcrumbList` names; footer copy and entries (the duplicate "Guides" entry removed — it pointed at a
homepage anchor, not the hub); 404; author page; About copy. The homepage section anchor moved from
`id="guides"` to `id="articles"` to match, so the term is consistent down to the DOM id.
*Verified:* no user-facing "Categories" or third-term "Guides" label remains; harnesses green.
*Effort (actual):* ~1h.

**Phase 2 — curate the taxonomy. ✅ SHIPPED.**
Two layers, deliberately: **editorial curation** (`CATEGORY_DISPOSITIONS` — out-of-scope topics are
excluded by slug because "supply chain operations is not a decision a tech worker makes with their own
money" stays true even when the category is temporarily empty) sitting on top of a **data rule** (a
category renders only with ≥1 post owned by this property). Counts are recomputed from owned posts, so a
card can no longer promise more than its page delivers. The four retired categories 301 out, and every
renamed path emits a real nginx 301 generated from the same list.
*Verified:* 1076 pages (exactly 4 fewer); 0 pages render "No articles"; 5 topic pages built; 10 category
301s in `nginx-redirects.conf`; harnesses green.
*Effort (actual):* ~1.5h.

**Deferred from this phase:** the "Enterprise tools ↗" hand-off line at the foot of the hub. With the
four cards gone the hub reads cleanly, and the homepage already carries an explicit enterprise hand-off
section — adding a second one to the hub is a judgement call worth making with you, not unilaterally.

**Phase 3 — the hub becomes an archive with an in-page topic filter.**
`/articles/` opens with featured/latest pieces (title, 2-line clamped summary, topic pill, date, read
time) — *titles before taxonomy* — then a compact "Browse by topic" index below for taxonomy browsers.
Chips filter the rendered list in place; **all cards stay in the HTML**, so no-JS visitors and crawlers
see every article, and each chip also links to its topic page. The homepage keeps its bento: the
homepage and the archive have different jobs (themed entry vs. chronological retrieval).
*Acceptance:* harvester harnesses green; chips keyboard-accessible (`aria-pressed`) with ≥44px targets;
no layout shift; the five consumer pillar pages stay reachable. *Risk:* medium. *Effort:* ~4h.

**Phase 4 — card scannability + stat callouts.**
Two-line clamped summaries, topic pill, date + reading time. The stat callout is sourced from real
content only: interim — build-time extraction from the post's existing
`[data-geo-injected="key-takeaways"]` block, emitted **only** when exactly one unambiguous
currency/percent/duration token exists; durable — an editorial field on the WordPress post
(`key_stat` + `key_stat_label`) read from the REST payload. Omit when absent; never fabricate a number.
Tokens: stat in `--ink`, label in `--ink-muted` (the AA scale from `docs/contrast-audit.md`).
*Acceptance:* contrast gate green with callouts present; every rendered stat traceable to post content.
*Risk:* low–medium (extraction quality). *Effort:* ~3h interim, ~1h front end once a WP field exists.

**Phase 5 — footer clarify + newsletter.**
Rename the jargon ("System Map" → browse-oriented label, "Active Modules" → Topics, "Sync" →
Subscribe), remove the duplicated Guides/Categories pair, unify the cross-property link to one
destination, and replace the fake newsletter with a link to a real signup (or wire an endpoint if you
have one). Keep the mental-model card.
*Acceptance:* no jargon label remains; no form that lies. *Risk:* low. *Effort:* ~1h.

**Phase 6 — verify and record.**
301 map + `generate-nginx-redirects.mjs`; `validate-routing.mjs`; both audit harnesses on the changed
routes; update this file's status and `docs/contrast-audit.md`; then commit and push.

---

## Out of scope / explicitly not changing

- The aichieve-owned routes and the `/apps/` → aichieve redirect behaviour.
- The split doctrine: a post appears on a property only when its slug is in `site-content.ts`.
- The homepage bento structure (it gets the new term, not a new architecture).
- Any change to calculator interiors beyond the tokens already established.
