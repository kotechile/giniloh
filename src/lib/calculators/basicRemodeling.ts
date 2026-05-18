import type {
	BasicRemodelingBreakdown,
	BasicRemodelingInputs,
	BasicRecommendation,
	EnjoymentLevel
} from './basicRemodelingTypes';

const ENJOYMENT_WEIGHT: Record<EnjoymentLevel, number> = {
	'very-low': 0,
	low: 0.25,
	medium: 0.5,
	high: 0.75,
	'very-high': 1
};

function positive(value: number) {
	return Number.isFinite(value) && value > 0 ? value : 0;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function divide(numerator: number, denominator: number) {
	return denominator > 0 ? numerator / denominator : 0;
}

function getRecommendation(
	decisionScore: number,
	resaleRecovery: number,
	yearsStaying: number,
	enjoymentWeight: number
): BasicRecommendation {
	if (decisionScore >= 70 || (resaleRecovery >= 0.8 && yearsStaying >= 5)) {
		return 'worth-it';
	}

	if (decisionScore < 45 || (resaleRecovery < 0.35 && yearsStaying <= 3 && enjoymentWeight <= 0.5)) {
		return 'skip';
	}

	return 'maybe';
}

function getDecisionNotes(
	recommendation: BasicRecommendation,
	resaleRecovery: number,
	yearsStaying: number,
	paybackYears: number | null
) {
	if (recommendation === 'worth-it') {
		return [
			"You're likely staying long enough to get both daily use and meaningful value back.",
			resaleRecovery >= 0.8
				? 'Your resale estimate suggests this project recovers a strong share of its cost.'
				: 'Even without full resale recovery, the combined savings and lifestyle case is strong.',
			paybackYears && paybackYears <= yearsStaying
				? 'Your annual savings could realistically pay back the project during your planned stay.'
				: 'This still looks reasonable even if the payoff is driven more by value and enjoyment than pure savings.'
		];
	}

	if (recommendation === 'skip') {
		return [
			'This looks hard to justify financially with the current assumptions.',
			yearsStaying <= 3
				? 'A short stay horizon makes it tough to recover enough value.'
				: 'The likely recovery and savings do not appear strong enough relative to cost.',
			'Consider lowering scope, cutting cost, or waiting until your timeline is longer.'
		];
	}

	return [
		'This sits in the middle and depends heavily on how realistic your resale estimate is.',
		yearsStaying >= 5
			? 'A longer stay makes the project easier to justify if the lifestyle benefit matters to you.'
			: 'If your timeline changes or your costs come down, this could move closer to worth it.',
		'This is not a clear financial win, but it may still be a good personal decision.'
	];
}

export function calculateBasicRemodeling(inputs: BasicRemodelingInputs): BasicRemodelingBreakdown {
	const projectCost = positive(inputs.projectCost);
	const estimatedResaleLift = positive(inputs.estimatedResaleLift);
	const yearsStaying = clamp(Math.floor(positive(inputs.yearsStaying)), 0, 20);
	const maintenanceSavingsAnnual = positive(inputs.maintenanceSavingsAnnual);
	const enjoymentWeight = ENJOYMENT_WEIGHT[inputs.enjoymentLevel];

	const resaleRecovery = divide(estimatedResaleLift, projectCost);
	const staySavings = maintenanceSavingsAnnual * yearsStaying;
	const enjoymentStayMultiplier = Math.min(yearsStaying / 10, 1);
	const enjoymentCredit = projectCost * enjoymentWeight * enjoymentStayMultiplier;
	const effectiveEnjoymentValue = enjoymentCredit * 0.35;
	const totalRealizedValue = estimatedResaleLift + staySavings + effectiveEnjoymentValue;
	const netValue = totalRealizedValue - projectCost;
	const paybackYears = maintenanceSavingsAnnual > 0 ? projectCost / maintenanceSavingsAnnual : null;

	const resaleScore = clamp(resaleRecovery * 100, 0, 100);
	const stayScore = clamp((yearsStaying / 10) * 100, 0, 100);
	const savingsCoverage = divide(staySavings, projectCost);
	const savingsScore = clamp(savingsCoverage * 100, 0, 100);
	const enjoymentScore = enjoymentWeight * 100;
	const decisionScore =
		resaleScore * 0.45 + stayScore * 0.2 + savingsScore * 0.15 + enjoymentScore * 0.2;

	const recommendation = getRecommendation(
		decisionScore,
		resaleRecovery,
		yearsStaying,
		enjoymentWeight
	);

	return {
		resaleRecovery,
		staySavings,
		effectiveEnjoymentValue,
		totalRealizedValue,
		netValue,
		paybackYears,
		decisionScore,
		recommendation,
		decisionNotes: getDecisionNotes(recommendation, resaleRecovery, yearsStaying, paybackYears)
	};
}
