<?php
/**
 * Assign the routing `vertical` term to every post.
 *
 * WORKS TWO WAYS — pick whichever you have:
 *   wp eval-file wp-vertical-backfill.php [--dry-run]     (needs wp-cli)
 *   php wp-vertical-backfill.php [--dry-run]              (needs only php, run from the WP root)
 *
 * WHY: the front ends read WordPress. Routing by vertical only works once the vertical is ON the
 * post — everything in Supabase (vertical_sites, articles.slug/wp_post_id) is upstream metadata.
 *
 * Idempotent: re-running re-assigns the same term. Safe to run twice.
 */

// -- standalone bootstrap ------------------------------------------------
// Under `wp eval-file` WordPress is already loaded (ABSPATH defined). Under plain `php` it is not,
// so find wp-load.php by walking up from wherever this file was copied to.
if ( ! defined( 'ABSPATH' ) ) {
	$root = __DIR__;
	for ( $i = 0; $i < 4 && ! file_exists( $root . '/wp-load.php' ); $i++ ) {
		$root = dirname( $root );
	}
	if ( ! file_exists( $root . '/wp-load.php' ) ) {
		fwrite( STDERR, "ERROR: cannot find wp-load.php above " . __DIR__ . "\n" );
		fwrite( STDERR, "Copy this file into the WordPress root, or use: wp eval-file\n" );
		exit( 1 );
	}
	require_once $root . '/wp-load.php';
}

$args_in = defined( 'WP_CLI' ) ? (array) ( $args ?? array() ) : (array) ( $argv ?? array() );
$dry     = in_array( '--dry-run', $args_in, true );

$MAP = array(
	"100-case-eval-925-coverage" => "ai_observability_qa",
	"agent-audit-trail-not-evidence" => "enterprise_ai_governance",
	"agent-failure-topology-not-model" => "agentic_ai",
	"agent-failures-tests-stayed-green" => "ai_observability_qa",
	"agent-loop-bound-not-a-budget" => "agentic_ai",
	"agent-memory-poisoning-write-path" => "agentic_resilience_failure",
	"agent-memory-tiering-l1-l4" => "agentic_ai",
	"agent-reliability-pass-k-not-one-green-run" => "ai_observability_qa",
	"agent-safety-gate-moves-to-verified-state" => "agentic_ai",
	"agent-timeout-false-alarm-budget" => "agentic_ai",
	"agent-tool-count-ceiling" => "multi_agent_enterprise_fabric",
	"agentic-ai-adoption-soars-but-profits-stall-in-2026" => "agentic_ai",
	"ai-coding-seats-measure-or-renew" => "enterprise_tech_leadership",
	"ai-incident-clock-4-hours-not-15-days" => "enterprise_ai_governance",
	"ai-spend-27t-cost-visibility-mandate" => "enterprise_ai_finops",
	"air-freight-wont-price-a-year" => "meio_working_capital_tco",
	"automation-payback-splits-by-sku-geometry" => "warehouse_automation_robotics_capex",
	"aws-cannot-restore-bahrain" => "enterprise_tech_leadership",
	"azure-control-plane-single-point-of-failure" => "enterprise_tech_leadership",
	"best-ai-proof-jobs-in-a-changing-market" => "career_velocity_equity_engineering",
	"beyond-the-emergency-fund-how-to-build-a-frictionless-wealth" => "personal_investing",
	"build-wait-payback-threshold" => "workstation_compute_economics",
	"buying-ai-quality-when-the-score-belongs-to-the-judge" => "ai_observability_qa",
	"cache-boundary-decides-input-bill" => "enterprise_ai_finops",
	"calculate-your-career-relocation-payback" => "career_velocity_equity_engineering",
	"caseproof-stop-signing-3m-warehouse-automation-deals-on-a-vendors" => "pro_app_notes",
	"cheaper-model-pricier-task" => "enterprise_ai_finops",
	"control-tower-silent-exception" => "control_tower_exception_orchestration",
	"demurrage-invoice-30-day-clocks" => "control_tower_exception_orchestration",
	"diesel-620-electric-freight-certificate-gap" => "last_mile_routing_fleet_carbon",
	"disney-hulu-fourth-hike-subscription-creep" => "personal_microeconomics_tinkering_tax",
	"durable-execution-not-a-transaction" => "multi_agent_enterprise_fabric",
	"ebike-costs-per-use-calculator-for-commuters" => "consumer_cost_per_use",
	"enterprisebuildvsbuy-the-250k-ai-upkeep-tax" => "enterprise_build_vs_buy",
	"expats-evaluating-the-true-value-of-a-job-driven-move-overseas" => "expat_cross_border_relocation",
	"facturgate-the-deterministic-pre-send-gate-converter-for-european-e" => "pro_app_notes",
	"fed-rate-hike-inverts-working-capital-trap" => "meio_working_capital_tco",
	"fine-tune-vs-rent-by-token" => "workstation_compute_economics",
	"flat-price-was-the-hedge" => "enterprise_build_vs_buy",
	"forecast-accuracy-is-not-shock-protection" => "demand_sensing_advanced_sop",
	"forecast-value-added-lose-to-last-period" => "demand_sensing_advanced_sop",
	"freight-claim-dies-at-9-months" => "supply_chain",
	"freight-scale-bet-vs-contract-duration" => "supply_chain",
	"fuel-surcharge-peg-mpg-audit" => "supply_chain",
	"gate-the-step-not-the-model" => "agentic_resilience_failure",
	"goods-tariff-relief-vs-vessel-fee" => "supply_chain",
	"gpu-hour-price-set-by-memory" => "gpu_hardware",
	"holiday-forecasts-miss-what-shoppers-count" => "demand_sensing_advanced_sop",
	"home-assistant-cloud-rename-hardware-rent" => "personal_microeconomics_tinkering_tax",
	"hour-14-recovery-wall" => "control_tower_exception_orchestration",
	"how-to-use-giniloh-to-simulate-automate-and-backtest-frictionless" => "giniloh_product_guides",
	"inventory-carrying-cost-rate" => "meio_working_capital_tco",
	"is-a-3000-espresso-maker-machine-worth-it" => "consumer_cost_per_use",
	"jobs-switch-calculator-step-by-step-profit-guide" => "career_velocity_equity_engineering",
	"kill-switch-misses-half-your-agents" => "enterprise_ai_governance",
	"kv-cache-is-the-concurrency-ceiling" => "gpu_hardware",
	"last-mile-carbon-number-is-a-rate-table" => "last_mile_routing_fleet_carbon",
	"lease-break-calculator-save-1850-in-3-steps" => "giniloh_product_guides",
	"local-ai-payback-cloud-gpu-spread" => "workstation_compute_economics",
	"maskills-multi-agent-skills-optimization" => "agentic_ai",
	"mcp-skills-extension" => "agentic_ai",
	"moss-landing-burns-again-homeowners-become-the-grid" => "resilient_home_assets",
	"multi-agent-orchestration-building-the-one-person-enterprise" => "multi_agent_enterprise_fabric",
	"nearshoring-doesnt-move-the-trade-case" => "supplier_risk_reshoring_decision",
	"negotiate-job-offer-with-giniloh-visualizer" => "career_velocity_equity_engineering",
	"nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check" => "personal_compute_hardware",
	"nvidia-says-its-gpus-arent-sold-out-its-cfos-279-billion-memory-bet" => "nhil_infrastructure_ops",
	"one-approval-two-payments" => "multi_agent_enterprise_fabric",
	"one-skill-too-many-green-test" => "agentic_ai",
	"openai-just-made-the-agent-loop-a-commodity" => "agentic_ai",
	"openais-custom-chip-beats-nvidia-on-power-2" => "nhil_infrastructure_ops",
	"owned-shuttles-or-rented-robots" => "warehouse_automation_robotics_capex",
	"parcelproof-stop-bleeding-28-on-carrier-invoices" => "pro_app_notes",
	"planner-as-router-fold-the-model-choice-into-the-plan" => "agentic_ai",
	"planning-ai-buys-capability-not-autonomy" => "demand_sensing_advanced_sop",
	"post-termination-option-clock-tax" => "career_velocity_equity_engineering",
	"prefill-decode-two-pool-gap" => "gpu_hardware",
	"rack-power-density-ceiling-build-before-you-buy" => "nhil_infrastructure_ops",
	"rack-ride-through-two-second-duty" => "nhil_infrastructure_ops",
	"remediator-recovers-46-percent" => "nhil_infrastructure_ops",
	"replace-laptop-screen-let-this-decision-engine-do-the-math" => "personal_microeconomics_tinkering_tax",
	"reshoring-moved-the-tariff-upstream" => "supplier_risk_reshoring_decision",
	"retry-is-the-failure-amplifier" => "agentic_resilience_failure",
	"retry-permission-leaves-the-caller" => "agentic_resilience_failure",
	"safety-stock-forecast-error-not-demand-noise" => "demand_sensing_advanced_sop",
	"same-day-race-undoes-route-optimization" => "last_mile_routing_fleet_carbon",
	"self-hosted-ai-when-to-buy-vs-rent-gpus" => "gpu_hardware",
	"self-hosting-break-even-one-hour-a-year" => "personal_microeconomics_tinkering_tax",
	"shippers-stuck-in-the-gap" => "control_tower_exception_orchestration",
	"simulate-a-frictionless-liquidity-sweep-in-giniloh" => "giniloh_product_guides",
	"sla-credit-is-not-insurance" => "enterprise_build_vs_buy",
	"slow-movers-hold-your-stock" => "meio_working_capital_tco",
	"smart-ways-to-invest-an-extra-500-a-day" => "personal_investing",
	"split-year-two-clock-seam" => "expat_cross_border_relocation",
	"staggered-lockup-six-selling-decisions" => "career_velocity_equity_engineering",
	"stale-grants-travel-the-graph" => "multi_agent_enterprise_fabric",
	"stripe-accounting-software-solving-the-payout-black-box-with" => "pro_app_notes",
	"tariff-cliff-already-priced-in" => "supply_chain",
	"tariff-split-reshoring-heavy-half" => "supplier_risk_reshoring_decision",
	"the-blueprint-behind-giniloh-money-flow" => "giniloh_product_guides",
	"the-cloud-bill-break-even-when-renting-servers-stops-paying" => "enterprise_tech_leadership",
	"the-giniloh-money-flow-simulator-explained" => "giniloh_product_guides",
	"the-sticker-price-lies-why-mexico-beats-china-on-total-landed-cost" => "supplier_risk_reshoring_decision",
	"three-forms-cost-more-than-tax" => "expat_cross_border_relocation",
	"token-price-record-low-budget-overrun" => "enterprise_ai_finops",
	"token-prices-just-halved-the-cfo-still-cant-read-the-bill" => "enterprise_ai_finops",
	"up-ns-rail-merger-clears-summary-denial" => "supply_chain",
	"vendor-replacement-ai-ceiling" => "enterprise_build_vs_buy",
	"wage-floor-sets-robot-payback" => "warehouse_automation_robotics_capex",
	"warehouse-pick-error-tax-payback" => "warehouse_automation_robotics_capex",
	"why-70-of-startup-options-go-unexercised" => "career_velocity_equity_engineering",
	"why-importers-forfeit-duty-refunds" => "supplier_risk_reshoring_decision",
	"you-think-youre-governing-your-agents" => "enterprise_ai_governance",
	"your-32gb-card-gone" => "workstation_compute_economics",
	"your-chip-stopped-deciding" => "gpu_hardware",
	"your-cluster-hidden-clock" => "enterprise_build_vs_buy",
	"zapier-notion-integration-calculate-your-tinkering-tax" => "personal_microeconomics_tinkering_tax",
	"zet-scale-ev-truck-residual-value-risk" => "last_mile_routing_fleet_carbon",
);

$created = $assigned = $missing = 0;
$miss    = array();
$seen    = array(); // distinct terms handled this run — without this, dry-run counts one per POST

foreach ( $MAP as $slug => $vertical ) {

	// Count DISTINCT terms, and don't re-query a term we already handled this run. In --dry-run
	// nothing is actually inserted, so a bare term_exists() check would re-report every post's
	// term as "to create" (118 instead of 27) and wildly overstate the change.
	if ( ! isset( $seen[ $vertical ] ) && ! term_exists( $vertical, 'vertical' ) ) {
		if ( ! $dry ) {
			$r = wp_insert_term( $vertical, 'vertical', array( 'slug' => $vertical ) );
			if ( is_wp_error( $r ) ) {
				fwrite( STDERR, "term error ({$vertical}): " . $r->get_error_message() . "\n" );
				continue;
			}
		}
		$seen[ $vertical ] = true;
		$created++;
	}

	$found = get_posts( array(
		'name'        => $slug,
		'post_type'   => 'post',
		'post_status' => 'any',
		'numberposts' => 1,
		'fields'      => 'ids',
	) );

	if ( empty( $found ) ) {
		$miss[] = $slug;
		$missing++;
		continue;
	}

	if ( ! $dry ) {
		// false = replace this taxonomy's terms for the post, so a post can never end up
		// belonging to two properties.
		wp_set_object_terms( $found[0], $vertical, 'vertical', false );
	}
	$assigned++;
}

if ( ! $dry ) {
	// The taxonomy registers under REST only after rewrite rules are rebuilt.
	flush_rewrite_rules( false );
}

printf(
	"%s  terms_created=%d  assigned=%d  posts_not_found=%d\n",
	$dry ? 'DRY RUN (nothing written)' : 'DONE',
	$created,
	$assigned,
	$missing
);

if ( $miss ) {
	echo "\nposts not found by slug (check the slug or the post status):\n";
	foreach ( $miss as $s ) {
		echo "  {$s}\n";
	}
}

if ( ! $dry ) {
	echo "\nNext: confirm the taxonomy is exposed.\n";
	echo "  curl -s https://cms.giniloh.com/wp-json/wp/v2/vertical | head -c 300\n";
}
