export type LeasePenaltyMethod = 'fixed' | 'percentage' | 'months';

export interface LeaseBreakInputs {
	monthlyRent: number;
	remainingMonths: number;
	selectedMethod: LeasePenaltyMethod;
	fixedFee: number;
	percentageFee: number;
	monthsFee: number;
	additionalCosts: number;
	securityDeposit: number;
}

export interface LeaseBreakBreakdown {
	fixedPenalty: number;
	percentagePenalty: number;
	monthsPenalty: number;
	selectedMethodPenalty: number;
	basePenalty: number;
	additionalCosts: number;
	securityDepositOffset: number;
	netPenalty: number;
}

export type RemodelyticsEngine =
	| 'resale'
	| 'energy'
	| 'income'
	| 'risk'
	| 'underwriting';

export type RemodelyticsProjectType =
	| 'kitchen'
	| 'bathroom'
	| 'siding'
	| 'deck'
	| 'garage-door'
	| 'hvac'
	| 'solar'
	| 'adu'
	| 'basement-rental';

export type RemodelyticsMaterialTier = 'standard' | 'enhanced' | 'intricate';

export interface RemodelyticsInputs {
	engine: RemodelyticsEngine;
	projectType: RemodelyticsProjectType;
	materialTier: RemodelyticsMaterialTier;
	zipCode: string;
	homeValue: number;
	homeSize: number;
	projectCostBaseline: number;
	cityCostIndex: number;
	baselineCostIndex: number;
	currentValue: number;
	compAverageValue: number;
	purchasePrice: number;
	mortgageLoanAmount: number;
	mortgageBalance: number;
	proposedHelocAmount: number;
	grossMonthlyRent: number;
	monthlyOperatingExpenses: number;
	monthlyDebtService: number;
	initialCashOutlay: number;
	baselineMonthlyUtilityCost: number;
	currentEfficiency: number;
	proposedEfficiency: number;
	utilityInflationRate: number;
	discountRate: number;
	householdIncome: number;
	localAmi: number;
	energyReductionPercent: number;
	dtiPercent: number;
	diyPercentOfArv: number;
	greenPremiumPercent: number;
}

export interface RemodelyticsBreakdown {
	localProjectCost: number;
	resalePremium: number;
	immediateAppreciation: number;
	pointInTimeRoi: number;
	arvProfessional: number;
	arvSeventyRule: number;
	mao: number;
	purchaseLtv: number;
	refinanceLtv: number;
	cltv: number;
	annualNoi: number;
	cashOnCashRoi: number;
	capitalizedIncomeValue: number;
	breakevenYears: number;
	hearDiscount: number;
	homesRebate: number;
	section25cCredit: number;
	monthlyUtilitySavingsYearOne: number;
	energyNpv: number;
	greenPremiumValue: number;
	nkbaSpendRatio: number;
	overImprovementRisk: 'Low' | 'Moderate' | 'High';
	underwritingWarnings: string[];
	engineScores: Record<RemodelyticsEngine, number>;
}

export interface OfferInput {
	name: string;
	cash: {
		baseSalary: number;
		targetBonusPercent: number;
		upfrontCashIncentive: number;
		clawbackMonths: number;
	};
	equity: {
		type: 'PUBLIC_STOCK_UNIT' | 'PRIVATE_STOCK_UNIT' | 'ISO' | 'NSO';
		totalGrantValue: number;
		shareCount: number;
		grantPrice: number;
		currentValue: number;
		vestingYears: number;
		hasOneYearCliff: boolean;
	};
	perks: {
		kMatchPercent: number;
		kMatchCapPercent: number;
		monthlyHealthPremium: number;
		esppContributionPercent: number;
		esppDiscountPercent: number;
		unusedPtoDays: number;
		annualWorkingDays: number;
	};
}

export interface TotalCompGlobalInputs {
	taxState: string;
	filingStatus: 'single' | 'married';
	growthAssumption: number;
	autoExercise: boolean;
	useManualTax: boolean;
	manualTaxRate: number;
}

export interface YearlyBreakdown {
	year: number;
	baseCash: number;
	bonusCash: number;
	liquidStockUnits: number;
	perksValue: number;
	taxDrag: number;
	purchaseCost: number;
	healthPremium: number;
	netSpendableCash: number;
	paperLtip: number;
	isClawbackRisk: boolean;
	clawbackAmount: number;
	rsuTaxShortfall: number;
	mtrFed: number;
}

export interface OfferBreakdownSummary {
	yearly: YearlyBreakdown[];
	total4YearLiquidity: number;
	totalPaperValue: number;
	totalOutofPocketDrag: number;
	exitReadinessNumber: number;
}
