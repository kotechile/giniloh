import type { OfferInput, TotalCompGlobalInputs, YearlyBreakdown, OfferBreakdownSummary } from './types';

// 2025/2026 Progressive Federal Income Tax Brackets
interface TaxBracket {
	limit: number;
	rate: number;
}

const FEDERAL_BRACKETS_SINGLE: TaxBracket[] = [
	{ limit: 11600, rate: 0.10 },
	{ limit: 47150, rate: 0.12 },
	{ limit: 100525, rate: 0.22 },
	{ limit: 191950, rate: 0.24 },
	{ limit: 243725, rate: 0.32 },
	{ limit: 609350, rate: 0.35 },
	{ limit: Infinity, rate: 0.37 }
];

const FEDERAL_BRACKETS_MARRIED: TaxBracket[] = [
	{ limit: 23200, rate: 0.10 },
	{ limit: 94300, rate: 0.12 },
	{ limit: 201050, rate: 0.22 },
	{ limit: 383900, rate: 0.24 },
	{ limit: 487450, rate: 0.32 },
	{ limit: 1218700, rate: 0.35 },
	{ limit: Infinity, rate: 0.37 }
];

function calculateFederalTax(income: number, status: 'single' | 'married'): number {
	if (income <= 0) return 0;
	const brackets = status === 'single' ? FEDERAL_BRACKETS_SINGLE : FEDERAL_BRACKETS_MARRIED;
	let tax = 0;
	let prevLimit = 0;

	for (const bracket of brackets) {
		if (income > bracket.limit) {
			tax += (bracket.limit - prevLimit) * bracket.rate;
			prevLimit = bracket.limit;
		} else {
			tax += (income - prevLimit) * bracket.rate;
			break;
		}
	}
	return tax;
}

function getStateTaxRate(state: string): number {
	switch (state.toUpperCase()) {
		case 'CA':
			return 0.093; // 9.3% representative flat rate
		case 'NY':
			return 0.065; // 6.5% representative flat rate
		case 'MD':
			return 0.0475; // 4.75% flat rate
		case 'TX':
		case 'WA':
			return 0.0; // 0% state income tax
		default:
			return 0.05; // 5% representative flat rate for other states
	}
}

function sanitizeNumber(value: number): number {
	return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateOfferBreakdown(
	offer: OfferInput,
	globalInputs: TotalCompGlobalInputs
): OfferBreakdownSummary {
	const baseSalary = sanitizeNumber(offer.cash.baseSalary);
	const targetBonusPercent = sanitizeNumber(offer.cash.targetBonusPercent);
	const upfrontCashIncentive = sanitizeNumber(offer.cash.upfrontCashIncentive);
	const clawbackMonths = sanitizeNumber(offer.cash.clawbackMonths);

	const equityType = offer.equity.type;
	const totalGrantValue = sanitizeNumber(offer.equity.totalGrantValue);
	const shareCount = sanitizeNumber(offer.equity.shareCount);
	const grantPrice = sanitizeNumber(offer.equity.grantPrice);
	const currentValue = sanitizeNumber(offer.equity.currentValue);
	const vestingYears = sanitizeNumber(offer.equity.vestingYears) || 4;

	const kMatchPercent = sanitizeNumber(offer.perks.kMatchPercent);
	const kMatchCapPercent = sanitizeNumber(offer.perks.kMatchCapPercent);
	const monthlyHealthPremium = sanitizeNumber(offer.perks.monthlyHealthPremium);
	const esppContributionPercent = sanitizeNumber(offer.perks.esppContributionPercent);
	const esppDiscountPercent = sanitizeNumber(offer.perks.esppDiscountPercent);

	const yearly: YearlyBreakdown[] = [];
	const yearsToProject = 4;

	for (let year = 1; year <= yearsToProject; year++) {
		// 1. Cash Layer
		const baseCash = baseSalary;
		const bonusCash = baseSalary * (targetBonusPercent / 100) + (year === 1 ? upfrontCashIncentive : 0);
		
		// Clawback Risk evaluation
		const isClawbackRisk = year === 1 && upfrontCashIncentive > 0 && clawbackMonths > 0;
		const clawbackAmount = isClawbackRisk ? upfrontCashIncentive : 0;

		// 2. Equity Layer & Vesting
		let yearVestingShares = 0;
		if (year <= vestingYears) {
			yearVestingShares = shareCount / vestingYears;
		}

		// Apply growth to stock/current values
		const growthMultiplier = Math.pow(1 + globalInputs.growthAssumption, year - 1);
		
		// Stock Units are typically defined by grant value. If shareCount is provided, use shareCount * Current Value.
		let unadjustedVestingEquityValue = 0;
		if (equityType === 'PUBLIC_STOCK_UNIT' || equityType === 'PRIVATE_STOCK_UNIT') {
			if (shareCount > 0 && currentValue > 0) {
				unadjustedVestingEquityValue = (shareCount * currentValue) / vestingYears;
			} else {
				unadjustedVestingEquityValue = totalGrantValue / vestingYears;
			}
		} else {
			// ISO/NSO Option value (shares * Current Value)
			unadjustedVestingEquityValue = yearVestingShares * currentValue;
		}

		const vestingEquityValue = unadjustedVestingEquityValue * growthMultiplier;

		let liquidStockUnits = 0;
		let paperLtip = 0;
		let purchaseCost = 0;

		if (equityType === 'PUBLIC_STOCK_UNIT') {
			liquidStockUnits = vestingEquityValue;
		} else if (equityType === 'PRIVATE_STOCK_UNIT') {
			paperLtip = vestingEquityValue;
		} else {
			// ISO or NSO Options
			paperLtip = vestingEquityValue;
			if (year <= vestingYears) {
				purchaseCost = yearVestingShares * grantPrice;
			}
		}

		// 3. Perks Layer
		const kMatchAmount = baseSalary * (kMatchPercent / 100) * (kMatchCapPercent / 100);
		
		// ESPP calculations
		let esppYield = 0;
		if (esppContributionPercent > 0 && esppDiscountPercent > 0) {
			const cappedContribution = Math.min(esppContributionPercent, 15); // ESPP max 15% contribution
			const contributionAmount = baseSalary * (cappedContribution / 100);
			const discountRate = esppDiscountPercent / 100;
			esppYield = contributionAmount * (discountRate / (1 - discountRate));
		}
		
		const perksValue = kMatchAmount + esppYield;

		// 4. Tax Drag Calculations (Cash + Vested Liquid Equity)
		const taxableIncome = baseCash + bonusCash + liquidStockUnits;
		let taxDrag = 0;

		if (globalInputs.useManualTax) {
			taxDrag = taxableIncome * (globalInputs.manualTaxRate / 100);
		} else {
			const fedTax = calculateFederalTax(taxableIncome, globalInputs.filingStatus);
			const stateRate = getStateTaxRate(globalInputs.taxState);
			const stateTax = taxableIncome * stateRate;
			taxDrag = fedTax + stateTax;
		}

		// 5. Out of pocket cash costs
		const healthPremium = monthlyHealthPremium * 12;
		
		// Subtract option purchase cost if auto-exercise is enabled
		const subtractedPurchaseCost = globalInputs.autoExercise ? purchaseCost : 0;

		// Net Spendable Cash Flow
		const netSpendableCash = baseCash + bonusCash + liquidStockUnits + esppYield - taxDrag - subtractedPurchaseCost - healthPremium;

		yearly.push({
			year,
			baseCash,
			bonusCash,
			liquidStockUnits,
			perksValue,
			taxDrag,
			purchaseCost,
			healthPremium,
			netSpendableCash,
			paperLtip,
			isClawbackRisk,
			clawbackAmount
		});
	}

	const total4YearLiquidity = yearly.reduce((sum, y) => sum + y.netSpendableCash, 0);
	const totalPaperValue = yearly.reduce((sum, y) => sum + y.paperLtip, 0);
	
	// Out-of-pocket drag is always purchase cost + health premiums
	const totalOutofPocketDrag = yearly.reduce((sum, y) => sum + y.purchaseCost + y.healthPremium, 0);

	return {
		yearly,
		total4YearLiquidity,
		totalPaperValue,
		totalOutofPocketDrag
	};
}
