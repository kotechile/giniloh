/**
 * Rent vs. Buy with opportunity cost.
 *
 * Most rent-vs-buy calculators compare a mortgage payment to a rent cheque and stop there. That
 * comparison is wrong in both directions: it ignores the equity a buyer accumulates, and it
 * ignores what the down payment would have earned if it stayed invested. This model runs both
 * households month by month to the same horizon and compares net worth after selling costs.
 *
 * What is deliberately excluded: tax deductibility of mortgage interest (standard-deduction
 * phase-outs make it a personal question), renters' insurance, and any assumption that the
 * owner reinvests the equity before selling. Those omissions are stated on the page.
 */

export interface RentVsBuyInputs {
	homePrice: number;
	downPaymentPct: number;
	mortgageRatePct: number;
	termYears: number;
	propertyTaxPct: number;
	insuranceAnnual: number;
	hoaMonthly: number;
	/** Annual maintenance/repairs as a percentage of home value. */
	maintenancePct: number;
	appreciationPct: number;
	rentMonthly: number;
	rentGrowthPct: number;
	horizonYears: number;
	/** What the invested side earns (index portfolio). */
	investmentReturnPct: number;
	/** Agent fees + transfer costs at sale. */
	sellingCostPct: number;
	/** Closing costs paid at purchase. */
	closingCostPct: number;
}

export interface RentVsBuyOutputs {
	purchase: {
		downPayment: number;
		closingCosts: number;
		loanAmount: number;
		monthlyPrincipalInterest: number;
		firstYearMonthlyCost: number;
	};
	owner: {
		homeValueAtHorizon: number;
		loanBalanceAtHorizon: number;
		sellingCosts: number;
		netProceeds: number;
		totalInterestPaid: number;
		totalOwnershipSpend: number;
	};
	renter: {
		totalRentPaid: number;
		investedPortfolio: number;
		startingCapital: number;
	};
	comparison: {
		priceToRentRatio: number;
		breakevenYear: number | null;
		ownerAdvantage: number;
		recommendation: 'Buy' | 'Rent and invest';
		monthlyGapFirstYear: number;
	};
}

const money = (n: number) => Math.round(n * 100) / 100;
const clampPct = (n: number) => Math.max(0, Math.min(100, n));

export function calculateRentVsBuy(inputs: RentVsBuyInputs): RentVsBuyOutputs {
	const price = Math.max(0, inputs.homePrice);
	const downPct = clampPct(inputs.downPaymentPct) / 100;
	const downPayment = price * downPct;
	const closingCosts = price * (Math.max(0, inputs.closingCostPct) / 100);
	const loanAmount = Math.max(0, price - downPayment);

	const monthlyRate = Math.max(0, inputs.mortgageRatePct) / 100 / 12;
	const totalPayments = Math.max(1, Math.round(inputs.termYears * 12));
	const monthlyPI =
		monthlyRate > 0
			? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments))
			: loanAmount / totalPayments;

	const monthlyTax = (price * (Math.max(0, inputs.propertyTaxPct) / 100)) / 12;
	const monthlyInsurance = Math.max(0, inputs.insuranceAnnual) / 12;
	const monthlyMaintenance = (price * (Math.max(0, inputs.maintenancePct) / 100)) / 12;
	const monthlyHoa = Math.max(0, inputs.hoaMonthly);
	const firstYearMonthlyCost = monthlyPI + monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyHoa;

	const horizonMonths = Math.max(0, Math.round(inputs.horizonYears * 12));
	const appreciation = 1 + Math.max(-0.99, inputs.appreciationPct) / 100;
	const monthlyInvestReturn = Math.pow(1 + Math.max(0, inputs.investmentReturnPct) / 100, 1 / 12) - 1;

	// Renter starts with the capital the buyer sinks at close.
	let portfolio = downPayment + closingCosts;
	let rent = Math.max(0, inputs.rentMonthly);
	let totalRentPaid = 0;
	let totalInterestPaid = 0;
	let totalOwnershipSpend = downPayment + closingCosts;
	let balance = loanAmount;
	let breakevenYear: number | null = null;

	for (let month = 1; month <= horizonMonths; month++) {
		// Year-over-year rent growth, applied at each anniversary.
		if (month > 1 && (month - 1) % 12 === 0) {
			rent *= 1 + Math.max(0, inputs.rentGrowthPct) / 100;
		}

		// Owner: amortise, and keep paying tax/insurance/maintenance.
		const interest = balance * monthlyRate;
		const principal = Math.min(balance, Math.max(0, monthlyPI - interest));
		balance = Math.max(0, balance - principal);
		totalInterestPaid += interest;
		const ownerOutflow = monthlyPI + monthlyTax + monthlyInsurance + monthlyMaintenance + monthlyHoa;
		totalOwnershipSpend += ownerOutflow;

		// Renter: pay rent, invest (or draw down) the difference.
		totalRentPaid += rent;
		portfolio *= 1 + monthlyInvestReturn;
		portfolio += ownerOutflow - rent;
		if (portfolio < 0) portfolio = 0;

		if (month % 12 === 0) {
			const homeValue = price * Math.pow(appreciation, month / 12);
			const sellingCosts = homeValue * (Math.max(0, inputs.sellingCostPct) / 100);
			const ownerNetWorth = homeValue - sellingCosts - balance;
			if (breakevenYear === null && ownerNetWorth >= portfolio) breakevenYear = month / 12;
		}
	}

	const homeValueAtHorizon = price * Math.pow(appreciation, inputs.horizonYears);
	const sellingCosts = homeValueAtHorizon * (Math.max(0, inputs.sellingCostPct) / 100);
	const netProceeds = homeValueAtHorizon - sellingCosts - balance;
	const renterPortfolio = Math.max(0, portfolio);

	const priceToRentRatio = inputs.rentMonthly > 0 ? price / (inputs.rentMonthly * 12) : Number.POSITIVE_INFINITY;
	const ownerAdvantage = netProceeds - renterPortfolio;
	const buyWins = ownerAdvantage > 0;

	return {
		purchase: {
			downPayment: money(downPayment),
			closingCosts: money(closingCosts),
			loanAmount: money(loanAmount),
			monthlyPrincipalInterest: money(monthlyPI),
			firstYearMonthlyCost: money(firstYearMonthlyCost)
		},
		owner: {
			homeValueAtHorizon: money(homeValueAtHorizon),
			loanBalanceAtHorizon: money(balance),
			sellingCosts: money(sellingCosts),
			netProceeds: money(netProceeds),
			totalInterestPaid: money(totalInterestPaid),
			totalOwnershipSpend: money(totalOwnershipSpend)
		},
		renter: {
			totalRentPaid: money(totalRentPaid),
			investedPortfolio: money(renterPortfolio),
			startingCapital: money(downPayment + closingCosts)
		},
		comparison: {
			priceToRentRatio: Number.isFinite(priceToRentRatio) ? Math.round(priceToRentRatio * 10) / 10 : Number.POSITIVE_INFINITY,
			breakevenYear,
			ownerAdvantage: money(ownerAdvantage),
			recommendation: buyWins ? 'Buy' : 'Rent and invest',
			monthlyGapFirstYear: money(firstYearMonthlyCost - inputs.rentMonthly)
		}
	};
}
