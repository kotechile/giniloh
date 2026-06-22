export const calculatorTools = [
	{
		title: 'Lease Break Calculator',
		slug: 'lease-break',
		href: '/calculators/lease-break/',
		status: 'Live',
		accent: 'emerald',
		description:
			'Estimate the real cost of breaking a lease early, including penalties, extra charges, and security deposit offsets.',
		utility: 'Calculate renter exit costs',
		category: 'FinanceApplication',
		keywords: ['lease break calculator', 'early lease termination', 'rent calculator']
	},
	{
		title: 'Raise & Job-Hop Velocity Calculator',
		slug: 'raise-velocity',
		href: '/calculators/raise-velocity/',
		status: 'Live',
		accent: 'cyan',
		description:
			'Compare traditional 3% annual raises vs. strategic job-hops yielding 15-20% bumps, projecting 10-year cumulative earnings.',
		utility: 'Evaluate career compensation options',
		category: 'FinanceApplication',
		keywords: ['job-hop calculator', 'salary projection', 'raise calculator']
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
		keywords: ['total compensation calculator', 'rsu calculator', 'equity visualizer']
	},
	{
		title: 'Frictionless Money Flow Simulator',
		slug: 'money-flow',
		href: '/calculators/money-flow/',
		status: 'Proposed',
		accent: 'violet',
		description:
			'Visualize automated account routing: from checking, through retirement matches, HSAs, and index fund allocation.',
		utility: 'Simulate automated investing systems',
		category: 'FinanceApplication',
		keywords: ['money flow flowchart', 'automated investing', 'portfolio flow']
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
		keywords: ['relocation calculator', 'moving cost payback', 'lease break move']
	},
	{
		title: 'Strategic Decision-Intelligence Engine',
		slug: 'decision-intelligence',
		href: '/calculators/decision-intelligence/',
		status: 'Live',
		accent: 'indigo',
		description:
			'Evaluate complex business and lifestyle trade-offs—from enterprise software build-vs-buy TCO to personal asset repairs, espresso machine cost-per-use, and time tinkering taxes.',
		utility: 'Analyze build vs. buy & personal asset TCO',
		category: 'FinanceApplication',
		keywords: ['decision intelligence', 'build vs buy calculator', 'espresso machine cpu', 'repair vs replace hvac', 'tinkering tax']
	},
	{
		title: 'Coffee Equipment Arbitrage Calculator',
		slug: 'coffee-arbitrage',
		href: '/calculators/coffee-arbitrage/',
		status: 'Live',
		accent: 'emerald',
		description:
			'Determine if investing in a premium home espresso setup beats your daily café runs. Real-time cost-per-use calculator.',
		utility: 'Evaluate espresso machine cost-per-use',
		category: 'FinanceApplication',
		keywords: ['coffee arbitrage calculator', 'espresso machine cpu', 'coffee cost calculator']
	},
	{
		title: 'Tech Debt Screen Striker (Repair vs. Replace)',
		slug: 'tech-debt-repair',
		href: '/calculators/tech-debt-repair/',
		status: 'Live',
		accent: 'indigo',
		description:
			'Calculate if repairing a 3-to-5-year-old laptop or phone is a smart fix or a financial liability. Uses the adapted consumer 1,500 index rule.',
		utility: 'Calculate repair vs replace index score',
		category: 'FinanceApplication',
		keywords: ['repair vs replace calculator', 'tech debt screen striker', 'laptop screen repair cost']
	},
	{
		title: 'No-Code Workaround Terminator',
		slug: 'no-code-terminator',
		href: '/calculators/no-code-terminator/',
		status: 'Live',
		accent: 'cyan',
		description:
			'Calculate the hidden tinkering tax of manual workarounds and sheets vs. upgrading to a centralized HubSpot CRM.',
		utility: 'Calculate time tax vs premium software cost',
		category: 'FinanceApplication',
		keywords: ['tinkering tax calculator', 'no-code workaround', 'hubspot crm price']
	},
	{
		title: 'Local GPU vs. Cloud GPU Calculator',
		slug: 'gpu-compute',
		href: '/calculators/gpu-compute/',
		status: 'Live',
		accent: 'violet',
		description:
			'Compare the TCO of building a local deep learning GPU workstation against renting cloud GPU compute instances.',
		utility: 'Evaluate local GPU vs cloud GPU TCO',
		category: 'FinanceApplication',
		keywords: ['gpu compute calculator', 'local rig vs cloud gpu', 'rtx 4090 power cost']
	}
] as const;

export type CalculatorTool = (typeof calculatorTools)[number];

export function getCalculatorSchema(tool: CalculatorTool, site: URL) {
	const url = new URL(tool.href, site).toString();

	return {
		'@context': 'https://schema.org',
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
			url: new URL('/', site).toString()
		}
	};
}

export function getCalculatorBySlug(slug: CalculatorTool['slug']) {
	return calculatorTools.find((tool) => tool.slug === slug);
}
