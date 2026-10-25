/**
 * The calculator register: what each tool is called, what question it answers, and the one line a
 * browsing visitor reads before deciding whether to open it.
 *
 * WHY THE COPY LOOKS LIKE THIS
 * These cards are the shop window. They used to read like a structured-products term sheet ("Net
 * Yield", "Amortization Simulator", "Section 415(c)") and the visitors who need the tool most — the
 * person with an offer letter or a lease — could not tell it was for them. `title` is now the plain
 * name of the decision, `utility` is the question in six words, and `description` opens with a
 * number or a rule instead of a category. Search terms live in `keywords` and in the page H1, not
 * here, so the plain name costs nothing in search.
 */
export const calculatorTools = [
	{
		title: 'RSU Hold vs. Sell',
		slug: 'rsu-hold-vs-sell',
		href: '/calculators/rsu-hold-vs-sell/',
		status: 'Live',
		accent: 'cyan',
		domainCategory: 'Portfolio Capital',
		outputType: 'Portfolio Risk & Tax Matrix',
		iconType: 'chart-line',
		description:
			'Your shares are already taxed as income the day they vest. This tells you whether keeping them beats selling and putting the money somewhere less tied to your employer.',
		utility: 'Sell on vest, or hold?',
		category: 'FinanceApplication',
		keywords: [
			'rsu hold vs sell calculator',
			'mega backdoor roth 2026 calculator',
			'concentrated stock risk model',
			'double jeopardy tech compensation',
			'72k section 415c limit'
		]
	},

	{
		title: 'W-2 vs. 1099 vs. S-Corp',
		slug: 'w2-vs-1099-scorp-calculator',
		href: '/calculators/w2-vs-1099-scorp-calculator/',
		status: 'Live',
		accent: 'emerald',
		domainCategory: 'Career',
		outputType: '3-Way Net Pay Comparison',
		iconType: 'chart-line',
		description:
			'The same work, paid three ways. See what each structure leaves you after tax, health cover, retirement limits and the unpaid admin hours it adds.',
		utility: 'Which structure pays more?',
		category: 'FinanceApplication',
		keywords: [
			'w2 vs 1099 calculator',
			's corp vs sole prop calculator',
			'1099 vs w2 breakeven hourly rate',
			'solo 401k s corp calculator',
			'qbi deduction 1099 vs scorp'
		]
	},

	{
		title: 'Secondary Tender vs. IPO',
		slug: 'secondary-tender-calculator',
		href: '/calculators/secondary-tender-calculator/',
		status: 'Live',
		accent: 'amber',
		domainCategory: 'Portfolio Capital',
		outputType: 'After-Tax Exit Comparison',
		iconType: 'matrix',
		description:
			'An offer for your private shares is cash today at a discount; waiting is a bet on an exit that may never happen. Compare both after tax, in today\u2019s dollars.',
		utility: 'Cash now, or wait?',
		category: 'FinanceApplication',
		keywords: [
			'secondary tender offer calculator',
			'startup secondary sale tax',
			'qsbs 1202 calculator',
			'ipo lockup opportunity cost',
			'private equity tender offer discount'
		]
	},

	{
		title: 'Build vs. Buy',
		slug: 'build-vs-buy',
		href: '/calculators/build-vs-buy/',
		status: 'Live',
		accent: 'cyan',
		domainCategory: 'Stack Economics',
		outputType: 'Discounted TCO Comparison',
		iconType: 'table',
		description:
			'A build case usually counts the licence it avoids and forgets the engineer-years it spends. This prices both sides over the same horizon, maintenance included.',
		utility: 'Build it, or pay for it?',
		category: 'FinanceApplication',
		keywords: [
			'build vs buy calculator',
			'internal tooling maintenance cost',
			'engineering time TCO',
			'vendor renewal escalation',
			'build vs buy software amortization'
		]
	},

	{
		title: 'Local GPU vs. Cloud',
		slug: 'gpu-breakeven',
		href: '/calculators/gpu-breakeven/',
		status: 'Live',
		accent: 'emerald',
		domainCategory: 'Compute Capital',
		outputType: 'Cost per GPU-Hour',
		iconType: 'server',
		description:
			'A workstation is a purchase; cloud GPUs are a bill. This works out the cost per GPU-hour each way, at the hours you will run and the years you will keep it.',
		utility: 'Own the hardware, or rent?',
		category: 'FinanceApplication',
		keywords: [
			'local vs cloud gpu calculator',
			'gpu cost per hour',
			'workstation break even cloud',
			'llm training hardware roi',
			'cloud gpu vs buying'
		]
	},

	{
		title: 'Rent vs. Buy',
		slug: 'rent-vs-buy',
		href: '/calculators/rent-vs-buy/',
		status: 'Live',
		accent: 'indigo',
		domainCategory: 'Personal Capital',
		outputType: 'Net Worth at Horizon',
		iconType: 'chart-bar',
		description:
			'Renting is not money thrown away if the down payment gets invested. This runs both households to the same year and compares what each one is actually worth.',
		utility: 'Buy the home, or rent and invest?',
		category: 'FinanceApplication',
		keywords: [
			'rent vs buy calculator',
			'rent vs buy opportunity cost',
			'price to rent ratio',
			'home equity break even year',
			'buying a home vs investing'
		]
	},

	{
		title: 'Lease Break Cost',
		slug: 'lease-break',
		href: '/calculators/lease-break/',
		status: 'Live',
		accent: 'emerald',
		domainCategory: 'Real Estate',
		outputType: 'Penalty Offset Matrix',
		iconType: 'table',
		description:
			'What walking out early costs: the termination clause, the rent still owed, the reletting fee and what your deposit can legally cover.',
		utility: 'What leaving early costs',
		category: 'FinanceApplication',
		keywords: ['lease break penalty calculator', 'early lease termination penalty', 'lease break penalty estimator']
	},
	{
		title: 'Job-Hop vs. Staying',
		slug: 'raise-velocity',
		href: '/calculators/raise-velocity/',
		status: 'Live',
		accent: 'cyan',
		domainCategory: 'Career',
		outputType: 'Cumulative Earnings Curve',
		iconType: 'chart-line',
		description:
			'Staying earns about 3% a year; changing employer earns 10-20% in one move. This projects both over ten years, including the equity you forfeit by leaving.',
		utility: 'Move jobs, or stay?',
		category: 'FinanceApplication',
		keywords: ['should I job hop calculator', 'job-hop calculator', 'job hop vs retention calculator', 'salary projection']
	},
	{
		title: 'Total Compensation',
		slug: 'total-comp',
		href: '/calculators/total-comp/',
		status: 'Live',
		accent: 'indigo',
		domainCategory: 'Compensation',
		outputType: 'Vesting & Equity Schedule',
		iconType: 'chart-bar',
		description:
			'Base salary is the smallest part of most tech offers. This adds bonus, equity and vesting so two offers can be compared on cash you can actually spend.',
		utility: 'Which offer pays more?',
		category: 'FinanceApplication',
		keywords: ['equity compensation calculator', 'total compensation calculator', 'total compensation visualizer', 'rsu calculator', 'equity visualizer']
	},
	{
		title: 'Where Your Paycheck Goes',
		slug: 'money-flow',
		href: '/calculators/money-flow/',
		status: 'Proposed',
		accent: 'violet',
		domainCategory: 'Personal Finance',
		outputType: 'Automated Routing Waterfall',
		iconType: 'flow',
		description:
			'Map every dollar from the paycheck to the account it reaches, then see what a different order is worth over ten years.',
		utility: 'Where each paycheck lands',
		category: 'FinanceApplication',
		keywords: ['total compensation visualizer', 'money flow flowchart', 'automated investing', 'portfolio flow']
	},
	{
		title: 'Relocation Payback',
		slug: 'relocation-cost',
		href: '/calculators/relocation-cost/',
		status: 'Live',
		accent: 'blue',
		domainCategory: 'Career',
		outputType: 'Payback Horizon Timeline',
		iconType: 'timeline',
		description:
			'Moving for a job costs money before it pays any. This finds how many months of the after-tax raise it takes to recover the move.',
		utility: 'Months to pay back the move',
		category: 'FinanceApplication',
		keywords: ['relocation cost benefit calculator', 'relocation payback calculator', 'moving cost payback', 'relocation calculator']
	},
	{
		title: 'Espresso Cost per Cup',
		slug: 'coffee-arbitrage',
		href: '/calculators/coffee-arbitrage/',
		status: 'Live',
		accent: 'emerald',
		domainCategory: 'Lifestyle',
		outputType: 'Per-Cup Cost Model',
		iconType: 'chart-line',
		description:
			'A $3,000 machine is cheap at four shots a day and expensive at four a month. Enter the habit you actually have and see the cost per cup.',
		utility: 'Cost per cup, at your habit',
		category: 'FinanceApplication',
		keywords: ['espresso cost per use calculator', 'home espresso cost-per-use', 'home espresso vs cafe cost', 'espresso machine cpu']
	},
	{
		title: 'Repair vs. Replace',
		slug: 'tech-debt-repair',
		href: '/calculators/tech-debt-repair/',
		status: 'Live',
		accent: 'indigo',
		domainCategory: 'Hardware',
		outputType: 'Repair vs. Replace Index',
		iconType: 'gauge',
		description:
			'A repair that buys two more years is cheap; one that buys six months is not. Compare the quote against the replacement price, per year of use.',
		utility: 'Fix it, or replace it?',
		category: 'FinanceApplication',
		keywords: ['technical debt calculator', 'repair vs replace calculator', 'tech repair vs replace', 'laptop screen repair cost']
	},
	{
		title: 'Spreadsheet vs. Real Software',
		slug: 'no-code-terminator',
		href: '/calculators/no-code-terminator/',
		status: 'Live',
		accent: 'cyan',
		domainCategory: 'Software & Ops',
		outputType: 'Time-Tax vs. SaaS Audit',
		iconType: 'clock',
		description:
			'Rebuilding the same automation every month is a cost even when nobody invoices it. Price the hours against the subscription that replaces them.',
		utility: 'Hours lost, or subscription',
		category: 'FinanceApplication',
		keywords: ['no-code total cost calculator', 'tinkering tax calculator', 'SaaS burn rate vs build', 'no-code workaround']
	},
	{
		title: 'AI Career Radar',
		slug: 'career-ai-resilience',
		href: '/calculators/career-ai-resilience/',
		status: 'Live',
		accent: 'cyan',
		domainCategory: 'Career',
		outputType: 'Task Automation Radar',
		iconType: 'radar',
		description:
			'See which parts of your job a current model can already do, task by task, and what changing one part of your week would do to the risk.',
		utility: 'What AI can do in your job',
		category: 'FinanceApplication',
		keywords: ['career ai risk', 'occupation vulnerability', 'ai automation calculator', 'future proof career']
	},
	{
		title: 'Expat Tax',
		slug: 'expat-evaluator',
		href: '/calculators/expat-evaluator/',
		status: 'Live',
		accent: 'indigo',
		domainCategory: 'Global Mobility',
		outputType: '5-Year Wealth & Tax Model',
		iconType: 'globe',
		description:
			'A move abroad is sold on the headline tax rate. This compares what you keep after both countries have taxed you, measured over five years.',
		utility: 'What you keep after both taxes',
		category: 'FinanceApplication',
		keywords: [
			'expat financial evaluator',
			'beckham law calculator',
			'us spain expat tax calculator',
			'feie vs ftc calculator',
			'tax equalization calculator',
			'international relocation cash flow'
		]
	}
] as const;

export type CalculatorTool = (typeof calculatorTools)[number];

export function getCalculatorSchema(tool: CalculatorTool, site: URL) {
	const url = new URL(tool.href, site).toString();
	const homeUrl = new URL('/', site).toString();
	const calculatorsUrl = new URL('/calculators/', site).toString();

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'SoftwareApplication',
				name: tool.title,
				description: tool.description,
				url,
				applicationCategory: tool.category,
				operatingSystem: 'Web',
				isAccessibleForFree: true,
				keywords: tool.keywords.join(', '),
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD',
					url
				},
				publisher: {
					'@type': 'Organization',
					name: 'Gini Loh',
					url: homeUrl
				}
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Home',
						item: homeUrl
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: 'Calculators',
						item: calculatorsUrl
					},
					{
						'@type': 'ListItem',
						position: 3,
						name: tool.title,
						item: url
					}
				]
			}
		]
	};
}

export function getCalculatorBySlug(slug: CalculatorTool['slug']) {
	return calculatorTools.find((tool) => tool.slug === slug);
}
