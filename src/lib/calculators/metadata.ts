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
