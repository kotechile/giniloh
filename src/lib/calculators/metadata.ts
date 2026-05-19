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
