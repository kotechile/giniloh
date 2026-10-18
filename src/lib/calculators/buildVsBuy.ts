/**
 * Enterprise Build-vs-Buy Amortisation.
 *
 * The business case for internal tooling usually contains the licence it replaces and the
 * engineer-months to reach v1. It usually omits the two numbers that decide the outcome:
 * the loaded cost of those engineer-months, and the permanent maintenance fraction that a
 * built tool consumes after launch. This model puts both on a discounted cash-flow basis over
 * the same horizon as the vendor contract, including renewal escalation.
 */

export interface BuildVsBuyInputs {
	/** Engineers assigned to reach feature parity. */
	engineers: number;
	/** Calendar months of build before the tool is usable. */
	monthsToParity: number;
	/** Fully loaded monthly cost per engineer (salary, benefits, overhead). */
	loadedMonthlyCostPerEngineer: number;
	/** Annual maintenance + support, as a percentage of the initial build cost. */
	maintenancePctPerYear: number;
	/** Hosting/infrastructure for the built tool, monthly. */
	infraMonthly: number;

	/** Vendor licence per seat per year. */
	vendorAnnualPerSeat: number;
	seats: number;
	/** One-time implementation/integration fee. */
	implementationFee: number;
	/** Renewal price escalation per year, percent. */
	vendorEscalationPct: number;

	horizonYears: number;
	discountRatePct: number;
}

export interface YearRow {
	year: number;
	buildCost: number;
	vendorCost: number;
	buildCumulative: number;
	vendorCumulative: number;
}

export interface BuildVsBuyOutputs {
	buildInitial: number;
	buildAnnualRun: number;
	vendorInitial: number;
	vendorAnnual: number;
	buildNpv: number;
	vendorNpv: number;
	breakevenYear: number | null;
	recommendation: 'Build in-house' | 'Buy the vendor';
	advantageAtHorizon: number;
	annualParityCost: number;
	series: YearRow[];
}

const money = (n: number) => Math.round(n * 100) / 100;

export function calculateBuildVsBuy(inputs: BuildVsBuyInputs): BuildVsBuyOutputs {
	const engineers = Math.max(0, inputs.engineers);
	const months = Math.max(0, inputs.monthsToParity);
	const loaded = Math.max(0, inputs.loadedMonthlyCostPerEngineer);
	const horizon = Math.max(1, Math.round(inputs.horizonYears));
	const discount = 1 + Math.max(0, inputs.discountRatePct) / 100;

	const buildInitial = engineers * months * loaded;
	const buildAnnualRun =
		buildInitial * (Math.max(0, inputs.maintenancePctPerYear) / 100) + Math.max(0, inputs.infraMonthly) * 12;

	const seats = Math.max(0, inputs.seats);
	const vendorInitial = Math.max(0, inputs.implementationFee);
	const vendorAnnual = Math.max(0, inputs.vendorAnnualPerSeat) * seats;
	const escalation = 1 + Math.max(0, inputs.vendorEscalationPct) / 100;

	let buildCumulative = buildInitial;
	let vendorCumulative = vendorInitial;
	let buildNpv = buildInitial;
	let vendorNpv = vendorInitial;
	let breakevenYear: number | null = null;
	const series: YearRow[] = [
		{
			year: 0,
			buildCost: money(buildInitial),
			vendorCost: money(vendorInitial),
			buildCumulative: money(buildCumulative),
			vendorCumulative: money(vendorCumulative)
		}
	];

	for (let year = 1; year <= horizon; year++) {
		// Build maintenance does not escalate with the vendor; internal cost drifts with salaries,
		// which are deliberately held flat here so the comparison is not won by an assumption.
		const buildCost = buildAnnualRun;
		const vendorCost = vendorAnnual * Math.pow(escalation, year - 1);
		buildCumulative += buildCost;
		vendorCumulative += vendorCost;
		buildNpv += buildCost / Math.pow(discount, year);
		vendorNpv += vendorCost / Math.pow(discount, year);
		if (breakevenYear === null && buildCumulative < vendorCumulative) breakevenYear = year;
		series.push({
			year,
			buildCost: money(buildCost),
			vendorCost: money(vendorCost),
			buildCumulative: money(buildCumulative),
			vendorCumulative: money(vendorCumulative)
		});
	}

	const buildWins = buildNpv < vendorNpv;
	return {
		buildInitial: money(buildInitial),
		buildAnnualRun: money(buildAnnualRun),
		vendorInitial: money(vendorInitial),
		vendorAnnual: money(vendorAnnual),
		buildNpv: money(buildNpv),
		vendorNpv: money(vendorNpv),
		breakevenYear,
		recommendation: buildWins ? 'Build in-house' : 'Buy the vendor',
		advantageAtHorizon: money(Math.abs(buildNpv - vendorNpv)),
		annualParityCost: money(buildAnnualRun - vendorAnnual),
		series
	};
}
