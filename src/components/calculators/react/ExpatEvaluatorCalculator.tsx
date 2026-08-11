import { useState, useMemo } from 'react';
import { calculateExpatFinancials, generate5YearProjections, type ExpatInputs } from '../../../lib/calculators/expat';
import { COUNTRY_PROFILES, type HostCountryId, type CountryProfile } from '../../../lib/calculators/expat-countries';
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
	const [homeSpouseIncome, setHomeSpouseIncome] = useState(65000); // Spousal income in Stay scenario

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

	// Host Tax Logic
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

	// Cost of Living & Expenses
	const [homeRentOrMortgageMonthly, setHomeRentOrMortgageMonthly] = useState(3200);
	const [hostRentMonthly, setHostRentMonthly] = useState(2200);
	const [privateTuitionMonthly, setPrivateTuitionMonthly] = useState(1000);
	const [privateHealthInsuranceMonthly, setPrivateHealthInsuranceMonthly] = useState(450);
	const [discretionarySpendMonthly, setDiscretionarySpendMonthly] = useState(3500);
	const [hostColIndexRatio, setHostColIndexRatio] = useState(0.82);

	// FX & Liabilities
	const [fxRateHostToUsd, setFxRateHostToUsd] = useState(1.10);
	const [homeLiabilitiesUsdMonthly, setHomeLiabilitiesUsdMonthly] = useState(1500);
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
			} else if (profile.currencyCode === 'ARS') {
				setHostBaseSalary(120000000); setHostBonus(18000000); setHostEquityAnnual(22000000);
				setHostRentMonthly(1500000); setColaMonthly(800000); setHousingAllowanceMonthly(1500000); setTuitionStipendAnnual(9000000);
			} else if (profile.currencyCode === 'BRL') {
				setHostBaseSalary(750000); setHostBonus(100000); setHostEquityAnnual(120000);
				setHostRentMonthly(12000); setColaMonthly(4000); setHousingAllowanceMonthly(8000); setTuitionStipendAnnual(60000);
			} else if (profile.currencyCode === 'MXN') {
				setHostBaseSalary(2200000); setHostBonus(300000); setHostEquityAnnual(400000);
				setHostRentMonthly(35000); setColaMonthly(12000); setHousingAllowanceMonthly(25000); setTuitionStipendAnnual(180000);
			} else if (profile.currencyCode === 'JPY') {
				setHostBaseSalary(18000000); setHostBonus(2500000); setHostEquityAnnual(3000000);
				setHostRentMonthly(280000); setColaMonthly(100000); setHousingAllowanceMonthly(200000); setTuitionStipendAnnual(1500000);
			} else if (profile.currencyCode === 'CRC') {
				setHostBaseSalary(75000000); setHostBonus(10000000); setHostEquityAnnual(12000000);
				setHostRentMonthly(1100000); setColaMonthly(400000); setHousingAllowanceMonthly(800000); setTuitionStipendAnnual(6000000);
			} else if (profile.currencyCode === 'AED') {
				setHostBaseSalary(520000); setHostBonus(80000); setHostEquityAnnual(100000);
				setHostRentMonthly(1100); setColaMonthly(3000); setHousingAllowanceMonthly(7000); setTuitionStipendAnnual(45000);
			} else {
				setHostBaseSalary(140000); setHostBonus(20000); setHostEquityAnnual(25000);
				setHostRentMonthly(2200); setColaMonthly(800); setHousingAllowanceMonthly(1800); setTuitionStipendAnnual(12000);
			}
		}
	};

	const inputs = useMemo<ExpatInputs>(() => ({
		hostCountryId,
		homeBaseSalary,
		homeBonus,
		homeEquityAnnual,
		homeSpouseIncome,
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
		hostRentMonthly,
		privateTuitionMonthly,
		privateHealthInsuranceMonthly,
		discretionarySpendMonthly,
		hostColIndexRatio,
		fxRateHostToUsd,
		homeLiabilitiesUsdMonthly,
		expectedInvestmentReturnRate
	}), [
		hostCountryId,
		homeBaseSalary, homeBonus, homeEquityAnnual, homeSpouseIncome,
		hostBaseSalary, hostBonus, hostEquityAnnual,
		spouseIncomeType, spouseIncomeAmount,
		colaMonthly, housingAllowanceMonthly, tuitionStipendAnnual, movingReimbursementOneTime,
		taxPolicy, useSpecialRegime, extendRegimeToDependents, foreignInvestmentIncome, purchasedHomeInHost, cadastralValue,
		isUSCitizen, taxReliefMethod, usFilingStatus, assignmentDurationYears,
		homeRentOrMortgageMonthly, hostRentMonthly, privateTuitionMonthly, privateHealthInsuranceMonthly,
		discretionarySpendMonthly, hostColIndexRatio, fxRateHostToUsd, homeLiabilitiesUsdMonthly, expectedInvestmentReturnRate
	]);

	const breakdown = useMemo(() => calculateExpatFinancials(inputs), [inputs]);
	const projections = useMemo(() => generate5YearProjections(inputs, breakdown), [inputs, breakdown]);

	return (
		<div className="space-y-10 bg-white text-[#1A1A1A]">
			{/* Title & Country Selector Header */}
			<div className="space-y-4">
				<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">
					Comparative Financial &amp; Tax Model
				</span>
				<h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] tracking-tight">
					Expat Financial &amp; Tax Evaluator
				</h1>
				<p className="text-base sm:text-lg text-[#5E5E5E] max-w-3xl leading-relaxed">
					Model net cash flow and 5-year wealth impact for relocation from the United States to 17 global expat destinations across Europe, the Americas, Asia, Oceania, and the Middle East.
				</p>

				{/* Modular Destination Country Switcher */}
				<div className="pt-2 border-t border-[#E5E5E5]">
					<span className="block font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C] mb-2">
						Select Host Country Destination
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.values(COUNTRY_PROFILES).map((c) => (
							<button
								key={c.id}
								onClick={() => handleCountryChange(c.id)}
								className={`px-3 py-1.5 text-xs font-bold font-mono transition cursor-pointer border ${
									hostCountryId === c.id
										? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
										: 'bg-white text-[#1A1A1A] border-[#E5E5E5] hover:border-[#1A1A1A]'
								}`}
							>
								{c.name} ({c.currencySymbol} {c.currencyCode})
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Naked Summary Metrics Header */}
			<div className="flex flex-col md:flex-row gap-8 py-8 border-y border-[#E5E5E5]">
				<div className="flex flex-col">
					<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C] mb-2">
						Annual Free Cash Flow Delta
					</span>
					<span className={`text-5xl sm:text-6xl font-black tracking-tight leading-none ${breakdown.annualCashFlowDelta >= 0 ? 'text-[#1A1A1A]' : 'text-[#B85C5C]'}`}>
						{breakdown.annualCashFlowDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.annualCashFlowDelta)}
					</span>
					<span className="mt-2 text-xs font-mono text-[#5E5E5E]">
						{breakdown.annualCashFlowDelta >= 0 ? `Move to ${selectedCountry.name} generates higher cash flow` : 'Stay in US produces higher cash flow'}
					</span>
				</div>

				<div className="hidden md:block w-px bg-[#E5E5E5]" />

				<div className="flex flex-col">
					<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C] mb-2">
						5-Year Wealth Impact
					</span>
					<span className={`text-5xl sm:text-6xl font-black tracking-tight leading-none ${breakdown.fiveYearWealthDelta >= 0 ? 'text-[#5A7A8F]' : 'text-[#B85C5C]'}`}>
						{breakdown.fiveYearWealthDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.fiveYearWealthDelta)}
					</span>
					<span className="mt-2 text-xs font-mono text-[#5E5E5E]">
						Cumulative difference at {(expectedInvestmentReturnRate * 100).toFixed(0)}% return
					</span>
				</div>

				<div className="hidden md:block w-px bg-[#E5E5E5]" />

				<div className="flex flex-col">
					<span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#8C8C8C] mb-2">
						Optimal US Tax Relief
					</span>
					<span className="text-5xl sm:text-6xl font-black text-[#1A1A1A] tracking-tight leading-none">
						{breakdown.optimalTaxRelief}
					</span>
					<span className="mt-2 text-xs font-mono text-[#5E5E5E]">
						{breakdown.optimalTaxRelief === 'FEIE' ? `FEIE Used: ${formatCurrency(breakdown.feieUsedAmount)}` : breakdown.optimalTaxRelief === 'FTC' ? `FTC Credit: ${formatCurrency(breakdown.ftcUsedAmount)}` : 'No US Tax Obligations'}
					</span>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="flex border-b border-[#E5E5E5] gap-6 overflow-x-auto">
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
						className={`pb-3 text-sm font-bold transition whitespace-nowrap cursor-pointer ${
							activeTab === tab.id
								? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]'
								: 'border-transparent text-[#8C8C8C] hover:text-[#1A1A1A]'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* --- TAB 1: EXECUTIVE SUMMARY --- */}
			{activeTab === 'dashboard' && (
				<div className="space-y-8">
					{/* Warnings Banner */}
					{breakdown.warnings.length > 0 && (
						<div className="border border-[#C88D4E] bg-white p-5 rounded-none space-y-2">
							<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#C88D4E]">
								Regulatory &amp; Tax Notices
							</span>
							<ul className="text-xs text-[#5E5E5E] space-y-1 list-disc pl-4">
								{breakdown.warnings.map((w, idx) => (
									<li key={idx}>{w}</li>
								))}
							</ul>
						</div>
					)}

					{/* Side-by-side Table Comparison */}
					<div className="border border-[#E5E5E5] p-6 space-y-6">
						<h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">
							Stay (US Baseline) vs. Move ({selectedCountry.name} Assignment) Cash Flow Walkdown
						</h2>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								<thead>
									<tr className="border-b border-[#E5E5E5] text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">
										<th className="py-3">Financial Metric</th>
										<th className="py-3 text-right">Stay (US Baseline)</th>
										<th className="py-3 text-right">Move ({selectedCountry.name})</th>
										<th className="py-3 text-right">Net Delta</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-[#E5E5E5] text-[#1A1A1A]">
									<tr>
										<td className="py-3 font-semibold">Gross Earned Compensation</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayGrossIncome)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveBaseGross)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveBaseGross - breakdown.stayGrossIncome)}</td>
									</tr>
									<tr>
										<td className="py-3 font-semibold">Corporate Subsidies &amp; COLA</td>
										<td className="py-3 text-right font-mono text-[#8C8C8C]">$0</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveAllowancesTotal)}</td>
										<td className="py-3 text-right font-mono text-[#5A7A8F]">+{formatCurrency(breakdown.moveAllowancesTotal)}</td>
									</tr>
									<tr className="font-bold border-t border-[#E5E5E5]">
										<td className="py-3">Total Household Gross Income</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayGrossIncome)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveTotalGross)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveTotalGross - breakdown.stayGrossIncome)}</td>
									</tr>
									<tr>
										<td className="py-3 text-semibold text-[#5E5E5E]">Actual Total Taxes (Host + Home + SS)</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayTaxes)}</td>
										<td className="py-3 text-right font-mono text-[#B85C5C]">{formatCurrency(breakdown.actualTotalTaxesPaid)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.actualTotalTaxesPaid - breakdown.stayTaxes)}</td>
									</tr>
									<tr>
										<td className="py-3 text-semibold text-[#5E5E5E]">Employer Tax Policy Reimbursement</td>
										<td className="py-3 text-right font-mono text-[#8C8C8C]">$0</td>
										<td className="py-3 text-right font-mono text-[#5A7A8F]">+{formatCurrency(breakdown.employerTaxReimbursement)}</td>
										<td className="py-3 text-right font-mono">+{formatCurrency(breakdown.employerTaxReimbursement)}</td>
									</tr>
									<tr className="font-bold border-t border-[#E5E5E5]">
										<td className="py-3">Net Take-Home Pay</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayNetIncome)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveNetIncome)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveNetIncome - breakdown.stayNetIncome)}</td>
									</tr>
									<tr>
										<td className="py-3 text-semibold text-[#5E5E5E]">Local Living Expenses &amp; Expat Fixed</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayLivingExpenses)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveLivingExpenses)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveLivingExpenses - breakdown.stayLivingExpenses)}</td>
									</tr>
									<tr>
										<td className="py-3 text-semibold text-[#5E5E5E]">Home Country Liabilities (USD Debt)</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.stayHomeLiabilities)}</td>
										<td className="py-3 text-right font-mono">{formatCurrency(breakdown.moveHomeLiabilities)}</td>
										<td className="py-3 text-right font-mono">$0</td>
									</tr>
									<tr className="font-black text-base border-t-2 border-[#1A1A1A]">
										<td className="py-4">Annual Free Cash Flow</td>
										<td className="py-4 text-right font-mono">{formatCurrency(breakdown.stayAnnualFreeCashFlow)}</td>
										<td className="py-4 text-right font-mono">{formatCurrency(breakdown.moveAnnualFreeCashFlow)}</td>
										<td className={`py-4 text-right font-mono ${breakdown.annualCashFlowDelta >= 0 ? 'text-[#5A7A8F]' : 'text-[#B85C5C]'}`}>
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
					<div className="border border-[#E5E5E5] p-6 space-y-4">
						<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">
							Stay Scenario (Home Baseline)
						</span>
						<h3 className="text-xl font-bold text-[#1A1A1A]">US Base &amp; Household Earnings ($ USD)</h3>

						<div className="space-y-4 pt-2">
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Primary Base Salary ($ USD)
								</label>
								<input
									type="number"
									value={homeBaseSalary}
									onChange={(e) => setHomeBaseSalary(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Annual Bonus ($ USD)
								</label>
								<input
									type="number"
									value={homeBonus}
									onChange={(e) => setHomeBonus(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Annual Equity Vesting ($ USD)
								</label>
								<input
									type="number"
									value={homeEquityAnnual}
									onChange={(e) => setHomeEquityAnnual(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
							<div className="border-t border-[#E5E5E5] pt-4">
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Spousal Annual Income in Home Country ($ USD)
								</label>
								<input
									type="number"
									value={homeSpouseIncome}
									onChange={(e) => setHomeSpouseIncome(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
						</div>
					</div>

					<div className="border border-[#E5E5E5] p-6 space-y-4">
						<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#5A7A8F]">
							Move Scenario ({selectedCountry.name})
						</span>
						<h3 className="text-xl font-bold text-[#1A1A1A]">Host Compensation ({selectedCountry.currencySymbol} {selectedCountry.currencyCode})</h3>

						<div className="space-y-4 pt-2">
							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
										Base ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostBaseSalary}
										onChange={(e) => setHostBaseSalary(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
									/>
								</div>
								<div>
									<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
										Bonus ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostBonus}
										onChange={(e) => setHostBonus(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
									/>
								</div>
								<div>
									<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
										Equity ({selectedCountry.currencySymbol})
									</label>
									<input
										type="number"
										value={hostEquityAnnual}
										onChange={(e) => setHostEquityAnnual(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
									/>
								</div>
							</div>

							<div className="border-t border-[#E5E5E5] pt-4">
								<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">Spousal Income Post-Move</span>
								<div className="grid grid-cols-2 gap-3 mt-2">
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">Employment Type</label>
										<select
											value={spouseIncomeType}
											onChange={(e) => setSpouseIncomeType(e.target.value as any)}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
										>
											<option value="none">No Income Post-Move</option>
											<option value="remote">Remote (Keeps Home Income)</option>
											<option value="local">Local (Host Country Sourced)</option>
										</select>
									</div>
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">Annual Amount ({spouseIncomeType === 'local' ? selectedCountry.currencySymbol : '$ USD'})</label>
										<input
											type="number"
											disabled={spouseIncomeType === 'none'}
											value={spouseIncomeAmount}
											onChange={(e) => setSpouseIncomeAmount(Math.max(0, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A] disabled:opacity-50"
										/>
									</div>
								</div>
							</div>

							<div className="border-t border-[#E5E5E5] pt-4 space-y-3">
								<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">Expat Allowances ({selectedCountry.currencySymbol} {selectedCountry.currencyCode})</span>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">COLA Monthly ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={colaMonthly}
											onChange={(e) => setColaMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
										/>
									</div>
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">Housing Allowance Monthly ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={housingAllowanceMonthly}
											onChange={(e) => setHousingAllowanceMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">Tuition Stipend Annual ({selectedCountry.currencySymbol})</label>
										<input
											type="number"
											value={tuitionStipendAnnual}
											onChange={(e) => setTuitionStipendAnnual(Math.max(0, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
										/>
									</div>
									<div>
										<label className="block text-xs text-[#5E5E5E] mb-1">Moving Reimbursement ($ USD)</label>
										<input
											type="number"
											value={movingReimbursementOneTime}
											onChange={(e) => setMovingReimbursementOneTime(Math.max(0, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
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
				<div className="space-y-8">
					<div className="grid gap-8 md:grid-cols-2">
						{/* Host Tax Engine */}
						<div className="border border-[#E5E5E5] p-6 space-y-4">
							<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#5A7A8F]">
								Host Tax Logic ({selectedCountry.name})
							</span>
							<h3 className="text-xl font-bold text-[#1A1A1A]">{selectedCountry.expatRegimeName}</h3>

							<div className="space-y-4 pt-2 text-xs">
								{selectedCountry.hasSpecialExpatRegime && (
									<div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
										<div>
											<span className="font-bold text-[#1A1A1A] block">Special Expat Tax Regime Active</span>
											<span className="text-[#5E5E5E]">{selectedCountry.expatRegimeDescription}</span>
										</div>
										<input
											type="checkbox"
											checked={useSpecialRegime}
											onChange={(e) => setUseSpecialRegime(e.target.checked)}
											className="h-5 w-5 accent-[#5A7A8F]"
										/>
									</div>
								)}

								<div>
									<label className="block text-[#8C8C8C] uppercase font-mono tracking-[0.2em] mb-1">
										Foreign Investment Income ($ USD)
									</label>
									<p className="text-[#5E5E5E] mb-1">Foreign dividends, interest &amp; capital gains.</p>
									<input
										type="number"
										value={foreignInvestmentIncome}
										onChange={(e) => setForeignInvestmentIncome(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 font-mono text-[#1A1A1A]"
									/>
								</div>

								<div className="border-t border-[#E5E5E5] pt-3">
									<p className="font-mono text-[11px] text-[#5E5E5E]">
										Host Tax Note: <strong>{breakdown.hostTaxDetailsNote}</strong>
									</p>
								</div>
							</div>
						</div>

						{/* Home Country Tax (US Obligations) */}
						<div className="border border-[#E5E5E5] p-6 space-y-4">
							<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">
								Home Country Tax Logic (U.S.)
							</span>
							<h3 className="text-xl font-bold text-[#1A1A1A]">Worldwide Taxation &amp; Treaties</h3>

							<div className="space-y-4 pt-2 text-xs">
								<div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
									<div>
										<span className="font-bold text-[#1A1A1A] block">U.S. Citizen / Green Card Holder</span>
										<span className="text-[#5E5E5E]">Subject to US worldwide income tax regardless of residence</span>
									</div>
									<input
										type="checkbox"
										checked={isUSCitizen}
										onChange={(e) => setIsUSCitizen(e.target.checked)}
										className="h-5 w-5 accent-[#5A7A8F]"
									/>
								</div>

								<div>
									<label className="block text-[#8C8C8C] uppercase font-mono tracking-[0.2em] mb-1">
										US Tax Relief Method
									</label>
									<select
										value={taxReliefMethod}
										onChange={(e) => setTaxReliefMethod(e.target.value as any)}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
									>
										<option value="auto">Auto-Select Optimal (FEIE vs FTC)</option>
										<option value="feie">Foreign Earned Income Exclusion (FEIE - Max $126,500)</option>
										<option value="ftc">Foreign Tax Credit (FTC - Dollar-for-dollar offset)</option>
									</select>
								</div>

								<div className="border-t border-[#E5E5E5] pt-4 space-y-3">
									<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">Corporate Tax Policy Coverage</span>
									<select
										value={taxPolicy}
										onChange={(e) => setTaxPolicy(e.target.value as any)}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A]"
									>
										<option value="tax-equalization">Tax Equalization (Employee burden stays identical to Stay scenario)</option>
										<option value="tax-protection">Tax Protection (Employer pays excess if host taxes &gt; home taxes)</option>
										<option value="laissez-faire">Laissez-Faire (Employee pays all host &amp; home taxes independently)</option>
									</select>
								</div>

								<div className="border-t border-[#E5E5E5] pt-4 space-y-2">
									<span className="font-mono text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">Totalization Agreement (Social Security)</span>
									<div>
										<label className="block text-[#5E5E5E] mb-1">Assignment Duration (Years)</label>
										<input
											type="number"
											min={1}
											max={10}
											value={assignmentDurationYears}
											onChange={(e) => setAssignmentDurationYears(Math.max(1, Number(e.target.value)))}
											className="w-full border border-[#E5E5E5] bg-white px-3 py-2 font-mono text-[#1A1A1A]"
										/>
									</div>
									<p className="text-[11px] text-[#5E5E5E]">
										Status: <strong>{breakdown.totalizationSocialSecurityModel}</strong>
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 4: EXPENSES & COST OF LIVING --- */}
			{activeTab === 'expenses' && (
				<div className="grid gap-8 md:grid-cols-2">
					<div className="border border-[#E5E5E5] p-6 space-y-4">
						<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">
							Home Living Expenses ($ USD)
						</span>
						<h3 className="text-xl font-bold text-[#1A1A1A]">Stay Scenario Outlays</h3>

						<div className="space-y-4 pt-2">
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Home Rent or Mortgage ($ USD / Month)
								</label>
								<input
									type="number"
									value={homeRentOrMortgageMonthly}
									onChange={(e) => setHomeRentOrMortgageMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Discretionary Spending Baseline ($ USD / Month)
								</label>
								<input
									type="number"
									value={discretionarySpendMonthly}
									onChange={(e) => setDiscretionarySpendMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
						</div>
					</div>

					<div className="border border-[#E5E5E5] p-6 space-y-4">
						<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#5A7A8F]">
							Host Expenses ({selectedCountry.currencySymbol} {selectedCountry.currencyCode})
						</span>
						<h3 className="text-xl font-bold text-[#1A1A1A]">Move Scenario Outlays</h3>

						<div className="space-y-4 pt-2">
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Host Rent ({selectedCountry.currencySymbol} / Month)
								</label>
								<input
									type="number"
									value={hostRentMonthly}
									onChange={(e) => setHostRentMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="block text-xs text-[#5E5E5E] mb-1">Private School Tuition ({selectedCountry.currencySymbol}/Mo)</label>
									<input
										type="number"
										value={privateTuitionMonthly}
										onChange={(e) => setPrivateTuitionMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
									/>
								</div>
								<div>
									<label className="block text-xs text-[#5E5E5E] mb-1">Private Health Insurance ({selectedCountry.currencySymbol}/Mo)</label>
									<input
										type="number"
										value={privateHealthInsuranceMonthly}
										onChange={(e) => setPrivateHealthInsuranceMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
									/>
								</div>
							</div>
							<div>
								<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
									Host Cost of Living Multiplier ({(hostColIndexRatio * 100).toFixed(0)}%)
								</label>
								<input
									type="range"
									min={0.3}
									max={1.5}
									step={0.01}
									value={hostColIndexRatio}
									onChange={(e) => setHostColIndexRatio(Number(e.target.value))}
									className="w-full h-2 rounded-lg bg-[#E5E5E5] accent-[#5A7A8F]"
								/>
								<span className="text-xs text-[#5E5E5E]">
									{hostColIndexRatio < 1 ? `Host city in ${selectedCountry.name} is ${( (1 - hostColIndexRatio) * 100 ).toFixed(0)}% cheaper than home` : `Host city in ${selectedCountry.name} is ${( (hostColIndexRatio - 1) * 100 ).toFixed(0)}% pricier than home`}
								</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 5: FX & LIABILITIES --- */}
			{activeTab === 'fx' && (
				<div className="border border-[#E5E5E5] p-6 space-y-6">
					<h3 className="text-xl font-bold text-[#1A1A1A]">Foreign Exchange &amp; Cross-Border Debt Servicing</h3>

					<div className="grid gap-6 md:grid-cols-2">
						<div>
							<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
								Exchange Rate ({selectedCountry.currencyCode} to USD)
							</label>
							<input
								type="number"
								step={0.0001}
								value={fxRateHostToUsd}
								onChange={(e) => setFxRateHostToUsd(Math.max(0.00001, Number(e.target.value)))}
								className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
							/>
							<span className="text-xs text-[#5E5E5E]">1 {selectedCountry.currencyCode} = ${fxRateHostToUsd} USD</span>
						</div>

						<div>
							<label className="block text-xs font-mono uppercase tracking-[0.2em] text-[#8C8C8C] mb-1">
								Home-Currency Monthly Liabilities ($ USD)
							</label>
							<input
								type="number"
								value={homeLiabilitiesUsdMonthly}
								onChange={(e) => setHomeLiabilitiesUsdMonthly(Math.max(0, Number(e.target.value)))}
								className="w-full border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-mono text-[#1A1A1A]"
							/>
							<span className="text-xs text-[#5E5E5E]">US mortgage, student loans, 401(k) / IRA contributions</span>
						</div>
					</div>

					<div className="border-t border-[#E5E5E5] pt-4 space-y-2">
						<span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#B85C5C]">
							Translation Risk Exposure (Host Currency Weakening)
						</span>
						<p className="text-sm text-[#5E5E5E]">
							If host currency ({selectedCountry.currencyCode}) depreciates by 10% against USD (from ${fxRateHostToUsd} to ${(fxRateHostToUsd * 0.9).toFixed(5)}), servicing your annual ${formatCurrency(breakdown.moveHomeLiabilities)} USD liabilities requires an extra <strong>{formatCurrency(breakdown.fxDepreciationImpactUsd)}</strong> in host earnings per year.
						</p>
					</div>
				</div>
			)}

			{/* --- TAB 6: 5-YEAR WEALTH TRAJECTORY --- */}
			{activeTab === 'wealth' && (
				<div className="border border-[#E5E5E5] p-6 space-y-6">
					<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
						<div>
							<h3 className="text-xl font-bold text-[#1A1A1A]">5-Year Cumulative Wealth Trajectory</h3>
							<p className="text-xs text-[#5E5E5E]">Compares cumulative wealth accumulation in the US vs. {selectedCountry.name}.</p>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-xs font-mono uppercase text-[#8C8C8C]">Assumed Growth Rate</span>
							<input
								type="number"
								step={0.01}
								min={0}
								max={0.2}
								value={expectedInvestmentReturnRate}
								onChange={(e) => setExpectedInvestmentReturnRate(Math.max(0, Number(e.target.value)))}
								className="w-20 border border-[#E5E5E5] bg-white px-2 py-1 text-sm font-mono text-[#1A1A1A]"
							/>
						</div>
					</div>

					{/* Visual Bar Comparison */}
					<div className="space-y-4">
						{projections.map((p) => {
							const maxVal = Math.max(...projections.map((x) => Math.max(x.stayCumulativeWealth, x.moveCumulativeWealth)), 1);
							const stayPct = Math.min(100, Math.max(5, (p.stayCumulativeWealth / maxVal) * 100));
							const movePct = Math.min(100, Math.max(5, (p.moveCumulativeWealth / maxVal) * 100));

							return (
								<div key={p.year} className="space-y-1.5 text-xs font-mono">
									<div className="flex justify-between text-[#1A1A1A] font-bold">
										<span>Year {p.year}</span>
										<span className={p.wealthDelta >= 0 ? 'text-[#5A7A8F]' : 'text-[#B85C5C]'}>
											Delta: {p.wealthDelta >= 0 ? '+' : ''}{formatCurrency(p.wealthDelta)}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<div className="flex justify-between text-[11px] text-[#8C8C8C] mb-0.5">
												<span>Stay (US)</span>
												<span>{formatCurrency(p.stayCumulativeWealth)}</span>
											</div>
											<div className="h-3 bg-[#E5E5E5] overflow-hidden">
												<div className="h-full bg-[#8C8C8C]" style={{ width: `${stayPct}%` }} />
											</div>
										</div>
										<div>
											<div className="flex justify-between text-[11px] text-[#5A7A8F] mb-0.5">
												<span>Move ({selectedCountry.name})</span>
												<span>{formatCurrency(p.moveCumulativeWealth)}</span>
											</div>
											<div className="h-3 bg-[#E5E5E5] overflow-hidden">
												<div className="h-full bg-[#5A7A8F]" style={{ width: `${movePct}%` }} />
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="border-t border-[#E5E5E5] pt-4">
						<p className="text-xs text-[#5E5E5E]">
							Note: Projections assume reinvestment of annual household free cash flows compounded annually at {(expectedInvestmentReturnRate * 100).toFixed(1)}%.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
