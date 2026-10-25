# Calculator language audit: from underwriter to household

Status: implementing. Scope: giniloh.com calculator discovery + calculator page orientation copy.

## The finding

The calculators are strong arithmetic wrapped in the wrong language for the person who needs
them. Three defects repeat across every surface, and they are the same three that made the
WellRoost engines bounce first-time visitors:

1. **Financial-engineering dialect on the label.** Card titles and one-liners read like a
   structured-products desk: "Net Yield", "Amortization Simulator", "3-Way Economic Yield Matrix",
   "Tinkering Tax", "Section 415(c)", "SE tax arbitrage", "probability-weighted exit proceeds".
   A reader who does not already know the answer cannot tell what the tool is for.
2. **The page opens with method, never with the question.** `CalculatorShell` renders eyebrow,
   title, description, then the island. Nothing states, in the reader's words, the decision the
   page prices ("should I sell my RSUs?"), so the visitor has to reverse-engineer it from jargon.
3. **No bridge to their own paperwork.** Inputs like "loaded cost per engineer" or "index plus
   margin" assume a document the household does not have open. Nothing says which number to
   fetch and where it lives.

Plus two live copy defects on the discovery surfaces: the homepage calculator section is still
headlined "Quantify compute, supply chain, and agentic workflows" (that half of the site moved to
aichieve.net in the split), and `/calculators/` asks the reader to "Explore Embedded Interactive
Micro-Assets".

## The standard (applied to every calculator)

| Stage | Requirement | Implemented as |
| --- | --- | --- |
| 1. Conceptual anchor | What decision this prices, in the reader's words, above the inputs | `PlainLanguageAnchor` — "What this answers" |
| 2. Paperwork bridge | The 2-3 numbers to fetch, and where they live | same panel — "Have this in front of you" |
| 3. Glossary | Every acronym used on the page, translated once | same panel — "Words on this page" |
| 4. What now | 2-3 concrete actions after the verdict | same panel — "What to do with the answer" |

## Translation matrix (the changes shipping in this pass)

| Calculator | Was | Now |
| --- | --- | --- |
| RSU hold vs sell | "RSU Hold vs. Sell & Mega Backdoor Roth Simulator" | "RSU Hold vs. Sell" / *Should you sell as it vests, or hold and bet on your employer?* |
| W-2 vs 1099 vs S-Corp | "W-2 vs. 1099 / S-Corp Net Yield Calculator" | "W-2 vs. 1099 vs. S-Corp" / *The same work paid three ways; which leaves you more?* |
| Secondary tender | "Secondary Tender vs. IPO Horizon Calculator" | "Secondary Tender vs. IPO" / *Cash now at a discount, or wait for an exit?* |
| Build vs buy | "Build-vs-Buy Amortization Simulator" | "Build vs. Buy" / *Build it, or pay a vendor for it?* |
| GPU break-even | "Local Workstation vs. Cloud GPU Break-even" | "Local GPU vs. Cloud" / *Own the hardware, or rent it by the hour?* |
| Rent vs buy | "Rent vs. Buy with Opportunity Cost" | "Rent vs. Buy" / *Does buying leave you richer than renting and investing the difference?* |
| Lease break | "Lease Break Penalty & Offset Estimator" | "Lease Break Cost" / *What does walking out early actually cost?* |
| Job hop | "Job-Hop vs. Retention Compensation Calculator" | "Job-Hop vs. Staying" / *Move jobs, or take the raise?* |
| Total comp | "Total Compensation & Equity Visualizer" | "Total Compensation" / *Which offer actually pays more?* |
| Money flow | "Automated Income Waterfall Simulator" | "Where Your Paycheck Goes" / *Where each dollar lands, and what a different order is worth.* |
| Relocation | "Career Relocation Cost & Payback Calculator" | "Relocation Payback" / *How many months of the raise pays back the move?* |
| Espresso | "Home Espresso Cost-per-Use Calculator" | "Espresso Cost per Cup" / *Cheap at four shots a day, expensive at four a month.* |
| Repair vs replace | "Tech Repair vs. Replace Optimizer" | "Repair vs. Replace" / *Fix it, or replace it?* |
| No-code vs SaaS | "Tinkering Tax vs. SaaS Upgrade Calculator" | "Spreadsheet vs. Real Software" / *Hours lost, against the subscription that replaces them.* |
| AI career | "AI Career Radar" (kept — already concrete) | unchanged title, plain question |
| Expat | "Expat Financial & International Tax Evaluator" | "Expat Tax" / *What you keep after both countries have taxed you.* |

Slugs, routes, nav labels, H1s and search keywords are unchanged. Only the card title, the
one-line hook and the body paragraph change — the words a browsing visitor actually reads.

## What shipped

- `src/lib/calculators/plainLanguage.ts` — new. Per-calculator question, paperwork, glossary and
  next steps, keyed by `CalculatorSlug`, so a new calculator without plain language fails
  type-check instead of shipping bare.
- `src/components/calculators/PlainLanguageAnchor.astro` — new. The orientation panel: what to
  have in front of you, the words on the page translated, what to do with the answer.
- `src/components/calculators/CalculatorShell.astro` — renders the question as the hero lede
  (above the method paragraph) and mounts the panel above the first input, for every calculator
  that uses the shell.
- `src/lib/calculators/metadata.ts` — all 16 card titles, hooks and descriptions rewritten.
- `src/pages/index.astro` — homepage calculator section headline, card lead line, CTA language,
  and the three teaser rows.
- `src/pages/calculators/index.astro` — intro, embed link, card lead line, meta and ItemList copy.
- `src/components/verticals/VerticalHub.astro` + `src/data/verticalArchitecture.ts` — six hub
  questions, six core-problem paragraphs, every topic heading and body, and the "vertical" jargon
  in the labels ("Section 01 of 06", "Start here", "Every calculator in this section").
- `src/pages/calculators/{coffee-arbitrage,tech-debt-repair,no-code-terminator}.astro` — input
  labels, verdict titles, verdict bodies, the coffee "optimistic frequency" warning, and meta copy.
- `src/pages/calculators/money-flow.astro` — bespoke hero, standfirst, the three how-to bullets
  (T_over/CLI/macro-regime language) and the same orientation panel.
- Every calculator hero description (the paragraph under the question) rewritten where it was
  written for an analyst: relocation, expat, GPU, raise velocity, total comp, RSU, secondary
  tender, build-vs-buy, rent-vs-buy, lease break, coffee, repair and spreadsheet/SaaS.

### H1s deliberately untouched

The copy contract in `AGENTS.md` freezes H1s, slugs and nav labels. Some cards are now plainer
than the H1 they open ("Spreadsheet vs. Real Software" → "Tinkering Tax vs. SaaS Upgrade
Calculator"). The question at the top of the page closes that gap without spending the frozen
name. If the H1 freeze is ever lifted, those are the five worth renaming first.

## Gates

`npm run copy:check` (prebuild, hard), `npm run check`, `npm run build`, `npm run check:calculators`.

## Not in this pass

- Relabelling inputs inside the React islands where the engine's own vocabulary is the label
  ("P&I", "Loaded cost per engineer", "Months to parity"). The glossary translates them; renaming
  the fields themselves is a per-engine change that deserves its own screenshot review, because
  the layout is tuned to the current label lengths.
- Engine *outputs* still print finance dialect where the engine's own field names were reused
  ("terminal equity", "net yield", "cushion"). The glossary covers the vocabulary; the output
  strings need a per-engine pass with the numbers in front of you, because the wording is often
  load-bearing for the arithmetic.
- `docs/vibe-marketing-review.md` and the vendored lexicon still declare the audience as
  "technical decision-makers, operators and engineers". That is the aichieve.net audience. The
  giniloh lexicon copy should be re-vendored from `/root/vibe-marketing` with the household
  audience, or the gate will keep passing copy that reads over a normal reader's head.

## Verification

`npm run copy:check` PASS (no findings in any touched file), `npm run check` 0 errors,
`npm run build` 1015 pages, `npm run check:calculators` all known answers match, plus a
browser pass at 1280px and 390px on `/calculators/`, `/calculators/rent-vs-buy/` and
`/calculators/lease-break/`.
