# Vertical routing — backfill plan

**Status: proposal for review. Nothing here has been executed.** Generated from live CMS + Supabase, 2026-10-15.

## Why this is needed

Routing currently runs off `src/data/ownership.mjs` — a hand-maintained list of 112 post slugs, per repo.
It works, but a new post is invisible until someone edits a code file and redeploys, and adding a domain means
editing every other repo. The vertical pipeline already holds the same information, correctly, for 90 of 118 posts.

Measured coverage today:

| | count |
|---|---|
| WordPress posts | 118 |
| reachable via a vertical (`articles.tags` → `vertical_sites`) | 90 |
| **no vertical — alive only because the manifest lists them** | **28** |
| `articles` rows | 111 |
| `articles` rows with no matching published post | 21 |

> **The trap:** all 28 are currently published *only* because the manifest lists them. Retire the manifest
> before backfilling and all 28 vanish from both sites — 24% of the corpus, silently.

---

## Part 0 — prerequisite: make the join exact (do this first)

The join from a published post to its vertical is currently unreliable:

- `articles` has **no** `slug` and no `wp_post_id`
- published titles differ from draft titles — 19 of the 46 apparent mismatches were the *same* article retitled
  (e.g. `demurrage-invoice-30-day-clocks` ↔ "A late container's bill carries two 30-day clocks", 0.96 similar)
- no WordPress post carries any vertical: `tags` is empty on all 118, `meta` holds only `footnotes`

```sql
alter table public.articles add column slug text;
alter table public.articles add column wp_post_id bigint;
create unique index articles_slug_key on public.articles (slug) where slug is not null;
```

Backfill `slug` by title match **once**, then reconcile by hand. After that the join is a lookup, not a guess.

---

## Part A — correct 14 `vertical_sites` rows (the actual bug)

All 14 enterprise verticals still say `giniloh.com`. **No row in the table points at aichieve.net today.**

Cat 7 = ai-stack-tool-tco · cat 9 = autonomous-agentic-workflows · cat 10 = supply-chain-operations.

```sql
update public.vertical_sites set site_domain='aichieve.net', frontend_url='https://aichieve.net'
where vertical_id in (
  'enterprise_ai_finops',
  'ai_observability_qa',
  'nhil_infrastructure_ops',
  'enterprise_build_vs_buy',
  'multi_agent_enterprise_fabric',
  'agentic_ai',
  'agentic_resilience_failure',
  'supply_chain',
  'warehouse_automation_robotics_capex',
  'demand_sensing_advanced_sop',
  'control_tower_exception_orchestration',
  'last_mile_routing_fleet_carbon',
  'meio_working_capital_tco',
  'supplier_risk_reshoring_decision'
);
```

**Left as `giniloh.com` (7 rows) — verify two of these:**
`gpu_hardware`, `workstation_compute_economics` (cat 2) · `personal_microeconomics_tinkering_tax`,
`expat_cross_border_relocation` (cat 4) · `career_velocity_equity_engineering` (cat 8).
⚠ `enterprise_ai_governance` and `enterprise_tech_leadership` point at cat 3 (a giniloh category) but are named
*enterprise*. Their articles may belong on aichieve — worth checking before you deploy the change.

**Left as `wellroost.com` (5 rows):** `home_ops_execution`, `home_equity_tco`, `home_infrastructure_lifecycle_tco`,
`resilient_home_assets`, `smart_home_telemetry`. Unchanged by the split.

> ⚠ `smart_home_telemetry` points at `wp_category_id = 5`, which no longer exists in WordPress
> (WP has 1,2,3,4,6,7,8,9,10,11). Dangling reference.

---

## Part B — 4 proposed new verticals

13 of the 28 posts have no existing vertical that fits their subject. None of the 26 current verticals covers
our own product documentation, personal cost-per-use, or personal investing — the vertical system was built for
the enterprise pipeline.

| vertical_id | site | purpose | rows |
|---|---|---|---|
| `giniloh_product_guides` | giniloh.com | Guides, explainers and walkthroughs for our own giniloh calculators. | 5 |
| `consumer_cost_per_use` | giniloh.com | Cost-per-use arithmetic on personal purchases (espresso, ebike, and similar). | 2 |
| `personal_investing` | giniloh.com | Personal investing and wealth-building strategy. | 2 |
| `pro_app_notes` | aichieve.net | Launch and operating notes for the paid PRO apps (LedgerLink, FacturGate, ParcelProof, CaseProof, SpendProof). | 4 |

New verticals need a `wp_category_id` too. Suggestion: reuse the category of the content you're filing them
under (`giniloh_product_guides` → money-wealth/4, `consumer_cost_per_use` → major-purchases-assets/2,
`personal_investing` → money-wealth/4, `pro_app_notes` → business-automation-operations/11) so the derived
site filter keeps working while the taxonomy is rolled out.

---

## Part C — the 28 proposed `articles` rows

Marked as manual so they're never confused with pipeline output. `confidence` is my read, not a measurement —
`medium` rows are the ones I'd want you to look at.

| # | slug | WP cat | proposed vertical | site | new? | conf | why |
|---|---|---|---|---|---|---|---|
| 1 | `agentic-ai-adoption-soars-but-profits-stall-in-2026` | ai-stack-tool-tco | `agentic_ai` | aichieve | no | high | Agentic adoption |
| 2 | `caseproof-stop-signing-3m-warehouse-automation-deals-on-a-vendors` | business-automation-operations | `pro_app_notes` | aichieve | **yes** | high | CaseProof product note |
| 3 | `enterprisebuildvsbuy-the-250k-ai-upkeep-tax` | ai-stack-tool-tco | `enterprise_build_vs_buy` | aichieve | no | high | Named build-vs-buy |
| 4 | `facturgate-the-deterministic-pre-send-gate-converter-for-european-e` | business-automation-operations | `pro_app_notes` | aichieve | **yes** | high | FacturGate product note |
| 5 | `multi-agent-orchestration-building-the-one-person-enterprise` | ai-stack-tool-tco | `multi_agent_enterprise_fabric` | aichieve | no | high | Named multi-agent orchestration |
| 6 | `nvidia-says-its-gpus-arent-sold-out-its-cfos-279-billion-memory-bet` | ai-stack-tool-tco | `nhil_infrastructure_ops` | aichieve | no | medium | GPU supply/capex — or enterprise_ai_finops |
| 7 | `openai-just-made-the-agent-loop-a-commodity` | ai-stack-tool-tco | `agentic_ai` | aichieve | no | high | Agent loop economics |
| 8 | `openais-custom-chip-beats-nvidia-on-power-2` | ai-stack-tool-tco | `nhil_infrastructure_ops` | aichieve | no | high | Silicon/power infrastructure |
| 9 | `parcelproof-stop-bleeding-28-on-carrier-invoices` | business-automation-operations | `pro_app_notes` | aichieve | **yes** | high | ParcelProof product note |
| 10 | `stripe-accounting-software-solving-the-payout-black-box-with` | business-automation-operations | `pro_app_notes` | aichieve | **yes** | high | LedgerLink product note |
| 11 | `best-ai-proof-jobs-in-a-changing-market` | mental-models-strategy | `career_velocity_equity_engineering` | giniloh | no | high | Career resilience |
| 12 | `beyond-the-emergency-fund-how-to-build-a-frictionless-wealth` | money-wealth | `personal_investing` | giniloh | **yes** | medium | Wealth-building strategy |
| 13 | `calculate-your-career-relocation-payback` | mental-models-strategy | `career_velocity_equity_engineering` | giniloh | no | medium | Career move cost — or expat_cross_border_relocation; you decide |
| 14 | `ebike-costs-per-use-calculator-for-commuters` | major-purchases-assets | `consumer_cost_per_use` | giniloh | **yes** | high | Cost-per-use on a personal purchase |
| 15 | `expats-evaluating-the-true-value-of-a-job-driven-move-overseas` | mental-models-strategy | `expat_cross_border_relocation` | giniloh | no | high | Explicitly cross-border relocation |
| 16 | `how-to-use-giniloh-to-simulate-automate-and-backtest-frictionless` | money-wealth | `giniloh_product_guides` | giniloh | **yes** | high | How-to for our own tool |
| 17 | `is-a-3000-espresso-maker-machine-worth-it` | major-purchases-assets | `consumer_cost_per_use` | giniloh | **yes** | high | Cost-per-use on a personal purchase |
| 18 | `jobs-switch-calculator-step-by-step-profit-guide` | mental-models-strategy | `career_velocity_equity_engineering` | giniloh | no | high | Job-hop vs retention maths |
| 19 | `lease-break-calculator-save-1850-in-3-steps` | mental-models-strategy | `giniloh_product_guides` | giniloh | **yes** | high | Step guide for our lease-break calculator |
| 20 | `negotiate-job-offer-with-giniloh-visualizer` | mental-models-strategy | `career_velocity_equity_engineering` | giniloh | no | high | Offer negotiation / equity |
| 21 | `nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check` | major-purchases-assets | `workstation_compute_economics` | giniloh | no | high | Personal workstation economics |
| 22 | `replace-laptop-screen-let-this-decision-engine-do-the-math` | major-purchases-assets | `personal_microeconomics_tinkering_tax` | giniloh | no | high | Repair-vs-replace / tinkering tax |
| 23 | `self-hosted-ai-when-to-buy-vs-rent-gpus` | major-purchases-assets | `gpu_hardware` | giniloh | no | high | Personal buy-vs-rent hardware maths |
| 24 | `simulate-a-frictionless-liquidity-sweep-in-giniloh` | money-wealth | `giniloh_product_guides` | giniloh | **yes** | high | Walkthrough of our own tool |
| 25 | `smart-ways-to-invest-an-extra-500-a-day` | money-wealth | `personal_investing` | giniloh | **yes** | medium | Investing — no existing giniloh vertical fits |
| 26 | `the-blueprint-behind-giniloh-money-flow` | money-wealth | `giniloh_product_guides` | giniloh | **yes** | high | Design note for our own tool |
| 27 | `the-giniloh-money-flow-simulator-explained` | money-wealth | `giniloh_product_guides` | giniloh | **yes** | high | Explainer for our own Money Flow tool |
| 28 | `zapier-notion-integration-calculate-your-tinkering-tax` | major-purchases-assets | `personal_microeconomics_tinkering_tax` | giniloh | no | high | Named tinkering tax |

---

## Part D — WordPress side (yours to run; touches the CMS)

**1. Register the taxonomy.** `show_in_rest` is the load-bearing line — without it the REST API won't expose it
and the front ends can't filter on it.

```php
register_taxonomy('vertical', 'post', [
    'label'        => 'Vertical',
    'public'       => true,
    'show_in_rest' => true,      // required — the front ends read this over REST
    'hierarchical' => false,
    'rest_base'    => 'vertical',
]);
```

**2. Backfill.** Replace `wp_` with your actual prefix. **Back up the database first.**

```sql
-- mapping: published slug -> vertical
create temporary table _bf (post_slug varchar(200), vertical_id varchar(64), primary key (post_slug));
insert into _bf values
  -- the 28 below; the other 90 come from articles.tags (see Part F)
  ('agentic-ai-adoption-soars-but-profits-stall-in-2026','agentic_ai'),
  ('best-ai-proof-jobs-in-a-changing-market','career_velocity_equity_engineering'),
  ('beyond-the-emergency-fund-how-to-build-a-frictionless-wealth','personal_investing'),
  ('calculate-your-career-relocation-payback','career_velocity_equity_engineering'),
  ('caseproof-stop-signing-3m-warehouse-automation-deals-on-a-vendors','pro_app_notes'),
  ('ebike-costs-per-use-calculator-for-commuters','consumer_cost_per_use'),
  ('enterprisebuildvsbuy-the-250k-ai-upkeep-tax','enterprise_build_vs_buy'),
  ('expats-evaluating-the-true-value-of-a-job-driven-move-overseas','expat_cross_border_relocation'),
  ('facturgate-the-deterministic-pre-send-gate-converter-for-european-e','pro_app_notes'),
  ('how-to-use-giniloh-to-simulate-automate-and-backtest-frictionless','giniloh_product_guides'),
  ('is-a-3000-espresso-maker-machine-worth-it','consumer_cost_per_use'),
  ('jobs-switch-calculator-step-by-step-profit-guide','career_velocity_equity_engineering'),
  ('lease-break-calculator-save-1850-in-3-steps','giniloh_product_guides'),
  ('multi-agent-orchestration-building-the-one-person-enterprise','multi_agent_enterprise_fabric'),
  ('negotiate-job-offer-with-giniloh-visualizer','career_velocity_equity_engineering'),
  ('nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check','workstation_compute_economics'),
  ('nvidia-says-its-gpus-arent-sold-out-its-cfos-279-billion-memory-bet','nhil_infrastructure_ops'),
  ('openai-just-made-the-agent-loop-a-commodity','agentic_ai'),
  ('openais-custom-chip-beats-nvidia-on-power-2','nhil_infrastructure_ops'),
  ('parcelproof-stop-bleeding-28-on-carrier-invoices','pro_app_notes'),
  ('replace-laptop-screen-let-this-decision-engine-do-the-math','personal_microeconomics_tinkering_tax'),
  ('self-hosted-ai-when-to-buy-vs-rent-gpus','gpu_hardware'),
  ('simulate-a-frictionless-liquidity-sweep-in-giniloh','giniloh_product_guides'),
  ('smart-ways-to-invest-an-extra-500-a-day','personal_investing'),
  ('stripe-accounting-software-solving-the-payout-black-box-with','pro_app_notes'),
  ('the-blueprint-behind-giniloh-money-flow','giniloh_product_guides'),
  ('the-giniloh-money-flow-simulator-explained','giniloh_product_guides'),
  ('zapier-notion-integration-calculate-your-tinkering-tax','personal_microeconomics_tinkering_tax');

insert ignore into wp_terms (name, slug, term_group) select distinct vertical_id, vertical_id, 0 from _bf;
insert ignore into wp_term_taxonomy (term_id, taxonomy, description, parent, count)
  select t.term_id, 'vertical', '', 0, 0 from wp_terms t join _bf b on b.vertical_id = t.slug;
insert ignore into wp_term_relationships (object_id, term_taxonomy_id, term_order)
  select p.ID, tt.term_taxonomy_id, 0
  from _bf b
  join wp_posts p             on p.post_name = b.post_slug and p.post_type='post' and p.post_status='publish'
  join wp_terms t             on t.slug = b.vertical_id
  join wp_term_taxonomy tt    on tt.term_id = t.term_id and tt.taxonomy='vertical';

-- verify: every mapping row found a post
select b.post_slug, b.vertical_id, p.ID from _bf b left join wp_posts p on p.post_name=b.post_slug;
```

**3. Front-end filter, once the taxonomy is live:**
`/wp-json/wp/v2/posts?vertical=agentic_ai,supply_chain&per_page=100` — server-side, no Supabase at build time,
which also removes the determinism problem (a DB outage can no longer block a deploy).

---

## Part E — verification

```sql
-- after backfill: posts with no vertical (target: 0)
select count(*) from wp_posts p
 where p.post_type='post' and p.post_status='publish'
   and not exists (select 1 from wp_term_relationships r
                     join wp_term_taxonomy tt on tt.term_taxonomy_id=r.term_taxonomy_id
                    where r.object_id=p.ID and tt.taxonomy='vertical');

-- derived routing vs the manifest (must agree before you delete the manifest)
select v.site_domain, count(*) from wp_posts p
  join wp_term_relationships r on r.object_id=p.ID
  join wp_term_taxonomy tt on tt.term_taxonomy_id=r.term_taxonomy_id and tt.taxonomy='vertical'
  join wp_terms t on t.term_id=tt.term_id
  join public.vertical_sites v on v.vertical_id=t.slug
 where p.post_type='post' and p.post_status='publish' group by 1;
```

---

## Rollout order (nothing disappears if you follow it)

1. **Part 0** — add `slug`/`wp_post_id` to `articles`; backfill and reconcile the join
2. **Part A** — correct the 14 `vertical_sites` rows; check the 2 flagged enterprise verticals
3. **Part B** — add the 4 new verticals
4. **Part C** — insert the 28 `articles` rows
5. **Part D** — register the taxonomy, backfill all 118, verify against Part E
6. **Then** switch the front ends to `?vertical=` routing — and for one release, **assert** the derived result
   matches the manifest and fail the build on any disagreement. Delete the manifest only when it is silent.

Step 6's assertion is the cheap insurance: it proves the new path reproduces the old one before you trust it.

---

## Part A2 — dry run against the live data (added 2026-10-15, after step 0)

Step 0 is done and the join is exact: **90 of 111 `articles` rows are linked** to a WordPress post
(`slug` + `wp_post_id`, 0 errors). The distribution was clean — 72 exact title matches, 18 retitled
at >= 0.92 similarity, **zero in the 0.60–0.92 band**, and no post claimed by two articles. The 21
unmatched rows are all unpublished **wellroost** drafts (heat pumps, panel amps, water leak monitors),
which is why they have no post.

With the join exact, the vertical path can be evaluated *before* anything is written to WordPress.
Result — and it is not a clean pass:

| | posts |
|---|---|
| derivable to exactly one site via vertical | 84 |
| **agree** with the existing manifest | **66** |
| **disagree** | **18** |

82% agreement. Six verticals account for all 18:

| vertical | wp_cat | currently says | posts | manifest says | action |
|---|---|---|---|---|---|
| `gpu_hardware` | 2 | giniloh.com | 4 | aichieve.net | move to aichieve + split (see below) |
| `workstation_compute_economics` | 2 | giniloh.com | 4 | aichieve.net | move to aichieve + split |
| `enterprise_tech_leadership` | 3 | giniloh.com | 4 | aichieve.net | move to aichieve |
| `enterprise_ai_governance` | 3 | giniloh.com | 4 | aichieve.net | move to aichieve |
| `resilient_home_assets` | 4 | wellroost.com | 1 | giniloh.com | **decision needed** |
| `multi_agent_enterprise_fabric` | 9 | aichieve.net | 1 | giniloh.com | **decision needed** |

This is the mixed-category problem one level up: these verticals sit on categories 2 and 3 (giniloh's
by declaration) but hold aichieve's content. **The two I flagged earlier as "verify" were right to
flag** — `enterprise_ai_governance` and `enterprise_tech_leadership` — plus two I did not expect.

### Consequences for Part B and Part C

`gpu_hardware` and `workstation_compute_economics` are genuinely mixed: they hold 8 aichieve posts,
and Part C proposed filing 2 *personal* giniloh posts (`self-hosted-ai-when-to-buy-vs-rent-gpus`,
`nvidia-rtx-pro-...`) into them. **Revised Part B: add a 5th vertical**, `personal_compute_hardware`
(giniloh, cat 2), and file both there instead. That keeps the enterprise verticals enterprise-only.

`resilient_home_assets` and `multi_agent_enterprise_fabric` are one-post mismatches — a routing
decision each, not a schema problem.

### Revised rollout

`npm run`-style order, unchanged, with one insertion:

1. **Part 0** — done (columns + 90-row join backfill)
2. **Part A2** — 14 corrections from Part A **plus 4 more** (`gpu_hardware`,
   `workstation_compute_economics`, `enterprise_tech_leadership`, `enterprise_ai_governance`)
   → **18 vertical_sites rows to aichieve.net**
3. **Part B** — 5 new verticals (the 4 from Part B + `personal_compute_hardware`)
4. **Part C** — 28 rows, with the 2 personal GPU posts redirected to `personal_compute_hardware`
5. **Part D** — WP taxonomy + backfill all 118
6. **Assertion release** — re-run the Part A2 comparison; target 0 disagreements, then delete the manifest

The Part A2 check is reusable as the release gate: it is read-only, takes seconds, and it just
prevented a migration that would have published 18 posts to the wrong domain.

---

## Part A3 — APPLIED (2026-10-15)

### Constraint fixed
`vertical_sites_cms_host_check` enforced `cms_base_url == 'https://cms.' + site_domain` — a 1:1
site-to-CMS assumption. aichieve.net reads the SHARED `cms.giniloh.com`, so no aichieve row could
ever satisfy it. Relaxed to a form check (`~ '^https://cms\.[a-z0-9.-]+$'`), which no longer couples
a site to its own CMS subdomain.

Proof it now models reality: 21 rows share one CMS host.

    cms.giniloh.com    -> 18 aichieve.net + 3 giniloh.com
    cms.wellroost.com  ->  5 wellroost.com

### 18 rows moved to aichieve.net
14 from Part A (cat 7/9/10 enterprise verticals mis-pointed at giniloh) + 4 from Part A2
(`gpu_hardware`, `workstation_compute_economics`, `enterprise_tech_leadership`,
`enterprise_ai_governance`). `cms_base_url` left untouched — `cms.giniloh.com` is the truth.

Final distribution:  aichieve.net 18 | giniloh.com 3 | wellroost.com 5

giniloh.com keeps only `career_velocity_equity_engineering`, `expat_cross_border_relocation`,
`personal_microeconomics_tinkering_tax`. That is THIN — Part B/C must add giniloh verticals or the
consumer site has almost no vertical coverage.

### Release gate
    agree 82 | disagree 2 | unresolved 0        (was: 66 agree / 18 disagree)

Both survivors are the two flagged for a human decision, not inference errors:

    moss-landing-burns-again-homeowners-become-the-grid   derived wellroost.com   manifest giniloh.com
    one-approval-two-payments                             derived aichieve.net    manifest giniloh.com

Resolve these two by editing the POST (its vertical tag or its manifest entry), not the verticals
table — the verticals are now correct for everything else.

---

## Part D — RUNBOOK: deploying the vertical taxonomy

Environment discovered on the host (do not assume otherwise):

    cms.giniloh.com  -> 72.61.72.70
    container        -> wordpress-pwgow8ow48g88go880o480cs   (Traefik: Host(`cms.giniloh.com`))
    the OTHER one    -> wordpress-o8gg8osos44sckk800owcc44   (cms.wellroost.com)  <- DO NOT TOUCH
    wp-cli           -> NOT INSTALLED on host or in either container
    php              -> 8.3.33 (cli) inside the container
    mu-plugins/      -> exists and is writable

Because wp-cli is absent, the backfill runs under plain `php`, not `wp eval-file`. The script
handles both: with no ABSPATH it walks up looking for wp-load.php.

### 0. Decide the two posts first
Running as-is MOVES both (this is a real change, not a preview):

    moss-landing-burns-again-homeowners-become-the-grid   giniloh.com -> wellroost.com
    one-approval-two-payments                             giniloh.com -> aichieve.net

### 1. Deploy the taxonomy
    scp wordpress/mu-plugins/vertical-taxonomy.php root@72.61.72.70:/tmp/
    ssh root@72.61.72.70
    docker cp /tmp/vertical-taxonomy.php \
      wordpress-pwgow8ow48g88go880o480cs:/var/www/html/wp-content/mu-plugins/

mu-plugins load automatically — no activation, and it survives theme changes.

### 2. Dry run (writes nothing)
    docker exec wordpress-pwgow8ow48g88go880o480cs \
      php /var/www/html/wp-vertical-backfill.php --dry-run

Expected exactly:
    DRY RUN (nothing written)  terms_created=27  assigned=118  posts_not_found=0

### 3. Apply
    docker exec wordpress-pwgow8ow48g88go880o480cs \
      php /var/www/html/wp-vertical-backfill.php

Expected:  DONE  terms_created=27  assigned=118  posts_not_found=0
Its last step calls flush_rewrite_rules(false) — required for the REST route to appear.

### 4. Verify
    curl -s https://cms.giniloh.com/wp-json/wp/v2/vertical | head -c 300
    curl -s "https://cms.giniloh.com/wp-json/wp/v2/posts?per_page=2&_fields=slug,vertical"

Then in wp-admin: Posts list should show a "Vertical" column.

### Verified in advance
    php -l on both files inside the container : No syntax errors
    --dry-run against the live DB             : assigned=118  posts_not_found=0

### Two bugs caught by that dry run before deploy
1. terms_created reported 118 (per-POST) instead of 27 (per distinct term) — fixed with a $seen set.
2. The mu-plugin's pre_insert_term guard called current_user_can() unguarded. In a CLI run there is
   no current user, so it returns false and wp_insert_term() would have been REJECTED — creating zero
   terms. Scoped to is_user_logged_in() so CLI passes and logged-in non-admins are still blocked.
