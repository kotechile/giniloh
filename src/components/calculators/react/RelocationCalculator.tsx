import { useState, useId, useMemo, useRef, useEffect } from 'react';
import { calculateRelocation, calculateTaxForYear, doesStateExcludeQualifiedRelocation, calculateFederalTax, calculateFicaTax } from '../../../lib/calculators/relocation';
import { formatCurrency, formatPercent } from '../../../lib/calculators/format';
import type { RelocationInputs, RelocationExpense, TaxYearSummary } from '../../../lib/calculators/types';

const US_STATES = [
	{ code: 'CA', name: 'California' },
	{ code: 'NY', name: 'New York' },
	{ code: 'NJ', name: 'New Jersey' },
	{ code: 'MD', name: 'Maryland' },
	{ code: 'VA', name: 'Virginia' },
	{ code: 'MA', name: 'Massachusetts' },
	{ code: 'PA', name: 'Pennsylvania' },
	{ code: 'AR', name: 'Arkansas' },
	{ code: 'HI', name: 'Hawaii' },
	{ code: 'TX', name: 'Texas (No Income Tax)' },
	{ code: 'FL', name: 'Florida (No Income Tax)' },
	{ code: 'WA', name: 'Washington (No Income Tax)' },
	{ code: 'OTHER', name: 'Other State (5% flat est.)' }
];

const DEFAULT_EXPENSES: RelocationExpense[] = [
	{ id: 'exp-1', name: 'Professional packing & loading', category: 'transit', amount: 1800, isReimbursed: true, isGrossedUp: false, isQualifiedMovingCost: true },
	{ id: 'exp-2', name: 'Moving truck rental & fuel', category: 'transit', amount: 1200, isReimbursed: false, isGrossedUp: false, isQualifiedMovingCost: true },
	{ id: 'exp-3', name: 'One-way flights & travel lodging', category: 'transit', amount: 800, isReimbursed: true, isGrossedUp: true, isQualifiedMovingCost: true },
	{ id: 'exp-4', name: 'Transit insurance', category: 'transit', amount: 200, isReimbursed: false, isGrossedUp: false, isQualifiedMovingCost: true },
	{ id: 'exp-5', name: 'Home cleaning & prep services', category: 'origin', amount: 350, isReimbursed: false, isGrossedUp: false, isQualifiedMovingCost: false },
	{ id: 'exp-6', name: 'Utility hookup & installation', category: 'destination', amount: 150, isReimbursed: false, isGrossedUp: false, isQualifiedMovingCost: false },
	{ id: 'exp-7', name: 'Initial appliance & setup purchases', category: 'destination', amount: 600, isReimbursed: true, isGrossedUp: false, isQualifiedMovingCost: false }
];

export default function RelocationCalculator() {
	const fieldId = useId();
	const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'lease' | 'tax' | 'grossup' | 'compliance'>('dashboard');

	// --- Form State ---
	const [filingStatus, setFilingStatus] = useState<'single' | 'married' | 'hoh'>('single');
	const [isMilitaryOrIntel, setIsMilitaryOrIntel] = useState(false);
	const [originState, setOriginState] = useState('MD');
	const [originLocalRate, setOriginLocalRate] = useState(3.2);
	const [originSalary, setOriginSalary] = useState(95000);

	const [destState, setDestState] = useState('CA');
	const [destLocalRate, setDestLocalRate] = useState(0.0);
	const [destSalary, setDestSalary] = useState(120000);

	const [expenses, setExpenses] = useState<RelocationExpense[]>(DEFAULT_EXPENSES);

	// Lease Break Form State
	const [leaseMonthlyRent, setLeaseMonthlyRent] = useState(2200);
	const [leaseDaysOccupied, setLeaseDaysOccupied] = useState(12);
	const [leaseDaysInMonth, setLeaseDaysInMonth] = useState(30);
	const [leaseProrationMethod, setLeaseProrationMethod] = useState<'daily' | 'annual' | 'banker'>('daily');
	const [leaseFlatPenalties, setLeaseFlatPenalties] = useState(3500);
	const [leaseLostDeposit, setLeaseLostDeposit] = useState(1500);
	const [leaseEmployerAllowance, setLeaseEmployerAllowance] = useState(2000);

	// Clawback / Compliance Form State
	const [clawbackDurationMonths, setClawbackDurationMonths] = useState(12);
	const [clawbackModel, setClawbackModel] = useState<'cliff' | 'linear'>('linear');
	const [clawbackInterestRate, setClawbackInterestRate] = useState(0.0);
	const [clawbackDeferralOption, setClawbackDeferralOption] = useState('payroll_deduction');
	const [employeeName, setEmployeeName] = useState('Alex Rivers');
	const [companyName, setCompanyName] = useState('Acme Technologies Inc.');

	// Ensure CA stays compliant
	useEffect(() => {
		if (destState === 'CA') {
			setClawbackModel('linear');
			setClawbackInterestRate(0.0);
			if (clawbackDurationMonths > 24) {
				setClawbackDurationMonths(24);
			}
		}
	}, [destState, clawbackDurationMonths]);

	// --- Expense Helpers ---
	const updateExpense = (id: string, updates: Partial<RelocationExpense>) => {
		setExpenses((prev) =>
			prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
		);
	};

	const addCustomExpense = () => {
		const newExp: RelocationExpense = {
			id: `exp-${Date.now()}`,
			name: 'Custom relocation service',
			category: 'transit',
			amount: 500,
			isReimbursed: false,
			isGrossedUp: false,
			isQualifiedMovingCost: false
		};
		setExpenses((prev) => [...prev, newExp]);
	};

	const removeExpense = (id: string) => {
		setExpenses((prev) => prev.filter((exp) => exp.id !== id));
	};

	// --- Calculations Compilation ---
	const inputs = useMemo<RelocationInputs>(() => ({
		filingStatus,
		isMilitaryOrIntel,
		originState,
		originLocalRate,
		originSalary,
		destState,
		destLocalRate,
		destSalary,
		expenses,
		leaseMonthlyRent,
		leaseDaysOccupied,
		leaseDaysInMonth,
		leaseProrationMethod,
		leaseFlatPenalties,
		leaseLostDeposit,
		leaseEmployerAllowance,
		clawbackDurationMonths,
		clawbackModel,
		clawbackInterestRate,
		clawbackDeferralOption,
		employeeName,
		companyName
	}), [
		filingStatus, isMilitaryOrIntel, originState, originLocalRate, originSalary,
		destState, destLocalRate, destSalary, expenses,
		leaseMonthlyRent, leaseDaysOccupied, leaseDaysInMonth, leaseProrationMethod,
		leaseFlatPenalties, leaseLostDeposit, leaseEmployerAllowance,
		clawbackDurationMonths, clawbackModel, clawbackInterestRate, clawbackDeferralOption,
		employeeName, companyName
	]);

	const breakdown = useMemo(() => calculateRelocation(inputs), [inputs]);

	// --- SVG Chart Resize and Hover Logic ---
	const chartSvgRef = useRef<SVGSVGElement>(null);
	const [chartWidth, setChartWidth] = useState(800);
	const [hoverIdx, setHoverIdx] = useState<number | null>(null);

	useEffect(() => {
		if (chartSvgRef.current) {
			const resizeObserver = new ResizeObserver((entries) => {
				for (let entry of entries) {
					setChartWidth(Math.max(300, entry.contentRect.width));
				}
			});
			resizeObserver.observe(chartSvgRef.current);
			return () => resizeObserver.disconnect();
		}
	}, []);

	const chartHeight = 220;
	const chartMargin = { top: 20, right: 25, bottom: 30, left: 65 };
	const chartPlotWidth = chartWidth - chartMargin.left - chartMargin.right;
	const chartPlotHeight = chartHeight - chartMargin.top - chartMargin.bottom;

	// Scale coordinates
	const points = breakdown.amortizationCashFlow;
	const maxVal = Math.max(...points, 5000);
	const minVal = Math.min(...points, -5000);
	const rangeY = maxVal - minVal;

	const getX = (index: number) => {
		return chartMargin.left + (index / 24) * chartPlotWidth;
	};

	const getY = (val: number) => {
		const ratio = (val - minVal) / rangeY;
		return chartMargin.top + chartPlotHeight - ratio * chartPlotHeight;
	};

	const linePath = useMemo(() => {
		if (!points || points.length === 0) return '';
		return points
			.map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(val)}`)
			.join(' ');
	}, [points, chartPlotWidth, minVal, rangeY]);

	const areaPath = useMemo(() => {
		if (!points || points.length === 0) return '';
		const startX = getX(0);
		const endX = getX(24);
		const zeroY = getY(0);
		return `${linePath} L ${endX} ${zeroY} L ${startX} ${zeroY} Z`;
	}, [linePath, chartPlotWidth, minVal, rangeY]);

	const zeroLineY = getY(0);

	return (
		<div className="grid gap-6">
			{/* Real-time Summary Header */}
			<div className="overflow-hidden rounded-[1.8rem] border border-blue-500/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96)_65%,rgba(59,130,246,0.1))]">
				<div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-7">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-300">
							Net-Of-Tax Payback Modeler
						</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Relocation Analytics Suite
						</h2>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
							Model moving costs, lease breaks, multi-jurisdictional tax changes, and stays-or-pay agreements under the 2026 OBBBA tax guidelines.
						</p>
						<div className="mt-6 flex flex-wrap gap-2.5">
							<span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								OBBBA 2026 Compliant
							</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								State Tax Exclusions
							</span>
							<span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								CA AB 692 Guardrails
							</span>
						</div>
					</div>
					
					{/* KPI Summary Card */}
					<div className="grid gap-3.5 rounded-[1.6rem] border border-white/10 bg-slate-950/50 p-5 shadow-2xl backdrop-blur-sm [.light_&]:bg-white/80">
						<div className="flex items-center justify-between border-b border-slate-900 pb-3 [.light_&]:border-slate-100">
							<span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">Payback Status</span>
							<span className={`rounded-full px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] ${breakdown.paybackPeriodMonths === Infinity ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
								{breakdown.paybackPeriodMonths === Infinity ? 'No Break-Even' : 'Calculated'}
							</span>
						</div>
						
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-xl border border-white/5 bg-slate-900/40 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
								<p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">Net Upfront Cost</p>
								<p className="mt-1 text-lg font-bold text-white tracking-tight">{formatCurrency(breakdown.netOutOfPocketRelocationCosts)}</p>
							</div>
							<div className="rounded-xl border border-white/5 bg-slate-900/40 p-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
								<p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-slate-500">Monthly Net Gain</p>
								<p className={`mt-1 text-lg font-bold tracking-tight ${breakdown.monthlyNetSalaryDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
									{formatCurrency(breakdown.monthlyNetSalaryDiff)}
								</p>
							</div>
						</div>
						
						<div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex flex-col justify-center">
							<p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-blue-300">Break-Even Period</p>
							<p className="mt-1 text-2xl font-extrabold text-blue-400 tracking-tight">
								{breakdown.paybackPeriodMonths === Infinity 
									? 'N/A' 
									: breakdown.paybackPeriodMonths <= 0 
										? 'Immediate' 
										: `${breakdown.paybackPeriodMonths.toFixed(1)} Months`
								}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Core Geographic & Salary Profile */}
			<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
				<div className="border-b border-slate-900 pb-4 mb-5 [.light_&]:border-slate-100">
					<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Core Modeler Settings</span>
					<h3 className="mt-1.5 text-xl font-semibold text-white">Demographics &amp; Salary Profile</h3>
				</div>

				<div className="grid gap-5 md:grid-cols-3">
					<div className="rounded-xl border border-slate-900 bg-slate-950/45 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
						<label className="block text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-2">Filing Status</label>
						<select
							value={filingStatus}
							onChange={(e) => setFilingStatus(e.target.value as any)}
							className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
						>
							<option value="single">Single</option>
							<option value="married">Married (Filing Jointly)</option>
							<option value="hoh">Head of Household</option>
						</select>
					</div>

					<div className="rounded-xl border border-slate-900 bg-slate-950/45 p-4 flex items-center justify-between [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
						<div>
							<label className="block text-xs font-mono uppercase tracking-[0.2em] text-slate-500">Military Exemption</label>
							<p className="text-[11px] text-slate-500 mt-1">IRC Section 132(g) Rules</p>
						</div>
						<input
							type="checkbox"
							checked={isMilitaryOrIntel}
							onChange={(e) => setIsMilitaryOrIntel(e.target.checked)}
							className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-blue-600 outline-none"
						/>
					</div>

					<div className="rounded-xl border border-slate-900 bg-slate-950/45 p-4 flex items-center justify-between [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
						<div>
							<label className="block text-xs font-mono uppercase tracking-[0.2em] text-slate-500">State Exceptions Engine</label>
							<p className="text-[11px] text-slate-500 mt-1">
								{doesStateExcludeQualifiedRelocation(destState) ? `${destState} Excludes moving costs` : 'No state exemptions'}
							</p>
						</div>
						<span className={`h-2 w-2 rounded-full ${doesStateExcludeQualifiedRelocation(destState) ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2 mt-6">
					{/* Origin State Profile */}
					<div className="space-y-4 border border-slate-800/80 rounded-[1.5rem] p-5 bg-slate-900/10 [.light_&]:border-slate-200 [.light_&]:bg-slate-50/50">
						<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300">Origin Location</h4>
						<div className="grid gap-4">
							<div>
								<label className="block text-xs text-slate-400 mb-1">Origin State</label>
								<select
									value={originState}
									onChange={(e) => setOriginState(e.target.value)}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
								>
									{US_STATES.map((s) => (
										<option key={s.code} value={s.code}>{s.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-xs text-slate-400 mb-1">Local Tax Rate (%)</label>
								<input
									type="number"
									step={0.05}
									value={originLocalRate}
									onChange={(e) => setOriginLocalRate(Math.max(0, Number(e.target.value)))}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white"
								/>
							</div>
							<div>
								<label className="block text-xs text-slate-400 mb-1">Base Annual Salary ($)</label>
								<input
									type="number"
									step={1000}
									value={originSalary}
									onChange={(e) => setOriginSalary(Math.max(0, Number(e.target.value)))}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white"
								/>
							</div>
						</div>
					</div>

					{/* Destination State Profile */}
					<div className="space-y-4 border border-slate-800/80 rounded-[1.5rem] p-5 bg-slate-900/10 [.light_&]:border-slate-200 [.light_&]:bg-slate-50/50">
						<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300">Destination Location</h4>
						<div className="grid gap-4">
							<div>
								<label className="block text-xs text-slate-400 mb-1">Destination State</label>
								<select
									value={destState}
									onChange={(e) => setDestState(e.target.value)}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
								>
									{US_STATES.map((s) => (
										<option key={s.code} value={s.code}>{s.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className="block text-xs text-slate-400 mb-1">Local Tax Rate (%)</label>
								<input
									type="number"
									step={0.05}
									value={destLocalRate}
									onChange={(e) => setDestLocalRate(Math.max(0, Number(e.target.value)))}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white"
								/>
							</div>
							<div>
								<label className="block text-xs text-slate-400 mb-1">Base Annual Salary ($)</label>
								<input
									type="number"
									step={1000}
									value={destSalary}
									onChange={(e) => setDestSalary(Math.max(0, Number(e.target.value)))}
									className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Sub-module Navigation Tabs */}
			<div className="flex flex-wrap gap-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-1 backdrop-blur-sm [.light_&]:border-slate-200 [.light_&]:bg-slate-100">
				{[
					{ id: 'dashboard', label: 'Overview & Payback' },
					{ id: 'expenses', label: 'Expense Ledger' },
					{ id: 'lease', label: 'Lease Break' },
					{ id: 'tax', label: 'Tax Engine' },
					{ id: 'grossup', label: 'Gross-Up' },
					{ id: 'compliance', label: 'Compliance & Stay' }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						className={`flex-1 min-w-[110px] rounded-xl px-3 py-2.5 text-center font-mono text-xs uppercase tracking-wider transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white [.light_&]:hover:bg-white/70 [.light_&]:hover:text-black'}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab Contents */}
			<div className="grid gap-6">

				{/* TAB 1: DASHBOARD (Overview & Payback Chart) */}
				{activeTab === 'dashboard' && (
					<div className="grid gap-6">
						{/* Chart Card */}
						<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
							<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-4 [.light_&]:border-slate-100">
								<div>
									<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Cumulative Cash Flow</span>
									<h3 className="mt-1.5 text-xl font-semibold text-white">The Relocation Debt Valley</h3>
								</div>
								<span className="rounded-full border border-slate-700 bg-slate-900/50 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-400 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
									24-Month Projection
								</span>
							</div>

							<div className="relative w-full">
								<svg
									ref={chartSvgRef}
									width="100%"
									height={chartHeight}
									className="overflow-visible select-none"
									onMouseLeave={() => setHoverIdx(null)}
									onMouseMove={(e) => {
										if (!chartSvgRef.current) return;
										const rect = chartSvgRef.current.getBoundingClientRect();
										const x = e.clientX - rect.left - chartMargin.left;
										const segment = chartPlotWidth / 24;
										const idx = Math.max(0, Math.min(24, Math.round(x / segment)));
										setHoverIdx(idx);
									}}
								>
									{/* Background grid lines */}
									{[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
										<line
											key={ratio}
											x1={chartMargin.left}
											y1={chartMargin.top + ratio * chartPlotHeight}
											x2={chartMargin.left + chartPlotWidth}
											y2={chartMargin.top + ratio * chartPlotHeight}
											className="stroke-slate-800/60 [.light_&]:stroke-slate-200"
											strokeDasharray="4 4"
										/>
									))}

									{/* Zero axis */}
									{zeroLineY >= chartMargin.top && zeroLineY <= chartMargin.top + chartPlotHeight && (
										<line
											x1={chartMargin.left}
											y1={zeroLineY}
											x2={chartMargin.left + chartPlotWidth}
											y2={zeroLineY}
											className="stroke-slate-600 [.light_&]:stroke-slate-300"
											strokeWidth="1.5"
										/>
									)}

									{/* Fill Area */}
									{areaPath && (
										<path
											d={areaPath}
											className="fill-blue-500/5 [.light_&]:fill-blue-500/10"
										/>
									)}

									{/* Line Path */}
									{linePath && (
										<path
											d={linePath}
											fill="none"
											className="stroke-blue-500 [.light_&]:stroke-blue-600"
											strokeWidth="2.5"
										/>
									)}

									{/* Break-even Month Vertical Dash */}
									{breakdown.paybackPeriodMonths > 0 && breakdown.paybackPeriodMonths <= 24 && (
										<g>
											<line
												x1={getX(breakdown.paybackPeriodMonths)}
												y1={chartMargin.top}
												x2={getX(breakdown.paybackPeriodMonths)}
												y2={chartMargin.top + chartPlotHeight}
												className="stroke-emerald-400 [.light_&]:stroke-emerald-500"
												strokeDasharray="3 3"
												strokeWidth="1.5"
											/>
											<circle
												cx={getX(breakdown.paybackPeriodMonths)}
												cy={getY(0)}
												r="4"
												className="fill-emerald-400 stroke-slate-950 [.light_&]:stroke-white"
												strokeWidth="1.5"
											/>
										</g>
									)}

									{/* Hover Marker */}
									{hoverIdx !== null && points[hoverIdx] !== undefined && (
										<g>
											<line
												x1={getX(hoverIdx)}
												y1={chartMargin.top}
												x2={getX(hoverIdx)}
												y2={chartMargin.top + chartPlotHeight}
												className="stroke-slate-700 [.light_&]:stroke-slate-300"
												strokeDasharray="2 2"
											/>
											<circle
												cx={getX(hoverIdx)}
												cy={getY(points[hoverIdx])}
												r="5"
												className="fill-blue-400 stroke-slate-950 [.light_&]:stroke-white"
												strokeWidth="1.5"
											/>
										</g>
									)}

									{/* Y Axis text Labels */}
									<text x={chartMargin.left - 10} y={getY(maxVal) + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
										{formatCurrency(maxVal)}
									</text>
									<text x={chartMargin.left - 10} y={getY(0) + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
										$0
									</text>
									<text x={chartMargin.left - 10} y={getY(minVal) + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
										{formatCurrency(minVal)}
									</text>

									{/* X Axis text Labels */}
									<text x={getX(0)} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
										Start
									</text>
									<text x={getX(6)} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
										M6
									</text>
									<text x={getX(12)} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
										M12
									</text>
									<text x={getX(18)} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
										M18
									</text>
									<text x={getX(24)} y={chartHeight - 10} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
										M24
									</text>
								</svg>

								{/* Tooltip */}
								{hoverIdx !== null && points[hoverIdx] !== undefined && (
									<div
										className="absolute z-10 rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md text-xs font-mono text-left [.light_&]:bg-white [.light_&]:border-slate-200"
										style={{
											left: `${Math.min(chartPlotWidth - 40, Math.max(70, getX(hoverIdx) - 70))}px`,
											top: `10px`
										}}
									>
										<p className="text-slate-400">Month {hoverIdx}</p>
										<p className={`font-bold mt-1 text-sm ${points[hoverIdx] >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
											{formatCurrency(points[hoverIdx])}
										</p>
										<p className="text-[10px] text-slate-500 mt-1 uppercase">
											{points[hoverIdx] >= 0 ? 'Profit Zone' : 'Debt Valley'}
										</p>
									</div>
								)}
							</div>
						</div>

						{/* Breakdown of Out-of-Pocket & Earnings */}
						<div className="grid gap-6 md:grid-cols-2">
							{/* Out-of-Pocket Breakdown */}
							<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-5 backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
								<h3 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Relocation Cost Friction</h3>
								<div className="mt-4 grid gap-3.5">
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Total Ledged Costs</span>
										<span className="font-mono text-white">{formatCurrency(breakdown.totalAllExpenses)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Employer Reimbursements</span>
										<span className="font-mono text-emerald-400">-{formatCurrency(breakdown.totalReimbursed)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Lease Termination Friction</span>
										<span className="font-mono text-white">{formatCurrency(breakdown.leaseNetFriction)}</span>
									</div>
									<div className="flex items-center justify-between text-sm border-b border-slate-900 pb-3.5 [.light_&]:border-slate-100">
										<span className="text-slate-400">Tax Liability Drag (Non-Grossed)</span>
										<span className="font-mono text-rose-400">+{formatCurrency(Math.max(0, breakdown.netOutOfPocketRelocationCosts - breakdown.totalOutOfPocketExpenses - breakdown.leaseNetFriction))}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-semibold text-white">Net Out-of-Pocket Costs</span>
										<span className="font-mono text-lg font-bold text-blue-400">{formatCurrency(breakdown.netOutOfPocketRelocationCosts)}</span>
									</div>
								</div>
							</div>

							{/* Earnings Bump Breakdown */}
							<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-5 backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
								<h3 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Compensation Delta</h3>
								<div className="mt-4 grid gap-3.5">
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Origin Base Salary</span>
										<span className="font-mono text-white">{formatCurrency(originSalary)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Destination Proposed Salary</span>
										<span className="font-mono text-emerald-400">+{formatCurrency(destSalary)}</span>
									</div>
									<div className="flex items-center justify-between text-sm">
										<span className="text-slate-400">Pre-Move Monthly Net Take-Home</span>
										<span className="font-mono text-white">{formatCurrency(breakdown.preMoveMonthlyNet)}</span>
									</div>
									<div className="flex items-center justify-between text-sm border-b border-slate-900 pb-3.5 [.light_&]:border-slate-100">
										<span className="text-slate-400">Post-Move Monthly Net Take-Home</span>
										<span className="font-mono text-white">{formatCurrency(breakdown.postMoveMonthlyNet)}</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-semibold text-white">Net Monthly Salary Gain</span>
										<span className={`font-mono text-lg font-bold ${breakdown.monthlyNetSalaryDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
											{formatCurrency(breakdown.monthlyNetSalaryDiff)}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 2: EXPENSE LEDGER (Epic 1) */}
				{activeTab === 'expenses' && (
					<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
						<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-5 [.light_&]:border-slate-100">
							<div>
								<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Epic 1 Checklist-Ledger</span>
								<h3 className="mt-1.5 text-xl font-semibold text-white">Relocation Expense Checklist</h3>
							</div>
							<button
								onClick={addCustomExpense}
								className="rounded-xl border border-blue-500/20 bg-blue-600/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-blue-300 transition hover:bg-blue-600 hover:text-white"
							>
								+ Add Custom Row
							</button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full border-collapse text-left text-sm">
								<thead>
									<tr className="border-b border-slate-800/80 [.light_&]:border-slate-200">
										<th className="pb-3.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Item Description</th>
										<th className="pb-3.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Category</th>
										<th className="pb-3.5 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Amount</th>
										<th className="pb-3.5 text-center font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Reimbursed</th>
										<th className="pb-3.5 text-center font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Grossed-Up</th>
										<th className="pb-3.5 text-center font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Qualified (Exclusion)</th>
										<th className="pb-3.5 text-right font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Actions</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-900/60 [.light_&]:divide-slate-100">
									{expenses.map((exp) => (
										<tr key={exp.id} className="group hover:bg-slate-900/10 [.light_&]:hover:bg-slate-50">
											<td className="py-3.5 font-medium text-white">
												<input
													type="text"
													value={exp.name}
													onChange={(e) => updateExpense(exp.id, { name: e.target.value })}
													className="bg-transparent text-white outline-none border-b border-transparent focus:border-slate-700 w-full"
												/>
											</td>
											<td className="py-3.5">
												<select
													value={exp.category}
													onChange={(e) => updateExpense(exp.id, { category: e.target.value as any })}
													className="bg-transparent text-slate-300 outline-none [.light_&]:text-slate-800"
												>
													<option value="origin" className="bg-slate-950">Origin services</option>
													<option value="transit" className="bg-slate-950">Physical transit</option>
													<option value="destination" className="bg-slate-950">Destination setup</option>
												</select>
											</td>
											<td className="py-3.5 font-mono text-white">
												<div className="flex items-center gap-1">
													<span>$</span>
													<input
														type="number"
														value={exp.amount}
														onChange={(e) => updateExpense(exp.id, { amount: Math.max(0, Number(e.target.value)) })}
														className="bg-transparent text-white outline-none border-b border-transparent focus:border-slate-700 w-20 font-mono"
													/>
												</div>
											</td>
											<td className="py-3.5 text-center">
												<input
													type="checkbox"
													checked={exp.isReimbursed}
													onChange={(e) => updateExpense(exp.id, { isReimbursed: e.target.checked })}
													className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 outline-none"
												/>
											</td>
											<td className="py-3.5 text-center">
												<input
													type="checkbox"
													checked={exp.isGrossedUp}
													disabled={!exp.isReimbursed}
													onChange={(e) => updateExpense(exp.id, { isGrossedUp: e.target.checked })}
													className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 outline-none disabled:opacity-30"
												/>
											</td>
											<td className="py-3.5 text-center">
												<input
													type="checkbox"
													checked={exp.isQualifiedMovingCost}
													onChange={(e) => updateExpense(exp.id, { isQualifiedMovingCost: e.target.checked })}
													className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 outline-none"
												/>
											</td>
											<td className="py-3.5 text-right">
												<button
													onClick={() => removeExpense(exp.id)}
													className="text-rose-400 hover:text-rose-300 font-mono text-xs uppercase"
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Subtotals bento-grid */}
						<div className="mt-6 grid gap-4 sm:grid-cols-3">
							<div className="rounded-2xl border border-slate-900 bg-slate-950/45 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
								<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">Origin Services</p>
								<p className="mt-1 text-lg font-bold text-white font-mono">{formatCurrency(breakdown.totalOriginExpenses)}</p>
							</div>
							<div className="rounded-2xl border border-slate-900 bg-slate-950/45 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
								<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">Logistics Transit</p>
								<p className="mt-1 text-lg font-bold text-white font-mono">{formatCurrency(breakdown.totalTransitExpenses)}</p>
							</div>
							<div className="rounded-2xl border border-slate-900 bg-slate-950/45 p-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
								<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">Destination Setup</p>
								<p className="mt-1 text-lg font-bold text-white font-mono">{formatCurrency(breakdown.totalDestinationExpenses)}</p>
							</div>
						</div>
					</div>
				)}

				{/* TAB 3: LEASE BREAK (Epic 2) */}
				{activeTab === 'lease' && (
					<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
						<div className="border-b border-slate-900 pb-4 mb-5 [.light_&]:border-slate-100">
							<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Epic 2 Housing Transition</span>
							<h3 className="mt-1.5 text-xl font-semibold text-white">Lease Break Friction Engine</h3>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							{/* Inputs */}
							<div className="grid gap-5">
								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Monthly Rent ($)</span>
										<input
											type="number"
											value={leaseMonthlyRent}
											onChange={(e) => setLeaseMonthlyRent(Math.max(0, Number(e.target.value)))}
											className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										/>
									</label>
								</div>

								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Days Occupied in final month</span>
										<input
											type="number"
											min={0}
											max={leaseDaysInMonth}
											value={leaseDaysOccupied}
											onChange={(e) => setLeaseDaysOccupied(Math.max(0, Number(e.target.value)))}
											className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										/>
									</label>
								</div>

								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Proration Formula</span>
										<select
											value={leaseProrationMethod}
											onChange={(e) => setLeaseProrationMethod(e.target.value as any)}
											className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										>
											<option value="daily">Daily Calendar Rate</option>
											<option value="annual">Annual Rate Method</option>
											<option value="banker">Banker's Month (30-day)</option>
										</select>
									</label>
								</div>

								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Flat Penalties ($)</span>
										<input
											type="number"
											value={leaseFlatPenalties}
											onChange={(e) => setLeaseFlatPenalties(Math.max(0, Number(e.target.value)))}
											className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										/>
									</label>
								</div>

								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Lost Security Deposit ($)</span>
										<input
											type="number"
											value={leaseLostDeposit}
											onChange={(e) => setLeaseLostDeposit(Math.max(0, Number(e.target.value)))}
											className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										/>
									</label>
								</div>

								<div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-slate-700 transition">
									<label className="flex items-center justify-between text-sm font-semibold text-slate-100">
										<span>Employer Mitigation Allowance ($)</span>
										<input
											type="number"
											value={leaseEmployerAllowance}
											onChange={(e) => setLeaseEmployerAllowance(Math.max(0, Number(e.target.value)))}
											className="w-28 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-right text-sm font-mono text-white"
										/>
									</label>
								</div>
							</div>

							{/* Calculations Result */}
							<div className="rounded-[1.6rem] border border-slate-800/80 bg-slate-950/50 p-6 flex flex-col justify-between [.light_&]:bg-slate-50 [.light_&]:border-slate-200">
								<div>
									<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Lease break breakdown</h4>
									<div className="mt-5 space-y-4">
										<div className="flex justify-between text-sm">
											<span className="text-slate-400">Prorated Final Rent</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.leaseProratedRent)}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-slate-400">Flat Contract Penalties</span>
											<span className="font-mono text-white">+{formatCurrency(leaseFlatPenalties)}</span>
										</div>
										<div className="flex justify-between text-sm">
											<span className="text-slate-400">Estimated Lost Deposit</span>
											<span className="font-mono text-white">+{formatCurrency(leaseLostDeposit)}</span>
										</div>
										<div className="flex justify-between text-sm border-b border-slate-800 pb-4 [.light_&]:border-slate-200">
											<span className="text-slate-400">Employer Allowances Offset</span>
											<span className="font-mono text-emerald-400">-{formatCurrency(leaseEmployerAllowance)}</span>
										</div>
									</div>
								</div>

								<div className="mt-8 border-t border-slate-900 pt-6 [.light_&]:border-slate-200">
									<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-blue-300">Net Lease Break Exposure</p>
									<p className="mt-2 text-4xl font-extrabold text-blue-400 font-mono tracking-tight">
										{formatCurrency(breakdown.leaseNetFriction)}
									</p>
									<p className="mt-3 text-xs leading-6 text-slate-400">
										This total has been added to your origin services expense ledger and is included in the break-even payback calculation.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 4: TAX ENGINE (Epic 3 & Section 5) */}
				{activeTab === 'tax' && (
					<div className="grid gap-6">
						{/* Side-by-side Tax Comparison */}
						<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
							<h3 className="text-lg font-semibold text-white mb-5 border-b border-slate-900 pb-3 [.light_&]:border-slate-100">Annual Tax Engine Analysis</h3>

							<div className="grid gap-6 md:grid-cols-2">
								{/* Pre-move Taxes */}
								<div className="space-y-4">
									<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Pre-Move Summary ({originState})</h4>
									<div className="space-y-3.5 text-sm">
										<div className="flex justify-between">
											<span className="text-slate-400">Gross Income</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.preMoveTax.grossIncome)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Federal Tax</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.preMoveTax.federalTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">FICA (SS & Med)</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.preMoveTax.ficaTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">State Tax</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.preMoveTax.stateTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Local Tax ({originLocalRate.toFixed(2)}%)</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.preMoveTax.localTax)}</span>
										</div>
										<div className="flex justify-between border-t border-slate-900 pt-3 font-semibold text-white [.light_&]:border-slate-200">
											<span>Total Tax Burden</span>
											<span className="font-mono text-rose-400">{formatCurrency(breakdown.preMoveTax.totalTax)}</span>
										</div>
										<div className="flex justify-between border-t border-slate-900 pt-3 font-bold text-white [.light_&]:border-slate-200">
											<span>Net Take-Home Salary</span>
											<span className="font-mono text-emerald-400">{formatCurrency(breakdown.preMoveTax.netTakeHome)}</span>
										</div>
									</div>
								</div>

								{/* Post-move Taxes */}
								<div className="space-y-4">
									<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Post-Move Summary ({destState})</h4>
									<div className="space-y-3.5 text-sm">
										<div className="flex justify-between">
											<span className="text-slate-400">Gross Income (Incl. Reimb.)</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.postMoveTax.grossIncome)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Federal Tax</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.postMoveTax.federalTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">FICA (SS & Med)</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.postMoveTax.ficaTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">State Tax</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.postMoveTax.stateTax)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-slate-400">Local Tax ({destLocalRate.toFixed(2)}%)</span>
											<span className="font-mono text-white">{formatCurrency(breakdown.postMoveTax.localTax)}</span>
										</div>
										<div className="flex justify-between border-t border-slate-900 pt-3 font-semibold text-white [.light_&]:border-slate-200">
											<span>Total Tax Burden</span>
											<span className="font-mono text-rose-400">{formatCurrency(breakdown.postMoveTax.totalTax)}</span>
										</div>
										<div className="flex justify-between border-t border-slate-900 pt-3 font-bold text-white [.light_&]:border-slate-200">
											<span>Net Take-Home Salary</span>
											<span className="font-mono text-emerald-400">{formatCurrency(breakdown.postMoveTax.netTakeHome)}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* TAB 5: TAX GROSS-UP (Epic 5) */}
				{activeTab === 'grossup' && (
					<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
						<div className="border-b border-slate-900 pb-4 mb-5 [.light_&]:border-slate-100">
							<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Epic 5 Tax gross-up optimization</span>
							<h3 className="mt-1.5 text-xl font-semibold text-white">Employer Tax Assistance Modeler</h3>
						</div>

						<p className="text-sm leading-7 text-slate-300 mb-6">
							Calculate the precise amount of gross-up assistance required to deliver a guaranteed net relocation benefit. This maps the combined effects of federal, FICA, destination state marginal, and municipal tax layers.
						</p>

						<div className="overflow-x-auto border border-slate-900 rounded-2xl [.light_&]:border-slate-200 mb-6">
							<table className="w-full border-collapse text-left text-sm">
								<thead>
									<tr className="bg-slate-950/45 border-b border-slate-900 [.light_&]:bg-slate-50 [.light_&]:border-slate-200">
										<th className="p-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Methodology</th>
										<th className="p-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Net Relocation Benefit</th>
										<th className="p-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Required Tax Assistance</th>
										<th className="p-4 font-mono text-[0.68rem] uppercase tracking-[0.2em] text-slate-500">Total Employer Cost</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-900/60 [.light_&]:divide-slate-100">
									{/* Flat/Simple */}
									<tr>
										<td className="p-4">
											<span className="font-semibold text-white block">Flat / Simple Method</span>
											<span className="text-xs text-slate-400 block mt-1">E_net * (1 + R_combined)</span>
										</td>
										<td className="p-4 font-mono text-white">
											{formatCurrency(expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0))}
										</td>
										<td className="p-4 font-mono text-rose-400">
											{formatCurrency(Math.max(0, breakdown.grossUpFlat - expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0)))}
										</td>
										<td className="p-4 font-mono text-blue-400 font-semibold">{formatCurrency(breakdown.grossUpFlat)}</td>
									</tr>

									{/* Supplemental Inverse */}
									<tr>
										<td className="p-4">
											<span className="font-semibold text-white block">Supplemental Inverse (Tax-on-Tax)</span>
											<span className="text-xs text-slate-400 block mt-1">E_net / (1 - R_combined)</span>
										</td>
										<td className="p-4 font-mono text-white">
											{formatCurrency(expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0))}
										</td>
										<td className="p-4 font-mono text-rose-400">
											{formatCurrency(Math.max(0, breakdown.grossUpInverse - expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0)))}
										</td>
										<td className="p-4 font-mono text-blue-400 font-semibold">{formatCurrency(breakdown.grossUpInverse)}</td>
									</tr>

									{/* Marginal True-Up */}
									<tr className="bg-blue-500/5 [.light_&]:bg-blue-50/50">
										<td className="p-4">
											<span className="font-bold text-white block flex items-center gap-1.5">
												Marginal True-Up
												<span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-blue-400">
													Recommended
												</span>
											</span>
											<span className="text-xs text-slate-400 block mt-1">Iterative scenario tax returns comparison</span>
										</td>
										<td className="p-4 font-mono text-white font-semibold">
											{formatCurrency(expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0))}
										</td>
										<td className="p-4 font-mono text-rose-400 font-bold">
											{formatCurrency(Math.max(0, breakdown.grossUpMarginal - expenses.reduce((sum, e) => (e.isReimbursed && e.isGrossedUp ? sum + e.amount : sum), 0)))}
										</td>
										<td className="p-4 font-mono text-emerald-400 font-extrabold">{formatCurrency(breakdown.grossUpMarginal)}</td>
									</tr>
								</tbody>
							</table>
						</div>

						<div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs leading-6 text-slate-400 [.light_&]:bg-slate-50 [.light_&]:border-slate-200">
							<p className="font-bold text-white uppercase tracking-wider mb-2">Composite Rate Assembly Details</p>
							<ul className="space-y-1">
								<li>• Federal Supplemental Rate: 22.00%</li>
								<li>• FICA Tax Contribution: {destSalary >= 184500 ? '1.45% (Above Social Security Cap)' : '7.65% (Below Cap)'}</li>
								<li>• Destination State Marginal Rate ({destState}): {formatPercent(Math.round(((breakdown.postMoveTax.stateTax - calculateTaxForYear(filingStatus, destState, destLocalRate, destSalary, [], isMilitaryOrIntel, true).stateTax) / Math.max(1, breakdown.postMoveTax.taxableRelocationReimbursements)) * 100))}</li>
								<li>• Destination Local Tax Rate: {destLocalRate.toFixed(2)}%</li>
							</ul>
						</div>
					</div>
				)}

				{/* TAB 6: STAY-OR-PAY COMPLIANCE (Epic 6 & California AB 692) */}
				{activeTab === 'compliance' && (
					<div className="grid gap-6">
						{/* Compliance Settings & Guardrails */}
						<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md [.light_&]:border-slate-200 [.light_&]:bg-white">
							<div className="border-b border-slate-900 pb-4 mb-5 [.light_&]:border-slate-100">
								<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">Epic 6 clawback compliance guardrails</span>
								<h3 className="mt-1.5 text-xl font-semibold text-white">Stay-or-Pay Retention Rules</h3>
							</div>

							{/* California AB 692 Notification Alert */}
							{destState === 'CA' && (
								<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-5 text-sm text-left">
									<div className="flex gap-3">
										<svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
										</svg>
										<div>
											<p className="font-bold text-amber-400 uppercase tracking-wider font-mono text-xs">California AB 692 Compliance Notice</p>
											<p className="mt-1 text-slate-300 text-xs leading-6">
												Under California AB 692, stay-or-pay agreements are subject to strict statutory rules. The interface has restricted your variables to guarantee conformity:
											</p>
											<ul className="mt-2 list-disc list-inside text-[11px] text-slate-400 space-y-1">
												<li>Cliff repayment models are prohibited; graduated linear decay is enforced.</li>
												<li>Retention schedules are strictly capped at 24 months maximum.</li>
												<li>Interest rates on outstanding liabilities must be locked at 0.00%.</li>
												<li>Standalone contracts with a mandatory 5-business-day Legal Review Disclosure are required.</li>
												<li>A deferral payment option selection must be chooseable.</li>
											</ul>
										</div>
									</div>
								</div>
							)}

							<div className="grid gap-6 md:grid-cols-2">
								{/* Inputs */}
								<div className="grid gap-4">
									<div>
										<label className="block text-xs text-slate-400 mb-1">Employee Full Name</label>
										<input
											type="text"
											value={employeeName}
											onChange={(e) => setEmployeeName(e.target.value)}
											className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
										/>
									</div>
									<div>
										<label className="block text-xs text-slate-400 mb-1">Company / Employer Entity</label>
										<input
											type="text"
											value={companyName}
											onChange={(e) => setCompanyName(e.target.value)}
											className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
										/>
									</div>
									<div>
										<label className="block text-xs text-slate-400 mb-1">Retention Duration (Months)</label>
										<input
											type="number"
											value={clawbackDurationMonths}
											disabled={destState === 'CA'}
											onChange={(e) => setClawbackDurationMonths(Math.max(1, Number(e.target.value)))}
											className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white disabled:opacity-50"
										/>
										{destState === 'CA' && <p className="text-[10px] text-slate-500 mt-1">Locked at 24 months maximum for CA compliance.</p>}
									</div>
									<div>
										<label className="block text-xs text-slate-400 mb-1">Repayment Schedule Model</label>
										<select
											value={clawbackModel}
											disabled={destState === 'CA'}
											onChange={(e) => setClawbackModel(e.target.value as any)}
											className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-50"
										>
											<option value="linear">Graduated Linear Decay</option>
											<option value="cliff">Cliff-Repayment Model</option>
										</select>
										{destState === 'CA' && <p className="text-[10px] text-slate-500 mt-1">Cliff model prohibited under CA AB 692.</p>}
									</div>
									<div>
										<label className="block text-xs text-slate-400 mb-1">Interest Rate (%)</label>
										<input
											type="number"
											value={clawbackInterestRate}
											disabled={destState === 'CA'}
											onChange={(e) => setClawbackInterestRate(Math.max(0, Number(e.target.value)))}
											className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-mono text-white disabled:opacity-50"
										/>
										{destState === 'CA' && <p className="text-[10px] text-slate-500 mt-1">Interest rate locked at 0.00% for CA compliance.</p>}
									</div>
									{destState === 'CA' && (
										<div>
											<label className="block text-xs text-slate-400 mb-1">Repayment Payment Deferral Option</label>
											<select
												value={clawbackDeferralOption}
												onChange={(e) => setClawbackDeferralOption(e.target.value)}
												className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
											>
												<option value="payroll_deduction">Standard Monthly Payroll Deductions</option>
												<option value="deferred_lump_sum">Deferred Lump-Sum Repayment (6 months grace)</option>
												<option value="custom_instalment">Custom Compliant Instalment Schedule</option>
											</select>
										</div>
									)}
								</div>

								{/* Repayment Graph & Compliance Checklist */}
								<div className="rounded-[1.6rem] border border-slate-800/80 bg-slate-950/50 p-5 flex flex-col justify-between [.light_&]:bg-slate-50 [.light_&]:border-slate-200">
									<div>
										<h4 className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">Repayment obligation decay</h4>
										
										{/* Simple visual decay bars */}
										<div className="mt-5 space-y-3">
											{[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
												const m = Math.round(ratio * clawbackDurationMonths);
												const isLinear = clawbackModel === 'linear';
												const pct = isLinear ? (1 - ratio) * 100 : (ratio < 1 ? 100 : 0);
												return (
													<div key={ratio} className="text-xs">
														<div className="flex justify-between font-mono text-slate-400 mb-1">
															<span>Month {m}</span>
															<span>{pct.toFixed(0)}% Owed ({formatCurrency(breakdown.totalReimbursed * (pct / 100))})</span>
														</div>
														<div className="h-1.5 w-full bg-slate-900 rounded-full">
															<div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
														</div>
													</div>
												);
											})}
										</div>
									</div>

									<div className="mt-6 border-t border-slate-900 pt-5 [.light_&]:border-slate-200">
										<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">AB 692 Compliance Audit</p>
										<div className="mt-2.5 space-y-2">
											<div className="flex items-center gap-2 text-xs">
												<span className={breakdown.isCaliforniaAB692Compliant ? 'text-emerald-400' : 'text-rose-400'}>●</span>
												<span className="text-slate-300">
													{breakdown.isCaliforniaAB692Compliant ? 'Compliant Stay-or-Pay Agreement Terms' : 'Compliance Violations Detected'}
												</span>
											</div>
											{breakdown.complianceWarnings.map((warning, index) => (
												<p key={index} className="text-[10px] text-rose-400 leading-5 pl-4">• {warning}</p>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Standalone Legal Contract Preview Card */}
						<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/30 p-6 shadow-2xl backdrop-blur-md text-left [.light_&]:border-slate-200 [.light_&]:bg-white print:border-none print:shadow-none print:bg-white print:p-0">
							<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4 mb-6 [.light_&]:border-slate-100 print:hidden">
								<div>
									<span className="font-mono text-xs uppercase tracking-[0.24em] text-blue-400">AB 692 Standalone Agreement Preview</span>
									<h3 className="mt-1.5 text-xl font-semibold text-white">Stay-or-Pay Relocation Repayment Contract</h3>
								</div>
								<button
									onClick={() => window.print()}
									className="rounded-xl border border-blue-500/20 bg-blue-600 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-blue-700 transition"
								>
									Print clawback PDF
								</button>
							</div>

							{/* Legal Contract Document */}
							<div className="rounded-2xl border border-slate-900/80 bg-slate-950/90 p-8 font-serif text-sm leading-7 text-slate-300 max-w-2xl mx-auto shadow-inner border-t-[6px] border-t-blue-500 [.light_&]:bg-slate-50 [.light_&]:border-slate-200 print:border-none print:shadow-none print:max-w-full print:p-0">
								<h2 className="text-center font-sans font-bold text-white text-lg tracking-wider uppercase mb-8 [.light_&]:text-black">
									EMPLOYEE GEOGRAPHIC RELOCATION REPAYMENT AGREEMENT
								</h2>
								
								<p className="mb-6">
									This Geographic Relocation Repayment Agreement (the &quot;Agreement&quot;) is made and entered into as of the relocation transition date, by and between <strong>{companyName}</strong> (the &quot;Employer&quot;) and <strong>{employeeName}</strong> (the &quot;Employee&quot;).
								</p>

								<h3 className="font-sans font-bold text-white uppercase text-xs tracking-wider mb-2 [.light_&]:text-black">1. REIMBURSED RELOCATION ASSISTANCE BENEFITS</h3>
								<p className="mb-6">
									The Employer has agreed to provide or reimburse the Employee for relocation expenses up to the total net amount of <strong>{formatCurrency(breakdown.totalReimbursed)}</strong> (including any grossed-up taxes paid directly by the Employer totaling <strong>{formatCurrency(breakdown.grossUpMarginal > breakdown.totalReimbursed ? breakdown.grossUpMarginal - breakdown.totalReimbursed : 0)}</strong>).
								</p>

								<h3 className="font-sans font-bold text-white uppercase text-xs tracking-wider mb-2 [.light_&]:text-black">2. RETENTION REQUIREMENT AND DECAY SCHEDULE</h3>
								<p className="mb-6">
									In consideration for receiving the relocation benefits, the Employee agrees to remain employed by the Employer on a full-time basis for a minimum duration of <strong>{clawbackDurationMonths} months</strong> (the &quot;Retention Period&quot;). 
									{clawbackModel === 'linear' ? (
										<span>
											{' '}If the Employee&apos;s employment is terminated by the Employer for Cause, or if the Employee resigns without Good Reason before the expiration of the Retention Period, the Employee shall repay the Employer the relocation assistance benefit prorated and decaying linearly at a rate of <strong>{(100 / clawbackDurationMonths).toFixed(2)}%</strong> per completed month of service.
										</span>
									) : (
										<span>
											{' '}If the Employee&apos;s employment is terminated by the Employer for Cause, or if the Employee resigns without Good Reason before the expiration of the Retention Period, the Employee shall repay the Employer 100% of the relocation assistance benefit on a cliff schedule.
										</span>
									)}
								</p>

								{destState === 'CA' && (
									<>
										<h3 className="font-sans font-bold text-white uppercase text-xs tracking-wider mb-2 [.light_&]:text-black">3. COMPLIANT DEFERRAL AND PAYMENT OPTIONS</h3>
										<p className="mb-6">
											Pursuant to California AB 692 compliance rules, the Employee has elected the following repayment method: <strong>{clawbackDeferralOption === 'payroll_deduction' ? 'Standard Monthly Payroll Deductions' : clawbackDeferralOption === 'deferred_lump_sum' ? 'Deferred Lump-Sum Repayment with 6 months grace period' : 'Custom Compliant Instalment Schedule'}</strong>.
											Outstanding clawback liabilities are locked at <strong>0.00% interest</strong>.
										</p>

										<div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 font-sans text-xs text-amber-300/95 leading-5">
											<p className="font-bold uppercase mb-1">MANDATORY 5-BUSINESS-DAY LEGAL REVIEW DISCLOSURE</p>
											<p>
												NOTICE: The Employee is hereby advised and declared to have a statutory right to review this standalone Geographic Relocation Repayment Agreement with independent legal counsel of their choosing. The Employee shall be given a mandatory period of five (5) business days from receipt of this document to sign and execute this agreement.
											</p>
										</div>
									</>
								)}

								<div className="mt-12 grid grid-cols-2 gap-8 font-sans text-xs pt-8 border-t border-slate-900 [.light_&]:border-slate-200">
									<div>
										<p className="border-b border-slate-700 pb-2 [.light_&]:border-slate-300"></p>
										<p className="mt-2 text-slate-400">Employee Signature</p>
										<p className="mt-1 font-bold text-white [.light_&]:text-black">{employeeName}</p>
									</div>
									<div>
										<p className="border-b border-slate-700 pb-2 [.light_&]:border-slate-300"></p>
										<p className="mt-2 text-slate-400">Employer Representative</p>
										<p className="mt-1 font-bold text-white [.light_&]:text-black">{companyName}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
