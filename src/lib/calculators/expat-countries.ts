export type HostCountryId =
	| 'spain'
	| 'germany'
	| 'uk'
	| 'france'
	| 'brazil'
	| 'chile'
	| 'argentina'
	| 'portugal'
	| 'mexico'
	| 'canada'
	| 'switzerland'
	| 'netherlands'
	| 'uae'
	| 'japan'
	| 'australia'
	| 'costa_rica'
	| 'italy';

export interface CountryProfile {
	id: HostCountryId;
	name: string;
	region: 'Europe' | 'Americas' | 'North America' | 'Central America' | 'Middle East' | 'Asia' | 'Oceania';
	currencyCode: 'EUR' | 'GBP' | 'BRL' | 'CLP' | 'ARS' | 'MXN' | 'CAD' | 'CHF' | 'AED' | 'JPY' | 'AUD' | 'CRC';
	currencySymbol: string;
	defaultFxToUsd: number;
	defaultColRatio: number;
	hasSpecialExpatRegime: boolean;
	expatRegimeName: string;
	expatRegimeDescription: string;
	calculateHostTax: (earnedIncomeHostCurr: number, useSpecialRegime: boolean, foreignInvIncomeUsd: number, fxToUsd: number) => {
		taxAmountHostCurr: number;
		effectiveRatePercent: number;
		detailsNote: string;
	};
	calculateHostSocialSecurity: (earnedIncomeHostCurr: number, isDetachedWorker: boolean, useSpecialRegime: boolean, fxToUsd: number) => {
		ssAmountHostCurr: number;
		detailsNote: string;
	};
}

// --- Country Calculation Helpers ---

function calculatePortugalProgressive(income: number): number {
	const brackets = [
		{ limit: 7703, rate: 0.1325 },
		{ limit: 11623, rate: 0.18 },
		{ limit: 16472, rate: 0.23 },
		{ limit: 21321, rate: 0.26 },
		{ limit: 27146, rate: 0.3275 },
		{ limit: 39791, rate: 0.37 },
		{ limit: 51997, rate: 0.435 },
		{ limit: 80000, rate: 0.45 },
		{ limit: Infinity, rate: 0.48 }
	];
	let tax = 0, prev = 0;
	for (const b of brackets) {
		if (income > prev) {
			tax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	return tax;
}

function calculateMexicoBrackets(income: number): number {
	const brackets = [
		{ limit: 8952, rate: 0.0192 },
		{ limit: 75984, rate: 0.064 },
		{ limit: 133536, rate: 0.1088 },
		{ limit: 155229, rate: 0.16 },
		{ limit: 185852, rate: 0.1792 },
		{ limit: 374837, rate: 0.2136 },
		{ limit: 590795, rate: 0.2352 },
		{ limit: 1127926, rate: 0.30 },
		{ limit: 1503902, rate: 0.32 },
		{ limit: 4511707, rate: 0.34 },
		{ limit: Infinity, rate: 0.35 }
	];
	let tax = 0, prev = 0;
	for (const b of brackets) {
		if (income > prev) {
			tax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	return tax;
}

function calculateCanadaFedPlusProvincial(income: number): number {
	// Federal (15% to 33%)
	const fedBrackets = [
		{ limit: 55867, rate: 0.15 },
		{ limit: 111733, rate: 0.205 },
		{ limit: 173205, rate: 0.26 },
		{ limit: 246752, rate: 0.29 },
		{ limit: Infinity, rate: 0.33 }
	];
	let fedTax = 0, prev = 0;
	for (const b of fedBrackets) {
		if (income > prev) {
			fedTax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	// Ontario provincial average (~5.05% to 13.16%)
	const provBrackets = [
		{ limit: 51446, rate: 0.0505 },
		{ limit: 102894, rate: 0.0915 },
		{ limit: 150000, rate: 0.1116 },
		{ limit: 220000, rate: 0.1216 },
		{ limit: Infinity, rate: 0.1316 }
	];
	let provTax = 0; prev = 0;
	for (const b of provBrackets) {
		if (income > prev) {
			provTax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	return fedTax + provTax;
}

function calculateSwissFedPlusCantonal(income: number): number {
	// Federal (max 11.5%) + Zurich Cantonal/Communal multiplier (~15-22% combined effective)
	let tax = 0;
	if (income > 900000) tax = income * 0.33;
	else if (income > 300000) tax = income * 0.28;
	else if (income > 150000) tax = income * 0.22;
	else if (income > 75000) tax = income * 0.16;
	else tax = income * 0.10;
	return tax;
}

function calculateDutchBox1(income: number): number {
	if (income <= 75518) return income * 0.3697;
	return (75518 * 0.3697) + (income - 75518) * 0.495;
}

function calculateJapanNationalPlusLocal(income: number): number {
	const brackets = [
		{ limit: 1950000, rate: 0.05 },
		{ limit: 3300000, rate: 0.10 },
		{ limit: 6950000, rate: 0.20 },
		{ limit: 9000000, rate: 0.23 },
		{ limit: 18000000, rate: 0.33 },
		{ limit: 40000000, rate: 0.40 },
		{ limit: Infinity, rate: 0.45 }
	];
	let natTax = 0, prev = 0;
	for (const b of brackets) {
		if (income > prev) {
			natTax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	const localTax = income * 0.10; // Inhabitant tax flat 10%
	return natTax + localTax;
}

function calculateAtoBrackets(income: number): number {
	if (income <= 18200) return 0;
	if (income <= 45000) return (income - 18200) * 0.16;
	if (income <= 135000) return 4288 + (income - 45000) * 0.30;
	if (income <= 190000) return 31288 + (income - 135000) * 0.37;
	return 51638 + (income - 190000) * 0.45;
}

function calculateCRBrackets(income: number): number {
	const brackets = [
		{ limit: 9410000, rate: 0.0 },
		{ limit: 13810000, rate: 0.10 },
		{ limit: 24230000, rate: 0.15 },
		{ limit: 48470000, rate: 0.20 },
		{ limit: Infinity, rate: 0.25 }
	];
	let tax = 0, prev = 0;
	for (const b of brackets) {
		if (income > prev) {
			tax += Math.min(income - prev, b.limit - prev) * b.rate;
			prev = b.limit;
		} else break;
	}
	return tax;
}

function calculateItalyIrpef(income: number): number {
	if (income <= 28000) return income * 0.23;
	if (income <= 50000) return (28000 * 0.23) + (income - 28000) * 0.35;
	return (28000 * 0.23) + (22000 * 0.35) + (income - 50000) * 0.43;
}

// --- Master Country Profiles Register ---

export const COUNTRY_PROFILES: Record<HostCountryId, CountryProfile> = {
	spain: {
		id: 'spain',
		name: 'Spain',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.10,
		defaultColRatio: 0.82,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Beckham Law (24% Flat)',
		expatRegimeDescription: 'Flat 24% tax rate up to €600,000 for 6 years; foreign passive investment income is 100% exempt.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			if (useSpecialRegime) {
				const tax = earnedIncome <= 600000 ? earnedIncome * 0.24 : 600000 * 0.24 + (earnedIncome - 600000) * 0.47;
				return {
					taxAmountHostCurr: tax,
					effectiveRatePercent: (tax / earnedIncome) * 100,
					detailsNote: 'Beckham Law flat 24% up to €600k (foreign investment income exempt)'
				};
			} else {
				const brackets = [
					{ limit: 12450, rate: 0.19 },
					{ limit: 20200, rate: 0.24 },
					{ limit: 35200, rate: 0.30 },
					{ limit: 60000, rate: 0.37 },
					{ limit: 300000, rate: 0.45 },
					{ limit: Infinity, rate: 0.47 }
				];
				let tax = 0, prev = 0;
				for (const b of brackets) {
					if (earnedIncome > prev) {
						tax += Math.min(earnedIncome - prev, b.limit - prev) * b.rate;
						prev = b.limit;
					} else break;
				}
				const foreignTax = (foreignInvIncomeUsd / fxToUsd) * 0.21;
				const totalTax = tax + foreignTax;
				return {
					taxAmountHostCurr: totalTax,
					effectiveRatePercent: (totalTax / earnedIncome) * 100,
					detailsNote: 'Standard Spanish progressive rates (19%–47%) + 21% on foreign passive income'
				};
			}
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) {
				return { ssAmountHostCurr: 0, detailsNote: 'Exempt under US-Spain Totalization Detached Worker Rule (≤5 yrs)' };
			}
			const cap = 4700;
			const ss = Math.min(earnedIncome * 0.0635, cap);
			return { ssAmountHostCurr: ss, detailsNote: 'Spanish Social Security (~6.35% employee contribution capped)' };
		}
	},

	germany: {
		id: 'germany',
		name: 'Germany',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.10,
		defaultColRatio: 0.92,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Skilled Foreign Worker Tax Incentive (30% Exemption)',
		expatRegimeDescription: 'Tax-free relocation allowance & proposed 30% tax base exemption for qualified foreign professionals.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			const taxableIncome = useSpecialRegime ? earnedIncome * 0.70 : earnedIncome;
			let tax = 0;
			if (taxableIncome > 277825) tax = 0.45 * taxableIncome - 18300;
			else if (taxableIncome > 66760) tax = 0.42 * taxableIncome - 9972;
			else if (taxableIncome > 11784) {
				const y = (taxableIncome - 11784) / 10000;
				tax = (995.21 * y + 1400) * y;
			}

			if (tax > 18130) tax += tax * 0.055; // Solidaritätszuschlag
			const foreignTax = (foreignInvIncomeUsd / fxToUsd) * 0.26375;
			const totalTax = tax + foreignTax;

			return {
				taxAmountHostCurr: totalTax,
				effectiveRatePercent: (totalTax / earnedIncome) * 100,
				detailsNote: useSpecialRegime
					? 'Germany Skilled Expat Regime (30% tax-free income base + Solidarity Surcharge)'
					: 'Germany Progressive Einkommensteuer (14%–45%) + Solidarity Surcharge'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) return { ssAmountHostCurr: 0, detailsNote: 'Exempt under US-Germany Totalization Agreement (≤5 yrs)' };
			const ss = Math.min(earnedIncome * 0.20, 14200);
			return { ssAmountHostCurr: ss, detailsNote: 'German Social Security (~20% employee contributions capped at ~€14.2k)' };
		}
	},

	uk: {
		id: 'uk',
		name: 'United Kingdom',
		region: 'Europe',
		currencyCode: 'GBP',
		currencySymbol: '£',
		defaultFxToUsd: 1.30,
		defaultColRatio: 1.05,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Overseas Work Relief (OWR) & 4-Year FIG Exemption',
		expatRegimeDescription: 'Exempts foreign-duty salary from UK income tax for up to 3 years and 100% exempts foreign investment income (FIG regime).',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			const personalAllowance = 12570;
			const taxableIncome = useSpecialRegime ? earnedIncome * 0.75 : earnedIncome;
			const netTaxable = Math.max(0, taxableIncome - personalAllowance);

			let tax = 0;
			if (netTaxable > 112570) tax = 37700 * 0.20 + 74870 * 0.40 + (netTaxable - 112570) * 0.45;
			else if (netTaxable > 37700) tax = 37700 * 0.20 + (netTaxable - 37700) * 0.40;
			else tax = netTaxable * 0.20;

			const foreignTax = useSpecialRegime ? 0 : (foreignInvIncomeUsd / fxToUsd) * 0.20;
			const totalTax = tax + foreignTax;

			return {
				taxAmountHostCurr: totalTax,
				effectiveRatePercent: (totalTax / earnedIncome) * 100,
				detailsNote: useSpecialRegime
					? 'UK Overseas Work Relief (OWR) & Foreign Income/Gains (FIG) Exemption'
					: 'UK Standard Income Tax (20% Basic, 40% Higher, 45% Additional)'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) return { ssAmountHostCurr: 0, detailsNote: 'Exempt under US-UK Totalization Agreement (≤5 yrs)' };
			let ni = 0;
			if (earnedIncome > 12570) {
				ni += Math.min(earnedIncome - 12570, 50270 - 12570) * 0.08;
				if (earnedIncome > 50270) ni += (earnedIncome - 50270) * 0.02;
			}
			return { ssAmountHostCurr: ni, detailsNote: 'UK National Insurance (8% main rate + 2% upper rate)' };
		}
	},

	france: {
		id: 'france',
		name: 'France',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.10,
		defaultColRatio: 0.95,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Régime des Impatriés (30% Exemption Art. 155 B)',
		expatRegimeDescription: 'Flat 30% tax exemption on total gross remuneration for 8 years + 50% exemption on foreign passive investment income.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			const taxableIncome = useSpecialRegime ? earnedIncome * 0.70 : earnedIncome;
			const brackets = [
				{ limit: 11294, rate: 0.0 },
				{ limit: 28797, rate: 0.11 },
				{ limit: 82341, rate: 0.30 },
				{ limit: 177106, rate: 0.41 },
				{ limit: Infinity, rate: 0.45 }
			];
			let tax = 0, prev = 0;
			for (const b of brackets) {
				if (taxableIncome > prev) {
					tax += Math.min(taxableIncome - prev, b.limit - prev) * b.rate;
					prev = b.limit;
				} else break;
			}

			const foreignInvEur = foreignInvIncomeUsd / fxToUsd;
			const foreignTax = useSpecialRegime ? (foreignInvEur * 0.50) * 0.30 : foreignInvEur * 0.30;

			return {
				taxAmountHostCurr: tax + foreignTax,
				effectiveRatePercent: ((tax + foreignTax) / earnedIncome) * 100,
				detailsNote: useSpecialRegime
					? 'France Impatriate Regime (30% tax-free bonus exemption under Art. 155 B + 50% passive exemption)'
					: 'France Impôt sur le Revenu (11%–45% brackets) + 30% PFU on foreign passive income'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) return { ssAmountHostCurr: 0, detailsNote: 'Exempt under US-France Totalization Agreement (≤5 yrs)' };
			const ss = Math.min(earnedIncome * 0.14, 12000);
			return { ssAmountHostCurr: ss, detailsNote: 'French Social Charges (CSG/CRDS & Social Security)' };
		}
	},

	brazil: {
		id: 'brazil',
		name: 'Brazil',
		region: 'Americas',
		currencyCode: 'BRL',
		currencySymbol: 'R$',
		defaultFxToUsd: 0.18,
		defaultColRatio: 0.55,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Non-Resident Flat 25% Tax Rate',
		expatRegimeDescription: 'Flat 25% tax rate without progressive deductions during initial 183-day non-resident assignment period.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			if (useSpecialRegime) {
				const tax = earnedIncome * 0.25;
				return { taxAmountHostCurr: tax, effectiveRatePercent: 25, detailsNote: 'Brazil Initial Non-Resident Expat Flat 25% Tax Rate' };
			} else {
				const brackets = [
					{ limit: 26400, rate: 0.0 },
					{ limit: 33919, rate: 0.075 },
					{ limit: 45012, rate: 0.15 },
					{ limit: 55976, rate: 0.225 },
					{ limit: Infinity, rate: 0.275 }
				];
				let tax = 0, prev = 0;
				for (const b of brackets) {
					if (earnedIncome > prev) {
						tax += Math.min(earnedIncome - prev, b.limit - prev) * b.rate;
						prev = b.limit;
					} else break;
				}
				const foreignTax = (foreignInvIncomeUsd / fxToUsd) * 0.15;
				return {
					taxAmountHostCurr: tax + foreignTax,
					effectiveRatePercent: ((tax + foreignTax) / earnedIncome) * 100,
					detailsNote: 'Brazil Progressive IRPF (7.5%–27.5% max bracket)'
				};
			}
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) return { ssAmountHostCurr: 0, detailsNote: 'Exempt under US-Brazil Totalization Agreement (≤5 yrs)' };
			const ss = Math.min(earnedIncome * 0.14, 12000);
			return { ssAmountHostCurr: ss, detailsNote: 'Brazil INSS Social Security (Capped at R$1,000/mo)' };
		}
	},

	chile: {
		id: 'chile',
		name: 'Chile',
		region: 'Americas',
		currencyCode: 'CLP',
		currencySymbol: '$',
		defaultFxToUsd: 0.00105,
		defaultColRatio: 0.60,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Law 18.156 Pension & Health Exemption',
		expatRegimeDescription: 'Foreign specialists enrolled in a foreign social security scheme are 100% EXEMPT from Chilean pension (10%) and health (7%) contributions.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			const brackets = [
				{ limit: 10500000, rate: 0.0 },
				{ limit: 23300000, rate: 0.04 },
				{ limit: 38800000, rate: 0.08 },
				{ limit: 54300000, rate: 0.135 },
				{ limit: 69800000, rate: 0.23 },
				{ limit: 93100000, rate: 0.304 },
				{ limit: 240000000, rate: 0.35 },
				{ limit: Infinity, rate: 0.40 }
			];
			let tax = 0, prev = 0;
			for (const b of brackets) {
				if (earnedIncome > prev) {
					tax += Math.min(earnedIncome - prev, b.limit - prev) * b.rate;
					prev = b.limit;
				} else break;
			}
			const foreignTax = useSpecialRegime ? 0 : (foreignInvIncomeUsd / fxToUsd) * 0.35;
			return {
				taxAmountHostCurr: tax + foreignTax,
				effectiveRatePercent: ((tax + foreignTax) / earnedIncome) * 100,
				detailsNote: useSpecialRegime
					? 'Chile Impuesto Único al Trabajo (First 3-year foreign investment income tax holiday active)'
					: 'Chile Standard Impuesto Único al Trabajo (0%–40% progressive brackets)'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker, useSpecialRegime) => {
			if (isDetachedWorker || useSpecialRegime) return { ssAmountHostCurr: 0, detailsNote: '100% Exempt from Chilean Pension & Health under Ley N° 18.156 for Foreign Technicians' };
			const ss = Math.min(earnedIncome * 0.17, 6120000);
			return { ssAmountHostCurr: ss, detailsNote: 'Chile AFP Pension (10%) & Health (7%) capped at 81.6 UF' };
		}
	},

	argentina: {
		id: 'argentina',
		name: 'Argentina',
		region: 'Americas',
		currencyCode: 'ARS',
		currencySymbol: '$',
		defaultFxToUsd: 0.00085,
		defaultColRatio: 0.48,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Financial MEP Exchange Rate Arbitrage',
		expatRegimeDescription: 'Leverages the financial MEP / CCL exchange rate to maximize USD purchasing power against local Peso inflation.',
		calculateHostTax: (earnedIncome, useSpecialRegime, foreignInvIncomeUsd, fxToUsd) => {
			if (earnedIncome <= 0) return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: 'No income' };

			const nonTaxableMin = 36000000;
			const netTaxable = Math.max(0, earnedIncome - nonTaxableMin);
			const brackets = [
				{ limit: 5000000, rate: 0.05 },
				{ limit: 10000000, rate: 0.10 },
				{ limit: 20000000, rate: 0.15 },
				{ limit: 35000000, rate: 0.20 },
				{ limit: 50000000, rate: 0.25 },
				{ limit: 75000000, rate: 0.30 },
				{ limit: Infinity, rate: 0.35 }
			];
			let tax = 0, prev = 0;
			for (const b of brackets) {
				if (netTaxable > prev) {
					tax += Math.min(netTaxable - prev, b.limit - prev) * b.rate;
					prev = b.limit;
				} else break;
			}
			const foreignTax = (foreignInvIncomeUsd / fxToUsd) * 0.15;
			return {
				taxAmountHostCurr: tax + foreignTax,
				effectiveRatePercent: ((tax + foreignTax) / earnedIncome) * 100,
				detailsNote: useSpecialRegime
					? 'Argentina Impuesto a las Ganancias + Financial MEP Rate Purchasing Power Optimization'
					: 'Argentina Standard Impuesto a las Ganancias (5%–35% brackets)'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			if (isDetachedWorker) return { ssAmountHostCurr: 0, detailsNote: 'Exempt under Detached Worker Totalization Rule (≤5 yrs)' };
			const ss = Math.min(earnedIncome * 0.17, 18000000);
			return { ssAmountHostCurr: ss, detailsNote: 'Argentina SIPA & Obra Social (17% employee contribution capped)' };
		}
	},

	portugal: {
		id: 'portugal',
		name: 'Portugal',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.08,
		defaultColRatio: 0.75,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'IFICI (NHR 2.0)',
		expatRegimeDescription: 'Flat 20% tax on qualifying Portuguese income for 10 years; foreign-source income largely exempt.',
		calculateHostTax: (earnedIncome, useSpecialRegime) => {
			const tax = useSpecialRegime ? earnedIncome * 0.20 : calculatePortugalProgressive(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: useSpecialRegime ? '20% flat rate under IFICI (NHR 2.0)' : 'Standard Portuguese progressive up to 48%'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : earnedIncome * 0.11,
				detailsNote: isDetachedWorker ? 'Exempt under US-PT Totalization Agreement' : '11% employee social security contribution'
			};
		}
	},

	mexico: {
		id: 'mexico',
		name: 'Mexico',
		region: 'North America',
		currencyCode: 'MXN',
		currencySymbol: '$',
		defaultFxToUsd: 0.055,
		defaultColRatio: 0.60,
		hasSpecialExpatRegime: false,
		expatRegimeName: 'None',
		expatRegimeDescription: 'Taxes applied on worldwide income if considered a resident (usually >183 days).',
		calculateHostTax: (earnedIncome) => {
			const tax = calculateMexicoBrackets(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: 'Mexico progressive ISR rates ranging from 1.92% to 35%'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			const imssCap = 18000;
			const ss = Math.min(earnedIncome * 0.0275, imssCap);
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : ss,
				detailsNote: isDetachedWorker ? 'Exempt under detached worker rule' : 'IMSS social security employee contribution'
			};
		}
	},

	canada: {
		id: 'canada',
		name: 'Canada',
		region: 'North America',
		currencyCode: 'CAD',
		currencySymbol: 'C$',
		defaultFxToUsd: 0.74,
		defaultColRatio: 0.95,
		hasSpecialExpatRegime: false,
		expatRegimeName: 'None',
		expatRegimeDescription: 'Taxed on worldwide income; high reliance on US Foreign Tax Credits (Form 1116) to offset double taxation.',
		calculateHostTax: (earnedIncome) => {
			const tax = calculateCanadaFedPlusProvincial(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: 'Canada Federal (up to 33%) + Provincial progressive rates'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			const cppCap = 4050;
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : Math.min(earnedIncome * 0.0595, cppCap),
				detailsNote: isDetachedWorker ? 'Exempt under US-Canada Totalization' : 'CPP (Canada Pension Plan) & EI contributions'
			};
		}
	},

	switzerland: {
		id: 'switzerland',
		name: 'Switzerland',
		region: 'Europe',
		currencyCode: 'CHF',
		currencySymbol: 'CHF',
		defaultFxToUsd: 1.12,
		defaultColRatio: 1.40,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Expatriate Deductions',
		expatRegimeDescription: 'Special deductions for housing and international schooling for qualifying temporary assignments.',
		calculateHostTax: (earnedIncome, useSpecialRegime) => {
			const deductions = useSpecialRegime ? 18000 : 0;
			const taxBase = Math.max(0, earnedIncome - deductions);
			const tax = calculateSwissFedPlusCantonal(taxBase);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: useSpecialRegime ? 'Federal max 11.5% + Cantonal/Communal rates (with CHF 18k expat deduction)' : 'Federal max 11.5% + Cantonal/Communal rates'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : earnedIncome * 0.053,
				detailsNote: isDetachedWorker ? 'Exempt under US-Swiss Totalization' : 'AHV/IV standard 5.3% employee deduction'
			};
		}
	},

	netherlands: {
		id: 'netherlands',
		name: 'Netherlands',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.08,
		defaultColRatio: 1.05,
		hasSpecialExpatRegime: true,
		expatRegimeName: '30% Ruling',
		expatRegimeDescription: 'Up to 30% of gross salary is tax-free for up to 5 years (stable for 2025/2026 transition).',
		calculateHostTax: (earnedIncome, useSpecialRegime) => {
			const taxable = useSpecialRegime ? earnedIncome * 0.70 : earnedIncome;
			const tax = calculateDutchBox1(taxable);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: useSpecialRegime ? 'Dutch Box 1 progressive up to 49.5% on 70% taxable base' : 'Dutch Box 1 progressive up to 49.5%'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			const niCap = 10000;
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : Math.min(earnedIncome * 0.10, niCap),
				detailsNote: isDetachedWorker ? 'Exempt under US-NL Totalization' : 'Capped Dutch National Insurance'
			};
		}
	},

	uae: {
		id: 'uae',
		name: 'United Arab Emirates',
		region: 'Middle East',
		currencyCode: 'AED',
		currencySymbol: 'د.إ',
		defaultFxToUsd: 0.27,
		defaultColRatio: 0.90,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Zero Income Tax',
		expatRegimeDescription: 'The UAE levies 0% personal income tax on salaries and capital gains.',
		calculateHostTax: () => {
			return { taxAmountHostCurr: 0, effectiveRatePercent: 0, detailsNote: '0% Personal Income Tax in UAE' };
		},
		calculateHostSocialSecurity: () => {
			return { ssAmountHostCurr: 0, detailsNote: 'Expats do not contribute to UAE social security' };
		}
	},

	japan: {
		id: 'japan',
		name: 'Japan',
		region: 'Asia',
		currencyCode: 'JPY',
		currencySymbol: '¥',
		defaultFxToUsd: 0.0067,
		defaultColRatio: 0.85,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Non-Permanent Resident',
		expatRegimeDescription: 'Foreign-sourced income is exempt from Japanese tax provided it is not remitted into Japan.',
		calculateHostTax: (earnedIncome) => {
			const tax = calculateJapanNationalPlusLocal(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: 'Japan National (up to 45%) + Inhabitant Tax (10%)'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			const ssCap = 1200000;
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : Math.min(earnedIncome * 0.15, ssCap),
				detailsNote: isDetachedWorker ? 'Exempt if detached worker < 5 years (US-Japan agreement)' : 'Japan Social Insurance'
			};
		}
	},

	australia: {
		id: 'australia',
		name: 'Australia',
		region: 'Oceania',
		currencyCode: 'AUD',
		currencySymbol: 'A$',
		defaultFxToUsd: 0.65,
		defaultColRatio: 1.10,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Temporary Resident Status',
		expatRegimeDescription: 'Foreign-sourced passive income and capital gains are tax-free. Medicare levy exemption applies.',
		calculateHostTax: (earnedIncome) => {
			const tax = calculateAtoBrackets(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: 'Australia ATO progressive rates up to 45%'
			};
		},
		calculateHostSocialSecurity: () => {
			return { ssAmountHostCurr: 0, detailsNote: 'US-AU Totalization applies; temporary residents exempt from Medicare levy' };
		}
	},

	costa_rica: {
		id: 'costa_rica',
		name: 'Costa Rica',
		region: 'Central America',
		currencyCode: 'CRC',
		currencySymbol: '₡',
		defaultFxToUsd: 0.0020,
		defaultColRatio: 0.75,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Territorial Tax System',
		expatRegimeDescription: 'Foreign-sourced income is 100% exempt from Costa Rican tax.',
		calculateHostTax: (earnedIncome) => {
			const tax = calculateCRBrackets(earnedIncome);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: 'Progressive up to 25% on local Costa Rican income only'
			};
		},
		calculateHostSocialSecurity: (earnedIncome) => {
			return {
				ssAmountHostCurr: earnedIncome * 0.1067,
				detailsNote: '10.67% CCSS contribution (No Totalization Agreement with the US)'
			};
		}
	},

	italy: {
		id: 'italy',
		name: 'Italy',
		region: 'Europe',
		currencyCode: 'EUR',
		currencySymbol: '€',
		defaultFxToUsd: 1.08,
		defaultColRatio: 0.85,
		hasSpecialExpatRegime: true,
		expatRegimeName: 'Impatriati Regime (2026 Rules)',
		expatRegimeDescription: '50% exemption on Italian-sourced employment income (subject to €600k cap) for 5 years.',
		calculateHostTax: (earnedIncome, useSpecialRegime) => {
			const taxable = useSpecialRegime ? earnedIncome * 0.50 : earnedIncome;
			const tax = calculateItalyIrpef(taxable);
			return {
				taxAmountHostCurr: tax,
				effectiveRatePercent: (tax / earnedIncome) * 100,
				detailsNote: useSpecialRegime ? 'IRPEF progressive up to 43% applied to 50% taxable base' : 'IRPEF progressive up to 43%'
			};
		},
		calculateHostSocialSecurity: (earnedIncome, isDetachedWorker) => {
			return {
				ssAmountHostCurr: isDetachedWorker ? 0 : earnedIncome * 0.0919,
				detailsNote: isDetachedWorker ? 'Exempt under US-Italy Totalization' : 'Standard ~9.19% INPS employee social security'
			};
		}
	}
};
