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

## Not fixed here (open risks)

- **Open anon INSERT.** `vibe_lead_intents` and `vibe_telemetry_events` accept anonymous inserts by design
  (RLS `WITH CHECK` limits the shape, not the rate). A script can fill the tables and trigger scenario mail
  to arbitrary addresses. The fix is a server-side edge function with a CAPTCHA/turnstile, not a client change —
  tracked, not pretended.
- **wellroost's own client** (`wellroost front end/src/lib/telemetry.ts`) is a different shape (flat
  `vibe_asset_telemetry` rows). It reaches n8n, and its leads carry `calculated_metrics.domain`, so it resolves;
  it does not write `vibe_lead_intents` from the client at all. Out of scope for this repo.
- **`vibe_telemetry_events.vertical_slug` backfill** assumes this table is giniloh-only. It is (aichieve and
  wellroost have their own tables), but a future shared table would need the property in the row instead.

## Verification performed

1. `npm run check` — 0 errors.
2. `npm run build` — succeeds.
3. Browser run against `astro dev`: slider drag, impression, lead submit → rows land in Supabase with
   `vertical_slug = giniloh` + `domain_category`; the failure path (bad anon key) shows the alert instead of
   claiming success; the test rows are deleted afterwards so the poller never mails them.
4. `node scripts/build-n8n.mjs` — all three copies rewritten and byte-identical.
5. `node scripts/verify.mjs` against the built preview — telemetry wiring check green.
