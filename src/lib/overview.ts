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
	eyebrow: 'Decision tools for your own money',
	headline: 'Run the numbers before you commit.',
	subheadline:
		'Job offers, equity, leases, relocations, expat tax, laptop repairs — even the espresso machine. Every model runs in your browser: no signup, nothing uploaded.',
	mission:
		'Professionals pay for these decisions themselves: job offers, equity, lease exits, relocations, cross-border tax, and the purchases that quietly compound. The tools put a number on each one before the money moves.',
	originStory:
		'Evaluating high-stakes personal and professional trade-offs shouldn\'t be about guessing. Gini Loh builds interactive, data-driven calculators that put the real total cost of ownership on career moves, housing, mobility and major purchases — before you commit.',
	audience: [
		{
			title: 'The Tech Worker',
			description: 'Negotiating an offer, weighing equity against base, or pricing a move to a new city or country.'
		},
		{
			title: 'The Smart Purchaser',
			description: 'Amortising a home espresso machine, or pricing the exact exit cost of a lease before signing it.'
		},
		{
			title: 'The Decision Engineer',
			description: 'Quantifying the tinkering tax, repair-versus-replace, and what a subscription really costs per year.'
		}
	],
	aboutSections: [
		{
			title: 'What Gini Loh Covers',
			body: 'Compensation and career moves, housing and lease exits, relocation and cross-border tax, and cost-per-use arbitrage on the things you buy.'
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

	const originMatch = cleanedContent.match(
		/Evaluating high-stakes professional[\s\S]*?zero hand-waving\./i
	);
	const missionMatch = cleanedContent.match(
		/Our mission is to give tech workers[\s\S]*?rental lease exits\./i
	);

	const audience: AudienceSegment[] = [
		{
			title: 'The Tech Worker',
			description: 'Negotiating an offer, weighing equity against base, or pricing a move to a new city or country.'
		},
		{
			title: 'The Smart Purchaser',
			description: 'Amortising a home espresso machine, or pricing the exact exit cost of a lease before signing it.'
		},
		{
			title: 'The Decision Engineer',
			description: 'Quantifying the tinkering tax, repair-versus-replace, and what a subscription really costs per year.'
		}
	];

	return {
		eyebrow: 'Decision tools for your own money',
		headline: 'Run the numbers before you commit.',
		subheadline:
			'Job offers, equity, leases, relocations, expat tax, laptop repairs — even the espresso machine. Every model runs in your browser: no signup, nothing uploaded.',
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
