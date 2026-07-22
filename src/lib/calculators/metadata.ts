export const calculatorTools = [
	{
		title: 'Lease Break Penalty & Offset Estimator',
		slug: 'lease-break',
		href: '/calculators/lease-break/',
		status: 'Live',
		accent: 'emerald',
		description:
			'Evaluate your early lease termination exposure. Calculate contract penalty structures, exit fees, and security deposit offsets.',
		utility: 'Calculate renter exit costs',
		category: 'FinanceApplication',
		keywords: ['lease break penalty calculator', 'early lease termination penalty', 'lease break penalty estimator']
	},
	{
		title: 'Job-Hop vs. Retention Compensation Calculator',
		slug: 'raise-velocity',
		href: '/calculators/raise-velocity/',
		status: 'Live',
		accent: 'cyan',
		description:
			'Compare traditional 3% annual raises vs. strategic job-hops yielding 15-20% bumps, projecting 10-year cumulative earnings.',
		utility: 'Evaluate career compensation options',
		category: 'FinanceApplication',
		keywords: ['should I job hop calculator', 'job-hop calculator', 'job hop vs retention calculator', 'salary projection']
	},
	{
		title: 'Total Compensation & Equity Visualizer',
		slug: 'total-comp',
		href: '/calculators/total-comp/',
		status: 'Live',
		accent: 'indigo',
		description:
			'Model base salary, cash bonuses, and vesting RSUs or options with stock growth assumptions to evaluate tech offers.',
		utility: 'Evaluate RSUs and stock options values',
		category: 'FinanceApplication',
		keywords: ['equity compensation calculator', 'total compensation calculator', 'total compensation visualizer', 'rsu calculator', 'equity visualizer']
	},
	{
		title: 'Automated Income Waterfall Simulator',
		slug: 'money-flow',
		href: '/calculators/money-flow/',
		status: 'Proposed',
		accent: 'violet',
		description:
			'Visualize automated account routing: from checking, through retirement matches, HSAs, and index fund allocation.',
		utility: 'Simulate automated investing systems',
		category: 'FinanceApplication',
		keywords: ['total compensation visualizer', 'money flow flowchart', 'automated investing', 'portfolio flow']
	},
	{
		title: 'Career Relocation Cost & Payback Calculator',
		slug: 'relocation-cost',
		href: '/calculators/relocation-cost/',
		status: 'Live',
		accent: 'blue',
		description:
			'Find out how many months of a new salary bump it takes to break even on moving costs, lease breaks, and new deposits.',
		utility: 'Calculate relocation payback period',
		category: 'FinanceApplication',
		keywords: ['relocation cost benefit calculator', 'relocation payback calculator', 'moving cost payback', 'relocation calculator']
	},
	{
		title: 'Master Asset & Software TCO Calculator',
		slug: 'decision-intelligence',
		href: '/calculators/decision-intelligence/',
		status: 'Live',
		accent: 'indigo',
		description:
			'Evaluate complex business and lifestyle trade-offs—from enterprise software build-vs-buy TCO to personal asset repairs, espresso machine cost-per-use, and time tinkering taxes.',
		utility: 'Analyze build vs. buy & personal asset TCO',
		category: 'FinanceApplication',
		keywords: ['decision intelligence', 'build vs buy calculator', 'tinkering tax calculator', 'repair vs replace calculator', 'espresso cost per use calculator']
	},
	{
		title: 'Home Espresso Cost-per-Use Calculator',
		slug: 'coffee-arbitrage',
		href: '/calculators/coffee-arbitrage/',
		status: 'Live',
		accent: 'emerald',
		description:
			'Determine if investing in a premium home espresso setup beats your daily café runs. Real-time cost-per-use calculator.',
		utility: 'Evaluate espresso machine cost-per-use',
		category: 'FinanceApplication',
		keywords: ['espresso cost per use calculator', 'home espresso cost-per-use', 'home espresso vs cafe cost', 'espresso machine cpu']
	},
	{
		title: 'Tech Repair vs. Replace Optimizer',
		slug: 'tech-debt-repair',
		href: '/calculators/tech-debt-repair/',
		status: 'Live',
		accent: 'indigo',
		description:
			'Calculate if repairing a 3-to-5-year-old laptop or phone is a smart fix or a financial liability. Uses the adapted consumer 1,500 index rule.',
		utility: 'Calculate repair vs replace index score',
		category: 'FinanceApplication',
		keywords: ['technical debt calculator', 'repair vs replace calculator', 'tech repair vs replace', 'laptop screen repair cost']
	},
	{
		title: 'Tinkering Tax vs. SaaS Upgrade Calculator',
		slug: 'no-code-terminator',
		href: '/calculators/no-code-terminator/',
		status: 'Live',
		accent: 'cyan',
		description:
			'Calculate the hidden tinkering tax of manual workarounds and sheets vs. upgrading to a centralized SaaS platform.',
		utility: 'Calculate time tax vs premium software cost',
		category: 'FinanceApplication',
		keywords: ['no-code total cost calculator', 'tinkering tax calculator', 'SaaS burn rate vs build', 'no-code workaround']
	},
	{
		title: 'GPU TCO Analyzer',
		slug: 'gpu-compute',
		href: '/calculators/gpu-compute/',
		status: 'Live',
		accent: 'violet',
		description:
			'Compare the TCO of building a local deep learning GPU workstation against renting cloud GPU compute instances.',
		utility: 'Evaluate local GPU vs cloud GPU TCO',
		category: 'FinanceApplication',
		keywords: ['gpu tco calculator', 'gpu cost per hour vs cloud', 'rtx 6000 rental vs buy', 'should I buy vs rent gpu', 'gpu compute calculator']
	},
	{
		title: 'AI Career Radar',
		slug: 'career-ai-resilience',
		href: '/calculators/career-ai-resilience/',
		status: 'Live',
		accent: 'cyan',
		description:
			'Analyze the automation vulnerability of 1,000+ occupations at the task level. Drag sliders to simulate upskilling and see how task-shifting future-proofs your career.',
		utility: 'Analyze career AI risk & upskill',
		category: 'FinanceApplication',
		keywords: ['career ai risk', 'occupation vulnerability', 'ai automation calculator', 'future proof career']
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
