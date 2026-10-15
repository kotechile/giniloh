/**
 * ⚠️  THE SPLIT MANIFEST — SINGLE SOURCE OF TRUTH FOR BOTH PROPERTIES.  ⚠️
 *
 * Plain ESM (.mjs) on purpose. This file is imported by TWO different loaders:
 *
 *   1. `src/lib/site-content.ts`  — the typed runtime view (Sets + predicates)
 *   2. `astro.config.mjs`         — to generate the 301 map for moved URLs
 *
 * astro.config.mjs is evaluated by Node/Vite before TypeScript is available, so the shared data
 * has to live in plain JS. Keeping ONE copy here is what stops the redirect list drifting out of
 * sync with the content split — the failure mode that would silently leave moved articles
 * answering 404 on giniloh.com instead of redirecting.
 *
 * The split is a per-post list, not a category rule: the WordPress taxonomy was authored as one
 * site's blog and mixes audiences (a `major-purchases-assets` category holds both an
 * espresso-machine cost-per-use post and a KV-cache concurrency post). Category filtering is
 * therefore impossible, and this list is the split.
 *
 * A post published to the CMS appears on NEITHER site until its slug is added here. Silence is
 * the deliberate default — safer than one article live on two domains with two canonicals.
 */

export const GINILOH_ORIGIN = 'https://giniloh.com';
export const AICHIEVE_ORIGIN = 'https://aichieve.net';

/** Personal / career / consumer optimisation. Served by giniloh.com. */
export const GINILOH_POST_SLUGS = [
	'best-ai-proof-jobs-in-a-changing-market',
	'beyond-the-emergency-fund-how-to-build-a-frictionless-wealth',
	'calculate-your-career-relocation-payback',
	'disney-hulu-fourth-hike-subscription-creep',
	'ebike-costs-per-use-calculator-for-commuters',
	'expats-evaluating-the-true-value-of-a-job-driven-move-overseas',
	'home-assistant-cloud-rename-hardware-rent',
	'how-to-use-giniloh-to-simulate-automate-and-backtest-frictionless',
	'is-a-3000-espresso-maker-machine-worth-it',
	'jobs-switch-calculator-step-by-step-profit-guide',
	'lease-break-calculator-save-1850-in-3-steps',
	'moss-landing-burns-again-homeowners-become-the-grid',
	'negotiate-job-offer-with-giniloh-visualizer',
	'nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check',
	'one-approval-two-payments',
	'post-termination-option-clock-tax',
	'replace-laptop-screen-let-this-decision-engine-do-the-math',
	'self-hosting-break-even-one-hour-a-year',
	'simulate-a-frictionless-liquidity-sweep-in-giniloh',
	'smart-ways-to-invest-an-extra-500-a-day',
	'split-year-two-clock-seam',
	'staggered-lockup-six-selling-decisions',
	'the-blueprint-behind-giniloh-money-flow',
	'the-giniloh-money-flow-simulator-explained',
	'why-70-of-startup-options-go-unexercised',
	'zapier-notion-integration-calculate-your-tinkering-tax',
];

/** Enterprise AI, compute, agentic operations and supply chain. Served by aichieve.net. */
export const AICHIEVE_POST_SLUGS = [
	'100-case-eval-925-coverage',
	'agent-audit-trail-not-evidence',
	'agent-failure-topology-not-model',
	'agent-failures-tests-stayed-green',
	'agent-memory-poisoning-write-path',
	'agent-memory-tiering-l1-l4',
	'agent-reliability-pass-k-not-one-green-run',
	'agent-safety-gate-moves-to-verified-state',
	'agent-timeout-false-alarm-budget',
	'agent-tool-count-ceiling',
	'agentic-ai-adoption-soars-but-profits-stall-in-2026',
	'ai-coding-seats-measure-or-renew',
	'ai-incident-clock-4-hours-not-15-days',
	'ai-spend-27t-cost-visibility-mandate',
	'air-freight-wont-price-a-year',
	'automation-payback-splits-by-sku-geometry',
	'aws-cannot-restore-bahrain',
	'azure-control-plane-single-point-of-failure',
	'build-wait-payback-threshold',
	'buying-ai-quality-when-the-score-belongs-to-the-judge',
	'cache-boundary-decides-input-bill',
	'caseproof-stop-signing-3m-warehouse-automation-deals-on-a-vendors',
	'control-tower-silent-exception',
	'demurrage-invoice-30-day-clocks',
	'diesel-620-electric-freight-certificate-gap',
	'durable-execution-not-a-transaction',
	'enterprisebuildvsbuy-the-250k-ai-upkeep-tax',
	'facturgate-the-deterministic-pre-send-gate-converter-for-european-e',
	'fed-rate-hike-inverts-working-capital-trap',
	'fine-tune-vs-rent-by-token',
	'flat-price-was-the-hedge',
	'forecast-accuracy-is-not-shock-protection',
	'freight-scale-bet-vs-contract-duration',
	'fuel-surcharge-peg-mpg-audit',
	'gate-the-step-not-the-model',
	'goods-tariff-relief-vs-vessel-fee',
	'gpu-hour-price-set-by-memory',
	'hour-14-recovery-wall',
	'inventory-carrying-cost-rate',
	'kill-switch-misses-half-your-agents',
	'kv-cache-is-the-concurrency-ceiling',
	'last-mile-carbon-number-is-a-rate-table',
	'local-ai-payback-cloud-gpu-spread',
	'maskills-multi-agent-skills-optimization',
	'mcp-skills-extension',
	'multi-agent-orchestration-building-the-one-person-enterprise',
	'nearshoring-doesnt-move-the-trade-case',
	'nvidia-says-its-gpus-arent-sold-out-its-cfos-279-billion-memory-bet',
	'one-skill-too-many-green-test',
	'openai-just-made-the-agent-loop-a-commodity',
	'openais-custom-chip-beats-nvidia-on-power-2',
	'owned-shuttles-or-rented-robots',
	'parcelproof-stop-bleeding-28-on-carrier-invoices',
	'planner-as-router-fold-the-model-choice-into-the-plan',
	'planning-ai-buys-capability-not-autonomy',
	'prefill-decode-two-pool-gap',
	'rack-power-density-ceiling-build-before-you-buy',
	'rack-ride-through-two-second-duty',
	'remediator-recovers-46-percent',
	'reshoring-moved-the-tariff-upstream',
	'retry-is-the-failure-amplifier',
	'retry-permission-leaves-the-caller',
	'safety-stock-forecast-error-not-demand-noise',
	'same-day-race-undoes-route-optimization',
	'self-hosted-ai-when-to-buy-vs-rent-gpus',
	'shippers-stuck-in-the-gap',
	'sla-credit-is-not-insurance',
	'slow-movers-hold-your-stock',
	'stale-grants-travel-the-graph',
	'stripe-accounting-software-solving-the-payout-black-box-with',
	'tariff-cliff-already-priced-in',
	'tariff-split-reshoring-heavy-half',
	'the-cloud-bill-break-even-when-renting-servers-stops-paying',
	'the-sticker-price-lies-why-mexico-beats-china-on-total-landed-cost',
	'token-price-record-low-budget-overrun',
	'token-prices-just-halved-the-cfo-still-cant-read-the-bill',
	'up-ns-rail-merger-clears-summary-denial',
	'vendor-replacement-ai-ceiling',
	'wage-floor-sets-robot-payback',
	'warehouse-pick-error-tax-payback',
	'why-importers-forfeit-duty-refunds',
	'you-think-youre-governing-your-agents',
	'your-32gb-card-gone',
	'your-chip-stopped-deciding',
	'your-cluster-hidden-clock',
	'zet-scale-ev-truck-residual-value-risk',
];


/**
 * Tool pages that MOVED during the split. giniloh.com must 301 these to their new home rather
 * than 404 them — they are linked from indexed articles and carried real search equity.
 *
 * `from` is the path as it shipped on giniloh.com. `to` is absolute on the new property.
 */
export const MOVED_TOOL_PATHS = [
	{ from: '/calculators/gpu-compute/', to: `${AICHIEVE_ORIGIN}/tools/gpu-compute/` },
	{ from: '/calculators/decision-intelligence/', to: `${AICHIEVE_ORIGIN}/tools/master-asset-tco/` },
];

/** The enterprise tool register, for cross-references that must not be hardcoded twice. */
export const AICHIEVE_TOOL_PATHS = [
	{ slug: 'gpu-compute', title: 'GPU TCO Analyzer', path: '/tools/gpu-compute/' },
	{ slug: 'master-asset-tco', title: 'Master Asset & Software TCO Calculator', path: '/tools/master-asset-tco/' },
];
