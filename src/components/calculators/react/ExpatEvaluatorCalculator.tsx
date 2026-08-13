import { useState, useMemo } from 'react';
import { calculateExpatFinancials, generate5YearProjections, type ExpatInputs, type ExpatBreakdown, type YearProjection } from '../../../lib/calculators/expat';
import { COUNTRY_PROFILES, type HostCountryId } from '../../../lib/calculators/expat-countries';
import { formatCurrency } from '../../../lib/calculators/format';

/**
 * Reusable Field Label with Interactive Hover Tooltip
 */
function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
	return (
		<div className="flex items-center gap-1.5 mb-1.5 group relative">
			<label className="block text-xs font-semibold text-stone-700 cursor-pointer">{label}</label>
			<div className="relative flex items-center">
				<svg className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-stone-900 text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl z-50 pointer-events-none">
					{tooltip}
					<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-stone-900"></div>
				</div>
			</div>
		</div>
	);
}

/**
 * 1. 5-Year Wealth Trajectory SVG Area Chart (Earthy Sage & Terracotta Scale)
 */
function WealthAreaChart({ projections, countryName }: { projections: YearProjection[]; countryName: string }) {
	const maxVal = Math.max(...projections.map((p) => Math.max(p.stayCumulativeWealth, p.moveCumulativeWealth)), 10000);
	
	const width = 900;
	const height = 240;
	const padL = 75;
	const padR = 40;
	const padT = 30;
	const padB = 45;
	const plotW = width - padL - padR;
	const plotH = height - padT - padB;

	const getX = (idx: number) => padL + (idx / 4) * plotW;
	const getY = (val: number) => padT + plotH - (Math.max(0, val) / maxVal) * plotH;

	const stayPoints = projections.map((p, i) => `${getX(i)},${getY(p.stayCumulativeWealth)}`).join(' L ');
	const movePoints = projections.map((p, i) => `${getX(i)},${getY(p.moveCumulativeWealth)}`).join(' L ');

	const stayArea = `M ${getX(0)},${getY(0)} L ${stayPoints} L ${getX(4)},${getY(0)} Z`;
	const moveArea = `M ${getX(0)},${getY(0)} L ${movePoints} L ${getX(4)},${getY(0)} Z`;

	return (
		<div className="w-full bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-3">
			<div className="flex items-center justify-between text-xs font-mono">
				<div className="flex items-center gap-5">
					<span className="flex items-center gap-2 font-medium text-stone-600">
						<span className="w-3 h-3 rounded-full bg-stone-400 opacity-70 inline-block"></span> Stay (US Baseline)
					</span>
					<span className="flex items-center gap-2 font-bold text-[#2E6F40]">
						<span className="w-3 h-3 rounded-full bg-[#2E6F40] inline-block"></span> Move ({countryName})
					</span>
				</div>
				<span className="text-stone-400 font-mono text-[11px]">All figures in USD ($)</span>
			</div>

			<div className="relative w-full overflow-hidden">
				<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible font-mono text-[11px]">
					{[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
						const y = padT + plotH * (1 - pct);
						const val = Math.round((maxVal * pct) / 1000);
						return (
							<g key={idx}>
								<line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E7E5E4" strokeDasharray="4 4" strokeWidth="1" />
								<text x={padL - 10} y={y + 4} textAnchor="end" fill="#78716C" className="font-semibold">
									${val}k
								</text>
							</g>
						);
					})}

					<path d={stayArea} fill="rgba(120, 113, 108, 0.12)" />
					<path d={moveArea} fill="rgba(46, 111, 64, 0.15)" />

					<path d={`M ${stayPoints}`} fill="none" stroke="#78716C" strokeWidth="1.75" strokeDasharray="5 5" />
					<path d={`M ${movePoints}`} fill="none" stroke="#2E6F40" strokeWidth="2.25" />

					{projections.map((p, i) => {
						const x = getX(i);
						const yStay = getY(p.stayCumulativeWealth);
						const yMove = getY(p.moveCumulativeWealth);
						return (
							<g key={i}>
								<line x1={x} y1={padT} x2={x} y2={height - padB} stroke="#E7E5E4" strokeDasharray="3 3" strokeWidth="1" />
								<circle cx={x} cy={yStay} r="3.5" fill="#78716C" />
								<circle cx={x} cy={yMove} r="4.5" fill="#2E6F40" stroke="#FFFFFF" strokeWidth="1.5" />
								<text x={x} y={height - 12} textAnchor="middle" fill="#57534E" fontWeight="bold">
									Year {p.year}
								</text>
							</g>
						);
					})}
				</svg>
			</div>
		</div>
	);
}

/**
 * 2. Cash Flow Waterfall / Bridge Component Chart (Earthy Terracotta Red for Negatives & Earthy Green for Positives)
 */
function CashFlowWaterfallChart({ breakdown }: { breakdown: ExpatBreakdown }) {
	const staySteps = [
		{ label: 'Gross Income', val: breakdown.stayGrossIncome, type: 'plus' },
		{ label: 'Taxes', val: -breakdown.stayTaxes, type: 'minus' },
		{ label: 'Living Expenses', val: -breakdown.stayLivingExpenses, type: 'minus' },
		{ label: 'Liabilities', val: -breakdown.stayHomeLiabilities, type: 'minus' },
		{ label: 'Net Cash Flow', val: breakdown.stayAnnualFreeCashFlow, type: 'total' }
	];

	const moveSteps = [
		{ label: 'Earned Comp', val: breakdown.moveBaseGross, type: 'plus' },
		{ label: 'Allowances', val: breakdown.moveAllowancesTotal, type: 'plus' },
		{ label: 'Taxes', val: -breakdown.actualTotalTaxesPaid + breakdown.employerTaxReimbursement, type: 'minus' },
		{ label: 'Living Expenses', val: -breakdown.moveLivingExpenses, type: 'minus' },
		{ label: 'Liabilities', val: -breakdown.moveTotalLiabilitiesUsd, type: 'minus' },
		{ label: 'Net Cash Flow', val: breakdown.moveAnnualFreeCashFlow, type: 'total' }
	];

	const maxIncome = Math.max(breakdown.stayGrossIncome, breakdown.moveTotalGross, 10000);

	return (
		<div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
			<div className="flex items-center justify-between border-b border-stone-100 pb-3">
				<h3 className="text-base font-bold text-stone-900">Cash Flow Component Bridge (Normalized $ USD)</h3>
				<span className="text-xs font-mono text-stone-400">Journey from Gross Income to Net Free Cash Flow</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Stay Scenario Bridge */}
				<div className="space-y-2.5 bg-stone-50/80 p-4 rounded-xl border border-stone-200/70">
					<span className="text-xs font-bold font-mono uppercase text-stone-600 block mb-2">
						🇺🇸 Stay Scenario Waterfall
					</span>
					{staySteps.map((s, idx) => {
						const widthPct = Math.min(100, Math.max(4, (Math.abs(s.val) / maxIncome) * 100));
						const isPositive = s.val >= 0;
						const barColor = isPositive ? '#2E6F40' : '#C25E40';

						return (
							<div key={idx} className="space-y-1 text-xs font-mono">
								<div className="flex justify-between items-center text-stone-700 font-medium">
									<span>{s.label}</span>
									<span style={{ color: barColor }} className="font-bold">
										{s.val >= 0 ? '+' : ''}{formatCurrency(s.val)}
									</span>
								</div>
								<div className="h-2 bg-stone-200 rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${widthPct}%`, backgroundColor: barColor }}
									/>
								</div>
							</div>
						);
					})}
				</div>

				{/* Move Scenario Bridge */}
				<div className="space-y-2.5 bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/70">
					<span className="text-xs font-bold font-mono uppercase text-stone-700 block mb-2">
						{breakdown.currencySymbol} Move ({breakdown.countryName}) Waterfall
					</span>
					{moveSteps.map((s, idx) => {
						const widthPct = Math.min(100, Math.max(4, (Math.abs(s.val) / maxIncome) * 100));
						const isPositive = s.val >= 0;
						const barColor = isPositive ? '#2E6F40' : '#C25E40';

						return (
							<div key={idx} className="space-y-1 text-xs font-mono">
								<div className="flex justify-between items-center text-stone-700 font-medium">
									<span>{s.label}</span>
									<span style={{ color: barColor }} className="font-bold">
										{s.val >= 0 ? '+' : ''}{formatCurrency(s.val)}
									</span>
								</div>
								<div className="h-2 bg-stone-200 rounded-full overflow-hidden">
									<div
										className="h-full rounded-full transition-all"
										style={{ width: `${widthPct}%`, backgroundColor: barColor }}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

/**
 * 3. Total Compensation Stacked Bar Chart (Earthy Green Comp Components)
 */
function TotalCompStackedChart({ inputs, breakdown }: { inputs: ExpatInputs; breakdown: ExpatBreakdown }) {
	const fx = inputs.fxRateHostToUsd;

	const stayBase = inputs.homeBaseSalary;
	const stayBonus = inputs.homeBonus;
	const stayEquity = inputs.homeEquityAnnual;
	const staySpouse = inputs.homeSpouseIncome;
	const stayTotal = stayBase + stayBonus + stayEquity + staySpouse;

	const moveBase = inputs.hostBaseSalary * fx;
	const moveBonus = inputs.hostBonus * fx;
	const moveEquity = inputs.hostEquityAnnual * fx;
	const moveSpouse = (inputs.spouseIncomeType === 'local' ? inputs.spouseIncomeAmount * fx : inputs.spouseIncomeType === 'remote' ? inputs.spouseIncomeAmount : 0);
	const moveAllowances = breakdown.moveAllowancesTotal;
	const moveTotal = moveBase + moveBonus + moveEquity + moveSpouse + moveAllowances;

	const maxVal = Math.max(stayTotal, moveTotal, 10000);

	return (
		<div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
			<div className="flex items-center justify-between border-b border-stone-100 pb-3">
				<h3 className="text-base font-bold text-stone-900">Total Household Compensation Composition ($ USD)</h3>
				<span className="text-xs font-mono text-stone-400">Base + Bonus + Equity + Spouse + Allowances</span>
			</div>

			<div className="space-y-4 font-mono text-xs">
				<div className="space-y-1.5">
					<div className="flex justify-between font-bold text-stone-800">
						<span>🇺🇸 Stay (US Baseline Total: {formatCurrency(stayTotal)})</span>
					</div>
					<div className="h-5 bg-stone-100 rounded-xl overflow-hidden flex border border-stone-200">
						<div style={{ width: `${(stayBase / maxVal) * 100}%` }} className="bg-stone-800 text-white flex items-center justify-center text-[10px] font-bold" title={`Base: ${formatCurrency(stayBase)}`}>
							Base
						</div>
						{stayBonus > 0 && (
							<div style={{ width: `${(stayBonus / maxVal) * 100}%` }} className="bg-stone-600 text-white flex items-center justify-center text-[10px]" title={`Bonus: ${formatCurrency(stayBonus)}`}>
								Bonus
							</div>
						)}
						{stayEquity > 0 && (
							<div style={{ width: `${(stayEquity / maxVal) * 100}%` }} className="bg-stone-500 text-white flex items-center justify-center text-[10px]" title={`Equity: ${formatCurrency(stayEquity)}`}>
								Equity
							</div>
						)}
						{staySpouse > 0 && (
							<div style={{ width: `${(staySpouse / maxVal) * 100}%` }} className="bg-stone-400 text-white flex items-center justify-center text-[10px]" title={`Spouse: ${formatCurrency(staySpouse)}`}>
								Spouse
							</div>
						)}
					</div>
				</div>

				<div className="space-y-1.5">
					<div className="flex justify-between font-bold text-[#2E6F40]">
						<span>{breakdown.currencySymbol} Move ({breakdown.countryName} Total: {formatCurrency(moveTotal)})</span>
					</div>
					<div className="h-5 bg-stone-50 rounded-xl overflow-hidden flex border border-stone-200">
						<div style={{ width: `${(moveBase / maxVal) * 100}%` }} className="bg-[#1E4B2B] text-white flex items-center justify-center text-[10px] font-bold" title={`Host Base: ${formatCurrency(moveBase)}`}>
							Base
						</div>
						{moveBonus > 0 && (
							<div style={{ width: `${(moveBonus / maxVal) * 100}%` }} className="bg-[#2E6F40] text-white flex items-center justify-center text-[10px]" title={`Host Bonus: ${formatCurrency(moveBonus)}`}>
								Bonus
							</div>
						)}
						{moveEquity > 0 && (
							<div style={{ width: `${(moveEquity / maxVal) * 100}%` }} className="bg-[#3B7A4A] text-white flex items-center justify-center text-[10px]" title={`Host Equity: ${formatCurrency(moveEquity)}`}>
								Equity
							</div>
						)}
						{moveSpouse > 0 && (
							<div style={{ width: `${(moveSpouse / maxVal) * 100}%` }} className="bg-amber-600 text-white flex items-center justify-center text-[10px]" title={`Spouse: ${formatCurrency(moveSpouse)}`}>
								Spouse
							</div>
						)}
						{moveAllowances > 0 && (
							<div style={{ width: `${(moveAllowances / maxVal) * 100}%` }} className="bg-amber-500 text-stone-900 flex items-center justify-center text-[10px] font-bold" title={`Allowances: ${formatCurrency(moveAllowances)}`}>
								Allowances
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * 4. Grouped Horizontal Expense Comparison Chart (Earthy Terracotta Red for Costs)
 */
function ExpenseGroupedBarChart({ inputs, breakdown }: { inputs: ExpatInputs; breakdown: ExpatBreakdown }) {
	const fx = inputs.fxRateHostToUsd;

	const categories = [
		{
			name: 'Housing / Rent',
			stayUsd: inputs.homeRentOrMortgageMonthly * 12,
			moveUsd: inputs.hostRentMonthly * 12 * fx
		},
		{
			name: 'Private School Tuition',
			stayUsd: inputs.homeTuitionMonthly * 12,
			moveUsd: inputs.privateTuitionMonthly * 12 * fx
		},
		{
			name: 'Health Insurance',
			stayUsd: inputs.homeHealthInsuranceMonthly * 12,
			moveUsd: inputs.privateHealthInsuranceMonthly * 12 * fx
		},
		{
			name: 'Discretionary Spend',
			stayUsd: inputs.discretionarySpendMonthly * 12,
			moveUsd: inputs.discretionarySpendMonthly * 12 * inputs.hostColIndexRatio
		}
	];

	const maxExpense = Math.max(...categories.flatMap((c) => [c.stayUsd, c.moveUsd]), 1000);

	return (
		<div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
			<div className="flex items-center justify-between border-b border-stone-100 pb-3">
				<h3 className="text-base font-bold text-stone-900">Annual Living Expenses Comparison ($ USD Normalized)</h3>
				<span className="text-xs font-mono text-stone-400">1:1 Category Outlay Comparison</span>
			</div>

			<div className="space-y-4">
				{categories.map((cat, idx) => {
					const stayPct = (cat.stayUsd / maxExpense) * 100;
					const movePct = (cat.moveUsd / maxExpense) * 100;
					const isCheaper = cat.moveUsd <= cat.stayUsd;

					return (
						<div key={idx} className="space-y-1.5 text-xs font-mono bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/60">
							<div className="flex justify-between font-semibold text-stone-800">
								<span>{cat.name}</span>
								<span style={{ color: isCheaper ? '#2E6F40' : '#C25E40' }} className="font-bold">
									Delta: {cat.moveUsd - cat.stayUsd <= 0 ? '' : '+'}{formatCurrency(cat.moveUsd - cat.stayUsd)}
								</span>
							</div>

							<div className="flex items-center gap-2">
								<span className="w-16 text-[10px] text-stone-500 font-bold">Stay (US)</span>
								<div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
									<div className="h-full bg-stone-600 rounded-full" style={{ width: `${stayPct}%` }} />
								</div>
								<span className="w-16 text-right text-stone-700 font-semibold">{formatCurrency(cat.stayUsd)}</span>
							</div>

							<div className="flex items-center gap-2">
								<span style={{ color: isCheaper ? '#2E6F40' : '#C25E40' }} className="w-16 text-[10px] font-bold">Move</span>
								<div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
									<div className="h-full rounded-full" style={{ width: `${movePct}%`, backgroundColor: isCheaper ? '#2E6F40' : '#C25E40' }} />
								</div>
								<span className="w-16 text-right font-semibold text-stone-900">{formatCurrency(cat.moveUsd)}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function ExpatEvaluatorCalculator() {
	const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'tax' | 'expenses' | 'fx' | 'wealth'>('dashboard');

	const [hostCountryId, setHostCountryId] = useState<HostCountryId>('spain');
	const selectedCountry = COUNTRY_PROFILES[hostCountryId] || COUNTRY_PROFILES.spain;

	const [homeBaseSalary, setHomeBaseSalary] = useState(160000);
	const [homeBonus, setHomeBonus] = useState(25000);
	const [homeEquityAnnual, setHomeEquityAnnual] = useState(30000);
	const [homeSpouseIncome, setHomeSpouseIncome] = useState(65000);
	const [homeStateTaxRate, setHomeStateTaxRate] = useState(0.05);

	const [hostBaseSalary, setHostBaseSalary] = useState(140000);
	const [hostBonus, setHostBonus] = useState(20000);
	const [hostEquityAnnual, setHostEquityAnnual] = useState(25000);

	const [spouseIncomeType, setSpouseIncomeType] = useState<'none' | 'remote' | 'local'>('remote');
	const [spouseIncomeAmount, setSpouseIncomeAmount] = useState(65000);

	const [colaMonthly, setColaMonthly] = useState(800);
	const [housingAllowanceMonthly, setHousingAllowanceMonthly] = useState(1800);
	const [tuitionStipendAnnual, setTuitionStipendAnnual] = useState(12000);
	const [movingReimbursementOneTime, setMovingReimbursementOneTime] = useState(8000);

	const [taxPolicy, setTaxPolicy] = useState<'laissez-faire' | 'tax-equalization' | 'tax-protection'>('tax-equalization');

	const [useSpecialRegime, setUseSpecialRegime] = useState(true);
	const [extendRegimeToDependents, setExtendRegimeToDependents] = useState(true);
	const [foreignInvestmentIncome, setForeignInvestmentIncome] = useState(15000);
	const [purchasedHomeInHost, setPurchasedHomeInHost] = useState(false);
	const [cadastralValue, setCadastralValue] = useState(250000);

	const [isUSCitizen, setIsUSCitizen] = useState(true);
	const [taxReliefMethod, setTaxReliefMethod] = useState<'auto' | 'feie' | 'ftc'>('auto');
	const [usFilingStatus, setUsFilingStatus] = useState<'single' | 'married'>('married');

	const [assignmentDurationYears, setAssignmentDurationYears] = useState(3);

	const [homeRentOrMortgageMonthly, setHomeRentOrMortgageMonthly] = useState(3200);
	const [homeTuitionMonthly, setHomeTuitionMonthly] = useState(1200);
	const [homeHealthInsuranceMonthly, setHomeHealthInsuranceMonthly] = useState(500);
	const [discretionarySpendMonthly, setDiscretionarySpendMonthly] = useState(3500);

	const [hostRentMonthly, setHostRentMonthly] = useState(2200);
	const [privateTuitionMonthly, setPrivateTuitionMonthly] = useState(1000);
	const [privateHealthInsuranceMonthly, setPrivateHealthInsuranceMonthly] = useState(450);
	const [hostColIndexRatio, setHostColIndexRatio] = useState(0.82);

	const [fxRateHostToUsd, setFxRateHostToUsd] = useState(1.10);
	const [homeLiabilitiesUsdMonthly, setHomeLiabilitiesUsdMonthly] = useState(1500);
	const [hostLiabilitiesMonthly, setHostLiabilitiesMonthly] = useState(0);
	const [expectedInvestmentReturnRate, setExpectedInvestmentReturnRate] = useState(0.07);

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
		<div className="space-y-8 p-4 sm:p-6 md:p-8 bg-[#F5F2ED] rounded-3xl min-h-screen text-stone-900 border border-stone-200/70 shadow-sm">
			{/* Header & Country Selector */}
			<div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200/80 shadow-sm">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-emerald-100/60 text-[#2E6F40] border border-emerald-200">
							<span className="w-2 h-2 rounded-full bg-[#2E6F40] animate-pulse"></span>
							Expat Financial &amp; Tax Evaluator
						</span>
						<h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mt-3">
							Comparative International Relocation Model
						</h1>
					</div>
					<div className="flex items-center gap-2 bg-[#FAF8F5] px-4 py-2 rounded-xl border border-stone-200">
						<span className="text-xl">{selectedCountry.flagEmoji}</span>
						<span className="font-semibold text-sm text-stone-900">{selectedCountry.name}</span>
						<span className="text-xs font-mono text-stone-500">({selectedCountry.currencyCode})</span>
					</div>
				</div>

				<p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-relaxed">
					Evaluate net cash flow, tax relief (FEIE vs. FTC), special expat regimes, and 5-year wealth trajectory comparing your Stay (US Baseline) scenario against relocation to 17 destination countries.
				</p>

				{/* Destination Country Switcher with Flag Icons */}
				<div className="pt-4 border-t border-stone-100 space-y-3">
					<span className="block font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
						Select Host Country Destination
					</span>
					<div className="flex flex-wrap gap-2">
						{Object.values(COUNTRY_PROFILES).map((c) => (
							<button
								key={c.id}
								onClick={() => handleCountryChange(c.id)}
								style={
									hostCountryId === c.id
										? { backgroundColor: '#2E6F40', color: '#FFFFFF', borderColor: '#2E6F40' }
										: undefined
								}
								className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
									hostCountryId === c.id
										? 'shadow-md font-bold'
										: 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
								}`}
							>
								<span className="text-base leading-none">{c.flagEmoji}</span>
								<span>{c.name}</span>
								<span
									style={hostCountryId === c.id ? { color: 'rgba(255, 255, 255, 0.85)' } : undefined}
									className={`text-[10px] font-mono ${hostCountryId !== c.id ? 'text-stone-400' : ''}`}
								>
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
						: 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-200/80'
				}`}>
					<div className="flex items-center justify-between">
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
							Annual Cash Flow Delta
						</span>
						<span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
							breakdown.annualCashFlowDelta >= 0 ? 'bg-emerald-100 text-[#2E6F40]' : 'bg-amber-100 text-[#C25E40]'
						}`}>
							{breakdown.annualCashFlowDelta >= 0 ? '▲ Net Surplus' : '▼ Net Deficit'}
						</span>
					</div>
					<div className={`text-4xl sm:text-5xl font-black tracking-tight mt-3 ${
						breakdown.annualCashFlowDelta >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
					}`}>
						{breakdown.annualCashFlowDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.annualCashFlowDelta)}
					</div>
					<p className="mt-2 text-xs font-medium text-stone-600">
						{breakdown.annualCashFlowDelta >= 0
							? `Relocating to ${selectedCountry.name} yields higher net free cash flow`
							: 'Staying in the US produces higher net free cash flow'}
					</p>
				</div>

				{/* 5-Year Wealth Impact Card with Micro-Chart Sparkline */}
				<div className="p-6 bg-gradient-to-br from-[#FAF8F5] via-white to-emerald-50/30 border border-stone-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
					<div>
						<div className="flex items-center justify-between">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
								5-Year Wealth Impact
							</span>
							<svg className="w-16 h-7" viewBox="0 0 60 25">
								<path d="M 0 20 Q 30 18 60 15" fill="none" stroke="#A8A29E" strokeWidth="1.5" strokeDasharray="3 3" />
								<path d="M 0 20 Q 30 10 60 4" fill="none" stroke={breakdown.fiveYearWealthDelta >= 0 ? '#2E6F40' : '#C25E40'} strokeWidth="2" />
							</svg>
						</div>
						<div className={`text-4xl sm:text-5xl font-black tracking-tight mt-3 ${
							breakdown.fiveYearWealthDelta >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
						}`}>
							{breakdown.fiveYearWealthDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.fiveYearWealthDelta)}
						</div>
					</div>
					<p className="mt-2 text-xs font-medium text-stone-600">
						Cumulative difference over 5 years at {(expectedInvestmentReturnRate * 100).toFixed(0)}% return
					</p>
				</div>

				{/* Optimal US Tax Relief Card */}
				<div className="p-6 bg-white border border-stone-200/80 rounded-2xl shadow-sm flex flex-col justify-between">
					<div>
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500 block">
							Optimal US Tax Relief
						</span>
						<div className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight mt-3">
							{breakdown.optimalTaxRelief}
						</div>
					</div>
					<div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
						<span className="text-stone-500 font-mono">Tax Savings Route</span>
						<span className="font-bold text-stone-800">
							{breakdown.optimalTaxRelief === 'FEIE' ? `FEIE: ${formatCurrency(breakdown.feieUsedAmount)}` : breakdown.optimalTaxRelief === 'FTC' ? `FTC: ${formatCurrency(breakdown.ftcUsedAmount)}` : 'N/A'}
						</span>
					</div>
				</div>
			</div>

			{/* Navigation Tabs */}
			<div className="bg-white p-2 rounded-2xl border border-stone-200/80 shadow-sm flex gap-2 overflow-x-auto">
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
						style={
							activeTab === tab.id
								? { backgroundColor: '#2E6F40', color: '#FFFFFF' }
								: undefined
						}
						className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
							activeTab === tab.id
								? 'shadow-sm font-black'
								: 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
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
						<div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl space-y-2">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9C4127] flex items-center gap-2">
								<svg className="w-4 h-4 text-[#C25E40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
								</svg>
								Regulatory &amp; Tax Notices
							</span>
							<ul className="text-xs text-stone-800 space-y-1 list-disc pl-5 font-medium">
								{breakdown.warnings.map((w, idx) => (
									<li key={idx}>{w}</li>
								))}
							</ul>
						</div>
					)}

					{/* CHART 1: 5-Year Wealth Trajectory Area Chart */}
					<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-4">
						<div className="flex items-center justify-between border-b border-stone-100 pb-3">
							<h3 className="text-base font-bold text-stone-900">5-Year Cumulative Wealth Growth Trajectory</h3>
							<span className="text-xs font-mono text-[#2E6F40] font-bold">
								{breakdown.fiveYearWealthDelta >= 0 ? '+' : ''}{formatCurrency(breakdown.fiveYearWealthDelta)} Net Gap
							</span>
						</div>
						<WealthAreaChart projections={projections} countryName={selectedCountry.name} />
					</div>

					{/* CHART 2: Cash Flow Waterfall / Bridge */}
					<CashFlowWaterfallChart breakdown={breakdown} />

					{/* Executive Cash Flow Walkdown Table */}
					<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
							<h2 className="text-xl font-bold text-stone-900 tracking-tight">
								Stay (US Baseline) vs. Move ({selectedCountry.name}) Walkdown
							</h2>
							<span className="text-xs font-mono text-stone-500">All figures in USD ($)</span>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm border-collapse">
								<thead>
									<tr className="border-b border-stone-200 text-xs font-mono font-bold uppercase tracking-wider text-stone-500">
										<th className="py-3.5 px-3">Financial Metric</th>
										<th className="py-3.5 px-3 text-right">Stay (US Baseline)</th>
										<th className="py-3.5 px-3 text-right bg-emerald-50/40 rounded-t-xl">Move ({selectedCountry.name})</th>
										<th className="py-3.5 px-3 text-right">Net Delta</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-stone-100 text-stone-800 font-medium text-xs sm:text-sm">
									{/* 1. Gross Earned Compensation */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Gross Earned Compensation</td>
										<td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayEarnedIncome)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">{formatCurrency(breakdown.moveBaseGross)}</td>
										<td className={`py-3 px-3 text-right font-mono font-bold ${
											breakdown.moveBaseGross - breakdown.stayEarnedIncome >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveBaseGross - breakdown.stayEarnedIncome >= 0 ? '+' : ''}{formatCurrency(breakdown.moveBaseGross - breakdown.stayEarnedIncome)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Primary Base Salary</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeBaseSalary)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveBaseSalaryUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveBaseSalaryUsd - inputs.homeBaseSalary >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveBaseSalaryUsd - inputs.homeBaseSalary >= 0 ? '+' : ''}{formatCurrency(breakdown.moveBaseSalaryUsd - inputs.homeBaseSalary)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Annual Bonus</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeBonus)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveBonusUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveBonusUsd - inputs.homeBonus >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveBonusUsd - inputs.homeBonus >= 0 ? '+' : ''}{formatCurrency(breakdown.moveBonusUsd - inputs.homeBonus)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Annual Equity Vesting</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeEquityAnnual)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveEquityAnnualUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveEquityAnnualUsd - inputs.homeEquityAnnual >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveEquityAnnualUsd - inputs.homeEquityAnnual >= 0 ? '+' : ''}{formatCurrency(breakdown.moveEquityAnnualUsd - inputs.homeEquityAnnual)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Spousal Earned Income</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeSpouseIncome)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveSpouseIncomeUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveSpouseIncomeUsd - inputs.homeSpouseIncome >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveSpouseIncomeUsd - inputs.homeSpouseIncome >= 0 ? '+' : ''}{formatCurrency(breakdown.moveSpouseIncomeUsd - inputs.homeSpouseIncome)}
										</td>
									</tr>

									{/* 2. Global Investment Income */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Global Investment Income (Passive)</td>
										<td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayInvestmentIncome)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">{formatCurrency(breakdown.moveInvestmentIncome)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold text-stone-400">$0</td>
									</tr>

									{/* 3. Corporate Subsidies & COLA */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Corporate Subsidies &amp; COLA</td>
										<td className="py-3 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20 text-[#2E6F40]">+{formatCurrency(breakdown.moveAllowancesTotal)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold text-[#2E6F40]">+{formatCurrency(breakdown.moveAllowancesTotal)}</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Monthly COLA Stipend</td>
										<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveColaUsd)}</td>
										<td className="py-2 px-3 text-right font-mono text-[#2E6F40]">+{formatCurrency(breakdown.moveColaUsd)}</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Monthly Housing Allowance</td>
										<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveHousingUsd)}</td>
										<td className="py-2 px-3 text-right font-mono text-[#2E6F40]">+{formatCurrency(breakdown.moveHousingUsd)}</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Annual Tuition Stipend</td>
										<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveTuitionUsd)}</td>
										<td className="py-2 px-3 text-right font-mono text-[#2E6F40]">+{formatCurrency(breakdown.moveTuitionUsd)}</td>
									</tr>

									{/* Total Household Gross Income */}
									<tr className="font-bold border-t border-stone-200 bg-stone-100">
										<td className="py-3.5 px-3 text-stone-900 font-extrabold">Total Household Gross Income</td>
										<td className="py-3.5 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayGrossIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono font-bold bg-emerald-50/40">{formatCurrency(breakdown.moveTotalGross)}</td>
										<td className={`py-3.5 px-3 text-right font-mono font-bold ${
											breakdown.moveTotalGross - breakdown.stayGrossIncome >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveTotalGross - breakdown.stayGrossIncome >= 0 ? '+' : ''}{formatCurrency(breakdown.moveTotalGross - breakdown.stayGrossIncome)}
										</td>
									</tr>

									{/* 5. Actual Total Taxes */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Actual Total Taxes (Host + Home + SS)</td>
										<td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayTaxes)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">{formatCurrency(breakdown.actualTotalTaxesPaid)}</td>
										<td className={`py-3 px-3 text-right font-mono font-bold ${
											breakdown.actualTotalTaxesPaid - breakdown.stayTaxes <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.actualTotalTaxesPaid - breakdown.stayTaxes > 0 ? '+' : ''}{formatCurrency(breakdown.actualTotalTaxesPaid - breakdown.stayTaxes)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Host Country Income Taxes</td>
										<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.hostTaxPaid)}</td>
										<td className="py-2 px-3 text-right font-mono text-[#C25E40]">+{formatCurrency(breakdown.hostTaxPaid)}</td>
									</tr>
									{breakdown.imputedRentalTaxPaid > 0 && (
										<tr className="text-xs text-stone-500 font-normal">
											<td className="py-2 px-3 pl-8">└─ Imputed Rental Income Tax</td>
											<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
											<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.imputedRentalTaxPaid)}</td>
											<td className="py-2 px-3 text-right font-mono text-[#C25E40]">+{formatCurrency(breakdown.imputedRentalTaxPaid)}</td>
										</tr>
									)}
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ U.S. Federal Income Taxes</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(breakdown.stayFedTaxEarned + breakdown.stayFedTaxInv)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.homeTaxPaid)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.homeTaxPaid - (breakdown.stayFedTaxEarned + breakdown.stayFedTaxInv) <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.homeTaxPaid - (breakdown.stayFedTaxEarned + breakdown.stayFedTaxInv) > 0 ? '+' : ''}{formatCurrency(breakdown.homeTaxPaid - (breakdown.stayFedTaxEarned + breakdown.stayFedTaxInv))}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ U.S. State Income Taxes</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(breakdown.stayStateTax)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">$0</td>
										<td className="py-2 px-3 text-right font-mono text-[#2E6F40]">{formatCurrency(-breakdown.stayStateTax)}</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Social Security / FICA</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(breakdown.stayFicaTax)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveSocialSecurityTaxUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveSocialSecurityTaxUsd - breakdown.stayFicaTax <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveSocialSecurityTaxUsd - breakdown.stayFicaTax > 0 ? '+' : ''}{formatCurrency(breakdown.moveSocialSecurityTaxUsd - breakdown.stayFicaTax)}
										</td>
									</tr>

									{/* Employer Tax Policy Reimbursement */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Employer Tax Policy Reimbursement</td>
										<td className="py-3 px-3 text-right font-mono text-stone-400">$0</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">
											{breakdown.employerTaxReimbursement > 0 ? (
												<span className="text-[#2E6F40] font-bold">+{formatCurrency(breakdown.employerTaxReimbursement)}</span>
											) : (
												<span className="text-stone-400">$0</span>
											)}
										</td>
										<td className="py-3 px-3 text-right font-mono font-bold">
											{breakdown.employerTaxReimbursement > 0 ? (
												<span className="text-[#2E6F40] font-bold">+{formatCurrency(breakdown.employerTaxReimbursement)}</span>
											) : (
												<span className="text-stone-400">$0</span>
											)}
										</td>
									</tr>

									{/* Net Take-Home Pay */}
									<tr className="font-bold border-t border-stone-200 bg-stone-100">
										<td className="py-3.5 px-3 text-stone-900 font-extrabold">Net Take-Home Pay</td>
										<td className="py-3.5 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayNetIncome)}</td>
										<td className="py-3.5 px-3 text-right font-mono font-bold bg-emerald-50/40">{formatCurrency(breakdown.moveNetIncome)}</td>
										<td className={`py-3.5 px-3 text-right font-mono font-bold ${
											breakdown.moveNetIncome - breakdown.stayNetIncome >= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveNetIncome - breakdown.stayNetIncome >= 0 ? '+' : ''}{formatCurrency(breakdown.moveNetIncome - breakdown.stayNetIncome)}
										</td>
									</tr>

									{/* 8. Local Living Expenses & Fixed Costs */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Local Living Expenses &amp; Fixed Costs</td>
										<td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayLivingExpenses)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">{formatCurrency(breakdown.moveLivingExpenses)}</td>
										<td className={`py-3 px-3 text-right font-mono font-bold ${
											breakdown.moveLivingExpenses - breakdown.stayLivingExpenses <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveLivingExpenses - breakdown.stayLivingExpenses > 0 ? '+' : ''}{formatCurrency(breakdown.moveLivingExpenses - breakdown.stayLivingExpenses)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Housing / Rent</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeRentOrMortgageMonthly * 12)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveRentUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveRentUsd - (inputs.homeRentOrMortgageMonthly * 12) <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveRentUsd - (inputs.homeRentOrMortgageMonthly * 12) > 0 ? '+' : ''}{formatCurrency(breakdown.moveRentUsd - (inputs.homeRentOrMortgageMonthly * 12))}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Private School Tuition</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeTuitionMonthly * 12)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveTuitionUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveTuitionUsd - (inputs.homeTuitionMonthly * 12) <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveTuitionUsd - (inputs.homeTuitionMonthly * 12) > 0 ? '+' : ''}{formatCurrency(breakdown.moveTuitionUsd - (inputs.homeTuitionMonthly * 12))}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Health Insurance</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.homeHealthInsuranceMonthly * 12)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveHealthInsuranceUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveHealthInsuranceUsd - (inputs.homeHealthInsuranceMonthly * 12) <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveHealthInsuranceUsd - (inputs.homeHealthInsuranceMonthly * 12) > 0 ? '+' : ''}{formatCurrency(breakdown.moveHealthInsuranceUsd - (inputs.homeHealthInsuranceMonthly * 12))}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Discretionary Spending Baseline</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(inputs.discretionarySpendMonthly * 12)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveDiscretionaryUsd)}</td>
										<td className={`py-2 px-3 text-right font-mono ${
											breakdown.moveDiscretionaryUsd - (inputs.discretionarySpendMonthly * 12) <= 0 ? 'text-[#2E6F40]' : 'text-[#C25E40]'
										}`}>
											{breakdown.moveDiscretionaryUsd - (inputs.discretionarySpendMonthly * 12) > 0 ? '+' : ''}{formatCurrency(breakdown.moveDiscretionaryUsd - (inputs.discretionarySpendMonthly * 12))}
										</td>
									</tr>

									{/* 9. Total Liabilities & Debt */}
									<tr className="bg-stone-50/30">
										<td className="py-3 px-3 font-bold text-stone-950">Total Liabilities &amp; Debt (USD + Host)</td>
										<td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(breakdown.stayHomeLiabilities)}</td>
										<td className="py-3 px-3 text-right font-mono font-bold bg-emerald-50/20">{formatCurrency(breakdown.moveTotalLiabilitiesUsd)}</td>
										<td className={`py-3 px-3 text-right font-mono font-bold ${
											breakdown.moveTotalLiabilitiesUsd === breakdown.stayHomeLiabilities
												? 'text-stone-400'
												: breakdown.moveTotalLiabilitiesUsd < breakdown.stayHomeLiabilities
												? 'text-[#2E6F40]'
												: 'text-[#C25E40]'
										}`}>
											{breakdown.moveTotalLiabilitiesUsd > breakdown.stayHomeLiabilities ? '+' : ''}{formatCurrency(breakdown.moveTotalLiabilitiesUsd - breakdown.stayHomeLiabilities)}
										</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Home-Currency Liabilities (U.S.)</td>
										<td className="py-2 px-3 text-right font-mono">{formatCurrency(breakdown.stayHomeLiabilities)}</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveHomeLiabilities)}</td>
										<td className="py-2 px-3 text-right font-mono text-stone-400">$0</td>
									</tr>
									<tr className="text-xs text-stone-500 font-normal">
										<td className="py-2 px-3 pl-8">└─ Host-Currency Liabilities (Local)</td>
										<td className="py-2 px-3 text-right font-mono">$0</td>
										<td className="py-2 px-3 text-right font-mono bg-emerald-50/10">{formatCurrency(breakdown.moveHostLiabilitiesUsd)}</td>
										<td className="py-2 px-3 text-right font-mono text-[#C25E40]">+{formatCurrency(breakdown.moveHostLiabilitiesUsd)}</td>
									</tr>

									{/* 10. Annual Free Cash Flow */}
									<tr className="font-black text-xs sm:text-sm border-t-2 border-stone-900 bg-stone-900 text-white rounded-b-xl">
										<td className="py-3.5 px-3">Annual Free Cash Flow</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.stayAnnualFreeCashFlow)}</td>
										<td className="py-3.5 px-3 text-right font-mono">{formatCurrency(breakdown.moveAnnualFreeCashFlow)}</td>
										<td className={`py-3.5 px-3 text-right font-mono ${
											breakdown.annualCashFlowDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'
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
				<div className="space-y-6">
					{/* CHART 3: Total Compensation Stacked Chart */}
					<TotalCompStackedChart inputs={inputs} breakdown={breakdown} />

					<div className="grid gap-8 md:grid-cols-2">
						{/* Left Panel: Stay Scenario (Home Baseline) */}
						<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-stone-100 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
									Stay Scenario (Home Baseline)
								</span>
								<span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
									🇺🇸 United States ($ USD)
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">US Base &amp; Household Earnings</h3>

							<div className="space-y-4">
								<div>
									<FieldLabel
										label="Primary Base Salary ($ USD / Year)"
										tooltip="Annual fixed base salary in the US before federal, state, and payroll taxes."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={homeBaseSalary}
											onChange={(e) => setHomeBaseSalary(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all outline-none"
										/>
									</div>
								</div>

								<div>
									<FieldLabel
										label="Annual Bonus ($ USD)"
										tooltip="Expected annual performance bonus or cash incentive in the US."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={homeBonus}
											onChange={(e) => setHomeBonus(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all outline-none"
										/>
									</div>
								</div>

								<div>
									<FieldLabel
										label="Annual Equity Vesting ($ USD)"
										tooltip="Annual market value of RSUs, stock options, or equity vesting in the US."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={homeEquityAnnual}
											onChange={(e) => setHomeEquityAnnual(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all outline-none"
										/>
									</div>
								</div>

								<div className="border-t border-stone-100 pt-4">
									<FieldLabel
										label="Spousal Annual Income in Home Country ($ USD)"
										tooltip="Spouse's annual gross earnings in the US before relocation."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={homeSpouseIncome}
											onChange={(e) => setHomeSpouseIncome(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 focus:bg-white focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10 transition-all outline-none"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Right Panel: Move Scenario */}
						<div className="bg-gradient-to-br from-emerald-50/30 via-white to-stone-50/50 rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-emerald-100 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2E6F40]">
									Move Scenario ({selectedCountry.name})
								</span>
								<span className="text-xs font-bold text-[#2E6F40] bg-emerald-100/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
									<span>{selectedCountry.flagEmoji}</span>
									<span>{selectedCountry.currencyCode} ({selectedCountry.currencySymbol})</span>
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">Host Compensation ({selectedCountry.currencySymbol})</h3>

							<div className="space-y-4">
								<div className="grid grid-cols-3 gap-3">
									<div>
										<FieldLabel
											label={`Base (${selectedCountry.currencySymbol})`}
											tooltip={`Annual base salary offered in ${selectedCountry.name} in local ${selectedCountry.currencyCode}.`}
										/>
										<input
											type="number"
											value={hostBaseSalary}
											onChange={(e) => setHostBaseSalary(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
									<div>
										<FieldLabel
											label={`Bonus (${selectedCountry.currencySymbol})`}
											tooltip={`Annual performance bonus in ${selectedCountry.currencyCode}.`}
										/>
										<input
											type="number"
											value={hostBonus}
											onChange={(e) => setHostBonus(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
									<div>
										<FieldLabel
											label={`Equity (${selectedCountry.currencySymbol})`}
											tooltip={`Annual equity or stock vesting value in ${selectedCountry.currencyCode}.`}
										/>
										<input
											type="number"
											value={hostEquityAnnual}
											onChange={(e) => setHostEquityAnnual(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
								</div>

								<div className="border-t border-emerald-100 pt-4">
									<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">Spousal Income Post-Move</span>
									<div className="grid grid-cols-2 gap-3">
										<div>
											<FieldLabel
												label="Employment Type"
												tooltip="Remote keeps home US income; Local means local employment in host country."
											/>
											<select
												value={spouseIncomeType}
												onChange={(e) => setSpouseIncomeType(e.target.value as any)}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-semibold text-stone-900 outline-none"
											>
												<option value="none">No Income Post-Move</option>
												<option value="remote">Remote (Keeps Home Income)</option>
												<option value="local">Local (Host Country Sourced)</option>
											</select>
										</div>
										<div>
											<FieldLabel
												label={`Annual Amount (${spouseIncomeType === 'local' ? selectedCountry.currencySymbol : '$ USD'})`}
												tooltip="Gross annual spousal earnings post-relocation."
											/>
											<input
												type="number"
												disabled={spouseIncomeType === 'none'}
												value={spouseIncomeAmount}
												onChange={(e) => setSpouseIncomeAmount(Math.max(0, Number(e.target.value)))}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 disabled:opacity-50 outline-none"
											/>
										</div>
									</div>
								</div>

								<div className="border-t border-emerald-100 pt-4 space-y-3">
									<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500 block">Expat Relocation Allowances ({selectedCountry.currencySymbol})</span>
									<div className="grid grid-cols-2 gap-3">
										<div>
											<FieldLabel
												label={`COLA Monthly (${selectedCountry.currencySymbol})`}
												tooltip="Monthly Cost of Living Adjustment stipend provided by employer."
											/>
											<input
												type="number"
												value={colaMonthly}
												onChange={(e) => setColaMonthly(Math.max(0, Number(e.target.value)))}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
										<div>
											<FieldLabel
												label={`Housing Allowance Monthly (${selectedCountry.currencySymbol})`}
												tooltip="Monthly corporate housing or rental subsidy paid by employer."
											/>
											<input
												type="number"
												value={housingAllowanceMonthly}
												onChange={(e) => setHousingAllowanceMonthly(Math.max(0, Number(e.target.value)))}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
									</div>
									<div className="grid grid-cols-2 gap-3">
										<div>
											<FieldLabel
												label={`Tuition Stipend Annual (${selectedCountry.currencySymbol})`}
												tooltip="Annual corporate education subsidy for children's schooling."
											/>
											<input
												type="number"
												value={tuitionStipendAnnual}
												onChange={(e) => setTuitionStipendAnnual(Math.max(0, Number(e.target.value)))}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
										<div>
											<FieldLabel
												label="Moving Reimbursement ($ USD)"
												tooltip="One-time corporate relocation allowance or lump-sum moving payment."
											/>
											<input
												type="number"
												value={movingReimbursementOneTime}
												onChange={(e) => setMovingReimbursementOneTime(Math.max(0, Number(e.target.value)))}
												className="w-full px-3 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 3: INTERNATIONAL TAXATION ENGINE --- */}
			{activeTab === 'tax' && (
				<div className="space-y-6">
					{/* Stacked Tax Burden Comparison Chart */}
					<div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm space-y-3">
						<div className="flex items-center justify-between border-b border-stone-100 pb-2">
							<h3 className="text-base font-bold text-stone-900">Total Tax Burden Composition ($ USD Normalized)</h3>
							<span className="text-xs font-mono text-stone-400">Host vs. Home Tax Offset</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
							<div className="space-y-1 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
								<div className="flex justify-between font-bold text-stone-800">
									<span>🇺🇸 Stay Total Tax: {formatCurrency(breakdown.stayTaxes)}</span>
								</div>
								<div className="h-4 bg-stone-200 rounded-lg overflow-hidden flex">
									<div style={{ width: `${(breakdown.stayTaxes / Math.max(breakdown.stayTaxes, breakdown.actualTotalTaxesPaid, 1)) * 100}%` }} className="bg-stone-700 text-white text-[10px] font-bold flex items-center justify-center">
										US Fed + State + FICA
									</div>
								</div>
							</div>

							<div className="space-y-1 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
								<div className="flex justify-between font-bold text-[#C25E40]">
									<span>{selectedCountry.flagEmoji} Move Actual Tax: {formatCurrency(breakdown.actualTotalTaxesPaid)}</span>
								</div>
								<div className="h-4 bg-amber-100 rounded-lg overflow-hidden flex">
									<div style={{ width: `${(breakdown.actualTotalTaxesPaid / Math.max(breakdown.stayTaxes, breakdown.actualTotalTaxesPaid, 1)) * 100}%` }} className="bg-[#C25E40] text-white text-[10px] font-bold flex items-center justify-center">
										Host + Home + SS Tax
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid gap-8 md:grid-cols-2">
						{/* Host Tax Panel */}
						<div className="bg-gradient-to-br from-amber-50/30 via-white to-stone-50/50 rounded-2xl border border-amber-200/60 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C25E40]">
									Host Tax Engine ({selectedCountry.name})
								</span>
								<span className="text-xs font-bold text-[#C25E40] bg-amber-100/70 px-2.5 py-1 rounded-lg">
									{selectedCountry.flagEmoji} {selectedCountry.currencyCode}
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">{selectedCountry.expatRegimeName}</h3>

							<div className="space-y-4 pt-1 text-xs">
								{selectedCountry.hasSpecialExpatRegime && (
									<div className="flex items-center justify-between bg-white p-4 rounded-xl border border-amber-200/80">
										<div>
											<span className="font-bold text-stone-900 block text-sm">Special Expat Tax Regime</span>
											<span className="text-stone-500 text-xs">{selectedCountry.expatRegimeDescription}</span>
										</div>
										<input
											type="checkbox"
											checked={useSpecialRegime}
											onChange={(e) => setUseSpecialRegime(e.target.checked)}
											className="h-5 w-5 rounded accent-[#C25E40] cursor-pointer"
										/>
									</div>
								)}

								<div>
									<FieldLabel
										label="Global Passive & Investment Income ($ USD / Year)"
										tooltip="Annual dividends, interest, and capital gains. Evaluated under host special expat regime exemptions and US taxes."
									/>
									<input
										type="number"
										value={foreignInvestmentIncome}
										onChange={(e) => setForeignInvestmentIncome(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
									/>
								</div>

								<div className="bg-white p-4 rounded-xl border border-amber-200/80">
									<span className="text-xs font-mono uppercase text-stone-400 block mb-1">Tax Engine Note</span>
									<p className="font-mono text-xs text-stone-800 font-semibold">
										{breakdown.hostTaxDetailsNote}
									</p>
								</div>
							</div>
						</div>

						{/* Home US Tax Panel */}
						<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-stone-100 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
									Home Tax Logic (U.S.)
								</span>
								<span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
									🇺🇸 Worldwide Obligations
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">Treaties &amp; Tax Coverage Policy</h3>

							<div className="space-y-4 pt-1 text-xs">
								<div className="flex items-center justify-between bg-stone-50 p-4 rounded-xl border border-stone-200">
									<div>
										<span className="font-bold text-stone-900 block text-sm">U.S. Citizen / Green Card Holder</span>
										<span className="text-stone-500 text-xs">Subject to US worldwide income tax regardless of residence</span>
									</div>
									<input
										type="checkbox"
										checked={isUSCitizen}
										onChange={(e) => setIsUSCitizen(e.target.checked)}
										className="h-5 w-5 rounded accent-stone-900 cursor-pointer"
									/>
								</div>

								<div>
									<FieldLabel
										label="US State Tax Rate Jurisdiction (Stay Scenario)"
										tooltip="State income tax rate in your home baseline state before relocation (0% TX/FL, 5% Avg, 9.3% CA)."
									/>
									<select
										value={homeStateTaxRate}
										onChange={(e) => setHomeStateTaxRate(Number(e.target.value))}
										className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 outline-none"
									>
										<option value={0.0}>0.0% — No State Income Tax (TX, FL, WA, NV, WY, SD, TN, AK)</option>
										<option value={0.0307}>3.07% — Low State Tax (e.g. PA)</option>
										<option value={0.05}>5.00% — National US Average State Tax</option>
										<option value={0.0685}>6.85% — Mid-High State Tax (e.g. NY)</option>
										<option value={0.093}>9.30% — High State Tax (e.g. CA)</option>
									</select>
								</div>

								<div>
									<FieldLabel
										label="US Federal Tax Relief Method"
										tooltip="FEIE excludes up to $126.5k foreign salary (best for low-tax countries). FTC provides dollar-for-dollar tax credits (best for high-tax countries)."
									/>
									<select
										value={taxReliefMethod}
										onChange={(e) => setTaxReliefMethod(e.target.value as any)}
										className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 outline-none"
									>
										<option value="auto">Auto-Select Optimal (FEIE vs FTC)</option>
										<option value="feie">Foreign Earned Income Exclusion (FEIE - Max $126,500)</option>
										<option value="ftc">Foreign Tax Credit (FTC - Dollar-for-dollar offset)</option>
									</select>
								</div>

								<div>
									<FieldLabel
										label="Corporate Tax Policy Coverage"
										tooltip="Tax Equalization keeps your net tax burden identical to Stay. Tax Protection reimburses if host taxes exceed home taxes."
									/>
									<select
										value={taxPolicy}
										onChange={(e) => setTaxPolicy(e.target.value as any)}
										className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 outline-none"
									>
										<option value="tax-equalization">Tax Equalization (Employee burden stays identical to Stay scenario)</option>
										<option value="tax-protection">Tax Protection (Employer pays excess if host taxes &gt; home taxes)</option>
										<option value="laissez-faire">Laissez-Faire (Employee pays all host &amp; home taxes independently)</option>
									</select>
								</div>

								<div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
									<FieldLabel
										label="Assignment Duration (Years)"
										tooltip="Assignments ≤5 years qualify for Totalization detached worker exemption from host social security."
									/>
									<input
										type="number"
										min={1}
										max={10}
										value={assignmentDurationYears}
										onChange={(e) => setAssignmentDurationYears(Math.max(1, Number(e.target.value)))}
										className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-mono text-stone-900"
									/>
									<p className="text-[11px] text-stone-600">
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
				<div className="space-y-6">
					{/* CHART 4: Grouped Expense Comparison Chart */}
					<ExpenseGroupedBarChart inputs={inputs} breakdown={breakdown} />

					<div className="grid gap-8 md:grid-cols-2">
						{/* Left Panel: Stay Expenses */}
						<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-stone-100 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
									Home Living Expenses ($ USD)
								</span>
								<span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
									🇺🇸 Stay Outlays
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">Home Country Baseline Costs</h3>

							<div className="space-y-4">
								<div>
									<FieldLabel
										label="Home Rent or Mortgage ($ USD / Month)"
										tooltip="Monthly housing costs in the US (rent payment or primary mortgage payment)."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={homeRentOrMortgageMonthly}
											onChange={(e) => setHomeRentOrMortgageMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<FieldLabel
											label="Private School Tuition ($/Mo)"
											tooltip="Monthly private school tuition for children in the US."
										/>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
											<input
												type="number"
												value={homeTuitionMonthly}
												onChange={(e) => setHomeTuitionMonthly(Math.max(0, Number(e.target.value)))}
												className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
									</div>
									<div>
										<FieldLabel
											label="Private Health Insurance ($/Mo)"
											tooltip="Monthly private health insurance premiums in the US."
										/>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
											<input
												type="number"
												value={homeHealthInsuranceMonthly}
												onChange={(e) => setHomeHealthInsuranceMonthly(Math.max(0, Number(e.target.value)))}
												className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
											/>
										</div>
									</div>
								</div>

								<div>
									<FieldLabel
										label="Discretionary Spending Baseline ($ USD / Month)"
										tooltip="Monthly lifestyle outlays in the US (groceries, dining, transportation, utilities)."
									/>
									<div className="relative">
										<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
										<input
											type="number"
											value={discretionarySpendMonthly}
											onChange={(e) => setDiscretionarySpendMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full pl-8 pr-3 py-2.5 bg-stone-50/80 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Right Panel: Host Expenses */}
						<div className="bg-gradient-to-br from-[#FAF8F5] via-white to-stone-50/50 rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-5">
							<div className="flex items-center justify-between border-b border-stone-100 pb-3">
								<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700">
									Host Expenses ({selectedCountry.name})
								</span>
								<span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-lg">
									{selectedCountry.flagEmoji} {selectedCountry.currencyCode} ({selectedCountry.currencySymbol})
								</span>
							</div>

							<h3 className="text-lg font-bold text-stone-900">Host Destination Costs ({selectedCountry.currencySymbol})</h3>

							<div className="space-y-4">
								<div>
									<FieldLabel
										label={`Host Rent (${selectedCountry.currencySymbol} / Month)`}
										tooltip={`Monthly rental cost in ${selectedCountry.name} in local ${selectedCountry.currencyCode}.`}
									/>
									<input
										type="number"
										value={hostRentMonthly}
										onChange={(e) => setHostRentMonthly(Math.max(0, Number(e.target.value)))}
										className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<FieldLabel
											label={`Private School Tuition (${selectedCountry.currencySymbol}/Mo)`}
											tooltip={`Monthly international school tuition in ${selectedCountry.currencyCode}.`}
										/>
										<input
											type="number"
											value={privateTuitionMonthly}
											onChange={(e) => setPrivateTuitionMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
									<div>
										<FieldLabel
											label={`Private Health Insurance (${selectedCountry.currencySymbol}/Mo)`}
											tooltip={`Monthly private expat health insurance premium in ${selectedCountry.currencyCode}.`}
										/>
										<input
											type="number"
											value={privateHealthInsuranceMonthly}
											onChange={(e) => setPrivateHealthInsuranceMonthly(Math.max(0, Number(e.target.value)))}
											className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
										/>
									</div>
								</div>

								<div>
									<FieldLabel
										label={`Host Cost of Living Multiplier (${(hostColIndexRatio * 100).toFixed(0)}%)`}
										tooltip="Adjusts discretionary spending based on local purchasing power index vs US baseline."
									/>
									<input
										type="range"
										min={0.3}
										max={1.5}
										step={0.01}
										value={hostColIndexRatio}
										onChange={(e) => setHostColIndexRatio(Number(e.target.value))}
										className="w-full h-2 rounded-lg bg-stone-200 accent-[#2E6F40] cursor-pointer"
									/>
									<span className="text-xs text-stone-600 font-medium">
										{hostColIndexRatio < 1
											? `Host city in ${selectedCountry.name} is ${((1 - hostColIndexRatio) * 100).toFixed(0)}% cheaper than home`
											: `Host city in ${selectedCountry.name} is ${((hostColIndexRatio - 1) * 100).toFixed(0)}% pricier than home`}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* --- TAB 5: FX & LIABILITIES --- */}
			{activeTab === 'fx' && (
				<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-6">
					<h3 className="text-xl font-bold text-stone-900 tracking-tight">Foreign Exchange &amp; Cross-Border Debt Servicing</h3>

					<div className="bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-2.5 text-xs text-stone-600">
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-[#9C4127] block">
							How to Input Liabilities:
						</span>
						<p className="leading-relaxed">
							<strong>Home-Currency Liabilities (U.S. obligations):</strong> Enter USD obligations that you currently pay and will continue paying even after moving (e.g., U.S. student loans or a retained U.S. mortgage). The model automatically applies these to **both** the <strong>Stay</strong> and <strong>Move</strong> scenarios.
						</p>
						<p className="leading-relaxed">
							<strong>Host-Currency Liabilities (Local obligations):</strong> Enter local debts or commitments that you will only incur if you move (e.g., a Spanish car lease or a Spanish local mortgage). These are only applied to the <strong>Move</strong> scenario.
						</p>
						<p className="leading-relaxed font-semibold text-stone-700">
							Note: Primary home rent/housing outlays should be entered in Tab 4 (Expenses &amp; CoL), not here.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<div>
							<FieldLabel
								label={`Exchange Rate (${selectedCountry.currencyCode} to USD)`}
								tooltip={`Current exchange rate: 1 ${selectedCountry.currencyCode} in USD.`}
							/>
							<input
								type="number"
								step={0.0001}
								value={fxRateHostToUsd}
								onChange={(e) => setFxRateHostToUsd(Math.max(0.00001, Number(e.target.value)))}
								className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
							/>
							<span className="text-xs text-stone-500 font-mono mt-1 block">1 {selectedCountry.currencyCode} = ${fxRateHostToUsd} USD</span>
						</div>

						<div>
							<FieldLabel
								label="Home-Currency Monthly Liabilities ($ USD)"
								tooltip="Ongoing USD debt obligations (US mortgage, student loans, 401k/IRA contributions)."
							/>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-stone-400 font-semibold">$</span>
								<input
									type="number"
									value={homeLiabilitiesUsdMonthly}
									onChange={(e) => setHomeLiabilitiesUsdMonthly(Math.max(0, Number(e.target.value)))}
									className="w-full pl-8 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
								/>
							</div>
							<span className="text-xs text-stone-500 mt-1 block">US mortgage, student loans, 401(k) / IRA contributions</span>
						</div>
					</div>

					<div className="grid gap-6 md:grid-cols-2 border-t border-stone-100 pt-6">
						<div>
							<FieldLabel
								label={`Host-Currency Monthly Liabilities (${selectedCountry.currencySymbol} ${selectedCountry.currencyCode})`}
								tooltip={`Local debt servicing in host country (local car lease, host mortgage, local loan).`}
							/>
							<input
								type="number"
								value={hostLiabilitiesMonthly}
								onChange={(e) => setHostLiabilitiesMonthly(Math.max(0, Number(e.target.value)))}
								className="w-full px-3 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-sm font-mono text-stone-900 outline-none"
							/>
							<span className="text-xs text-stone-500 mt-1 block">Host local car lease, local debt, or host pension contributions</span>
						</div>

						<div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col justify-between">
							<span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-500">
								Combined Debt Servicing Summary
							</span>
							<p className="text-lg font-mono text-stone-900 font-bold mt-1">
								Total Move Debt: {formatCurrency(breakdown.moveTotalLiabilitiesUsd)} / year
							</p>
							<p className="text-xs text-stone-500 font-mono">
								Home USD Debt: {formatCurrency(breakdown.moveHomeLiabilities)} + Host Debt: {formatCurrency(breakdown.moveHostLiabilitiesUsd)}
							</p>
						</div>
					</div>

					<div className="border-t border-stone-100 pt-4 space-y-2">
						<span className="font-mono text-xs font-bold uppercase tracking-wider text-[#C25E40] flex items-center gap-1.5">
							<svg className="w-4 h-4 text-[#C25E40]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Translation Risk Exposure (Host Currency Weakening)
						</span>
						<p className="text-sm text-stone-600">
							If host currency ({selectedCountry.currencyCode}) depreciates by 10% against USD (from ${fxRateHostToUsd} to ${(fxRateHostToUsd * 0.9).toFixed(5)}), servicing your annual ${formatCurrency(breakdown.moveTotalLiabilitiesUsd)} USD liabilities requires an extra <strong>{formatCurrency(breakdown.fxDepreciationImpactUsd)}</strong> in host earnings per year.
						</p>
					</div>
				</div>
			)}

			{/* --- TAB 6: 5-YEAR WEALTH TRAJECTORY --- */}
			{activeTab === 'wealth' && (
				<div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-6 space-y-6">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
						<div>
							<h3 className="text-xl font-bold text-stone-900 tracking-tight">5-Year Cumulative Wealth Trajectory</h3>
							<p className="text-xs text-stone-500">Compares cumulative wealth accumulation in the US vs. {selectedCountry.name}.</p>
						</div>
						<div className="flex items-center gap-3 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
							<span className="text-xs font-mono uppercase text-stone-500">Assumed Growth Rate</span>
							<input
								type="number"
								step={0.01}
								min={0}
								max={0.2}
								value={expectedInvestmentReturnRate}
								onChange={(e) => setExpectedInvestmentReturnRate(Math.max(0, Number(e.target.value)))}
								className="w-16 px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-stone-900 outline-none"
							/>
						</div>
					</div>

					{/* CHART 1 REPEATED: Large High-Res Earthy Terracotta & Green 5-Year Area Chart */}
					<WealthAreaChart projections={projections} countryName={selectedCountry.name} />

					{/* Visual Bar Comparison Charts */}
					<div className="space-y-4">
						{projections.map((p) => {
							const maxVal = Math.max(...projections.map((x) => Math.max(x.stayCumulativeWealth, x.moveCumulativeWealth)), 1);
							const stayPct = Math.min(100, Math.max(5, (p.stayCumulativeWealth / maxVal) * 100));
							const movePct = Math.min(100, Math.max(5, (p.moveCumulativeWealth / maxVal) * 100));
							const isPositive = p.wealthDelta >= 0;

							return (
								<div key={p.year} className="space-y-2 font-mono text-xs bg-stone-50/60 p-4 rounded-xl border border-stone-200/60">
									<div className="flex justify-between items-center text-stone-900 font-bold">
										<span>Year {p.year} Accumulation</span>
										<span style={{ color: isPositive ? '#2E6F40' : '#C25E40' }} className="px-2.5 py-0.5 rounded-md font-bold bg-stone-100">
											Net Delta: {p.wealthDelta >= 0 ? '+' : ''}{formatCurrency(p.wealthDelta)}
										</span>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
										<div>
											<div className="flex justify-between text-[11px] text-stone-500 mb-1">
												<span>Stay (US Baseline)</span>
												<span className="font-bold text-stone-700">{formatCurrency(p.stayCumulativeWealth)}</span>
											</div>
											<div className="h-3 bg-stone-200 rounded-full overflow-hidden">
												<div className="h-full bg-stone-500 rounded-full transition-all" style={{ width: `${stayPct}%` }} />
											</div>
										</div>
										<div>
											<div className="flex justify-between text-[11px] text-stone-700 mb-1">
												<span>Move ({selectedCountry.name})</span>
												<span style={{ color: isPositive ? '#2E6F40' : '#C25E40' }} className="font-bold">{formatCurrency(p.moveCumulativeWealth)}</span>
											</div>
											<div className="h-3 bg-stone-200 rounded-full overflow-hidden">
												<div className="h-full rounded-full transition-all" style={{ width: `${movePct}%`, backgroundColor: isPositive ? '#2E6F40' : '#C25E40' }} />
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					<div className="border-t border-stone-100 pt-4 text-xs text-stone-500">
						<p>
							Note: Projections assume annual household free cash flow is reinvested and compounded annually at {(expectedInvestmentReturnRate * 100).toFixed(1)}%.
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
