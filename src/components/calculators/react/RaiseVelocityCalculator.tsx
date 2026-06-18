import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import {
	CareerVelocityEngine,
	type PerformanceInputs,
	type StayerProfileConfig,
	type SwitcherProfileConfig,
	type GeographicProfile,
	type TrajectoryProjectionPoint
} from '../../../lib/calculators/careerVelocity';
import { formatCurrency, formatPercent } from '../../../lib/calculators/format';
import { CurrencyInput } from './fields/CurrencyInput';
import { StepperInput } from './fields/StepperInput';

export default function RaiseVelocityCalculator() {
	// Safe hydration state
	const [isLoaded, setIsLoaded] = useState(false);

	// Core state inputs
	const [startingSalary, setStartingSalary] = useState(100000);
	const [combinedTaxRate, setCombinedTaxRate] = useState(30); // in %
	const [marketReturnRate, setMarketReturnRate] = useState(8); // in %
	const [bonusPercentage, setBonusPercentage] = useState(10); // in %
	const [employerMatchLimit, setEmployerMatchLimit] = useState(3); // in %
	const [deferralContribution, setDeferralContribution] = useState(6); // in %

	// Stayer config state
	const [stayerRaiseRate, setStayerRaiseRate] = useState(4.1); // in %
	const [stayerCoL, setStayerCoL] = useState(1.0);
	const [stayerHours, setStayerHours] = useState(40);
	const [stayerPto, setStayerPto] = useState(15);

	// Switcher config state
	const [nonHopRaiseRate, setNonHopRaiseRate] = useState(3.0); // in %
	const [hopRaiseRate, setHopRaiseRate] = useState(15.0); // in %
	const [hopIntervalYears, setHopIntervalYears] = useState(3);
	const [unvestedMatchLossRate, setUnvestedMatchLossRate] = useState(100); // in %
	const [unvestedBonusLossRate, setUnvestedBonusLossRate] = useState(50); // in %
	const [cobraCost, setCobraCost] = useState(1200);
	const [signingBonus, setSigningBonus] = useState(5000);
	const [switcherCoL, setSwitcherCoL] = useState(1.0);
	const [switcherHours, setSwitcherHours] = useState(40);
	const [switcherPto, setSwitcherPto] = useState(15);

	// Tab states
	const [activeConfigTab, setActiveConfigTab] = useState<'core' | 'stayer' | 'switcher'>('core');
	const [chartMode, setChartMode] = useState<'portfolio' | 'salary'>('portfolio');

	// SVG Chart sizing and hover
	const svgRef = useRef<SVGSVGElement>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 320 });
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const fieldId = useId();

	// Hydration sync from localStorage
	useEffect(() => {
		const stored = localStorage.getItem('gini_raise_velocity_inputs');
		if (stored) {
			try {
				const data = JSON.parse(stored);
				if (typeof data.startingSalary === 'number') setStartingSalary(data.startingSalary);
				if (typeof data.combinedTaxRate === 'number') setCombinedTaxRate(data.combinedTaxRate);
				if (typeof data.marketReturnRate === 'number') setMarketReturnRate(data.marketReturnRate);
				if (typeof data.bonusPercentage === 'number') setBonusPercentage(data.bonusPercentage);
				if (typeof data.employerMatchLimit === 'number') setEmployerMatchLimit(data.employerMatchLimit);
				if (typeof data.deferralContribution === 'number') setDeferralContribution(data.deferralContribution);
				if (typeof data.stayerRaiseRate === 'number') setStayerRaiseRate(data.stayerRaiseRate);
				if (typeof data.stayerCoL === 'number') setStayerCoL(data.stayerCoL);
				if (typeof data.stayerHours === 'number') setStayerHours(data.stayerHours);
				if (typeof data.stayerPto === 'number') setStayerPto(data.stayerPto);
				if (typeof data.nonHopRaiseRate === 'number') setNonHopRaiseRate(data.nonHopRaiseRate);
				if (typeof data.hopRaiseRate === 'number') setHopRaiseRate(data.hopRaiseRate);
				if (typeof data.hopIntervalYears === 'number') setHopIntervalYears(data.hopIntervalYears);
				if (typeof data.unvestedMatchLossRate === 'number') setUnvestedMatchLossRate(data.unvestedMatchLossRate);
				if (typeof data.unvestedBonusLossRate === 'number') setUnvestedBonusLossRate(data.unvestedBonusLossRate);
				if (typeof data.cobraCost === 'number') setCobraCost(data.cobraCost);
				if (typeof data.signingBonus === 'number') setSigningBonus(data.signingBonus);
				if (typeof data.switcherCoL === 'number') setSwitcherCoL(data.switcherCoL);
				if (typeof data.switcherHours === 'number') setSwitcherHours(data.switcherHours);
				if (typeof data.switcherPto === 'number') setSwitcherPto(data.switcherPto);
			} catch (e) {
				console.error('Failed to restore calculator inputs from localStorage:', e);
			}
		}
		setIsLoaded(true);
	}, []);

	// Write back to localStorage on change
	useEffect(() => {
		if (isLoaded) {
			const payload = {
				startingSalary,
				combinedTaxRate,
				marketReturnRate,
				bonusPercentage,
				employerMatchLimit,
				deferralContribution,
				stayerRaiseRate,
				stayerCoL,
				stayerHours,
				stayerPto,
				nonHopRaiseRate,
				hopRaiseRate,
				hopIntervalYears,
				unvestedMatchLossRate,
				unvestedBonusLossRate,
				cobraCost,
				signingBonus,
				switcherCoL,
				switcherHours,
				switcherPto
			};
			localStorage.setItem('gini_raise_velocity_inputs', JSON.stringify(payload));
		}
	}, [
		isLoaded,
		startingSalary,
		combinedTaxRate,
		marketReturnRate,
		bonusPercentage,
		employerMatchLimit,
		deferralContribution,
		stayerRaiseRate,
		stayerCoL,
		stayerHours,
		stayerPto,
		nonHopRaiseRate,
		hopRaiseRate,
		hopIntervalYears,
		unvestedMatchLossRate,
		unvestedBonusLossRate,
		cobraCost,
		signingBonus,
		switcherCoL,
		switcherHours,
		switcherPto
	]);

	// Listen to element width resize
	useEffect(() => {
		if (svgRef.current) {
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					setDimensions((prev) => ({
						...prev,
						width: Math.max(300, entry.contentRect.width)
					}));
				}
			});
			resizeObserver.observe(svgRef.current);
			return () => resizeObserver.disconnect();
		}
	}, []);

	// Normalizing calculation structures
	const inputs: PerformanceInputs = useMemo(
		() => ({
			startingSalary,
			combinedTaxRate: combinedTaxRate / 100,
			marketReturnRate: marketReturnRate / 100,
			bonusPercentage: bonusPercentage / 100,
			employerMatchLimit: employerMatchLimit / 100,
			deferralContribution: deferralContribution / 100
		}),
		[
			startingSalary,
			combinedTaxRate,
			marketReturnRate,
			bonusPercentage,
			employerMatchLimit,
			deferralContribution
		]
	);

	const stayerConfig: StayerProfileConfig = useMemo(
		() => ({
			annualRaiseRate: stayerRaiseRate / 100
		}),
		[stayerRaiseRate]
	);

	const switcherConfig: SwitcherProfileConfig = useMemo(
		() => ({
			nonHopRaiseRate: nonHopRaiseRate / 100,
			hopRaiseRate: hopRaiseRate / 100,
			hopIntervalYears,
			unvestedMatchLossRate: unvestedMatchLossRate / 100,
			unvestedBonusLossRate: unvestedBonusLossRate / 100,
			cobraTransitionCost: cobraCost,
			newHireSigningBonusGross: signingBonus
		}),
		[
			nonHopRaiseRate,
			hopRaiseRate,
			hopIntervalYears,
			unvestedMatchLossRate,
			unvestedBonusLossRate,
			cobraCost,
			signingBonus
		]
	);

	const geoStayer: GeographicProfile = useMemo(
		() => ({
			costOfLivingIndex: stayerCoL,
			expectedWeeklyHours: stayerHours,
			paidTimeOffDays: stayerPto
		}),
		[stayerCoL, stayerHours, stayerPto]
	);

	const geoSwitcher: GeographicProfile = useMemo(
		() => ({
			costOfLivingIndex: switcherCoL,
			expectedWeeklyHours: switcherHours,
			paidTimeOffDays: switcherPto
		}),
		[switcherCoL, switcherHours, switcherPto]
	);

	const projections = useMemo(
		() =>
			CareerVelocityEngine.calculateProjections(
				inputs,
				stayerConfig,
				switcherConfig,
				geoStayer,
				geoSwitcher,
				10
			),
		[inputs, stayerConfig, switcherConfig, geoStayer, geoSwitcher]
	);

	// Get final results for KPIs
	const finalYearNode = projections[9] || {
		stayerSalary: 0,
		switcherSalary: 0,
		stayerNetAnnualCashFlow: 0,
		switcherNetAnnualCashFlow: 0,
		compoundedPortfolioDelta: 0
	};

	// SVG Chart Rendering Dimensions
	const margin = { top: 20, right: 30, bottom: 40, left: 80 };
	const plotWidth = dimensions.width - margin.left - margin.right;
	const plotHeight = dimensions.height - margin.top - margin.bottom;

	// Scale mapping helpers
	const getX = (index: number) => margin.left + (index / 9) * plotWidth;

	// Min/Max for plotting scales
	const scaleBounds = useMemo(() => {
		if (chartMode === 'portfolio') {
			const vals = projections.map((p) => p.compoundedPortfolioDelta);
			const minVal = Math.min(...vals, -2000);
			const maxVal = Math.max(...vals, 10000);
			const padding = (maxVal - minVal) * 0.15 || 1000;
			return { minY: minVal - padding, maxY: maxVal + padding };
		} else {
			const vals = projections.flatMap((p) => [p.stayerSalary, p.switcherSalary]);
			const minVal = Math.min(...vals, startingSalary);
			const maxVal = Math.max(...vals, startingSalary);
			const padding = (maxVal - minVal) * 0.1 || 10000;
			return { minY: Math.max(0, minVal - padding), maxY: maxVal + padding };
		}
	}, [chartMode, projections, startingSalary]);

	const getY = (val: number) => {
		const range = scaleBounds.maxY - scaleBounds.minY;
		if (range === 0) return margin.top + plotHeight / 2;
		const ratio = (val - scaleBounds.minY) / range;
		return margin.top + plotHeight - ratio * plotHeight;
	};

	// Draw lines
	const stayerSalaryPath = useMemo(() => {
		if (chartMode !== 'salary') return '';
		return projections
			.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.stayerSalary)}`)
			.join(' ');
	}, [chartMode, projections, plotWidth, scaleBounds]);

	const switcherSalaryPath = useMemo(() => {
		if (chartMode !== 'salary') return '';
		return projections
			.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.switcherSalary)}`)
			.join(' ');
	}, [chartMode, projections, plotWidth, scaleBounds]);

	const portfolioLinePath = useMemo(() => {
		if (chartMode !== 'portfolio') return '';
		return projections
			.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.compoundedPortfolioDelta)}`)
			.join(' ');
	}, [chartMode, projections, plotWidth, scaleBounds]);

	const portfolioAreaPath = useMemo(() => {
		if (chartMode !== 'portfolio' || projections.length === 0) return '';
		const startX = getX(0);
		const endX = getX(9);
		const zeroY = getY(0);
		return `${portfolioLinePath} L ${endX} ${zeroY} L ${startX} ${zeroY} Z`;
	}, [portfolioLinePath, plotWidth, scaleBounds]);

	const zeroLineY = getY(0);

	// Mouse interaction handlers
	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		if (!svgRef.current) return;
		const rect = svgRef.current.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;
		const idx = Math.round((mouseX / plotWidth) * 9);
		if (idx >= 0 && idx <= 9) {
			setHoveredIndex(idx);
		} else {
			setHoveredIndex(null);
		}
	};

	const hoveredData = hoveredIndex !== null ? projections[hoveredIndex] : null;

	return (
		<div className="grid gap-6">
			{/* KPI Summary Section */}
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="rounded-2xl border border-cyan-500/25 bg-slate-950/40 p-5 backdrop-blur-md shadow-lg">
					<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-cyan-400">
						Year 10 Raise Delta Portfolio
					</p>
					<h3 className="mt-2 text-3xl font-bold tracking-tight text-white font-sans">
						{formatCurrency(finalYearNode.compoundedPortfolioDelta)}
					</h3>
					<p className="mt-1 text-xs text-slate-400">
						Compounded at {marketReturnRate}% annual return
					</p>
				</div>

				<div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md shadow-lg">
					<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">
						Year 10 Salary Comparison
					</p>
					<h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
						{formatCurrency(finalYearNode.switcherSalary)}{' '}
						<span className="text-xs font-normal text-slate-400">vs</span>{' '}
						<span className="text-slate-400">
							{formatCurrency(finalYearNode.stayerSalary)}
						</span>
					</h3>
					<p className="mt-1 text-xs text-cyan-300 font-medium">
						+{formatPercent(Math.round(((finalYearNode.switcherSalary - finalYearNode.stayerSalary) / finalYearNode.stayerSalary) * 100))} Switcher premium
					</p>
				</div>

				<div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md shadow-lg">
					<p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-slate-500">
						Year 10 Net Take-home
					</p>
					<h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
						{formatCurrency(finalYearNode.switcherNetAnnualCashFlow)}{' '}
						<span className="text-xs font-normal text-slate-400">vs</span>{' '}
						<span className="text-slate-400">
							{formatCurrency(finalYearNode.stayerNetAnnualCashFlow)}
						</span>
					</h3>
					<p className="mt-1 text-xs text-slate-400">
						Inclusive of tax, matches & transition friction
					</p>
				</div>
			</div>

			{/* Chart Section */}
			<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/35 p-5 shadow-2xl backdrop-blur-md sm:p-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
					<div>
						<h2 className="text-lg font-bold tracking-tight text-white font-sans">
							10-Year Compounding Trajectory
						</h2>
						<p className="text-xs text-slate-400 mt-1">
							Visualize the divergence in salary or compounded raise portfolios.
						</p>
					</div>
					<div className="flex gap-1.5 rounded-lg bg-slate-950/90 border border-slate-800 p-1 font-mono text-[10px] self-start sm:self-center">
						<button
							onClick={() => setChartMode('portfolio')}
							className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${chartMode === 'portfolio' ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
						>
							💼 Portfolio growth
						</button>
						<button
							onClick={() => setChartMode('salary')}
							className={`rounded px-3 py-1.5 font-medium transition cursor-pointer ${chartMode === 'salary' ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300' : 'text-slate-400 hover:text-white'}`}
						>
							📈 Salary trajectory
						</button>
					</div>
				</div>

				{/* SVG Chart */}
				<div className="relative mt-6">
					<svg
						ref={svgRef}
						width="100%"
						height={dimensions.height}
						onMouseMove={handleMouseMove}
						onMouseLeave={() => setHoveredIndex(null)}
						className="overflow-visible select-none cursor-crosshair"
					>
						{/* Grid Lines */}
						{[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
							const y = margin.top + ratio * plotHeight;
							const val = scaleBounds.maxY - ratio * (scaleBounds.maxY - scaleBounds.minY);
							return (
								<g key={`grid-${ratio}`}>
									<line
										x1={margin.left}
										y1={y}
										x2={dimensions.width - margin.right}
										y2={y}
										stroke="#1e293b"
										strokeWidth="1"
										strokeDasharray="4, 4"
									/>
									<text
										x={margin.left - 12}
										y={y + 3.5}
										fill="#64748b"
										className="text-[9px] font-mono"
										textAnchor="end"
									>
										{formatCurrency(val)}
									</text>
								</g>
							);
						})}

						{/* Zero Baseline indicator for Portfolio */}
						{chartMode === 'portfolio' && zeroLineY >= margin.top && zeroLineY <= margin.top + plotHeight && (
							<line
								x1={margin.left}
								y1={zeroLineY}
								x2={dimensions.width - margin.right}
								y2={zeroLineY}
								stroke="#94a3b8"
								strokeWidth="1.5"
								strokeDasharray="2, 2"
								opacity="0.3"
							/>
						)}

						{/* X Axis Labels */}
						{projections.map((p, idx) => (
							<text
								key={`xlabel-${idx}`}
								x={getX(idx)}
								y={dimensions.height - margin.bottom + 18}
								fill="#64748b"
								className="text-[9px] font-mono"
								textAnchor="middle"
							>
								Yr {p.year}
							</text>
						))}

						{/* Paths & Areas */}
						{chartMode === 'portfolio' && (
							<>
								<path
									d={portfolioAreaPath}
									fill="url(#portfolio-gradient)"
									className="transition-all duration-300"
								/>
								<path
									d={portfolioLinePath}
									fill="none"
									stroke="#22d3ee"
									strokeWidth="3"
									className="transition-all duration-300"
								/>
							</>
						)}

						{chartMode === 'salary' && (
							<>
								<path
									d={stayerSalaryPath}
									fill="none"
									stroke="#475569"
									strokeWidth="2.5"
									strokeDasharray="3, 3"
									className="transition-all duration-300"
								/>
								<path
									d={switcherSalaryPath}
									fill="none"
									stroke="#06b6d4"
									strokeWidth="3.5"
									className="transition-all duration-300"
								/>
							</>
						)}

						{/* Hover Line */}
						{hoveredIndex !== null && (
							<line
								x1={getX(hoveredIndex)}
								y1={margin.top}
								x2={getX(hoveredIndex)}
								y2={dimensions.height - margin.bottom}
								stroke="#22d3ee"
								strokeWidth="1.5"
								strokeDasharray="3, 3"
								className="pointer-events-none"
							/>
						)}

						{/* Data Points */}
						{projections.map((p, idx) => {
							const isHovered = hoveredIndex === idx;
							if (chartMode === 'portfolio') {
								return (
									<circle
										key={`dot-${idx}`}
										cx={getX(idx)}
										cy={getY(p.compoundedPortfolioDelta)}
										r={isHovered ? 6 : 4.5}
										fill={isHovered ? '#22d3ee' : '#0891b2'}
										stroke="#020617"
										strokeWidth={isHovered ? 2.5 : 1.5}
										className="transition-all"
									/>
								);
							} else {
								return (
									<g key={`dots-salary-${idx}`}>
										<circle
											cx={getX(idx)}
											cy={getY(p.stayerSalary)}
											r={isHovered ? 5.5 : 4}
											fill={isHovered ? '#94a3b8' : '#475569'}
											stroke="#020617"
											strokeWidth={1.5}
										/>
										<circle
											cx={getX(idx)}
											cy={getY(p.switcherSalary)}
											r={isHovered ? 6.5 : 4.5}
											fill={isHovered ? '#22d3ee' : '#06b6d4'}
											stroke="#020617"
											strokeWidth={isHovered ? 2.5 : 1.5}
										/>
									</g>
								);
							}
						})}

						{/* Color Gradients */}
						<defs>
							<linearGradient id="portfolio-gradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
								<stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
							</linearGradient>
						</defs>
					</svg>
				</div>

				{/* Floating tooltip data details */}
				{hoveredData ? (
					<div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 flex flex-col md:flex-row gap-6 text-xs font-mono justify-between animate-fadeIn">
						<div className="flex items-center font-bold text-white pr-4 md:border-r border-slate-800 text-sm">
							📅 Year {hoveredData.year} Projections
						</div>
						<div className="flex-1 grid gap-4 sm:grid-cols-2">
							{/* Stayer Details */}
							<div className="flex flex-col gap-1.5 border-b sm:border-b-0 sm:border-r border-slate-800/60 pb-3 sm:pb-0 pr-3">
								<p className="font-semibold text-slate-400 text-[11px] uppercase tracking-wide">
									Stayer (Annual merit updates)
								</p>
								<div className="flex justify-between mt-1 text-[11px] text-slate-400">
									<span>Base Salary:</span>
									<span className="text-white font-semibold">{formatCurrency(hoveredData.stayerSalary)}</span>
								</div>
								<div className="flex justify-between text-[11px] text-slate-400">
									<span>Effective Hourly Rate:</span>
									<span className="text-slate-300 font-semibold">{formatCurrency(hoveredData.stayerEffectiveHourlyRate)}/hr</span>
								</div>
								<div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1 mt-1 font-semibold text-slate-300">
									<span>Take-home Cash Flow:</span>
									<span>{formatCurrency(hoveredData.stayerNetAnnualCashFlow)}</span>
								</div>
							</div>

							{/* Switcher Details */}
							<div className="flex flex-col gap-1.5">
								<p className="font-semibold text-cyan-400 text-[11px] uppercase tracking-wide">
									Switcher (Job-hopping strategy)
								</p>
								<div className="flex justify-between mt-1 text-[11px] text-slate-400">
									<span>Base Salary:</span>
									<span className="text-white font-semibold">{formatCurrency(hoveredData.switcherSalary)}</span>
								</div>
								<div className="flex justify-between text-[11px] text-slate-400">
									<span>Effective Hourly Rate:</span>
									<span className="text-slate-300 font-semibold">{formatCurrency(hoveredData.switcherEffectiveHourlyRate)}/hr</span>
								</div>
								<div className="flex justify-between text-[11px] text-slate-400 border-t border-slate-900 pt-1 mt-1 font-semibold text-cyan-300">
									<span>Take-home Cash Flow:</span>
									<span>{formatCurrency(hoveredData.switcherNetAnnualCashFlow)}</span>
								</div>
								{hoveredData.year > 1 && hoveredData.year % switcherConfig.hopIntervalYears === 0 && (
									<div className="mt-1.5 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded p-1.5 leading-4">
										⚠️ Transition Friction applied: COBRA health cost, matching forfeitures, bonus timing cuts, offset by new hire signing bonus.
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="text-slate-500 text-center font-mono text-[10px] italic mt-5 py-2.5 bg-slate-950/20 border border-slate-900/40 rounded-xl">
						Hover mouse cursor over the chart nodes to view detailed yearly projections.
					</div>
				)}
			</div>

			{/* Configuration Input Panels */}
			<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/25 p-5 shadow-2xl backdrop-blur-md">
				{/* Tab bar selection */}
				<div className="flex border-b border-slate-900 mb-6 text-xs font-mono">
					<button
						onClick={() => setActiveConfigTab('core')}
						className={`flex-1 py-3 font-semibold text-center border-b-2 transition cursor-pointer ${activeConfigTab === 'core' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
					>
						⚙️ Core parameters
					</button>
					<button
						onClick={() => setActiveConfigTab('stayer')}
						className={`flex-1 py-3 font-semibold text-center border-b-2 transition cursor-pointer ${activeConfigTab === 'stayer' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
					>
						🏠 Stayer settings
					</button>
					<button
						onClick={() => setActiveConfigTab('switcher')}
						className={`flex-1 py-3 font-semibold text-center border-b-2 transition cursor-pointer ${activeConfigTab === 'switcher' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
					>
						🚗 Switcher details
					</button>
				</div>

				{/* Panels */}
				{activeConfigTab === 'core' && (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
						<CurrencyInput
							id={`${fieldId}-core-starting`}
							label="Starting Base Salary"
							value={startingSalary}
							step={5000}
							onChange={setStartingSalary}
							helpText="Base compensation at Year 1 for both paths."
						/>
						<StepperInput
							id={`${fieldId}-core-tax`}
							label="Combined Tax Rate"
							value={combinedTaxRate}
							min={0}
							max={80}
							suffix="%"
							onChange={setCombinedTaxRate}
							helpText="Combined federal, state, and local income tax rate."
						/>
						<StepperInput
							id={`${fieldId}-core-portfolio`}
							label="Portfolio Return Rate"
							value={marketReturnRate}
							min={0}
							max={25}
							suffix="%"
							onChange={setMarketReturnRate}
							helpText="Compounding rate of the raise delta brokerage portfolio."
						/>
						<StepperInput
							id={`${fieldId}-core-bonus`}
							label="Annual Bonus (%)"
							value={bonusPercentage}
							min={0}
							max={100}
							suffix="%"
							onChange={setBonusPercentage}
							helpText="Target performance bonus relative to base salary."
						/>
						<StepperInput
							id={`${fieldId}-core-match`}
							label="Employer Match Limit"
							value={employerMatchLimit}
							min={0}
							max={20}
							suffix="%"
							onChange={setEmployerMatchLimit}
							helpText="Max percentage of base salary matched by employer."
						/>
						<StepperInput
							id={`${fieldId}-core-deferral`}
							label="Deferral Contribution"
							value={deferralContribution}
							min={0}
							max={100}
							suffix="%"
							onChange={setDeferralContribution}
							helpText="Employee deferral contribution rate to 401(k)."
						/>
					</div>
				)}

				{activeConfigTab === 'stayer' && (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-fadeIn">
						<StepperInput
							id={`${fieldId}-stayer-raise`}
							label="Annual Merit Raise"
							value={stayerRaiseRate}
							min={0}
							max={25}
							step={0.1}
							suffix="%"
							onChange={setStayerRaiseRate}
							helpText="Yearly baseline wage increase rate for stayers."
						/>
						<StepperInput
							id={`${fieldId}-stayer-col`}
							label="Cost of Living Index"
							value={stayerCoL}
							min={0.2}
							max={3.0}
							step={0.05}
							suffix="Index"
							onChange={setStayerCoL}
							helpText="Location multiplier (1.0 = San Francisco baseline)."
						/>
						<StepperInput
							id={`${fieldId}-stayer-hours`}
							label="Expected Weekly Hours"
							value={stayerHours}
							min={10}
							max={100}
							suffix="hrs"
							onChange={setStayerHours}
							helpText="Average working hours per week."
						/>
						<StepperInput
							id={`${fieldId}-stayer-pto`}
							label="Paid Time Off (PTO)"
							value={stayerPto}
							min={0}
							max={60}
							suffix="days"
							onChange={setStayerPto}
							helpText="Total paid vacation and sick days per year."
						/>
					</div>
				)}

				{activeConfigTab === 'switcher' && (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
						<StepperInput
							id={`${fieldId}-switcher-interval`}
							label="Hop Interval (Years)"
							value={hopIntervalYears}
							min={1}
							max={10}
							suffix="Years"
							onChange={setHopIntervalYears}
							helpText="Average tenure at each employer before switching."
						/>
						<StepperInput
							id={`${fieldId}-switcher-hopbump`}
							label="Hop Salary Increase"
							value={hopRaiseRate}
							min={0}
							max={150}
							suffix="%"
							onChange={setHopRaiseRate}
							helpText="Average base salary increase secured when transitioning."
						/>
						<StepperInput
							id={`${fieldId}-switcher-nonhopraise`}
							label="Non-Hop Annual Raise"
							value={nonHopRaiseRate}
							min={0}
							max={25}
							step={0.1}
							suffix="%"
							onChange={setNonHopRaiseRate}
							helpText="Internal raise percentage in non-switch years."
						/>
						<CurrencyInput
							id={`${fieldId}-switcher-signing`}
							label="New Hire Signing Bonus"
							value={signingBonus}
							step={500}
							onChange={setSigningBonus}
							helpText="Average gross signing bonus secured at transition (taxed at combined rate)."
						/>
						<CurrencyInput
							id={`${fieldId}-switcher-cobra`}
							label="COBRA transition cost"
							value={cobraCost}
							step={100}
							onChange={setCobraCost}
							helpText="Total cost of health gap coverage during switch transitions."
						/>
						<StepperInput
							id={`${fieldId}-switcher-vestloss`}
							label="Unvested Match Loss"
							value={unvestedMatchLossRate}
							min={0}
							max={100}
							suffix="%"
							onChange={setUnvestedMatchLossRate}
							helpText="Percentage of matching funds forfeited upon departure."
						/>
						<StepperInput
							id={`${fieldId}-switcher-bonusloss`}
							label="Unvested Bonus Loss"
							value={unvestedBonusLossRate}
							min={0}
							max={100}
							suffix="%"
							onChange={setUnvestedBonusLossRate}
							helpText="Percentage of target bonus lost due to transition timing."
						/>
						<StepperInput
							id={`${fieldId}-switcher-col`}
							label="Cost of Living Index"
							value={switcherCoL}
							min={0.2}
							max={3.0}
							step={0.05}
							suffix="Index"
							onChange={setSwitcherCoL}
							helpText="Location multiplier (1.0 = San Francisco baseline)."
						/>
						<StepperInput
							id={`${fieldId}-switcher-hours`}
							label="Expected Weekly Hours"
							value={switcherHours}
							min={10}
							max={100}
							suffix="hrs"
							onChange={setSwitcherHours}
							helpText="Average working hours per week."
						/>
						<div className="sm:col-span-2 lg:col-span-3 grid sm:grid-cols-2 gap-5">
							<StepperInput
								id={`${fieldId}-switcher-pto`}
								label="Paid Time Off (PTO)"
								value={switcherPto}
								min={0}
								max={60}
								suffix="days"
								onChange={setSwitcherPto}
								helpText="Total paid vacation and sick days per year at the new job."
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
