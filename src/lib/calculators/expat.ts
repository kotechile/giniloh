import { COUNTRY_PROFILES, type CountryProfile, type HostCountryId } from './expat-countries';

export interface ExpatInputs {
	// Destination Host Country
	hostCountryId: HostCountryId;

	// Home Country (Stay) Baseline
	homeBaseSalary: number;
	homeBonus: number;
	homeEquityAnnual: number;
	homeSpouseIncome: number; // Spousal income in Home (Stay) scenario
	homeStateTaxRate: number; // e.g. 0.05 (5%) or 0.0 (TX/FL) or 0.093 (CA)
	
	// Host Country (Move) Compensation (in Host Currency)
	hostBaseSalary: number;
	hostBonus: number;
	hostEquityAnnual: number;

	// Spousal Income in Host Move Scenario
	spouseIncomeType: 'none' | 'remote' | 'local';
	spouseIncomeAmount: number;

	// Corporate Relocation Subsidies & Allowances (in Host Currency / USD for moving)
	colaMonthly: number;
	housingAllowanceMonthly: number;
	tuitionStipendAnnual: number;
	movingReimbursementOneTime: number;

	// Tax Policy & Coverage Model
	taxPolicy: 'laissez-faire' | 'tax-equalization' | 'tax-protection';

	// Host Tax Logic & Investments
	useSpecialRegime: boolean;
	extendRegimeToDependents: boolean;
	foreignInvestmentIncome: number; // Global investment income (dividends, interest, cap gains) in USD
	purchasedHomeInHost: boolean;
	cadastralValue: number; // Host currency

	// Home Tax Logic (U.S. Obligations)
	isUSCitizen: boolean;
	taxReliefMethod: 'auto' | 'feie' | 'ftc';
	usFilingStatus: 'single' | 'married';

	// Social Security & Totalization
	assignmentDurationYears: number;

	// Cost of Living & Local Expenses - Home Baseline (USD)
	homeRentOrMortgageMonthly: number; // USD
	homeTuitionMonthly: number; // USD
	homeHealthInsuranceMonthly: number; // USD
	discretionarySpendMonthly: number; // USD baseline

	// Cost of Living & Local Expenses - Host Destination (Host Currency)
	hostRentMonthly: number; // Host Currency
	privateTuitionMonthly: number; // Host Currency
	privateHealthInsuranceMonthly: number; // Host Currency
	hostColIndexRatio: number; // e.g. 0.85 means host is 15% cheaper

	// Foreign Exchange & Liabilities
	fxRateHostToUsd: number; // USD per 1 Host Currency (e.g. 1.10 for EUR, 0.00105 for CLP)
	homeLiabilitiesUsdMonthly: number; // USD obligations (US mortgage, student loan, 401k)
	stayOnlyLiabilitiesUsdMonthly: number; // USD obligations paid only in Stay (e.g. U.S. car lease to be terminated)
	hostLiabilitiesMonthly: number; // Host Currency obligations (Local car lease, local loan/mortgage)
	expectedInvestmentReturnRate: number; // e.g. 0.07 (7%)
}

export interface YearProjection {
	year: number;
	stayCumulativeWealth: number;
	moveCumulativeWealth: number;
	wealthDelta: number;
}

export interface ExpatBreakdown {
	// Selected Country Info
	countryName: string;
	currencySymbol: string;
	currencyCode: string;

	// Stay Scenario
	stayEarnedIncome: number;
	stayInvestmentIncome: number;
	stayGrossIncome: number;
	stayTaxes: number;
	stayNetIncome: number;
	stayFixedExpenses: number;
	stayLivingExpenses: number;
	stayHomeLiabilities: number;
	stayAnnualFreeCashFlow: number;

	// Move Scenario
	moveBaseGross: number; // Total Earned Compensation (Primary + Spousal)
	moveAllowancesTotal: number; // Subsidies & Allowances
	moveInvestmentIncome: number; // Global Investment Income
	moveTotalGross: number; // Total Household Gross Income
	hostTaxBase: number;
	hostTaxPaid: number;
	hostTaxDetailsNote: string;
	imputedRentalTaxPaid: number;
	homeTaxPaid: number;
	actualTotalTaxesPaid: number;
	effectiveEmployeeTaxBurden: number;
	employerTaxReimbursement: number;
	moveNetIncome: number;

	// Expenses & Liabilities
	moveLivingExpenses: number;
	moveExpatFixedExpenses: number;
	moveHomeLiabilities: number;
	moveHostLiabilitiesUsd: number;
	moveTotalLiabilitiesUsd: number;
	fxDepreciationImpactUsd: number;
	moveAnnualFreeCashFlow: number;

	// Net Comparison
	annualCashFlowDelta: number;
	fiveYearWealthStay: number;
	fiveYearWealthMove: number;
	fiveYearWealthDelta: number;
	breakEvenMonths: number;

	// Details & Warnings
	feieUsedAmount: number;
	ftcUsedAmount: number;
	optimalTaxRelief: 'FEIE' | 'FTC' | 'N/A';
	isDetachedWorkerActive: boolean;
	totalizationSocialSecurityModel: string;
	warnings: string[];

	// Detailed Sub-components for Walkdown Table
	stayFedTaxEarned: number;
	stayFedTaxInv: number;
	stayStateTax: number;
	stayFicaTax: number;

	moveBaseSalaryUsd: number;
	moveBonusUsd: number;
	moveEquityAnnualUsd: number;
	moveSpouseIncomeUsd: number;

	moveColaUsd: number;
	moveHousingUsd: number;
	moveTuitionUsd: number;

	stayRentUsd: number;
	stayTuitionUsd: number;
	stayHealthInsuranceUsd: number;
	stayDiscretionaryUsd: number;

	moveRentUsd: number;
	moveTuitionUsd: number;
	moveHealthInsuranceUsd: number;
	moveDiscretionaryUsd: number;

	moveSocialSecurityTaxUsd: number;
	stayOnlyLiabilitiesUsd: number;
}

/**
 * Standard US Federal Tax approximation for 2026
 */
function calculateUSFederalTax(taxableIncome: number, filingStatus: 'single' | 'married'): number {
	if (taxableIncome <= 0) return 0;
	const stdDeduction = filingStatus === 'married' ? 30000 : 15000;
	const netTaxable = Math.max(0, taxableIncome - stdDeduction);

	const brackets = filingStatus === 'married'
		? [
				{ limit: 23200, rate: 0.10 },
				{ limit: 94300, rate: 0.12 },
				{ limit: 201050, rate: 0.22 },
				{ limit: 383900, rate: 0.24 },
				{ limit: 487450, rate: 0.32 },
				{ limit: 731200, rate: 0.35 },
				{ limit: Infinity, rate: 0.37 }
		  ]
		: [
				{ limit: 11600, rate: 0.10 },
				{ limit: 47150, rate: 0.12 },
				{ limit: 100525, rate: 0.22 },
				{ limit: 191950, rate: 0.24 },
				{ limit: 243725, rate: 0.32 },
				{ limit: 609350, rate: 0.35 },
				{ limit: Infinity, rate: 0.37 }
		  ];

	let tax = 0;
	let prevLimit = 0;

	for (const b of brackets) {
		if (netTaxable > prevLimit) {
			const portion = Math.min(netTaxable - prevLimit, b.limit - prevLimit);
			tax += portion * b.rate;
			prevLimit = b.limit;
		} else {
			break;
		}
	}
	return tax;
}

export function calculateExpatFinancials(inputs: ExpatInputs): ExpatBreakdown {
	const warnings: string[] = [];
	const country: CountryProfile = COUNTRY_PROFILES[inputs.hostCountryId] || COUNTRY_PROFILES.spain;
	const fx = Math.max(0.00001, inputs.fxRateHostToUsd);

	// --- 1. STAY SCENARIO (Home Baseline in USD) ---
	const stayEarnedIncome = inputs.homeBaseSalary + inputs.homeBonus + inputs.homeEquityAnnual + inputs.homeSpouseIncome;
	const stayInvestmentIncome = inputs.foreignInvestmentIncome;
	const stayGrossIncome = stayEarnedIncome + stayInvestmentIncome;
	
	const stayFedTaxEarned = calculateUSFederalTax(stayEarnedIncome, inputs.usFilingStatus);
	const stayFedTaxInv = stayInvestmentIncome * 0.15; // 15% standard US capital gains / qualified dividend tax
	const stayStateTax = stayEarnedIncome * inputs.homeStateTaxRate;
	const stayFicaTax = Math.min(stayEarnedIncome, 168600) * 0.062 + stayEarnedIncome * 0.0145; // 7.65% FICA
	const stayTaxes = stayFedTaxEarned + stayFedTaxInv + stayStateTax + stayFicaTax;
	
	const stayNetIncome = stayGrossIncome - stayTaxes;

	const stayFixedExpenses = (inputs.homeTuitionMonthly + inputs.homeHealthInsuranceMonthly) * 12;
	const stayLivingExpenses = (inputs.homeRentOrMortgageMonthly + inputs.discretionarySpendMonthly) * 12 + stayFixedExpenses;
	const stayOnlyLiabilitiesUsd = inputs.stayOnlyLiabilitiesUsdMonthly * 12;
	const stayHomeLiabilities = (inputs.homeLiabilitiesUsdMonthly + inputs.stayOnlyLiabilitiesUsdMonthly) * 12;
	const stayAnnualFreeCashFlow = stayNetIncome - stayLivingExpenses - stayHomeLiabilities;

	// --- 2. MOVE SCENARIO (Host Assignment - Inputs in Host Currency converted to USD for comparison) ---
	const hostBaseSalaryUsd = inputs.hostBaseSalary * fx;
	const hostBonusUsd = inputs.hostBonus * fx;
	const hostEquityAnnualUsd = inputs.hostEquityAnnual * fx;

	const colaUsd = inputs.colaMonthly * 12 * fx;
	const housingAllowanceUsd = inputs.housingAllowanceMonthly * 12 * fx;
	const tuitionStipendUsd = inputs.tuitionStipendAnnual * fx;

	const moveAllowancesTotalUsd = colaUsd + housingAllowanceUsd + tuitionStipendUsd;
	
	const spousalLocalIncomeUsd = inputs.spouseIncomeType === 'local' ? inputs.spouseIncomeAmount * fx : 0;
	const spousalRemoteIncomeUsd = inputs.spouseIncomeType === 'remote' ? inputs.spouseIncomeAmount : 0;
	const totalSpouseIncomeMoveUsd = spousalLocalIncomeUsd + spousalRemoteIncomeUsd;

	// Move Gross Earned Compensation (Primary Base + Bonus + Equity + Spousal Income)
	const moveBaseGrossUsd = hostBaseSalaryUsd + hostBonusUsd + hostEquityAnnualUsd + totalSpouseIncomeMoveUsd;
	const moveInvestmentIncomeUsd = inputs.foreignInvestmentIncome;

	// Total Household Gross Income = Gross Earned Compensation + Subsidies & Allowances + Investment Income
	const moveTotalGrossUsd = moveBaseGrossUsd + moveAllowancesTotalUsd + moveInvestmentIncomeUsd;

	// --- Host Taxes (Modular calculation via Country Profile) ---
	const hostEarnedIncomeHostCurr = inputs.hostBaseSalary + inputs.hostBonus + (inputs.colaMonthly + inputs.housingAllowanceMonthly) * 12 + inputs.tuitionStipendAnnual + (inputs.spouseIncomeType === 'local' ? inputs.spouseIncomeAmount : 0);
	
	const hostTaxResult = country.calculateHostTax(hostEarnedIncomeHostCurr, inputs.useSpecialRegime, inputs.foreignInvestmentIncome, fx);
	const hostTaxPaidUsd = hostTaxResult.taxAmountHostCurr * fx;
	const hostTaxDetailsNote = hostTaxResult.detailsNote;

	// Imputed rental income tax if applicable
	let imputedRentalTaxPaidUsd = 0;
	if (inputs.purchasedHomeInHost && inputs.cadastralValue > 0) {
		const imputedIncomeHostCurr = inputs.cadastralValue * 0.015;
		const taxRate = inputs.useSpecialRegime ? 0.24 : 0.24;
		imputedRentalTaxPaidUsd = imputedIncomeHostCurr * taxRate * fx;
		warnings.push(`${country.name} Imputed Rental Income Tax applies (${country.currencySymbol}${(imputedIncomeHostCurr * taxRate).toFixed(0)} / ~$${imputedRentalTaxPaidUsd.toFixed(0)} USD per year).`);
	}

	// --- Home Taxes (US Obligations) ---
	let homeTaxPaidUsd = 0;
	let feieUsedAmount = 0;
	let ftcUsedAmount = 0;
	let optimalTaxRelief: 'FEIE' | 'FTC' | 'N/A' = 'N/A';

	if (inputs.isUSCitizen) {
		const feieCap2026 = 126500;
		const eligibleEarnedIncomeUsd = (inputs.hostBaseSalary + inputs.hostBonus) * fx + moveAllowancesTotalUsd;

		// Route A: FEIE
		const feieExclusion = Math.min(eligibleEarnedIncomeUsd, feieCap2026);
		const remainingUSIncomeFeie = Math.max(0, moveTotalGrossUsd - feieExclusion);
		const usTaxWithFeie = calculateUSFederalTax(remainingUSIncomeFeie, inputs.usFilingStatus);

		// Route B: FTC (Foreign Tax Credit)
		const usTaxGrossGlobal = calculateUSFederalTax(moveTotalGrossUsd, inputs.usFilingStatus);
		const ftcCredit = Math.min(usTaxGrossGlobal, hostTaxPaidUsd);
		const usTaxWithFtc = Math.max(0, usTaxGrossGlobal - ftcCredit);

		if (inputs.taxReliefMethod === 'feie') {
			homeTaxPaidUsd = usTaxWithFeie;
			feieUsedAmount = feieExclusion;
			optimalTaxRelief = 'FEIE';
		} else if (inputs.taxReliefMethod === 'ftc') {
			homeTaxPaidUsd = usTaxWithFtc;
			ftcUsedAmount = ftcCredit;
			optimalTaxRelief = 'FTC';
		} else {
			// Auto Selection
			if (usTaxWithFeie <= usTaxWithFtc) {
				homeTaxPaidUsd = usTaxWithFeie;
				feieUsedAmount = feieExclusion;
				optimalTaxRelief = 'FEIE';
			} else {
				homeTaxPaidUsd = usTaxWithFtc;
				ftcUsedAmount = ftcCredit;
				optimalTaxRelief = 'FTC';
			}
		}

		if (spousalRemoteIncomeUsd > 0) {
			warnings.push('Spousal remote income (US-sourced) remains fully taxable by the US and does not qualify for FEIE.');
		}
	}

	// --- Social Security & Totalization ---
	const isDetachedWorkerActive = inputs.assignmentDurationYears <= 5;
	const ssResult = country.calculateHostSocialSecurity(hostEarnedIncomeHostCurr, isDetachedWorkerActive, inputs.useSpecialRegime, fx);
	
	let socialSecurityTaxUsd = 0;
	let totalizationSocialSecurityModel = ssResult.detailsNote;

	if (isDetachedWorkerActive) {
		socialSecurityTaxUsd = Math.min(moveTotalGrossUsd, 168600) * 0.062 + moveTotalGrossUsd * 0.0145;
		totalizationSocialSecurityModel = `U.S. FICA Active (${country.name} SS Exempt via Totalization ≤5 Yrs)`;
	} else {
		socialSecurityTaxUsd = ssResult.ssAmountHostCurr * fx;
		if (inputs.assignmentDurationYears > 5) {
			warnings.push(`Assignment duration exceeds 5 years. Totalization detached worker status expires; ${country.name} Social Security applies.`);
		}
	}

	const actualTotalTaxesPaidUsd = hostTaxPaidUsd + imputedRentalTaxPaidUsd + homeTaxPaidUsd + socialSecurityTaxUsd;

	// --- Corporate Tax Coverage Policies ---
	let effectiveEmployeeTaxBurdenUsd = actualTotalTaxesPaidUsd;
	let employerTaxReimbursementUsd = 0;

	if (inputs.taxPolicy === 'tax-equalization') {
		effectiveEmployeeTaxBurdenUsd = stayTaxes;
		employerTaxReimbursementUsd = actualTotalTaxesPaidUsd - stayTaxes;
	} else if (inputs.taxPolicy === 'tax-protection') {
		if (actualTotalTaxesPaidUsd > stayTaxes) {
			employerTaxReimbursementUsd = actualTotalTaxesPaidUsd - stayTaxes;
			effectiveEmployeeTaxBurdenUsd = stayTaxes;
		} else {
			effectiveEmployeeTaxBurdenUsd = actualTotalTaxesPaidUsd;
			employerTaxReimbursementUsd = 0;
		}
	} else {
		effectiveEmployeeTaxBurdenUsd = actualTotalTaxesPaidUsd;
		employerTaxReimbursementUsd = 0;
	}

	const moveNetIncomeUsd = moveTotalGrossUsd + employerTaxReimbursementUsd - actualTotalTaxesPaidUsd;

	// --- Expenses & Local CoL ---
	const hostRentUsd = inputs.hostRentMonthly * 12 * fx;
	const privateTuitionUsd = inputs.privateTuitionMonthly * 12 * fx;
	const privateHealthInsuranceUsd = inputs.privateHealthInsuranceMonthly * 12 * fx;
	const moveExpatFixedExpensesUsd = privateTuitionUsd + privateHealthInsuranceUsd;

	const moveAdjustedDiscretionaryUsd = inputs.discretionarySpendMonthly * 12 * inputs.hostColIndexRatio;
	const moveLivingExpensesUsd = hostRentUsd + moveExpatFixedExpensesUsd + moveAdjustedDiscretionaryUsd;

	// Liabilities (Home USD debt + Host local debt converted to USD)
	const moveHomeLiabilitiesUsd = inputs.homeLiabilitiesUsdMonthly * 12;
	const moveHostLiabilitiesUsd = inputs.hostLiabilitiesMonthly * 12 * fx;
	const moveTotalLiabilitiesUsd = moveHomeLiabilitiesUsd + moveHostLiabilitiesUsd;

	const fxDepreciationImpactUsd = moveTotalLiabilitiesUsd * 0.10;

	const moveAnnualFreeCashFlowUsd = moveNetIncomeUsd - moveLivingExpensesUsd - moveTotalLiabilitiesUsd;

	// --- Comparison & Wealth Projections ---
	const annualCashFlowDelta = moveAnnualFreeCashFlowUsd - stayAnnualFreeCashFlow;

	const movingReimbursementOutlayUsd = inputs.movingReimbursementOneTime > 0 ? 0 : 5000;
	let breakEvenMonths = 0;
	if (movingReimbursementOutlayUsd > 0) {
		const monthlyGain = annualCashFlowDelta / 12;
		breakEvenMonths = monthlyGain > 0 ? movingReimbursementOutlayUsd / monthlyGain : Infinity;
	}

	const r = inputs.expectedInvestmentReturnRate;
	let fiveYearWealthStay = 0;
	let fiveYearWealthMove = 0;

	for (let y = 1; y <= 5; y++) {
		fiveYearWealthStay = (fiveYearWealthStay + Math.max(0, stayAnnualFreeCashFlow)) * (1 + r);
		fiveYearWealthMove = (fiveYearWealthMove + Math.max(0, moveAnnualFreeCashFlowUsd)) * (1 + r);
	}
	const fiveYearWealthDelta = fiveYearWealthMove - fiveYearWealthStay;

	return {
		countryName: country.name,
		currencySymbol: country.currencySymbol,
		currencyCode: country.currencyCode,

		stayEarnedIncome,
		stayInvestmentIncome,
		stayGrossIncome,
		stayTaxes,
		stayNetIncome,
		stayFixedExpenses,
		stayLivingExpenses,
		stayHomeLiabilities,
		stayAnnualFreeCashFlow,

		moveBaseGross: moveBaseGrossUsd,
		moveAllowancesTotal: moveAllowancesTotalUsd,
		moveInvestmentIncome: moveInvestmentIncomeUsd,
		moveTotalGross: moveTotalGrossUsd,
		hostTaxBase: hostEarnedIncomeHostCurr * fx,
		hostTaxPaid: hostTaxPaidUsd,
		hostTaxDetailsNote,
		imputedRentalTaxPaid: imputedRentalTaxPaidUsd,
		homeTaxPaid: homeTaxPaidUsd,
		actualTotalTaxesPaid: actualTotalTaxesPaidUsd,
		effectiveEmployeeTaxBurden: effectiveEmployeeTaxBurdenUsd,
		employerTaxReimbursement: employerTaxReimbursementUsd,
		moveNetIncome: moveNetIncomeUsd,

		moveLivingExpenses: moveLivingExpensesUsd,
		moveExpatFixedExpenses: moveExpatFixedExpensesUsd,
		moveHomeLiabilities: moveHomeLiabilitiesUsd,
		moveHostLiabilitiesUsd,
		moveTotalLiabilitiesUsd,
		fxDepreciationImpactUsd,
		moveAnnualFreeCashFlow: moveAnnualFreeCashFlowUsd,

		annualCashFlowDelta,
		fiveYearWealthStay,
		fiveYearWealthMove,
		fiveYearWealthDelta,
		breakEvenMonths,

		feieUsedAmount,
		ftcUsedAmount,
		optimalTaxRelief,
		isDetachedWorkerActive,
		totalizationSocialSecurityModel,
		warnings,

		// Detailed components mapping
		stayFedTaxEarned,
		stayFedTaxInv,
		stayStateTax,
		stayFicaTax,

		moveBaseSalaryUsd: hostBaseSalaryUsd,
		moveBonusUsd: hostBonusUsd,
		moveEquityAnnualUsd: hostEquityAnnualUsd,
		moveSpouseIncomeUsd: totalSpouseIncomeMoveUsd,

		moveColaUsd: colaUsd,
		moveHousingUsd: housingAllowanceUsd,
		moveTuitionUsd: tuitionStipendUsd,

		stayRentUsd: inputs.homeRentOrMortgageMonthly * 12,
		stayTuitionUsd: inputs.homeTuitionMonthly * 12,
		stayHealthInsuranceUsd: inputs.homeHealthInsuranceMonthly * 12,
		stayDiscretionaryUsd: inputs.discretionarySpendMonthly * 12,

		moveRentUsd: hostRentUsd,
		moveTuitionUsd: privateTuitionUsd,
		moveHealthInsuranceUsd: privateHealthInsuranceUsd,
		moveDiscretionaryUsd: moveAdjustedDiscretionaryUsd,

		moveSocialSecurityTaxUsd: socialSecurityTaxUsd,
		stayOnlyLiabilitiesUsd
	};
}

export function generate5YearProjections(inputs: ExpatInputs, breakdown: ExpatBreakdown): YearProjection[] {
	const r = inputs.expectedInvestmentReturnRate;
	const list: YearProjection[] = [];
	let cumStay = 0;
	let cumMove = 0;

	for (let year = 1; year <= 5; year++) {
		cumStay = (cumStay + Math.max(0, breakdown.stayAnnualFreeCashFlow)) * (1 + r);
		cumMove = (cumMove + Math.max(0, breakdown.moveAnnualFreeCashFlow)) * (1 + r);
		list.push({
			year,
			stayCumulativeWealth: cumStay,
			moveCumulativeWealth: cumMove,
			wealthDelta: cumMove - cumStay
		});
	}
	return list;
}
