import { useState, useMemo } from 'react';
import { calculateExpatFinancials, generate5YearProjections, type ExpatInputs } from '../../../lib/calculators/expat';
import { COUNTRY_PROFILES, type HostCountryId } from '../../../lib/calculators/expat-countries';
import { formatCurrency } from '../../../lib/calculators/format';

export default function ExpatEvaluatorCalculator() {
	const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'tax' | 'expenses' | 'fx' | 'wealth'>('dashboard');

	// --- Country Profile State ---
	const [hostCountryId, setHostCountryId] = useState<HostCountryId>('spain');
	const selectedCountry = COUNTRY_PROFILES[hostCountryId] || COUNTRY_PROFILES.spain;

	// --- Form Inputs State ---
	const [homeBaseSalary, setHomeBaseSalary] = useState(160000);
	const [homeBonus, setHomeBonus] = useState(25000);
	const [homeEquityAnnual, setHomeEquityAnnual] = useState(30000);
	const [homeSpouseIncome, setHomeSpouseIncome] = useState(65000);
	const [homeStateTaxRate, setHomeStateTaxRate] = useState(0.05);

	// Host Country Earnings (in Host Currency)
	const [hostBaseSalary, setHostBaseSalary] = useState(140000);
	const [hostBonus, setHostBonus] = useState(20000);
	const [hostEquityAnnual, setHostEquityAnnual] = useState(25000);

	// Spousal Income in Host Move Scenario
	const [spouseIncomeType, setSpouseIncomeType] = useState<'none' | 'remote' | 'local'>('remote');
	const [spouseIncomeAmount, setSpouseIncomeAmount] = useState(65000);

	// Corporate Relocation Subsidies & Allowances (in Host Currency)
	const [colaMonthly, setColaMonthly] = useState(800);
	const [housingAllowanceMonthly, setHousingAllowanceMonthly] = useState(1800);
	const [tuitionStipendAnnual, setTuitionStipendAnnual] = useState(12000);
	const [movingReimbursementOneTime, setMovingReimbursementOneTime] = useState(8000);

	// Tax Policy & Coverage Model
	const [taxPolicy, setTaxPolicy] = useState<'laissez-faire' | 'tax-equalization' | 'tax-protection'>('tax-equalization');

	// Host Tax Logic & Investments
	const [useSpecialRegime, setUseSpecialRegime] = useState(true);
	const [extendRegimeToDependents, setExtendRegimeToDependents] = useState(true);
	const [foreignInvestmentIncome, setForeignInvestmentIncome] = useState(15000);
	const [purchasedHomeInHost, setPurchasedHomeInHost] = useState(false);
	const [cadastralValue, setCadastralValue] = useState(250000);

	// Home Tax Logic (US Obligations)
	const [isUSCitizen, setIsUSCitizen] = useState(true);
	const [taxReliefMethod, setTaxReliefMethod] = useState<'auto' | 'feie' | 'ftc'>('auto');
	const [usFilingStatus, setUsFilingStatus] = useState<'single' | 'married'>('married');

	// Social Security & Totalization
	const [assignmentDurationYears, setAssignmentDurationYears] = useState(3);

	// Cost of Living & Expenses - Home Baseline (USD)
	const [homeRentOrMortgageMonthly, setHomeRentOrMortgageMonthly] = useState(3200);
	const [homeTuitionMonthly, setHomeTuitionMonthly] = useState(1200);
	const [homeHealthInsuranceMonthly, setHomeHealthInsuranceMonthly] = useState(500);
	const [discretionarySpendMonthly, setDiscretionarySpendMonthly] = useState(3500);

	// Cost of Living & Expenses - Host Destination (Host Currency)
	const [hostRentMonthly, setHostRentMonthly] = useState(2200);
	const [privateTuitionMonthly, setPrivateTuitionMonthly] = useState(1000);
	const [privateHealthInsuranceMonthly, setPrivateHealthInsuranceMonthly] = useState(450);
	const [hostColIndexRatio, setHostColIndexRatio] = useState(0.82);

	// FX & Liabilities
	const [fxRateHostToUsd, setFxRateHostToUsd] = useState(1.10);
	const [homeLiabilitiesUsdMonthly, setHomeLiabilitiesUsdMonthly] = useState(1500);
	const [hostLiabilitiesMonthly, setHostLiabilitiesMonthly] = useState(0);
	const [expectedInvestmentReturnRate, setExpectedInvestmentReturnRate] = useState(0.07);

	// Country Selection Handler
	const handleCountryChange = (countryId: HostCountryId) => {
		setHostCountryId(countryId);
		const profile = COUNTRY_PROFILES[countryId];
		if (profile) {
			setFxRateHostToUsd(profile.defaultFxToUsd);
			setHostColIndexRatio(profile.defaultColRatio);

			if (profile.currencyCode === 'CLP') {
				setHostBaseSalary(110000000); setHostBonus(15000000); setHostEquityAnnual(20000000);
				setHostRentMonthly(1200000); setColaMonthly(600000); setHousingAllowanceMonthly(1200000); setTuitionStipendAnnual(8000000);
				setPrivateTuitionMonthly(650000); setPrivateHealthInsuranceMonthly(300000);
			} else if (profile.currencyCode === 'ARS') {
				setHostBaseSalary(120000000); setHostBonus(18000000); setHostEquityAnnual(22000000);
				setHostRentMonthly(1500000); setColaMonthly(800000); setHousingAllowanceMonthly(1500000); setTuitionStipendAnnual(9000000);
				setPrivateTuitionMonthly(800000); setPrivateHealthInsuranceMonthly(400000);
			} else if (profile.currencyCode === 'BRL') {
				setHostBaseSalary(750000); setHostBonus(100000); setHostEquityAnnual(120000);
				setHostRentMonthly(12000); setColaMonthly(4000); setHousingAllowanceMonthly(8000); setTuitionStipendAnnual(60000);
				setPrivateTuitionMonthly(5000); setPrivateHealthInsuranceMonthly(2500);
			} else if (profile.currencyCode === 'MXN') {
				setHostBaseSalary(2200000); setHostBonus(300000); setHostEquityAnnual(400000);
				setHostRentMonthly(35000); setColaMonthly(12000); setHousingAllowanceMonthly(25000); setTuitionStipendAnnual(180000);
				setPrivateTuitionMonthly(18000); setPrivateHealthInsuranceMonthly(8000);
			} else if (profile.currencyCode === 'JPY') {
				setHostBaseSalary(18000000); setHostBonus(2500000); setHostEquityAnnual(3000000);
				setHostRentMonthly(280000); setColaMonthly(100000); setHousingAllowanceMonthly(200000); setTuitionStipendAnnual(1500000);
				setPrivateTuitionMonthly(150000); setPrivateHealthInsuranceMonthly(60000);
			} else if (profile.currencyCode === 'CRC') {
				setHostBaseSalary(75000000); setHostBonus(10000000); setHostEquityAnnual(12000000);
				setHostRentMonthly(1100000); setColaMonthly(400000); setHousingAllowanceMonthly(800000); setTuitionStipendAnnual(6000000);
				setPrivateTuitionMonthly(550000); setPrivateHealthInsuranceMonthly(250000);
			} else if (profile.currencyCode === 'AED') {
				setHostBaseSalary(520000); setHostBonus(80000); setHostEquityAnnual(100000);
				setHostRentMonthly(1100); setColaMonthly(3000); setHousingAllowanceMonthly(7000); setTuitionStipendAnnual(45000);
				setPrivateTuitionMonthly(4000); setPrivateHealthInsuranceMonthly(1800);
			} else {
				setHostBaseSalary(140000); setHostBonus(20000); setHostEquityAnnual(25000);
				setHostRentMonthly(2200); setColaMonthly(800); setHousingAllowanceMonthly(1800); setTuitionStipendAnnual(12000);
				setPrivateTuitionMonthly(1000); setPrivateHealthInsuranceMonthly(450);
			}
		}
	};

	const inputs = useMemo<ExpatInputs>(() => ({
		hostCountryId,
		homeBaseSalary,
		homeBonus,
		homeEquityAnnual,
		homeSpouseIncome,
		homeStateTaxRate,
		hostBaseSalary,
		hostBonus,
		hostEquityAnnual,
		spouseIncomeType,
		spouseIncomeAmount,
		colaMonthly,
		housingAllowanceMonthly,
		tuitionStipendAnnual,
		movingReimbursementOneTime,
		taxPolicy,
		useSpecialRegime,
		extendRegimeToDependents,
		foreignInvestmentIncome,
		purchasedHomeInHost,
		cadastralValue,
		isUSCitizen,
		taxReliefMethod,
		usFilingStatus,
		assignmentDurationYears,
		homeRentOrMortgageMonthly,
		homeTuitionMonthly,
		homeHealthInsuranceMonthly,
		hostRentMonthly,
		privateTuitionMonthly,
		privateHealthInsuranceMonthly,
		discretionarySpendMonthly,
		hostColIndexRatio,
		fxRateHostToUsd,
		homeLiabilitiesUsdMonthly,
		hostLiabilitiesMonthly,
		expectedInvestmentReturnRate
	}), [
		hostCountryId,
		homeBaseSalary, homeBonus, homeEquityAnnual, homeSpouseIncome, homeStateTaxRate,
		hostBaseSalary, hostBonus, hostEquityAnnual,
		spouseIncomeType, spouseIncomeAmount,
		colaMonthly, housingAllowanceMonthly, tuitionStipendAnnual, movingReimbursementOneTime,
		taxPolicy, useSpecialRegime, extendRegimeToDependents, foreignInvestmentIncome, purchasedHomeInHost, cadastralValue,
		isUSCitizen, taxReliefMethod, usFilingStatus, assignmentDurationYears,
		homeRentOrMortgageMonthly, homeTuitionMonthly, homeHealthInsuranceMonthly,
		hostRentMonthly, privateTuitionMonthly, privateHealthInsuranceMonthly,
		discretionarySpendMonthly, hostColIndexRatio, fxRateHostToUsd, homeLiabilitiesUsdMonthly, hostLiabilitiesMonthly, expectedInvestmentReturnRate
	]);

	const breakdown = useMemo(() => calculateExpatFinancials(inputs), [inputs]);
	const projections = useMemo(() => generate5YearProjections(inputs, breakdown), [inputs, breakdown]);

	return (
		<div className="space-y-8 p-4 sm:p-6 md:p-8 bg-[#F8FAFC] rounded-3xl min-h-screen text-slate-900 border border-slate-200/70 shadow-sm">
			{/* Header & Country Selector */}
			<div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
							<span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
							Expat Financial &amp; Tax Evaluator
						</span>
						<h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
							Comparative International Relocation Model
						</h1>
					</div>
					<div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
						<span className="text-xl">{selectedCountry.flagEmoji}</span>
						<span className="font-semibold text-sm text-slate-900">{selectedCountry.name}</span>
						<span className="text-xs font-mono text-slate-500">({selectedCountry.currencyCode})</span>
					</div>
				</div>

				<p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
					Evaluate net cash flow, tax relief (FEIE vs. FTC), special expat regimes, and 5-year wealth trajectory comparing your Stay (US Baseline) scenario against relocation to 17 destination countries.
				</p>

				{/* Destination Country Switcher with Flag Icons */}
				<div className="pt-4 border-t border-slate-100 space-y-3">
					<span className="block font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
						Select Host Country Destination
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.values(COUNTRY_PROFILES).map((c) => (
							<button
								key={c.id}
								onClick={() => handleCountryChange(c.id)}
								className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
									hostCountryId === c.id
										? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10'
										: 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
								}`}
							>
								<span className="text-base leading-none">{c.flagEmoji}</span>
								<span>{c.name}</span>
								<span className={`text-[10px] font-mono ${hostCountryId === c.id ? 'text-slate-300' : 'text-slate-400'}`}>
									{c.currencyCode}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Semantic Summary Metric Outcome Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Annual Free Cash Flow Delta Card */}
				<div className={`p-6 rounded-2xl border transition-all shadow-sm ${
					breakdown.annualCashFlowDelta >= 0
						? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200/80'
						: 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border-rose-200/80'
				}`}>
					<div className="flex items-center justify-between">
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
							Annual Cash Flow Delta
						</span>
						<span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
							breakdown.annualCashFlowDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
						}`}>
							{breakdown.annualCashFlowDelta >= 0 ? '▲ Net Surplus' : '▼ Net Deficit'}
						</span>
					</div>
					<div className={`text-4xl sm:text-5xl font-black tracking-tight mt-3 ${
						breakdown.annualCashFlowDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
					}`}>
						{breakdown.annualCashFlowDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.annualCashFlowDelta)}
					</div>
					<p className="mt-2 text-xs font-medium text-slate-600">
						{breakdown.annualCashFlowDelta >= 0
							? `Relocating to ${selectedCountry.name} yields higher net free cash flow`
							: 'Staying in the US produces higher net free cash flow'}
					</p>
				</div>

				{/* 5-Year Wealth Impact Card with Micro-Chart Sparkline */}
				<div className="p-6 bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
								5-Year Wealth Impact
							</span>
							{/* Micro Sparkline Visualizer */}
							<svg className="w-16 h-7" viewBox="0 0 60 25">
								<path d="M 0 20 Q 30 18 60 15" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
								<path d="M 0 20 Q 30 10 60 4" fill="none" stroke={breakdown.fiveYearWealthDelta >= 0 ? '#059669' : '#DC2626'} strokeWidth="2.5" />
							</svg>
						</div>
						<div className={`text-4xl sm:text-5xl font-black tracking-tight mt-3 ${
							breakdown.fiveYearWealthDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
						}`}>
							{breakdown.fiveYearWealthDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.fiveYearWealthDelta)}
						</div>
					</div>
					<p className="mt-2 text-xs font-medium text-slate-600">
						Cumulative difference over 5 years at {(expectedInvestmentReturnRate * 100).toFixed(0)}% return
					</p>
				</div>

				{/* Optimal US Tax Relief Card */}
				<div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
					<div>
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 block">
							Optimal US Tax Relief
						</span>
						<div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
							{breakdown.optimalTaxRelief}
						</div>
					</div>
					<div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
						<span className="text-slate-500 font-mono">Tax Savings Route</span>
						<span className="font-bold text-slate-800">
							{breakdown.optimalTaxRelief === 'FEIE' ? `FEIE: ${formatCurrency(breakdown.feieUsedAmount)}` : breakdown.optimalTaxRelief === 'FTC' ? `FTC: ${formatCurrency(breakdown.ftcUsedAmount)}` : 'N/A'}
						</span>
					</div>
				</div>
			</div>

			{/* Navigation Tabs with Active Pill Highlights */}
			<div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex gap-2 overflow-x-auto">
				{[
					{ id: 'dashboard', label: '1. Executive Summary' },
					{ id: 'income', label: '2. Income & Allowances' },
					{ id: 'tax', label: `3. ${selectedCountry.name} Tax Engine` },
					{ id: 'expenses', label: '4. Expenses & CoL' },
					{ id: 'fx', label: '5. FX & Liabilities' },
					{ id: 'wealth', label: '6. 5-Year Wealth Trajectory' }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
							activeTab === tab.id
								? 'bg-slate-900 text-white shadow-sm'
								: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* --- TAB 1: EXECUTIVE SUMMARY --- */}
			{activeTab === 'dashboard' && (
				<div className="space-y-6">
					{/* Regulatory & Tax Notices */}
					{breakdown.warnings.length > 0 && (
						<div className="bg-amber-50/60 border border-amber-200/80 p-5 rounded-2xl space-y-2">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
								<svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								Regulatory &amp; Tax Notices
							</span>
							<ul className="text-xs text-amber-900 space-y-1 list-disc pl-5 font-medium">
								{breakdown.warnings.map((w, idx) => (
									<li key={idx}>{w}</li>
								))}
							</ul>
						</div>
					)}

					{/* Executive Cash Flow Walkdown Table */}
					<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
							<h2 className="text-xl font-bold text-slate-900 tracking-tight">
								Stay (US Baseline) vs. Move ({selectedCountry.name}) Walkdown
							</h2>
							<span className="text-xs font-mono text-slate-500">All figures in USD ($)</span>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								<thead>
									<tr className="border-b border-slate-200 text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
										<th className="py-3.5 px-3">Financial Metric</th>
										<th className="py-3.5 px-3 text-right">Stay (US Baseline)</th>
										<th className="py-3.5 px-3 text-right bg-blue-50/50 rounded-t-xl">Move ({selectedCountry.name})</th>
										<th className="py-3.5 px-3 text-right">Net Delta</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
									<tr>
										<td className="py-3.5 px-3 font-semibold text-slate-900">Gross Earned Compensation</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayEarnedIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30">{formatCurrency(breakdown.moveBaseGross)}</td>
										<td className={`py-3.5 px-3 text-right font-mono font-bold ${
											breakdown.moveBaseGross - breakdown.stayEarnedIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'
										}`}>
											{formatCurrency(breakdown.moveBaseGross - breakdown.stayEarnedIncome)}
										</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 font-semibold text-slate-900">Global Investment Income (Passive)</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayInvestmentIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30">{formatCurrency(breakdown.moveInvestmentIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono text-slate-400">$0</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 font-semibold text-slate-900">Corporate Subsidies &amp; COLA</td>
										<td className="py-3.5 px-3 text-right font-mono text-slate-400">$0</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30 text-emerald-600">+{formatCurrency(breakdown.moveAllowancesTotal)}</td>
										<td className="py-3.5 px-3 text-right font-mono text-emerald-600">+{formatCurrency(breakdown.moveAllowancesTotal)}</td>
									</tr>
									<tr className="font-bold border-t border-slate-200 bg-slate-50/50">
										<td className="py-3.5 px-3 text-slate-900">Total Household Gross Income</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayGrossIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/50">{formatCurrency(breakdown.moveTotalGross)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.moveTotalGross - breakdown.stayGrossIncome)}</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 text-slate-600">Actual Total Taxes (Host + Home + SS)</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayTaxes)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30 text-rose-600">{formatCurrency(breakdown.actualTotalTaxesPaid)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.actualTotalTaxesPaid - breakdown.stayTaxes)}</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 text-slate-600">Employer Tax Policy Reimbursement</td>
										<td className="py-3.5 px-3 text-right font-mono text-slate-400">$0</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30 text-emerald-600">+{formatCurrency(breakdown.employerTaxReimbursement)}</td>
										<td className="py-3.5 px-3 text-right font-mono text-emerald-600">+{formatCurrency(breakdown.employerTaxReimbursement)}</td>
									</tr>
									<tr className="font-bold border-t border-slate-200 bg-slate-50/50">
										<td className="py-3.5 px-3 text-slate-900">Net Take-Home Pay</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayNetIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/50">{formatCurrency(breakdown.moveNetIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.moveNetIncome - breakdown.stayNetIncome)}</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 text-slate-600">Local Living Expenses &amp; Fixed Costs</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayLivingExpenses)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30">{formatCurrency(breakdown.moveLivingExpenses)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.moveLivingExpenses - breakdown.stayLivingExpenses)}</td>
									</tr>
									<tr>
										<td className="py-3.5 px-3 text-slate-600">Total Liabilities &amp; Debt (USD + Host)</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayHomeLiabilities)}</td>
										<td className="py-3.5 px-3 text-right font-mono bg-blue-50/30">{formatCurrency(breakdown.moveTotalLiabilitiesUsd)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.moveTotalLiabilitiesUsd - breakdown.stayHomeLiabilities)}</td>
									</tr>
									<tr className="font-black text-base border-t-2 border-slate-900 bg-slate-900 text-white rounded-b-xl">
										<td className="py-4 px-3">Annual Free Cash Flow</td>
										<td className="py-4 px-3 text-right font-mono">{formatCurrency(breakdown.stayAnnualFreeCashFlow)}</td>
										<td className="py-4 px-3 text-right font-mono">{formatCurrency(breakdown.moveAnnualFreeCashFlow)}</td>
										<td className={`py-4 px-3 text-right font-mono ${
											breakdown.annualCashFlowDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
										}`}>
											{breakdown.annualCashFlowDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.annualCashFlowDelta)}
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 2: INCOME & ALLOWANCES --- */}
			{activeTab === 'income' && (
				<div className="grid gap-8 md:grid-cols-2">
					{/* Left Panel: Stay Scenario (Home Baseline) */}
					<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
								Stay Scenario (Home Baseline)
							</span>
							<span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
								🇺🇸 United States ($ USD)
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">US Base &amp; Household Earnings</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Primary Base Salary ($ USD / Year)
								</label>
								<div className="relative">
									<span className="absolute left-3 top.1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={homeBaseSalary}
										onChange={(e) => setHomeBaseSalary(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Annual Bonus ($ USD)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={homeBonus}
										onChange={(e) => setHomeBonus(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Annual Equity Vesting ($ USD)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={homeEquityAnnual}
										onChange={(e) => setHomeEquityAnnual(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
									/>
								</div>
							</div>

							<div className="border-t border-slate-100 pt-4">
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Spousal Annual Income in Home Country ($ USD)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={homeSpouseIncome}
										onChange={(e) => setHomeSpouseIncome(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all outline-none"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel: Move Scenario (Cool-tinted Host Destination) */}
					<div className="bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 rounded-2xl border border-blue-100 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-blue-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-900">
								Move Scenario ({selectedCountry.name})
							</span>
							<span className="text-xs font-bold text-indigo-900 bg-blue-100/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
								<span>{selectedCountry.flagEmoji}</span>
								<span>{selectedCountry.currencyCode} ({selectedCountry.currencySymbol})</span>
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">Host Compensation ({selectedCountry.currencySymbol})</h3>

						<div className="space-y-4">
							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">
										Base ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostBaseSalary}
										onChange={(e) => setHostBaseSalary(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">
										Bonus ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostBonus}
										onChange={(e) => setHostBonus(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">
										Equity ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostEquityAnnual}
										onChange={(e) => setHostEquityAnnual(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all outline-none"
									/>
								</div>
							</div>

							<div className="border-t border-blue-100 pt-4">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Spousal Income Post-Move</span>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">Employment Type</label>
										<select
											value={spouseIncomeType}
											onChange={(e) => setSpouseIncomeType(e.target.value as any)}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-indigo-600 outline-none"
										>
											<option value="none">No Income Post-Move</option>
											<option value="remote">Remote (Keeps Home Income)</option>
											<option value="local">Local (Host Country Sourced)</option>
										</select>
									</div>
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">Annual Amount ({spouseIncomeType === 'local' ? selectedCountry.currencySymbol : '$ USD'})</label>
										<input
											type="number"
											disabled={spouseIncomeType === 'none'}
											value={spouseIncomeAmount}
											onChange={(e) => setSpouseIncomeAmount(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 disabled:opacity-50 outline-none"
										/>
									</div>
								</div>
							</div>

							<div className="border-t border-blue-100 pt-4 space-y-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 block">Expat Relocation Allowances ({selectedCountry.currencySymbol})</span>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">COLA Monthly ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={colaMonthly}
											onChange={(e) => setColaMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">Housing Allowance Monthly ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={housingAllowanceMonthly}
											onChange={(e) => setHousingAllowanceMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">Tuition Stipend Annual ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={tuitionStipendAnnual}
											onChange={(e) => setTuitionStipendAnnual(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-slate-600 mb-1">Moving Reimbursement ($ USD)</label>
										<input
											type="number"
											value={movingReimbursementOneTime}
											onChange={(e) => setMovingReimbursementOneTime(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 3: INTERNATIONAL TAXATION ENGINE --- */}
			{activeTab === 'tax' && (
				<div className="grid gap-8 md:grid-cols-2">
					{/* Host Tax Panel */}
					<div className="bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 rounded-2xl border border-blue-100 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-blue-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-900">
								Host Tax Engine ({selectedCountry.name})
							</span>
							<span className="text-xs font-bold text-indigo-900 bg-blue-100/70 px-2.5 py-1 rounded-lg">
								{selectedCountry.flagEmoji} {selectedCountry.currencyCode}
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">{selectedCountry.expatRegimeName}</h3>

						<div className="space-y-4 pt-1 text-xs">
							{selectedCountry.hasSpecialExpatRegime && (
								<div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100">
									<div>
										<span className="font-bold text-slate-900 block text-sm">Special Expat Tax Regime</span>
										<span className="text-slate-500 text-xs">{selectedCountry.expatRegimeDescription}</span>
									</div>
									<input
										type="checkbox"
										checked={useSpecialRegime}
										onChange={(e) => setUseSpecialRegime(e.target.checked)}
										className="h-5 w-5 rounded accent-indigo-600 cursor-pointer"
									/>
								</div>
							)}

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									Global Passive &amp; Investment Income ($ USD / Year)
								</label>
								<p className="text-slate-500 text-[11px] mb-1.5">Dividends, interest &amp; capital gains (Evaluated under host regime rules).</p>
								<input
									type="number"
									value={foreignInvestmentIncome}
									onChange={(e) => setForeignInvestmentIncome(Math.max(0, Number(e.target.value)))}
									className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
								/>
							</div>

							<div className="bg-white p-4 rounded-xl border border-blue-100">
								<span className="text-xs font-mono uppercase text-slate-400 block mb-1">Tax Engine Note</span>
								<p className="font-mono text-xs text-slate-800 font-semibold">
									{breakdown.hostTaxDetailsNote}
								</p>
							</div>
						</div>
					</div>

					{/* Home US Tax Panel */}
					<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
								Home Tax Logic (U.S.)
							</span>
							<span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
								🇺🇸 Worldwide Obligations
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">Treaties &amp; Tax Coverage Policy</h3>

						<div className="space-y-4 pt-1 text-xs">
							<div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
								<div>
									<span className="font-bold text-slate-900 block text-sm">U.S. Citizen / Green Card Holder</span>
									<span className="text-slate-500 text-xs">Subject to US worldwide income tax regardless of residence</span>
								</div>
								<input
									type="checkbox"
									checked={isUSCitizen}
									onChange={(e) => setIsUSCitizen(e.target.checked)}
									className="h-5 w-5 rounded accent-slate-900 cursor-pointer"
								/>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									US State Tax Rate Jurisdiction (Stay Scenario)
								</label>
								<select
									value={homeStateTaxRate}
									onChange={(e) => setHomeStateTaxRate(Number(e.target.value))}
									className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
								>
									<option value={0.0}>0.0% — No State Income Tax (TX, FL, WA, NV, WY, SD, TN, AK)</option>
									<option value={0.0307}>3.07% — Low State Tax (e.g. PA)</option>
									<option value={0.05}>5.00% — National US Average State Tax</option>
									<option value={0.0685}>6.85% — Mid-High State Tax (e.g. NY)</option>
									<option value={0.093}>9.30% — High State Tax (e.g. CA)</option>
								</select>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">
									US Federal Tax Relief Method
								</label>
								<select
									value={taxReliefMethod}
									onChange={(e) => setTaxReliefMethod(e.target.value as any)}
									className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
								>
									<option value="auto">Auto-Select Optimal (FEIE vs FTC)</option>
									<option value="feie">Foreign Earned Income Exclusion (FEIE - Max $126,500)</option>
									<option value="ftc">Foreign Tax Credit (FTC - Dollar-for-dollar offset)</option>
								</select>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Tax Policy Coverage</label>
								<select
									value={taxPolicy}
									onChange={(e) => setTaxPolicy(e.target.value as any)}
									className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none"
								>
									<option value="tax-equalization">Tax Equalization (Employee burden stays identical to Stay scenario)</option>
									<option value="tax-protection">Tax Protection (Employer pays excess if host taxes &gt; home taxes)</option>
									<option value="laissez-faire">Laissez-Faire (Employee pays all host &amp; home taxes independently)</option>
								</select>
							</div>

							<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
								<span className="font-mono text-xs uppercase text-slate-500 block">Totalization Agreement (Social Security)</span>
								<div>
									<label className="block text-slate-600 mb-1 font-medium">Assignment Duration (Years)</label>
									<input
										type="number"
										min={1}
										max={10}
										value={assignmentDurationYears}
										onChange={(e) => setAssignmentDurationYears(Math.max(1, Number(e.target.value)))}
										className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-900"
									/>
								</div>
								<p className="text-[11px] text-slate-600">
									Status: <strong>{breakdown.totalizationSocialSecurityModel}</strong>
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 4: EXPENSES & COST OF LIVING --- */}
			{activeTab === 'expenses' && (
				<div className="grid gap-8 md:grid-cols-2">
					{/* Left Panel: Stay Expenses */}
					<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-slate-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
								Home Living Expenses ($ USD)
							</span>
							<span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
								🇺🇸 Stay Outlays
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">Home Country Baseline Costs</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Home Rent or Mortgage ($ USD / Month)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={homeRentOrMortgageMonthly}
										onChange={(e) => setHomeRentOrMortgageMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Private School Tuition ($/Mo)</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
										<input
											type="number"
											value={homeTuitionMonthly}
											onChange={(e) => setHomeTuitionMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
								</div>
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Private Health Insurance ($/Mo)</label>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
										<input
											type="number"
											value={homeHealthInsuranceMonthly}
											onChange={(e) => setHomeHealthInsuranceMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
										/>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Discretionary Spending Baseline ($ USD / Month)
								</label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
									<input
										type="number"
										value={discretionarySpendMonthly}
										onChange={(e) => setDiscretionarySpendMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full pl-8 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Right Panel: Host Expenses */}
					<div className="bg-gradient-to-br from-blue-50/40 via-white to-sky-50/30 rounded-2xl border border-blue-100 shadow-sm p-6 space-y-5">
						<div className="flex items-center justify-between border-b border-blue-100 pb-3">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-900">
								Host Expenses ({selectedCountry.name})
							</span>
							<span className="text-xs font-bold text-indigo-900 bg-blue-100/70 px-2.5 py-1 rounded-lg">
								{selectedCountry.flagEmoji} {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
							</span>
						</div>

						<h3 className="text-lg font-bold text-slate-900">Host Destination Costs ({selectedCountry.currencySymbol})</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Host Rent ({selectedCountry.currencySymbol} / Month)
								</label>
								<input
									type="number"
									value={hostRentMonthly}
									onChange={(e) => setHostRentMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
								/>
							</div>

							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Private School Tuition ({selectedCountry.currencySymbol}/Mo)</label>
									<input
										type="number"
										value={privateTuitionMonthly}
										onChange={(e) => setPrivateTuitionMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
									/>
								</div>
								<div>
									<label className="block text-xs font-semibold text-slate-700 mb-1">Private Health Insurance ({selectedCountry.currencySymbol}/Mo)</label>
									<input
										type="number"
										value={privateHealthInsuranceMonthly}
										onChange={(e) => setPrivateHealthInsuranceMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
									/>
								</div>
							</div>

							<div>
								<label className="block text-xs font-semibold text-slate-700 mb-1.5">
									Host Cost of Living Multiplier ({(hostColIndexRatio * 100).toFixed(0)}%)
								</label>
								<input
									type="range"
									min={0.3}
									max={1.5}
									step={0.01}
									value={hostColIndexRatio}
									onChange={(e) => setHostColIndexRatio(Number(e.target.value))}
									className="w-full h-2 rounded-lg bg-slate-200 accent-indigo-600 cursor-pointer"
								/>
								<span className="text-xs text-slate-600 font-medium">
									{hostColIndexRatio < 1
										? `Host city in ${selectedCountry.name} is ${((1 - hostColIndexRatio) * 100).toFixed(0)}% cheaper than home`
										: `Host city in ${selectedCountry.name} is ${((hostColIndexRatio - 1) * 100).toFixed(0)}% pricier than home`}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 5: FX & LIABILITIES --- */}
			{activeTab === 'fx' && (
				<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
					<h3 className="text-xl font-bold text-slate-900 tracking-tight">Foreign Exchange &amp; Cross-Border Debt Servicing</h3>

					<div className="grid gap-6 md:grid-cols-2">
						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Exchange Rate ({selectedCountry.currencyCode} to USD)
							</label>
							<input
								type="number"
								step={0.0001}
								value={fxRateHostToUsd}
								onChange={(e) => setFxRateHostToUsd(Math.max(0.00001, Number(e.target.value)))}
								className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
							/>
							<span className="text-xs text-slate-500 font-mono mt-1 block">1 {selectedCountry.currencyCode} = ${fxRateHostToUsd} USD</span>
						</div>

						<div>
							<label className="block text-xs font-semibold text-slate-700 mb-1.5">
								Home-Currency Monthly Liabilities ($ USD)
							</label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">$</span>
								<input
									type="number"
									value={homeLiabilitiesUsdMonthly}
									onChange={(e) => setHomeLiabilitiesUsdMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
								/>
							</div>
							<span className="text-xs text-slate-500 mt-1 block">US mortgage, student loans, 401(k) / IRA contributions</span>
						</div>
					</div>

					<div className="grid gap-6 md:grid-cols-2 border-t border-slate-100 pt-6">
						<div>
							<label className="block text-xs font-semibold text-indigo-900 mb-1.5">
								Host-Currency Monthly Liabilities ({selectedCountry.currencySymbol} {selectedCountry.currencyCode})
							</label>
							<input
								type="number"
								value={hostLiabilitiesMonthly}
								onChange={(e) => setHostLiabilitiesMonthly(Math.max(0, Number(e.target.value)))}
								className="w-full px-3 py-2.5 bg-blue-50/50 border border-blue-200 rounded-xl text-sm font-mono text-slate-900 outline-none"
							/>
							<span className="text-xs text-slate-500 mt-1 block">Host local car lease, local debt, or host pension contributions</span>
						</div>

						<div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
								Combined Debt Servicing Summary
							</span>
							<p className="text-lg font-mono text-slate-900 font-bold mt-1">
								Total Move Debt: {formatCurrency(breakdown.moveTotalLiabilitiesUsd)} / year
							</p>
							<p className="text-xs text-slate-500 font-mono">
								Home USD Debt: {formatCurrency(breakdown.moveHomeLiabilities)} + Host Debt: {formatCurrency(breakdown.moveHostLiabilitiesUsd)}
							</p>
						</div>
					</div>

					<div className="border-t border-slate-100 pt-4 space-y-2">
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
							<svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Translation Risk Exposure (Host Currency Weakening)
						</span>
						<p className="text-sm text-slate-600">
							If host currency ({selectedCountry.currencyCode}) depreciates by 10% against USD (from ${fxRateHostToUsd} to ${(fxRateHostToUsd * 0.9).toFixed(5)}), servicing your annual ${formatCurrency(breakdown.moveTotalLiabilitiesUsd)} USD liabilities requires an extra <strong>{formatCurrency(breakdown.fxDepreciationImpactUsd)}</strong> in host earnings per year.
						</p>
					</div>
				</div>
			)}

			{/* --- TAB 6: 5-YEAR WEALTH TRAJECTORY --- */}
			{activeTab === 'wealth' && (
				<div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
						<div>
							<h3 className="text-xl font-bold text-slate-900 tracking-tight">5-Year Cumulative Wealth Trajectory</h3>
							<p className="text-xs text-slate-500">Compares cumulative wealth accumulation in the US vs. {selectedCountry.name}.</p>
						</div>
						<div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
							<span className="text-xs font-mono uppercase text-slate-500">Assumed Growth Rate</span>
							<input
								type="number"
								step={0.01}
								min={0}
								max={0.2}
								value={expectedInvestmentReturnRate}
								onChange={(e) => setExpectedInvestmentReturnRate(Math.max(0, Number(e.target.value)))}
								className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none"
							/>
						</div>
					</div>

					{/* Visual Bar Comparison Charts */}
					<div className="space-y-5">
						{projections.map((p) => {
							const maxVal = Math.max(...projections.map((x) => Math.max(x.stayCumulativeWealth, x.moveCumulativeWealth)), 1);
							const stayPct = Math.min(100, Math.max(5, (p.stayCumulativeWealth / maxVal) * 100));
							const movePct = Math.min(100, Math.max(5, (p.moveCumulativeWealth / maxVal) * 100));

							return (
								<div key={p.year} className="space-y-2 font-mono text-xs bg-slate-50/60 p-4 rounded-xl border border-slate-100">
									<div className="flex justify-between items-center text-slate-900 font-bold">
										<span>Year {p.year} Accumulation</span>
										<span className={`px-2 py-0.5 rounded-md font-bold ${
											p.wealthDelta >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
										}`}>
											Net Delta: {p.wealthDelta >= 0 ? '+' : ''}{formatCurrency(p.wealthDelta)}
										</span>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
										<div>
											<div className="flex justify-between text-[11px] text-slate-500 mb-1">
												<span>Stay (US Baseline)</span>
												<span className="font-bold text-slate-700">{formatCurrency(p.stayCumulativeWealth)}</span>
											</div>
											<div className="h-3.5 bg-slate-200 rounded-full overflow-hidden">
												<div className="h-full bg-slate-500 rounded-full transition-all" style={{ width: `${stayPct}%` }} />
											</div>
										</div>
										<div>
											<div className="flex justify-between text-[11px] text-indigo-900 mb-1">
												<span>Move ({selectedCountry.name})</span>
												<span className="font-bold text-emerald-600">{formatCurrency(p.moveCumulativeWealth)}</span>
											</div>
											<div className="h-3.5 bg-slate-200 rounded-full overflow-hidden">
												<div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${movePct}%` }} />
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
						<p>
							Note: Projections assume annual household free cash flow is reinvested and compounded annually at {(expectedInvestmentReturnRate * 100).toFixed(1)}%.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
