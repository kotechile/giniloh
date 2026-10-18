/**
 * The six verticals giniloh.com is organised around.
 *
 * One place owns the architecture: the hub pages, the nav dropdown and the "how it fits" strip
 * all read from here, so a vertical can never appear in the nav and be missing a hub (or claim a
 * calculator that the registry does not have).
 *
 * `tools` are calculator slugs from lib/calculators/metadata.ts, most important first. `flagship`
 * marks the tool that answers the hub's core question — the one the page leads with.
 */
export interface VerticalTopic {
	title: string;
	body: string;
}

export interface Vertical {
	slug: string;
	/** 1-based position in the architecture, used in the eyebrow. */
	position: number;
	title: string;
	shortLabel: string;
	/** The single question this vertical exists to answer. */
	question: string;
	coreProblem: string;
	topics: VerticalTopic[];
	tools: string[];
	flagship: string;
}

export const VERTICALS: Vertical[] = [
	{
		slug: 'career-capital',
		position: 1,
		title: 'Career Equity & Compensation',
		shortLabel: 'Career',
		question: 'What is my labor and equity actually worth after taxes and friction?',
		coreProblem:
			'Offers are compared on gross numbers. The decision that matters is net yield after self-employment tax, benefits, retirement caps, commute and admin hours, and the cliff forfeiture you take by leaving. Two offers that differ by $40k of headline comp can invert once those are priced.',
		topics: [
			{
				title: 'W-2 vs. 1099 vs. S-Corp',
				body: 'SE tax, the QBI deduction, Solo 401(k) capacity and compliance overhead — modelled as three net yields, not three gross incomes.'
			},
			{
				title: 'Offer engineering and cliff forfeiture',
				body: 'The cost of walking away from unvested equity, and what a counter-offer has to clear to be worth the reset.'
			},
			{
				title: 'True hourly yield',
				body: 'Commute, on-call and admin time divided into net pay. A $220k salary at 55 hours is a different job from $200k at 40.'
			}
		],
		tools: ['w2-vs-1099-scorp-calculator', 'raise-velocity', 'total-comp', 'career-ai-resilience', 'relocation-cost'],
		flagship: 'w2-vs-1099-scorp-calculator'
	},
	{
		slug: 'portfolio-capital',
		position: 2,
		title: 'Concentrated Equity & Portfolio Capital',
		shortLabel: 'Portfolio',
		question: 'How do I de-risk single-stock exposure and engineer tax-sheltered wealth?',
		coreProblem:
			'Engineers hold company stock because it keeps going up, while their salary, bonus and unvested equity are tied to the same employer. That is double jeopardy: one bad quarter cuts income and liquid net worth together. The fix is deterministic — price the concentration, then decide where the proceeds live.',
		topics: [
			{
				title: 'The RSU vest fallacy',
				body: 'Shares taxed as ordinary income on vest and then held are economically identical to taking the cash bonus and buying company stock at today’s price. If you would not buy it with new cash, auto-selling on vest is the same decision in reverse.'
			},
			{
				title: '10b5-1 plans and systematic de-risking',
				body: 'How directors and staff engineers schedule quarterly sales without insider-trading exposure — and why the plan has to be adopted while you are not in possession of material information.'
			},
			{
				title: 'Exchange funds vs. direct indexing',
				body: 'When a $500k+ single-stock position justifies a seven-year exchange-fund lockup, and when systematic tax-loss harvesting in a separately managed account is the cheaper diversifier.'
			},
			{
				title: 'Asset location and the $72k ceiling',
				body: 'High-dividend, REIT and bond exposure belongs in tax-deferred; high-growth equity belongs in Roth; the harvested core sits in taxable. The Mega Backdoor Roth is how the Roth bucket gets funded past the elective deferral cap.'
			},
			{
				title: 'Secondary tenders and QSBS',
				body: 'A tender offer is a price, not a verdict. Model the haircut against the risk-adjusted IPO path, then check whether §1202/§1045 rollover treatment survives the transaction.'
			}
		],
		tools: ['rsu-hold-vs-sell', 'secondary-tender-calculator', 'money-flow'],
		flagship: 'rsu-hold-vs-sell'
	},
	{
		slug: 'stack-economics',
		position: 3,
		title: 'Enterprise Stack Economics',
		shortLabel: 'Stack',
		question: 'Should we build this in-house or pay a vendor?',
		coreProblem:
			'Build-vs-buy is usually decided on the licence price and a gut feeling about control. The honest comparison is loaded engineering time to reach parity, the maintenance tax that never appears in the business case, integration and on-call, against a vendor price that escalates every renewal.',
		topics: [
			{
				title: 'Loaded build cost, not headcount',
				body: 'Person-months at a fully loaded rate, including the review, testing and migration work that a v1 estimate always omits.'
			},
			{
				title: 'The maintenance multiplier',
				body: 'A tool that took eight engineer-months to build consumes a permanent fraction of an engineer to keep alive. That is the line item vendors quote and internal teams do not.'
			},
			{
				title: 'Renewal escalation and exit cost',
				body: 'Vendor pricing escalates; so does the cost of leaving. The comparison is only fair over the same horizon, with the same discount rate.'
			}
		],
		tools: ['build-vs-buy', 'no-code-terminator'],
		flagship: 'build-vs-buy'
	},
	{
		slug: 'compute-capital',
		position: 4,
		title: 'Compute & Workstation Capital',
		shortLabel: 'Compute',
		question: 'Should I buy high-end local silicon or rent cloud GPU clusters?',
		coreProblem:
			'Local versus cloud is a utilisation question disguised as a hardware question. A $9k workstation that runs 40 hours a month costs more per GPU-hour than on-demand cloud; one that runs 300 hours a month beats it comfortably. The answer flips on hours, power, resale value and how long you keep the box.',
		topics: [
			{
				title: 'Cost per GPU-hour, owned',
				body: 'Purchase price minus resale, plus power and maintenance, divided by the hours you will actually use it before it is obsolete.'
			},
			{
				title: 'The idle-silicon penalty',
				body: 'Cloud bills only when you run. Local hardware bills every month whether or not the model is training, which is why low utilisation quietly loses.'
			},
			{
				title: 'Repair vs. replace',
				body: 'The same capital logic applied to the laptop or workstation already on the desk — when a repair is rational and when it is a sunk-cost argument.'
			}
		],
		tools: ['gpu-breakeven', 'tech-debt-repair'],
		flagship: 'gpu-breakeven'
	},
	{
		slug: 'cross-border',
		position: 5,
		title: 'Cross-Border & Relocation',
		shortLabel: 'Cross-Border',
		question: 'Is moving jurisdictions a real tax arbitrage or a hidden double-tax trap?',
		coreProblem:
			'A move abroad is usually sold on cost of living and a headline tax rate. The real result depends on treaty mechanics: FEIE versus foreign tax credit, social-security totalisation, where equity vests, tax equalisation and what the currency does over five years.',
		topics: [
			{
				title: 'FEIE vs. FTC',
				body: 'The exclusion and the credit are not interchangeable, and the better one changes with income mix, housing and equity.'
			},
			{
				title: 'Where the equity is taxed',
				body: 'RSUs and options can be sourced to the work location in the year they vest — a relocation mid-vest splits the same grant across two tax regimes.'
			},
			{
				title: 'Relocation payback',
				body: 'Moving costs, temporary housing and a spouse’s lost income are a capital outlay against future cash flow. It has a payback period, and it can be negative.'
			}
		],
		tools: ['expat-evaluator', 'relocation-cost'],
		flagship: 'expat-evaluator'
	},
	{
		slug: 'personal-capital',
		position: 6,
		title: 'High-Impact Personal Capital',
		shortLabel: 'Personal',
		question: 'Am I paying for real utility or wasting investment capital on lifestyle drag?',
		coreProblem:
			'The biggest household decisions are not investment picks. They are the lease you want to break, the rent-versus-buy call, and the recurring subscriptions and appliances that quietly consume the capital that would otherwise compound. Each has a deterministic answer.',
		topics: [
			{
				title: 'Lease break economics',
				body: 'Early-termination clauses, remaining rent, reletting fees and offsets. The penalty is a number you can compute before you sign.'
			},
			{
				title: 'Rent vs. buy with opportunity cost',
				body: 'A mortgage builds equity and consumes cash. The comparison is the net worth of an owner after selling costs against a renter who invests the down payment and the monthly difference.'
			},
			{
				title: 'Cost-per-use discipline',
				body: 'A $3,000 espresso machine is a bargain at four shots a day and a lifestyle tax at four a month. The same arithmetic applies to hobby hardware and subscription creep.'
			}
		],
		tools: ['rent-vs-buy', 'lease-break', 'money-flow', 'coffee-arbitrage'],
		flagship: 'rent-vs-buy'
	}
];

export function getVertical(slug: string): Vertical | undefined {
	return VERTICALS.find((v) => v.slug === slug);
}
