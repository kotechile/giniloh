import { readFile } from 'node:fs/promises';

import { resolveOverviewPath } from './source-files';

export interface AudienceSegment {
	title: string;
	description: string;
}

export interface OverviewContent {
	eyebrow: string;
	headline: string;
	subheadline: string;
	mission: string;
	originStory: string;
	audience: AudienceSegment[];
	aboutSections: Array<{ title: string; body: string }>;
}

const FALLBACK_OVERVIEW: OverviewContent = {
	eyebrow: 'Decision Intelligence for Tech Workers',
	headline: 'Decision Engine for Expensive Choices',
	subheadline:
		'Total Cost of Ownership (TCO) calculators for smart buying decisions. Quantify your hardware, compensation, and lifestyle trade-offs with mathematical clarity.',
	mission:
		'Our mission is to give tech workers the tools to model, quantify, and decide on high-stakes choices—from GPU workstation builds to equity packages and rental lease exits.',
	originStory:
		'Evaluating high-stakes professional and purchasing trade-offs shouldn\'t be about guessing. Gini Loh builds interactive, data-driven calculators to quantify the real total cost of ownership (TCO) of tech hardware, compensation offers, lease breaks, and operational investments.',
	audience: [
		{
			title: 'The Tech Worker',
			description: 'Evaluating RSU compensation packages, cloud GPU rentals vs. workstation buys, or remote relocations.'
		},
		{
			title: 'The Smart Purchaser',
			description: 'Amortizing home espresso machines or breaking rental leases by calculating the exact exit cost.'
		},
		{
			title: 'The Decision Engineer',
			description: 'Quantifying workflow tinkering taxes, tech repair-vs-replace metrics, and software build-vs-buy TCO.'
		}
	],
	aboutSections: [
		{
			title: 'What Gini Loh Covers',
			body: 'Hardware & Compute Decisions, Compensation Modeling, Software TCO, and lifestyle cost-per-use arbitrage.'
		}
	]
};

let overviewCache: Promise<OverviewContent> | undefined;

function cleanTextBlock(value: string) {
	return value.replace(/\s+/g, ' ').trim();
}

async function loadOverview() {
	const overviewPath = resolveOverviewPath();
	if (!overviewPath) {
		return FALLBACK_OVERVIEW;
	}

	const rawContent = await readFile(overviewPath, 'utf8');
	const cleanedContent = rawContent.replace(/\r/g, '');

	const headlineMatch = cleanedContent.match(/Decision Engine for Expensive Choices/i);
	const originMatch = cleanedContent.match(
		/Evaluating high-stakes professional[\s\S]*?zero hand-waving\./i
	);
	const missionMatch = cleanedContent.match(
		/Our mission is to give tech workers[\s\S]*?rental lease exits\./i
	);

	const audience: AudienceSegment[] = [
		{
			title: 'The Tech Worker',
			description: 'Evaluating RSU compensation packages, cloud GPU rentals vs. workstation buys, or remote relocations.'
		},
		{
			title: 'The Smart Purchaser',
			description: 'Amortizing home espresso machines or breaking rental leases by calculating the exact exit cost.'
		},
		{
			title: 'The Decision Engineer',
			description: 'Quantifying workflow tinkering taxes, tech repair-vs-replace metrics, and software build-vs-buy TCO.'
		}
	];

	return {
		eyebrow: 'Decision Intelligence for Tech Workers',
		headline: headlineMatch?.[0] ?? FALLBACK_OVERVIEW.headline,
		subheadline:
			'Total Cost of Ownership (TCO) calculators for smart buying decisions. Quantify your hardware, compensation, and lifestyle trade-offs.',
		mission: cleanTextBlock(missionMatch?.[0] ?? FALLBACK_OVERVIEW.mission),
		originStory: cleanTextBlock(originMatch?.[0] ?? FALLBACK_OVERVIEW.originStory),
		audience,
		aboutSections: [
			{
				title: 'Why the Site Exists',
				body: cleanTextBlock(
					originMatch?.[0] ??
						'Gini Loh closes the gap between complex purchases and career choices, replacing gut feelings with rigorous TCO engines.'
				)
			},
			{
				title: 'The Working Thesis',
				body: cleanTextBlock(
					missionMatch?.[0] ??
						'Ambitious professionals benefit from interactive, widgetized modeling of their most expensive professional and personal choices.'
				)
			}
		]
	} satisfies OverviewContent;
}

export async function getOverviewContent() {
	overviewCache ??= loadOverview();
	return overviewCache;
}
