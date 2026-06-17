import type { RelocationInputs, RelocationBreakdown, TaxYearSummary, RelocationExpense } from './types';

// OBBBA Federal Tax Year 2026 Brackets
const FED_BRACKETS = {
	single: [
		{ limit: 11925, rate: 0.10 },
		{ limit: 48475, rate: 0.12 },
		{ limit: 103350, rate: 0.22 },
		{ limit: 197300, rate: 0.24 },
		{ limit: 250525, rate: 0.32 },
		{ limit: 626350, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 }
	],
	married: [
		{ limit: 23850, rate: 0.10 },
		{ limit: 96950, rate: 0.12 },
		{ limit: 206700, rate: 0.22 },
		{ limit: 394600, rate: 0.24 },
		{ limit: 501050, rate: 0.32 },
		{ limit: 751600, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 }
	],
	hoh: [
		{ limit: 17000, rate: 0.10 },
		{ limit: 64800, rate: 0.12 },
		{ limit: 103350, rate: 0.22 },
		{ limit: 197300, rate: 0.24 },
		{ limit: 250500, rate: 0.32 },
		{ limit: 626350, rate: 0.35 },
		{ limit: Infinity, rate: 0.37 }
	]
};

// State standard deductions (2026 Est)
const STATE_DEDUCTIONS: Record<string, { single: number; married: number; hoh: number }> = {
	CA: { single: 5500, married: 11000, hoh: 11000 },
	NY: { single: 8000, married: 16000, hoh: 16000 },
	NJ: { single: 1000, married: 1000, hoh: 1000 },
	MD: { single: 4100, married: 8200, hoh: 4100 },
	VA: { single: 8750, married: 17500, hoh: 8750 },
	MA: { single: 4400, married: 8800, hoh: 4400 },
	PA: { single: 0, married: 0, hoh: 0 },
	AR: { single: 2300, married: 4600, hoh: 2300 },
	HI: { single: 2200, married: 4400, hoh: 4400 }
};

// State marginal tax rates (Simplified brackets or flat rate)
const STATE_TAX_RATES: Record<string, (taxable: number, filingStatus: 'single' | 'married' | 'hoh') => number> = {
	CA: (taxable) => {
		// CA progressive brackets up to 12.3%
		if (taxable <= 10412) return taxable * 0.01;
		if (taxable <= 24684) return 104.12 + (taxable - 10412) * 0.02;
		if (taxable <= 38959) return 389.56 + (taxable - 24684) * 0.04;
		if (taxable <= 54000) return 960.56 + (taxable - 38959) * 0.06;
		if (taxable <= 68263) return 1863.02 + (taxable - 54000) * 0.08;
		if (taxable <= 348696) return 3004.06 + (taxable - 68263) * 0.093;
		if (taxable <= 418424) return 29084.33 + (taxable - 348696) * 0.103;
		if (taxable <= 697364) return 36266.32 + (taxable - 418424) * 0.113;
		return 67786.54 + (taxable - 697364) * 0.123;
	},
	NY: (taxable) => {
		// NY progressive brackets up to 10.9%
		if (taxable <= 8500) return taxable * 0.04;
		if (taxable <= 11700) return 340 + (taxable - 8500) * 0.045;
		if (taxable <= 13900) return 484 + (taxable - 11700) * 0.0525;
		if (taxable <= 80650) return 600 + (taxable - 13900) * 0.0585;
		if (taxable <= 215400) return 4504 + (taxable - 80650) * 0.0625;
		if (taxable <= 1077550) return 12926 + (taxable - 215400) * 0.0685;
		if (taxable <= 5000000) return 71983 + (taxable - 1077550) * 0.0965;
		if (taxable <= 25000000) return 450499 + (taxable - 5000000) * 0.103;
		return 2510499 + (taxable - 25000000) * 0.109;
	},
	NJ: (taxable) => {
		// NJ progressive brackets up to 10.75%
		if (taxable <= 20000) return taxable * 0.014;
		if (taxable <= 35000) return 280 + (taxable - 20000) * 0.0175;
		if (taxable <= 40000) return 542.5 + (taxable - 35000) * 0.035;
		if (taxable <= 75000) return 717.5 + (taxable - 40000) * 0.05525;
		if (taxable <= 500000) return 2651.25 + (taxable - 75000) * 0.0637;
		if (taxable <= 1000000) return 29723.75 + (taxable - 500000) * 0.0897;
		return 74573.75 + (taxable - 1000000) * 0.1075;
	},
	MD: (taxable) => {
		// MD progressive brackets up to 5.75%
		if (taxable <= 1000) return taxable * 0.02;
		if (taxable <= 2000) return 20 + (taxable - 1000) * 0.03;
		if (taxable <= 3000) return 50 + (taxable - 2000) * 0.04;
		if (taxable <= 100000) return 90 + (taxable - 3000) * 0.0475;
		if (taxable <= 125000) return 4697.5 + (taxable - 100000) * 0.05;
		if (taxable <= 150000) return 5947.5 + (taxable - 125000) * 0.0525;
		if (taxable <= 250000) return 7260 + (taxable - 150000) * 0.055;
		return 12760 + (taxable - 250000) * 0.0575;
	},
	VA: (taxable) => {
		// VA progressive brackets up to 5.75%
		if (taxable <= 3000) return taxable * 0.02;
		if (taxable <= 5000) return 60 + (taxable - 3000) * 0.03;
		if (taxable <= 17000) return 120 + (taxable - 5000) * 0.05;
		return 720 + (taxable - 17000) * 0.0575;
	},
	MA: (taxable) => {
		// MA flat 5%
		return taxable * 0.05;
	},
	PA: (taxable) => {
		// PA flat 3.07%
		return taxable * 0.0307;
	},
	AR: (taxable) => {
		// AR progressive brackets up to 4.7%
		if (taxable <= 4900) return taxable * 0.02;
		if (taxable <= 9900) return 98 + (taxable - 4900) * 0.03;
		return 248 + (taxable - 9900) * 0.047;
	},
	HI: (taxable) => {
		// HI progressive brackets up to 11%
		if (taxable <= 2400) return taxable * 0.014;
		if (taxable <= 4800) return 33.6 + (taxable - 2400) * 0.032;
		if (taxable <= 9600) return 110.4 + (taxable - 4800) * 0.055;
		if (taxable <= 14400) return 374.4 + (taxable - 9600) * 0.064;
		if (taxable <= 19200) return 681.6 + (taxable - 14400) * 0.068;
		if (taxable <= 24000) return 1008 + (taxable - 19200) * 0.072;
		if (taxable <= 36000) return 1353.6 + (taxable - 24000) * 0.076;
		if (taxable <= 48000) return 2265.6 + (taxable - 36000) * 0.079;
		if (taxable <= 150000) return 3213.6 + (taxable - 48000) * 0.0825;
		if (taxable <= 175000) return 11628.6 + (taxable - 150000) * 0.09;
		if (taxable <= 200000) return 13878.6 + (taxable - 175000) * 0.10;
		return 16378.6 + (taxable - 200000) * 0.11;
	}
};

// Exclude relocation expenses from state income calculation if conformant
export function doesStateExcludeQualifiedRelocation(state: string): boolean {
	return ['CA', 'NY', 'NJ', 'MA', 'PA', 'AR', 'HI'].includes(state);
}

// Prorate Rent Calculations (Epic 2)
export function calculateProratedRent(
	rent: number,
	daysOccupied: number,
	daysInMonth: number,
	method: 'daily' | 'annual' | 'banker'
): number {
	if (rent <= 0 || daysOccupied <= 0) return 0;
	
	switch (method) {
		case 'annual':
			// (Rm * 12 / 365) * Do
			return (rent * 12 / 365) * daysOccupied;
		case 'banker':
			// (Rm / 30) * Do
			return (rent / 30) * daysOccupied;
		case 'daily':
		default:
			// (Rm / Dm) * Do
			const dm = daysInMonth > 0 ? daysInMonth : 30;
			return (rent / dm) * daysOccupied;
	}
}

// Federal Income Tax (Epic 3)
export function calculateFederalTax(taxable: number, filingStatus: 'single' | 'married' | 'hoh'): number {
	if (taxable <= 0) return 0;
	
	const brackets = FED_BRACKETS[filingStatus] || FED_BRACKETS.single;
	let tax = 0;
	let previousLimit = 0;
	
	for (const bracket of brackets) {
		if (taxable > bracket.limit) {
			tax += (bracket.limit - previousLimit) * bracket.rate;
			previousLimit = bracket.limit;
		} else {
			tax += (taxable - previousLimit) * bracket.rate;
			break;
		}
	}
	
	return tax;
}

// FICA Withholding Tax (Epic 3)
export function calculateFicaTax(baseSalary: number, taxableBenefits: number, filingStatus: 'single' | 'married' | 'hoh'): number {
	const totalWages = baseSalary + taxableBenefits;
	if (totalWages <= 0) return 0;
	
	// Social Security Limit: 6.2% up to $184,500
	const ssLimit = 184500;
	const ssWages = Math.min(totalWages, ssLimit);
	const ssTax = ssWages * 0.062;
	
	// Medicare: 1.45% on all earnings
	const medTax = totalWages * 0.0145;
	
	// Additional Medicare: 0.9% above $200,000 (Single/HOH) or $250,000 (Married)
	const addMedThreshold = filingStatus === 'married' ? 250000 : 200000;
	const addMedWages = Math.max(0, totalWages - addMedThreshold);
	const addMedTax = addMedWages * 0.009;
	
	return ssTax + medTax + addMedTax;
}

// State Personal Exemptions (progressive step-downs) (Epic 3)
export function calculateStateExemptions(state: string, filingStatus: 'single' | 'married' | 'hoh', agi: number): number {
	if (state === 'VA') {
		// Virginia: Standard $930 exemption
		// Assume 1 exemption for Single/HOH, 2 for Married
		const count = filingStatus === 'married' ? 2 : 1;
		return count * 930;
	}
	
	if (state === 'MD') {
		// Maryland: Exemption steps down from $3,200 to $800 based on AGI
		const count = filingStatus === 'married' ? 2 : 1;
		
		if (filingStatus === 'married') {
			if (agi <= 150000) return count * 3200;
			if (agi <= 175000) return count * 2400;
			if (agi <= 200000) return count * 1600;
			return count * 800;
		} else {
			if (agi <= 100000) return count * 3200;
			if (agi <= 125000) return count * 2400;
			if (agi <= 150000) return count * 1600;
			return count * 800;
		}
	}
	
	return 0; // Fallback
}

// Combined Tax Engine for a Year
export function calculateTaxForYear(
	filingStatus: 'single' | 'married' | 'hoh',
	state: string,
	localRatePercent: number,
	baseSalary: number,
	expenses: RelocationExpense[],
	isMilitaryOrIntel: boolean,
	isPostMove: boolean
): TaxYearSummary {
	// Determine taxable relocation reimbursements
	let taxableReimbursements = 0;
	
	if (isPostMove && expenses.length > 0) {
		expenses.forEach((expense) => {
			if (expense.isReimbursed && !expense.isGrossedUp) {
				// If military/intel, qualified transit is excluded
				if (isMilitaryOrIntel && expense.isQualifiedMovingCost) {
					return;
				}
				// Otherwise, fully taxable at federal level
				taxableReimbursements += expense.amount;
			}
		});
	}
	
	const grossIncome = baseSalary + taxableReimbursements;
	
	// 1. Federal Standard Deduction (OBBBA 2026)
	let fedStandardDeduction = 16100; // Single
	if (filingStatus === 'married') fedStandardDeduction = 32200;
	if (filingStatus === 'hoh') fedStandardDeduction = 24150;
	
	const federalTaxableIncome = Math.max(0, grossIncome - fedStandardDeduction);
	const federalTax = calculateFederalTax(federalTaxableIncome, filingStatus);
	
	// 2. FICA Tax
	const ficaTax = calculateFicaTax(baseSalary, taxableReimbursements, filingStatus);
	
	// 3. State Tax
	let stateStandardDeduction = 0;
	const stateDeductionGroup = STATE_DEDUCTIONS[state];
	if (stateDeductionGroup) {
		stateStandardDeduction = stateDeductionGroup[filingStatus];
	}
	
	const stateExemptions = calculateStateExemptions(state, filingStatus, grossIncome);
	
	// Determine state taxable relocation reimbursements
	let stateTaxableReimbursements = taxableReimbursements;
	if (isPostMove && doesStateExcludeQualifiedRelocation(state)) {
		// Subtract qualified moving costs from state taxable income
		let stateExcludedAmount = 0;
		expenses.forEach((expense) => {
			if (expense.isReimbursed && !expense.isGrossedUp && expense.isQualifiedMovingCost) {
				stateExcludedAmount += expense.amount;
			}
		});
		stateTaxableReimbursements = Math.max(0, taxableReimbursements - stateExcludedAmount);
	}
	
	const stateGrossIncome = baseSalary + stateTaxableReimbursements;
	const stateTaxableIncome = Math.max(0, stateGrossIncome - stateStandardDeduction - stateExemptions);
	
	let stateTax = 0;
	const stateRateFunc = STATE_TAX_RATES[state];
	if (stateRateFunc) {
		stateTax = stateRateFunc(stateTaxableIncome, filingStatus);
	} else {
		// Fallback state tax of 5%
		stateTax = stateTaxableIncome * 0.05;
	}
	
	// 4. Local Income Tax
	const localRate = localRatePercent / 100;
	const localTax = stateTaxableIncome * localRate;
	
	const totalTax = federalTax + ficaTax + stateTax + localTax;
	const netTakeHome = grossIncome - totalTax;
	
	return {
		baseSalary,
		taxableRelocationReimbursements: taxableReimbursements,
		grossIncome,
		standardDeduction: fedStandardDeduction,
		stateDeduction: stateStandardDeduction,
		personalExemptions: stateExemptions,
		federalTaxableIncome,
		stateTaxableIncome,
		federalTax,
		ficaTax,
		stateTax,
		localTax,
		totalTax,
		netTakeHome
	};
}

// Complete Modeler Logic
export function calculateRelocation(inputs: RelocationInputs): RelocationBreakdown {
	// 1. Calculate Expenses Categories
	let totalOriginExpenses = 0;
	let totalTransitExpenses = 0;
	let totalDestinationExpenses = 0;
	let totalReimbursed = 0;
	let totalOutOfPocketExpenses = 0;
	
	inputs.expenses.forEach((exp) => {
		const amt = exp.amount;
		if (exp.category === 'origin') totalOriginExpenses += amt;
		if (exp.category === 'transit') totalTransitExpenses += amt;
		if (exp.category === 'destination') totalDestinationExpenses += amt;
		
		if (exp.isReimbursed) {
			totalReimbursed += amt;
		} else {
			totalOutOfPocketExpenses += amt;
		}
	});
	
	const totalAllExpenses = totalOriginExpenses + totalTransitExpenses + totalDestinationExpenses;
	
	// 2. Housing & Lease Break calculations
	const leaseProratedRent = calculateProratedRent(
		inputs.leaseMonthlyRent,
		inputs.leaseDaysOccupied,
		inputs.leaseDaysInMonth,
		inputs.leaseProrationMethod
	);
	
	// Net friction: Rp + Fc + Dloss - Am
	const leaseNetFriction = Math.max(
		0,
		leaseProratedRent + inputs.leaseFlatPenalties + inputs.leaseLostDeposit - inputs.leaseEmployerAllowance
	);
	
	// Add lease net friction to origin category totals for breakdown purposes
	const finalTotalOrigin = totalOriginExpenses + leaseNetFriction;
	const finalTotalAll = finalTotalOrigin + totalTransitExpenses + totalDestinationExpenses;
	
	// 3. Tax engines (Pre-move vs Post-move)
	const preMoveTax = calculateTaxForYear(
		inputs.filingStatus,
		inputs.originState,
		inputs.originLocalRate,
		inputs.originSalary,
		[],
		inputs.isMilitaryOrIntel,
		false
	);
	
	const postMoveTax = calculateTaxForYear(
		inputs.filingStatus,
		inputs.destState,
		inputs.destLocalRate,
		inputs.destSalary,
		inputs.expenses,
		inputs.isMilitaryOrIntel,
		true
	);
	
	// Tax drag: difference between post-move tax with reimbursements vs post-move tax on salary alone
	const postMoveTaxSalaryOnly = calculateTaxForYear(
		inputs.filingStatus,
		inputs.destState,
		inputs.destLocalRate,
		inputs.destSalary,
		[],
		inputs.isMilitaryOrIntel,
		true
	);
	
	const taxDragOnBenefits = Math.max(0, postMoveTax.totalTax - postMoveTaxSalaryOnly.totalTax);
	
	// 4. Net out-of-pocket costs:
	// - out of pocket ledger expenses
	// - net lease break friction
	// - one-time tax liabilities from non-grossed-up reimbursements
	const netOutOfPocketRelocationCosts = totalOutOfPocketExpenses + leaseNetFriction + taxDragOnBenefits;
	
	// 5. Payback & Break-even calculations
	// Monthly net salary difference = post-move monthly net salary (salary-only) - pre-move monthly net salary
	const preMoveMonthlyNet = preMoveTax.netTakeHome / 12;
	const postMoveMonthlyNet = postMoveTaxSalaryOnly.netTakeHome / 12;
	const monthlyNetSalaryDiff = postMoveMonthlyNet - preMoveMonthlyNet;
	
	let paybackPeriodMonths = 0;
	if (monthlyNetSalaryDiff > 0) {
		paybackPeriodMonths = netOutOfPocketRelocationCosts / monthlyNetSalaryDiff;
	} else {
		paybackPeriodMonths = Infinity;
	}
	
	// Amortization Cash Flow (24 months projection)
	const amortizationCashFlow: number[] = [];
	let cumulativeCash = -netOutOfPocketRelocationCosts;
	
	amortizationCashFlow.push(cumulativeCash);
	for (let month = 1; month <= 24; month++) {
		if (monthlyNetSalaryDiff > 0) {
			cumulativeCash += monthlyNetSalaryDiff;
		}
		amortizationCashFlow.push(cumulativeCash);
	}
	
	// 6. Tax Gross-Up calculations (Epic 5)
	// Base benefits to be grossed up (all reimbursed expenses where grossed_up = true)
	let benefitsToGrossUp = 0;
	inputs.expenses.forEach((exp) => {
		if (exp.isReimbursed && exp.isGrossedUp) {
			benefitsToGrossUp += exp.amount;
		}
	});
	
	// Composite rate assembly
	// Fed supplemental: 22% under OBBBA
	const fedSupRate = 0.22;
	
	// FICA Rate: check if post-move salary is above SS wage base
	const ssLimit = 184500;
	const isAboveSS = inputs.destSalary >= ssLimit;
	const ficaRate = isAboveSS ? 0.0145 : 0.0765;
	
	// State marginal rate at destination (marginal rate estimated at destSalary)
	const stateRateFunc = STATE_TAX_RATES[inputs.destState];
	const testSalary = inputs.destSalary > 0 ? inputs.destSalary : 100000;
	const testStateTax1 = stateRateFunc ? stateRateFunc(testSalary, inputs.filingStatus) : testSalary * 0.05;
	const testStateTax2 = stateRateFunc ? stateRateFunc(testSalary + 1000, inputs.filingStatus) : (testSalary + 1000) * 0.05;
	const stateMarginalRate = Math.max(0, (testStateTax2 - testStateTax1) / 1000);
	
	const localMarginalRate = inputs.destLocalRate / 100;
	
	const combinedRate = fedSupRate + ficaRate + stateMarginalRate + localMarginalRate;
	
	// Flat gross-up formula: E * (1 + R_combined)
	const grossUpFlat = benefitsToGrossUp * (1 + combinedRate);
	
	// Supplemental Inverse formula (tax-on-tax): E / (1 - R_combined)
	// Clamp combined rate to avoid division by zero or negative values
	const clampedCombinedRate = Math.min(0.95, Math.max(0, combinedRate));
	const grossUpInverse = benefitsToGrossUp / (1 - clampedCombinedRate);
	
	// Marginal True-Up method (Iterative algorithm)
	let grossUpMarginal = 0;
	if (benefitsToGrossUp > 0) {
		const taxBase = postMoveTaxSalaryOnly.totalTax;
		let gCurr = benefitsToGrossUp * combinedRate; // Initial guess
		let converged = false;
		
		for (let iter = 0; iter < 20; iter++) {
			// Calculate tax with salary + benefit + current gross-up guess
			// Note: we calculate tax considering the grossed up benefit is taxable supplemental compensation
			const totalTaxableWages = inputs.destSalary + benefitsToGrossUp + gCurr;
			const testTaxSummary = calculateTaxForYear(
				inputs.filingStatus,
				inputs.destState,
				inputs.destLocalRate,
				totalTaxableWages,
				[], // Avoid double adding ledger expenses
				inputs.isMilitaryOrIntel,
				true
			);
			
			const taxDiff = Math.max(0, testTaxSummary.totalTax - taxBase);
			
			if (Math.abs(taxDiff - gCurr) < 0.01) {
				grossUpMarginal = benefitsToGrossUp + taxDiff;
				converged = true;
				break;
			}
			gCurr = taxDiff;
		}
		
		if (!converged) {
			grossUpMarginal = benefitsToGrossUp / (1 - clampedCombinedRate); // Fallback to inverse if doesn't converge
		}
	} else {
		grossUpMarginal = 0;
	}
	
	// 7. Compliance Checks (California AB 692)
	let isCaliforniaAB692Compliant = true;
	const complianceWarnings: string[] = [];
	
	if (inputs.destState === 'CA') {
		// Reject Cliff Repayment
		if (inputs.clawbackModel === 'cliff') {
			isCaliforniaAB692Compliant = false;
			complianceWarnings.push('California AB 692 rejects cliff-repayment clawback terms. Enforce graduated linear decay schedule.');
		}
		// Limit retention to 2 years
		if (inputs.clawbackDurationMonths > 24) {
			isCaliforniaAB692Compliant = false;
			complianceWarnings.push('California AB 692 limits stay-or-pay retention periods to a maximum of 24 months.');
		}
		// Limit interest rate to 0.00%
		if (inputs.clawbackInterestRate > 0) {
			isCaliforniaAB692Compliant = false;
			complianceWarnings.push('California AB 692 enforces a 0.00% maximum interest rate limit on clawback repayment liabilities.');
		}
		// Payment deferral option mandatory
		if (!inputs.clawbackDeferralOption) {
			isCaliforniaAB692Compliant = false;
			complianceWarnings.push('California AB 692 requires a mandatory deferral selection option for the employee.');
		}
	}
	
	return {
		totalOriginExpenses: finalTotalOrigin,
		totalTransitExpenses,
		totalDestinationExpenses,
		totalAllExpenses: finalTotalAll,
		totalReimbursed,
		totalOutOfPocketExpenses,
		leaseProratedRent,
		leaseNetFriction,
		netOutOfPocketRelocationCosts,
		preMoveTax,
		postMoveTax,
		preMoveMonthlyNet,
		postMoveMonthlyNet,
		monthlyNetSalaryDiff,
		paybackPeriodMonths,
		amortizationCashFlow,
		grossUpFlat,
		grossUpInverse,
		grossUpMarginal,
		isCaliforniaAB692Compliant,
		complianceWarnings
	};
}
