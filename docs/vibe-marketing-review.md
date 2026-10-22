# Vibe marketing: end-to-end review

Scope: the interactive micro-asset pipeline on giniloh.com — `VibeAssetCard` → `src/lib/telemetry/vibeClient.ts`
→ Supabase (`vibe_telemetry_events`, `vibe_lead_intents`) → n8n (`vibe-telemetry` webhook, `Lead Reports` poller)
→ scenario email. Reviewed against the live project, not just the source:

- production bundle `/_astro/VibeAssetGrid.BJQyfv91.js` carries both sinks (`supabase.co`, `webhook/vibe-telemetry`)
  — the deployed site does capture;
- live `vibe_lead_intents` rows carry `vertical_slug = 'giniloh'` + `domain_category = 'Career Capital'`;
- live `vibe_telemetry_events` rows carry `vertical_slug = 'career-capital'` — the pillar, not the property;
- live `vibe_asset_sessions` = 0 rows, and no code writes to it.

## The contract, stated once

| Column | Means | Example |
| --- | --- | --- |
| `vertical_slug` | the **property** that owns the row | `giniloh`, `wellroost`, `aichieve` |
| `domain_category` | what the asset is **about** (pillar/topic) | `career-capital`, `Career Capital` |

Two different facts. `aichieve` already runs this model (see `AICHIEVE/supabase/migrations/20261022_correct_vertical_slug.sql`);
giniloh's client and schema had drifted back to the pre-correction shape.

## Findings

| # | Sev | Finding | Fix |
| --- | --- | --- | --- |
| F1 | P0 | `captureVibeLead` returned `true` with **no sink configured** (the "mock capture" branch). The card then showed *"Decision Model Synced"* while nothing was stored — a lead lost silently, with the visitor told it worked. | Mock branch removed; returns `{ok:false, error}`; one loud console warning naming the two env vars that were missing. |
| F2 | P0 | No failure surface in the card. Network error, RLS rejection or a PostgREST 400 (bad column) all looked identical to a click that did nothing: the button reverted to "Export Model" and the visitor had no reason to retry. | `role="alert"` error state, form stays filled, retry allowed, real reason logged. |
| F3 | P1 | One column name, two meanings: events wrote the **pillar** into `vertical_slug`, leads wrote the **property**. `where vertical_slug = 'giniloh'` over events returns 0 rows — verified against the live project. | Client writes `vertical_slug` = property and `domain_category` = pillar on **both** writes; migration adds + backfills the column. |
| F4 | P1 | Repo migrations do not create `consent_text_version`, `delivered_at`, `domain_category` on `vibe_lead_intents`; they exist only in the live database (added by hand). A rebuild from `supabase/migrations` rejects the lead insert (PGRST204) **and** the n8n `Mark Sent` PATCH (42703) — which leaves every row `pending_n8n_sync` and re-mails it every 5 minutes, forever. | Idempotent alignment migration (`20261023_align_giniloh_telemetry.sql`). |
| F5 | P1 | `vibe_asset_sessions` is dead schema: zero writers, zero rows, and every field it holds is derivable from `vibe_telemetry_events`. | Table dropped **only when empty** (renamed to `_legacy` otherwise) and replaced by a reporting view of the same name. |
| F6 | P1 | n8n `Resolve Domain` infers the sending domain by searching `vertical_slug` for the string `aichieve`, then defaults to `giniloh.com`. Now that `vertical_slug` **is** the property, a `wellroost` row without `calculated_metrics.domain` is mailed from `reports@giniloh.com` with a giniloh link. It also let a client-chosen `metrics.domain` pick the `From` address. | Explicit property→domain map per branch, allowlisted to that branch's domains; `metrics.domain` only honoured when it is in the allowlist. |
| F7 | P2 | `input_adjusted` fired on every slider tick: one PostgREST INSERT per step, ~40 rows per drag. | 600 ms trailing debounce, flushed on unmount. |
| F8 | P2 | `card_impression` fired on hydration for all four cards, including below-the-fold ones — impressions counted for cards nobody saw. | `IntersectionObserver`, once per card at ≥50% visibility. |
| F9 | P2 | User-facing copy leaked the internals: *"Telemetry recorded. Full telemetry dispatch dispatched via n8n pipeline."* — also untrue, leads are polled from Supabase, not dispatched by n8n. | "Queued — we'll email <address> shortly", plus the address actually used. |
| F10 | P2 | `computeYield` was optional with a fabricated default (`14.2%` of the input) — an asset that forgot the prop would ship invented math under a real-looking headline. | Required prop, default deleted (all four assets supply one). |
| F11 | P2 | The yield value was not announced and the consent note was not associated with the email input. | `aria-live="polite"` on the output, `aria-describedby` on the input. |
| F12 | P2 | Local `.env` still used the Next.js names (`NEXT_PUBLIC_SUPABASE_*`) and had no webhook at all, so **any local/CI build** shipped a bundle with no sink (production is fine — verified above). | Renamed to `PUBLIC_SUPABASE_*`, added `PUBLIC_N8N_WEBHOOK_URL`; `.env.example` states that all three must exist at **build** time. |
| F13 | P2 | Nothing in the deploy contract noticed a bundle without sinks — `npm run check` and `npm run build` are green either way. | `scripts/verify.mjs` asserts a sink is baked into the `/calculators/interactive-assets/` chunks. |
| F14 | P3 | Email subject to the visitor was the raw slug (`w2-vs-1099-yield-engine`). | `assetTitle` travels in `calculated_metrics`; subject falls back to the slug. |
| F15 | P3 | `n8n/README.md` documented payloads without `domainCategory`, `consent_text_version` or `origin`, and never stated the property/topic contract the resolve step depends on. | README updated; workflows regenerated from `scripts/build-n8n.mjs` (never hand-edited). |
| F16 | P1 | n8n `Resolve Domain` is one Code node in its default "run once for **all** items" mode, but it read `$json` and returned a single item. Every tick therefore routed **one** row out of the 20 `Fetch Pending` returns; the other 19 were dropped and only re-read after the first was marked sent — a 20-lead backlog took 100 minutes to clear. | Node iterates `$input.all()`; verified with a six-row sample that all six come back routed. |
| F17 | P2 | *Found while testing the fix:* the first version of `captureVibeLead` treated **either** sink as success. The n8n webhook is a human alert, not delivery — the visitor's report comes from the poll of `vibe_lead_intents` — so a Supabase rejection plus a successful alert still showed "Scenario queued" for a row that did not exist. | Success now requires the row itself; the alert is recorded separately (`captured` vs `alerted` on the `lead_engaged` event). |

## Second pass — ownership review (security, delivery, honesty)

The first pass fixed what made the pipeline lie. This pass went after what makes it dangerous or
wrong: the anonymous write surface, the sender's failure loop, and the arithmetic on the cards.

| # | Sev | Finding | Fix |
| --- | --- | --- | --- |
| F18 | P0 | **The lead table was a mail-bomb.** `vibe_lead_intents` accepts anonymous INSERTs with a publishable key, and every accepted row makes the poller email that address. RLS validated the shape of the address, never the volume: one script could queue 10,000 reports for a victim and we would send them all from `reports@giniloh.com`, with our DMARC reputation. | `vibe_guard_lead()` trigger: normalises the address, collapses repeat submits inside 10 minutes, caps **3/hour per address** and **5 per session**, 8KB metrics, allowlisted `intent_type`. Trigger, not policy — it also holds for the already-deployed clients that know nothing about limits. |
| F19 | P1 | **A failed send was retried forever.** A hard-bounced address stayed `pending_n8n_sync` and came back every five minutes, indefinitely — 288 sends/day to someone who will never receive one, with nothing recording how often it had been tried. | `send_attempts` + `last_attempt_at`; the email node reports via `continueErrorOutput`; a failure branch counts the attempt and retires the row as `failed` at five. The fetch skips retired rows. |
| F20 | P1 | *Caught in my own fix:* the new `send_attempts=lt.5` filter applied to `aichieve_lead_intents`, which has no such column — the aichieve branch would have failed on 42703 and stopped mailing enterprise dossiers. | Columns and index added to the aichieve table in the same migration; the filter is verified 200 against both tables. |
| F21 | P1 | Every displayed number was formatted with `toLocaleString()` and **no locale**. These cards are server-rendered *and* hydrated, so the server pass uses the build machine's ICU default and the client pass uses the visitor's. Any difference is a React hydration mismatch that flashes on first paint. | `formatNumber` / `formatWithUnit` in `src/lib/calculators/format.ts`, locale pinned to `en-US`; used for the parameter, `aria-valuetext`, and all four yield headlines. |
| F22 | P1 | **Three of four cards asserted something the slider does not change.** GPU: "pays for itself in under 8 months" was a constant — false at the top of the range (it is ~13 months at 400 hrs/mo). RSU: an unlabelled 24% "downside buffer". Build-vs-buy: a one-sided build cost presented as the answer to a TCO comparison. W-2: an unexplained `×0.5` that understated the delta while the copy claimed to include compliance cost it never subtracted. | Payback computed from capital ÷ monthly saving; RSU states a 30% single-stock drawdown assumption and labels the figure *at risk*; build-vs-buy reports a stated 3-year TCO; W-2 deducts a named $1,800 compliance cost and applies the half-SE-tax deduction at a stated 32% marginal rate. |
| F23 | P2 | The RSU card asked for "Annual **Unvested** Equity" — you cannot sell unvested RSUs, so the question had no answer. | "Vested Company Stock Held". |
| F24 | P3 | `verify.mjs` had no assertion that a telemetry sink exists in the shipped bundle. | Added in the first pass; now proven green against production (`supabase + n8n webhook`). |
| F25 | P3 | **Open:** `vibe_asset_telemetry` (wellroost) accepts anonymous inserts with `WITH CHECK (true)` and carries no session id on any of its 7 rows — its deployed client is older than its repo, so a per-session cap has nothing to key on. | Flagged, not changed: not this repo's table and the fix belongs with that client. The same `vibe_guard_lead` pattern applies once it sends `session_id`. |

### Verified on the live project

- **No PII exposure:** with the publishable key, `select *` on `vibe_lead_intents` and
  `vibe_telemetry_events` returns `content-range: */0` (RLS), and `vibe_asset_sessions` returns
  `401 permission denied`.
- **Guard behaviour, through the anon key:** first insert 201; identical resubmit 201 with **no second
  row** (dedupe); a fourth distinct asset for one address in an hour → `400 lead rejected: this
  address has already requested 3 reports in the last hour`; 9KB metrics → `400 … 9020 bytes (limit
  8192)`; 5KB event payload → `400 … limit 4096`; 90-character session id → `400 identifier too
  long`; 401st event in one session → blocked at exactly 400 stored rows.
- **Retry branch, executed:** `send_attempts` 0→1 and 1→2 keep `pending_n8n_sync`; 4→5 sets
  `failed`; the PATCH URL resolves the row id through the paired item.
- **Hydration:** `astro dev` log shows zero hydration warnings on `/calculators/interactive-assets/`;
  SSR and client agree on `$150/hr`, `120 hrs/mo`, `$180,000`.
- **Card maths at the edges:** GPU at 400 hrs/mo → `+$650/mo`, "repays its $8,400 cost in about 13
  months"; at the 120 hrs/mo default → `-$50/mo` with the cloud winning, which the old copy could
  never say.
- **End-to-end capture after the refactor:** row stored with `vertical_slug = giniloh`,
  `domain_category = portfolio-capital`, `consent_text_version`, `send_attempts = 0`; deleted
  immediately so the poller never mails it.
- All four card CTAs point at pages that exist in `dist` (`w2-vs-1099-scorp-calculator`,
  `gpu-breakeven`, `build-vs-buy`, `rsu-hold-vs-sell`).

## Not fixed here (open risks)

- **Anonymous INSERT is bounded, not authenticated.** The guards cap volume per address and per
  session (F18), which kills the mail-bomb and the table flood, but they cannot tell a human from a
  script. A CAPTCHA'd edge function in front of the INSERT is the remaining step; nothing in the
  client can substitute for it.
- **wellroost's own client** (`wellroost front end/src/lib/telemetry.ts`) is a different shape (flat
  `vibe_asset_telemetry` rows). It reaches n8n, and its leads carry `calculated_metrics.domain`, so it resolves;
  it does not write `vibe_lead_intents` from the client at all. Out of scope for this repo.
- **`vibe_telemetry_events.vertical_slug` backfill** assumes this table is giniloh-only. It is (aichieve and
  wellroost have their own tables), but a future shared table would need the property in the row instead.

## Verification performed

1. `npm run check` — 0 errors; `npm run build` — succeeds (1097 pages).
2. **Live schema:** `20261023_align_giniloh_telemetry.sql` applied to `ixfdkninqeqmwuxncpvh` through the Supabase MCP.
   Confirmed afterwards: events now expose `domain_category`; all 13 pre-existing events backfilled to
   `vertical_slug = 'giniloh'` + their pillar; `vibe_asset_sessions` is a view with 9 derived rows; `anon`
   can INSERT events and leads and cannot read the session view.
3. **Generated workflow logic**, executed with `new Function` against representative rows:
   `giniloh → giniloh.com`, `wellroost → wellroost.com`, legacy `wellroost.com` hostname → `wellroost.com`,
   empty property + `metrics.domain` hint → honoured, `metrics.domain = evil.example` → refused in favour of
   the table default, legacy pillar `career-capital` → giniloh.com, `aichieve` → aichieve.net. Six rows in,
   six routed rows out.
4. **Browser run against `astro dev`** (`/calculators/interactive-assets/`):
   - hydration fired `card_impression` for the **two visible cards only**;
   - three slider moves produced **one** `input_adjusted` (debounced) at the final value;
   - every payload carried `vertical_slug = 'giniloh'` + `domain_category = 'career-capital'`;
   - a submitted address produced a `vibe_lead_intents` row with both columns, `consent_text_version`
     and `status = pending_n8n_sync`, and the card said "Scenario queued" naming that address;
   - with the lead endpoint forced to `400 PGRST204`, the same card showed a `role="alert"` error, kept the
     address, offered retry, and did **not** claim success — the exact behaviour that was missing.
   - test rows (1 lead, 13 events) were deleted afterwards so the 5-minute poller never mailed them.
5. Local bundle check: `dist/_astro/VibeAssetGrid.*.js` now contains the Supabase URL, the webhook path and
   `domain_category` — before the `.env` rename it contained none of them.
6. `node scripts/build-n8n.mjs` — all three copies rewritten and byte-identical.
