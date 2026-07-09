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
	eyebrow: 'Integrated career and wealth systems',
	headline: 'Engineer Your Money. Quantify Your Decisions.',
	subheadline:
		'Gini Loh connects compensation strategy, automation, and investing so ambitious professionals can earn more, keep more, and build a life with less friction.',
	mission:
		'Create one practical roadmap for professionals who want bigger paychecks, smarter portfolios, and a more intentional life.',
	originStory:
		'The front end is ready for a richer brand narrative once giniloh_overview.md is available. For now, this copy keeps the positioning aligned with the project mission from AGENTS.md.',
	audience: [
		{
			title: 'Ambitious professionals',
			description: 'Readers growing their income and looking for a better capital allocation strategy.'
		},
		{
			title: 'System builders',
			description: 'People who want to use automation, AI, and process design to buy back time.'
		},
		{
			title: 'Strategic decision-makers',
			description: 'Readers evaluating trade-offs across work, money, property, and long-term optionality.'
		}
	],
	aboutSections: [
		{
			title: 'What Gini Loh Covers',
			body: 'Career growth, investing, operating systems, and decision-making frameworks built for modern professionals.'
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

	const headlineMatch = cleanedContent.match(/Engineer Your Money\.\s*Quantify Your Decisions/i);
	const originMatch = cleanedContent.match(
		/The path to financial freedom[\s\S]*?We built Gini Loh to be the resource we wished we had\.[\s\S]*?fulfilling life\./i
	);
	const missionMatch = cleanedContent.match(
		/Our mission is to give high-potential professionals[\s\S]*?24\/7 networking robot\./i
	);

	const audience: AudienceSegment[] = [
		{
			title: 'The go-getter',
			description: 'Ready to negotiate the next offer for maximum compensation and long-term leverage.'
		},
		{
			title: 'System builder',
			description: 'Looking to automate saving, investing, retirement contributions, and day-to-day execution.'
		},
		{
			title: 'Aspiring leader',
			description: 'Building a career through intentional skill-stacking, promotion strategy, and better decisions.'
		}
	];

	return {
		eyebrow: 'Data-driven decisions for ambitious professionals',
		headline: headlineMatch?.[0] ?? FALLBACK_OVERVIEW.headline,
		subheadline:
			'Integrated career strategy and financial operating systems for people who want more income, smarter portfolios, and a life with less chaos.',
		mission: cleanTextBlock(missionMatch?.[0] ?? FALLBACK_OVERVIEW.mission),
		originStory: cleanTextBlock(originMatch?.[0] ?? FALLBACK_OVERVIEW.originStory),
		audience,
		aboutSections: [
			{
				title: 'Why the Site Exists',
				body: cleanTextBlock(
					originMatch?.[0] ??
						'Gini Loh closes the gap between career advice and financial strategy so readers can connect higher income with better capital deployment.'
				)
			},
			{
				title: 'The Working Thesis',
				body: cleanTextBlock(
					missionMatch?.[0] ??
						'The site is built to help readers earn more, keep more, and grow more by using integrated systems instead of disconnected advice.'
				)
			}
		]
	} satisfies OverviewContent;
}

export async function getOverviewContent() {
	overviewCache ??= loadOverview();
	return overviewCache;
}
