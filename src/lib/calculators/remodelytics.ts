import type {
	RemodelyticsBreakdown,
	RemodelyticsInputs,
	RemodelyticsProjectType
} from './types';

const RESALE_RETENTION: Record<RemodelyticsProjectType, number> = {
	kitchen: 0.72,
	bathroom: 0.68,
	siding: 0.82,
	deck: 0.66,
	'garage-door': 0.91,
	hvac: 0.48,
	solar: 0.54,
	adu: 0.64,
	'basement-rental': 0.58
};

const NKBA_CAPS: Partial<Record<RemodelyticsProjectType, number>> = {
	kitchen: 0.15,
	bathroom: 0.1,
	adu: 0.2,
	'basement-rental': 0.18
};

const MATERIAL_MULTIPLIER = {
	standard: 1,
	enhanced: 1.18,
	intricate: 1.38
};

function positive(value: number) {
	return Number.isFinite(value) && value > 0 ? value : 0;
}

function percent(value: number) {
	return positive(value) / 100;
}

function divide(numerator: number, denominator: number) {
	return denominator > 0 ? numerator / denominator : 0;
}

function presentValueOfSavings(
	monthlySavings: number,
	utilityInflationRate: number,
	discountRate: number,
	years = 30
) {
	let total = 0;

	for (let year = 1; year <= years; year += 1) {
		const annualSavings =
			monthlySavings * 12 * (1 + percent(utilityInflationRate)) ** Math.max(year - 1, 0);
		total += annualSavings / (1 + percent(discountRate)) ** year;
	}

	return total;
}

function calculateHearDiscount(inputs: RemodelyticsInputs, localProjectCost: number) {
	const localAmi = positive(inputs.localAmi);
	const income = positive(inputs.householdIncome);

	if (!localAmi || !income) {
		return 0;
	}

	const eligibleCost = Math.min(localProjectCost, 14000);

	if (income < localAmi * 0.8) {
		return eligibleCost;
	}

	if (income <= localAmi * 1.5) {
		return eligibleCost * 0.5;
	}

	return 0;
}

function calculateHomesRebate(inputs: RemodelyticsInputs, localProjectCost: number) {
	const energyReduction = positive(inputs.energyReductionPercent);
	const lowIncome = positive(inputs.localAmi) > 0 && positive(inputs.householdIncome) < inputs.localAmi * 0.8;

	if (energyReduction >= 35) {
		return Math.min(lowIncome ? 8000 : 4000, localProjectCost);
	}

	if (energyReduction >= 20) {
		return Math.min(lowIncome ? 4000 : 2000, localProjectCost);
	}

	if (energyReduction >= 15) {
		return Math.min(localProjectCost * (lowIncome ? 0.8 : 0.5), localProjectCost * energyReduction * 0.01);
	}

	return 0;
}

function calculateSection25c(inputs: RemodelyticsInputs, localProjectCost: number) {
	const eligibleProject =
		inputs.projectType === 'hvac' || inputs.projectType === 'solar' || inputs.projectType === 'siding';

	if (!eligibleProject) {
		return 0;
	}

	return Math.min(localProjectCost * 0.3, inputs.projectType === 'hvac' ? 2000 : 1200);
}

export function calculateRemodelytics(inputs: RemodelyticsInputs): RemodelyticsBreakdown {
	const homeValue = positive(inputs.homeValue);
	const baselineProjectCost = positive(inputs.projectCostBaseline);
	const cciRatio = divide(positive(inputs.cityCostIndex), positive(inputs.baselineCostIndex)) || 1;
	const materialMultiplier = MATERIAL_MULTIPLIER[inputs.materialTier];
	const localProjectCost = baselineProjectCost * cciRatio * materialMultiplier;
	const resalePremium = (RESALE_RETENTION[inputs.projectType] ?? 0.6) * localProjectCost;
	const greenPremiumValue = homeValue * percent(inputs.greenPremiumPercent);
	const immediateAppreciation = resalePremium + greenPremiumValue;
	const pointInTimeRoi = divide(immediateAppreciation - localProjectCost, localProjectCost) * 100;
	const arvProfessional = positive(inputs.compAverageValue);
	const arvSeventyRule = positive(inputs.currentValue) + localProjectCost * 0.7;
	const selectedArv = Math.max(arvProfessional, arvSeventyRule, homeValue);
	const mao = selectedArv * 0.7 - localProjectCost;
	const purchaseBasis = Math.min(positive(inputs.purchasePrice) + localProjectCost, selectedArv);
	const purchaseLtv = divide(positive(inputs.mortgageLoanAmount), purchaseBasis) * 100;
	const refinanceLtv = divide(positive(inputs.mortgageLoanAmount), selectedArv) * 100;
	const cltv =
		divide(positive(inputs.mortgageBalance) + positive(inputs.proposedHelocAmount), selectedArv) * 100;
	const annualNoi = (positive(inputs.grossMonthlyRent) - positive(inputs.monthlyOperatingExpenses)) * 12;
	const annualDebtService = positive(inputs.monthlyDebtService) * 12;
	const cashOnCashRoi =
		divide(annualNoi - annualDebtService, positive(inputs.initialCashOutlay)) * 100;
	const capRate = inputs.projectType === 'adu' ? 0.065 : 0.075;
	const capitalizedIncomeValue = divide(Math.max(annualNoi, 0), capRate);
	const breakevenYears = divide(localProjectCost, Math.max(annualNoi - annualDebtService, 0));
	const hearDiscount = calculateHearDiscount(inputs, localProjectCost);
	const homesRebate = calculateHomesRebate(inputs, localProjectCost);
	const section25cCredit = calculateSection25c(inputs, localProjectCost);
	const efficiencyGain = divide(
		positive(inputs.proposedEfficiency) - positive(inputs.currentEfficiency),
		positive(inputs.proposedEfficiency)
	);
	const monthlyUtilitySavingsYearOne =
		positive(inputs.baselineMonthlyUtilityCost) *
		Math.min(Math.max(efficiencyGain, 0), 0.75);
	const energyNpv =
		presentValueOfSavings(
			monthlyUtilitySavingsYearOne,
			inputs.utilityInflationRate,
			inputs.discountRate
		) -
		(localProjectCost - hearDiscount - homesRebate - section25cCredit);
	const nkbaSpendRatio = divide(localProjectCost, homeValue) * 100;
	const nkbaCap = NKBA_CAPS[inputs.projectType] ?? 0.18;
	const overImprovementRisk =
		nkbaSpendRatio > nkbaCap * 100 * 1.25 ? 'High' : nkbaSpendRatio > nkbaCap * 100 ? 'Moderate' : 'Low';
	const underwritingWarnings = [
		inputs.dtiPercent > 50 ? 'FHA 203(k) DTI exceeds the 50% stress boundary.' : '',
		inputs.dtiPercent > 45 ? 'Conventional HomeStyle DTI exceeds the 45% stress boundary.' : '',
		inputs.diyPercentOfArv > 10 ? 'Owner-DIY scope exceeds 10% of as-completed value.' : '',
		purchaseLtv > 97 ? 'Purchase LTV is above common renovation-loan comfort levels.' : '',
		cltv > 90 ? 'Combined leverage is above a conservative HELOC underwriting limit.' : '',
		overImprovementRisk === 'High'
			? 'Project cost materially exceeds the neighborhood/home-value allocation guardrail.'
			: ''
	].filter(Boolean);

	const resaleScore = Math.min(Math.max(pointInTimeRoi + 100, 0), 150);
	const energyScore = Math.min(Math.max(divide(energyNpv, localProjectCost) * 100 + 80, 0), 150);
	const incomeScore = Math.min(Math.max(cashOnCashRoi * 5 + 70, 0), 150);
	const riskPenalty = overImprovementRisk === 'High' ? 45 : overImprovementRisk === 'Moderate' ? 20 : 0;
	const underwritingScore = Math.max(100 - underwritingWarnings.length * 15, 0);

	return {
		localProjectCost,
		resalePremium,
		immediateAppreciation,
		pointInTimeRoi,
		arvProfessional,
		arvSeventyRule,
		mao,
		purchaseLtv,
		refinanceLtv,
		cltv,
		annualNoi,
		cashOnCashRoi,
		capitalizedIncomeValue,
		breakevenYears,
		hearDiscount,
		homesRebate,
		section25cCredit,
		monthlyUtilitySavingsYearOne,
		energyNpv,
		greenPremiumValue,
		nkbaSpendRatio,
		overImprovementRisk,
		underwritingWarnings,
		engineScores: {
			resale: resaleScore,
			energy: energyScore,
			income: incomeScore,
			risk: Math.max(100 - riskPenalty, 0),
			underwriting: underwritingScore
		}
	};
}
