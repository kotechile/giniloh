/**
 * The six verticals giniloh.com is organised around.
 *
 * One place owns the architecture: the hub pages, the nav dropdown and the "how it fits" strip
 * all read from here, so a vertical can never appear in the nav and be missing a hub (or claim a
 * calculator that the registry does not have).
 *
 * `tools` are calculator slugs from lib/calculators/metadata.ts, most important first. `flagship`
 * marks the tool that answers the hub's core question — the one the page leads with.
 *
 * COPY RULE: a hub is the shop window for its calculators, so it is written for the person with the
 * problem rather than for the desk that priced it. `question` is the household question;
 * `coreProblem` says why the obvious answer is wrong. Scheme sections, acronyms and "net yield" belong
 * in the calculator's own glossary, not here.
 */
export interface VerticalTopic {
	title: string;
	body: string;
	href?: string;
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
	articles?: string[];
}

export const VERTICALS: Vertical[] = [
	{
		slug: 'career-capital',
		position: 1,
		title: 'Career Equity & Compensation',
		shortLabel: 'Career',
		question: 'What is a job actually worth, once tax, hours and benefits are counted?',
		coreProblem:
			'Offers get compared on the headline number, and the headline is not what reaches your account. Tax, benefits, the commute, the unpaid admin, and the shares you forfeit by leaving all move the answer. Two offers $40,000 apart can swap places once those are counted.',
		topics: [
			{
				title: 'The same work, paid three ways',
				body: 'A salary, a day rate and a company of your own are taxed differently, and the gap is bigger than most people assume. Compare what lands in your account per hour worked, not what the contract calls gross.',
				href: '/calculators/w2-vs-1099-scorp-calculator/'
			},
			{
				title: 'What leaving actually costs',
				body: 'Unvested shares, a bonus you were three months from, and a retirement match are real money. A counter-offer has to clear that number before it is worth the disruption.',
				href: '/calculators/total-comp/'
			},
			{
				title: 'What an hour pays',
				body: 'Commute, on-call and admin time divided into take-home pay. $220,000 at 55 hours a week is a different job from $200,000 at 40.',
				href: '/calculators/raise-velocity/'
			}
		],
		tools: ['w2-vs-1099-scorp-calculator', 'raise-velocity', 'total-comp', 'career-ai-resilience', 'relocation-cost'],
		flagship: 'w2-vs-1099-scorp-calculator',
		articles: [
			'jobs-switch-calculator-step-by-step-profit-guide',
			'negotiate-job-offer-with-giniloh-visualizer',
			'calculate-your-career-relocation-payback',
			'best-ai-proof-jobs-in-a-changing-market',
			'post-termination-option-clock-tax'
		]
	},
	{
		slug: 'portfolio-capital',
		position: 2,
		title: 'Concentrated Equity & Portfolio Capital',
		shortLabel: 'Portfolio',
		question: 'How much of my savings should depend on one company?',
		coreProblem:
			'Your salary, your bonus and your savings can all depend on the same employer. One bad quarter then cuts your income and your net worth together. The way out is arithmetic rather than conviction: measure what one company is worth to you, then sell down to that number on a schedule.',
		topics: [
			{
				title: 'Shares taxed the day they vest',
				body: 'Stock you are given and keep is the same as taking the cash bonus and buying the shares at today’s price. If you would not buy it with new money, selling on vest is that same decision in reverse.',
				href: '/calculators/rsu-hold-vs-sell/'
			},
			{
				title: 'Selling on a schedule, not on a hunch',
				body: 'A written selling plan, adopted while you hold no company news, lets you sell quarterly without arguing about compliance every time.',
				href: '/staggered-lockup-six-selling-decisions/'
			},
			{
				title: 'A concentration you can live with',
				body: 'Pick the share of your savings one company may hold, then sell down to it on dates you set in advance. Most people land between 10% and 20%.',
				href: '/why-70-of-startup-options-go-unexercised/'
			},
			{
				title: 'Where the money goes next',
				body: 'High-growth shares in the Roth, bonds and property income in tax-deferred, the harvested rest in a normal account. Which account holds a fund matters as much as which fund.',
				href: '/calculators/money-flow/'
			},
			{
				title: 'Selling private shares before an IPO',
				body: 'A tender offer is a price, not a verdict. Compare it with what an exit might realistically pay after tax, then check the holding-period rules before you sign anything.',
				href: '/calculators/secondary-tender-calculator/'
			}
		],
		tools: ['rsu-hold-vs-sell', 'secondary-tender-calculator', 'money-flow'],
		flagship: 'rsu-hold-vs-sell',
		articles: [
			'staggered-lockup-six-selling-decisions',
			'why-70-of-startup-options-go-unexercised',
			'the-blueprint-behind-giniloh-money-flow',
			'how-to-use-giniloh-to-simulate-automate-and-backtest-frictionless',
			'beyond-the-emergency-fund-how-to-build-a-frictionless-wealth',
			'smart-ways-to-invest-an-extra-500-a-day'
		]
	},
	{
		slug: 'stack-economics',
		position: 3,
		title: 'Enterprise Stack Economics',
		shortLabel: 'Stack',
		question: 'Should we build this in-house or pay a vendor?',
		coreProblem:
			'Build-or-buy usually comes down to the licence price and a feeling about control. The honest version counts the engineer-years to match what the vendor already does, the maintenance that never appears in the business case, and a renewal price that rises every year.',
		topics: [
			{
				title: 'What the build really costs',
				body: 'Engineer-months at a fully loaded rate, including the review, testing and migration that a first estimate always leaves out.',
				href: '/calculators/build-vs-buy/'
			},
			{
				title: 'The maintenance nobody budgets',
				body: 'A tool that took eight engineer-months to build consumes a permanent share of an engineer to keep alive. Vendors quote that line item; internal teams do not.',
				href: '/calculators/no-code-terminator/'
			},
			{
				title: 'The price after year one',
				body: 'Vendor pricing rises at renewal, and so does the cost of leaving. Compare both sides over the same years, at the same discount rate.',
				href: '/zapier-notion-integration-calculate-your-tinkering-tax/'
			}
		],
		tools: ['build-vs-buy', 'no-code-terminator'],
		flagship: 'build-vs-buy',
		articles: [
			'zapier-notion-integration-calculate-your-tinkering-tax',
			'home-assistant-cloud-rename-hardware-rent'
		]
	},
	{
		slug: 'compute-capital',
		position: 4,
		title: 'Compute & Workstation Capital',
		shortLabel: 'Compute',
		question: 'Should I buy the hardware, or rent it by the hour?',
		coreProblem:
			'Local versus cloud is a question about hours used, dressed up as a question about hardware. A $9,000 workstation that runs 40 hours a month costs more per GPU-hour than on-demand cloud; one that runs 300 hours a month beats it comfortably. The answer flips on hours, power, resale value and how long you keep the box.',
		topics: [
			{
				title: 'Cost per GPU-hour, owned',
				body: 'Purchase price minus resale, plus power and maintenance, divided by the hours you will actually run before the hardware is obsolete.',
				href: '/calculators/gpu-breakeven/'
			},
			{
				title: 'Idle hardware still bills',
				body: 'Cloud bills only while you compute. Owned hardware bills every month whether or not it is running, which is why low use quietly loses.',
				href: '/nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check/'
			},
			{
				title: 'Repair or replace',
				body: 'The same arithmetic applied to the laptop already on the desk: when a repair buys real years, and when it is a sunk cost talking.',
				href: '/calculators/tech-debt-repair/'
			}
		],
		tools: ['gpu-breakeven', 'tech-debt-repair'],
		flagship: 'gpu-breakeven',
		articles: [
			'nvidia-rtx-pro-groundbreaking-performance-but-does-the-math-check',
			'replace-laptop-screen-let-this-decision-engine-do-the-math',
			'self-hosting-break-even-one-hour-a-year',
			'pi-5-price-jump-older-kit-wins'
		]
	},
	{
		slug: 'cross-border',
		position: 5,
		title: 'Cross-Border & Relocation',
		shortLabel: 'Cross-Border',
		question: 'If I move country, what is left of my pay after both tax systems?',
		coreProblem:
			'A move abroad is sold on cost of living and a headline tax rate. What you keep depends on the treaty, which credit you claim, where your shares vest, what the employer equalises, and what the currency does over five years.',
		topics: [
			{
				title: 'The exclusion or the credit',
				body: 'Two ways to avoid paying tax twice, and which one wins depends on your income mix, housing and shares. They are not interchangeable.',
				href: '/calculators/expat-evaluator/'
			},
			{
				title: 'Where the shares are taxed',
				body: 'Equity can be taxed where you worked in the year it vested. A move mid-vest splits one grant across two tax systems.',
				href: '/split-year-two-clock-seam/'
			},
			{
				title: 'What the move costs before it pays',
				body: 'Moving costs, temporary housing and a partner’s lost income are money out before any raise arrives. That has a payback period, and it can be negative.',
				href: '/calculators/relocation-cost/'
			}
		],
		tools: ['expat-evaluator', 'relocation-cost'],
		flagship: 'expat-evaluator',
		articles: [
			'expats-evaluating-the-true-value-of-a-job-driven-move-overseas',
			'calculate-your-career-relocation-payback',
			'split-year-two-clock-seam',
			'three-forms-cost-more-than-tax'
		]
	},
	{
		slug: 'personal-capital',
		position: 6,
		title: 'High-Impact Personal Capital',
		shortLabel: 'Personal',
		question: 'Am I paying for something I use, or for something I stopped noticing?',
		coreProblem:
			'The largest household decisions are not investment picks. They are the lease you want to break, the rent-or-buy call, the machine on the counter and the subscriptions you stopped noticing. Each one has an answer you can compute before you commit.',
		topics: [
			{
				title: 'Breaking a lease',
				body: 'The termination clause, the rent still owed, the reletting fee and what the deposit can legally cover are all knowable before you sign.',
				href: '/calculators/lease-break/'
			},
			{
				title: 'Rent or buy',
				body: 'A mortgage builds equity and consumes cash. The comparison is what the owner keeps after selling costs against what the renter has after investing the down payment and the monthly difference.',
				href: '/calculators/rent-vs-buy/'
			},
			{
				title: 'Cost per use',
				body: 'A $3,000 espresso machine is a bargain at four shots a day and a waste at four a month. The same arithmetic applies to hobby hardware and subscription creep.',
				href: '/is-a-3000-espresso-maker-machine-worth-it/'
			}
		],
		tools: ['rent-vs-buy', 'lease-break', 'money-flow', 'coffee-arbitrage'],
		flagship: 'rent-vs-buy',
		articles: [
			'lease-break-calculator-save-1850-in-3-steps',
			'is-a-3000-espresso-maker-machine-worth-it',
			'ebike-costs-per-use-calculator-for-commuters',
			'disney-hulu-fourth-hike-subscription-creep'
		]
	}
];

export function getVertical(slug: string): Vertical | undefined {
	return VERTICALS.find((v) => v.slug === slug);
}
