import React, { useState, useRef, useEffect, useId } from 'react';
import { calculateOfferBreakdown } from '../../../lib/calculators/totalComp';
import { formatCurrency } from '../../../lib/calculators/format';
import type { OfferInput, TotalCompGlobalInputs } from '../../../lib/calculators/types';
import { CurrencyInput } from './fields/CurrencyInput';
import { StepperInput } from './fields/StepperInput';

const INITIAL_OFFER_A: OfferInput = {
	name: 'Offer A (Public Tech)',
	cash: {
		baseSalary: 180000,
		targetBonusPercent: 15,
		signOnBonus: 20000,
		clawbackMonths: 12
	},
	equity: {
		type: 'PUBLIC_RSU',
		totalGrantValue: 200000,
		shareCount: 0,
		strikePrice: 0,
		currentFmv: 0,
		vestingYears: 4,
		hasOneYearCliff: true
	},
	perks: {
		kMatchPercent: 50,
		kMatchCapPercent: 6,
		monthlyHealthPremium: 150,
		esppContributionPercent: 10,
		esppDiscountPercent: 15
	}
};

const INITIAL_OFFER_B: OfferInput = {
	name: 'Offer B (Startup)',
	cash: {
		baseSalary: 155000,
		targetBonusPercent: 10,
		signOnBonus: 10000,
		clawbackMonths: 12
	},
	equity: {
		type: 'ISO',
		totalGrantValue: 0,
		shareCount: 50000,
		strikePrice: 2.0,
		currentFmv: 5.0,
		vestingYears: 4,
		hasOneYearCliff: true
	},
	perks: {
		kMatchPercent: 50,
		kMatchCapPercent: 4,
		monthlyHealthPremium: 100,
		esppContributionPercent: 0,
		esppDiscountPercent: 15
	}
};

const INITIAL_GLOBAL: TotalCompGlobalInputs = {
	taxState: 'CA',
	filingStatus: 'single',
	growthAssumption: 0.1, // 10%
	autoExercise: false,
	useManualTax: false,
	manualTaxRate: 30
};

export default function TotalCompCalculator() {
	const [globalInputs, setGlobalInputs] = useState<TotalCompGlobalInputs>(INITIAL_GLOBAL);
	const [offerA, setOfferA] = useState<OfferInput>(INITIAL_OFFER_A);
	const [offerB, setOfferB] = useState<OfferInput>(INITIAL_OFFER_B);
	
	// Collapse state for input sections
	const [activeASection, setActiveASection] = useState<'cash' | 'equity' | 'perks'>('cash');
	const [activeBSection, setActiveBSection] = useState<'cash' | 'equity' | 'perks'>('cash');

	const fieldId = useId();
	const svgRef = useRef<SVGSVGElement>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 320 });
	const [hoveredData, setHoveredData] = useState<{
		year: number;
		offerA: any;
		offerB: any;
		x: number;
	} | null>(null);

	// Resize observer to make chart responsive
	useEffect(() => {
		if (svgRef.current) {
			const resizeObserver = new ResizeObserver((entries) => {
				for (let entry of entries) {
					const { width } = entry.contentRect;
					setDimensions((prev) => ({ ...prev, width: Math.max(300, width) }));
				}
			});
			resizeObserver.observe(svgRef.current);
			return () => resizeObserver.disconnect();
		}
	}, []);

	// Run calculations
	const summaryA = calculateOfferBreakdown(offerA, globalInputs);
	const summaryB = calculateOfferBreakdown(offerB, globalInputs);

	// Handlers for inputs
	const updateGlobal = <K extends keyof TotalCompGlobalInputs>(key: K, value: TotalCompGlobalInputs[K]) => {
		setGlobalInputs((current) => ({ ...current, [key]: value }));
	};

	const updateOffer = (offerId: 'A' | 'B', section: keyof OfferInput, key: string, value: any) => {
		const setter = offerId === 'A' ? setOfferA : setOfferB;
		setter((current: any) => ({
			...current,
			[section]: {
				...current[section],
				[key]: value
			}
		}));
	};

	// Find chart scale bounds
	let maxPositive = 100000;
	let maxNegative = 20000;

	[summaryA, summaryB].forEach((summary) => {
		summary.yearly.forEach((year) => {
			const posSum = year.baseCash + year.bonusCash + year.liquidEquity + year.perksValue;
			const negSum = year.taxDrag + (globalInputs.autoExercise ? year.exerciseCost : 0) + year.healthPremium;
			if (posSum > maxPositive) maxPositive = posSum;
			if (negSum > maxNegative) maxNegative = negSum;
		});
	});

	const maxY = maxPositive * 1.15;
	const minY = -maxNegative * 1.15;

	// Chart dimensions layout
	const margin = { top: 25, right: 30, bottom: 45, left: 75 };
	const plotWidth = dimensions.width - margin.left - margin.right;
	const plotHeight = dimensions.height - margin.top - margin.bottom;

	// Coordinate helper maps
	const getY = (val: number) => {
		return margin.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
	};

	const getGroupX = (year: number) => {
		return margin.left + ((year - 0.5) / 4) * plotWidth;
	};

	// Chart points for Spendable Cash Overlay
	const pointsA = summaryA.yearly.map((y) => {
		const groupX = getGroupX(y.year);
		const barAX = groupX - 22;
		return { x: barAX, y: getY(y.netSpendableCash) };
	});

	const pointsB = summaryB.yearly.map((y) => {
		const groupX = getGroupX(y.year);
		const barBX = groupX + 22;
		return { x: barBX, y: getY(y.netSpendableCash) };
	});

	const pathA = `M ${pointsA.map((p) => `${p.x},${p.y}`).join(' L ')}`;
	const pathB = `M ${pointsB.map((p) => `${p.x},${p.y}`).join(' L ')}`;

	// Mouse movement for year details overlay
	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		if (!svgRef.current) return;
		const rect = svgRef.current.getBoundingClientRect();
		const mouseX = e.clientX - rect.left - margin.left;
		const yearWidth = plotWidth / 4;
		const year = Math.min(4, Math.max(1, Math.floor(mouseX / yearWidth) + 1));
		const groupX = getGroupX(year);
		setHoveredData({
			year,
			offerA: summaryA.yearly[year - 1],
			offerB: summaryB.yearly[year - 1],
			x: groupX
		});
	};

	const handleMouseLeave = () => {
		setHoveredData(null);
	};

	return (
		<div className="grid gap-8">
			{/* Sticky Global Controls Panel */}
			<div className="panel-soft rounded-[1.8rem] border border-cyan-500/15 bg-slate-950/70 p-5 shadow-xl backdrop-blur-md">
				<p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400">Global Trajectory Parameters</p>
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					
					{/* Tax Model Selection */}
					<div className="flex flex-col gap-2">
						<label htmlFor={`${fieldId}-tax-model`} className="text-xs font-semibold text-slate-300">Tax Location / Override</label>
						<select
							id={`${fieldId}-tax-model`}
							value={globalInputs.useManualTax ? 'manual' : globalInputs.taxState}
							onChange={(e) => {
								const val = e.target.value;
								if (val === 'manual') {
									updateGlobal('useManualTax', true);
								} else {
									updateGlobal('useManualTax', false);
									updateGlobal('taxState', val);
								}
							}}
							className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
						>
							<option value="CA">California (CA - 9.3%)</option>
							<option value="NY">New York (NY - 6.5%)</option>
							<option value="MD">Maryland (MD - 4.75%)</option>
							<option value="TX">Texas (TX - 0%)</option>
							<option value="WA">Washington (WA - 0%)</option>
							<option value="manual">Custom Effective Rate (%)</option>
						</select>
					</div>

					{/* Custom Tax Input (Only shown if Custom Selected) */}
					{globalInputs.useManualTax ? (
						<div className="flex flex-col gap-2">
							<label htmlFor={`${fieldId}-manual-tax-rate`} className="text-xs font-semibold text-slate-300">Effective Tax Rate (%)</label>
							<input
								id={`${fieldId}-manual-tax-rate`}
								type="number"
								min="0"
								max="100"
								value={globalInputs.manualTaxRate}
								onChange={(e) => updateGlobal('manualTaxRate', Math.max(0, Math.min(100, Number(e.target.value))))}
								className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
							/>
						</div>
					) : (
						<div className="flex flex-col gap-2">
							<label htmlFor={`${fieldId}-filing-status`} className="text-xs font-semibold text-slate-300">Tax Filing Status</label>
							<select
								id={`${fieldId}-filing-status`}
								value={globalInputs.filingStatus}
								onChange={(e) => updateGlobal('filingStatus', e.target.value as any)}
								className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
							>
								<option value="single">Single Filer</option>
								<option value="married">Married Filing Jointly</option>
							</select>
						</div>
					)}

					{/* Growth Assumption */}
					<div className="flex flex-col gap-2">
						<label htmlFor={`${fieldId}-growth`} className="text-xs font-semibold text-slate-300">Stock Growth Assumption</label>
						<select
							id={`${fieldId}-growth`}
							value={globalInputs.growthAssumption}
							onChange={(e) => updateGlobal('growthAssumption', Number(e.target.value))}
							className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
						>
							<option value="0">0% (Flat stock value)</option>
							<option value="0.1">10% Annual Growth</option>
							<option value="0.2">20% Annual Growth</option>
						</select>
					</div>

					{/* Auto-Exercise Toggles */}
					<div className="flex flex-col justify-center">
						<label className="inline-flex items-center gap-3 cursor-pointer mt-5">
							<input
								type="checkbox"
								checked={globalInputs.autoExercise}
								onChange={(e) => updateGlobal('autoExercise', e.target.checked)}
								className="sr-only peer"
							/>
							<div className="relative w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white"></div>
							<span className="text-xs font-semibold text-slate-300">Auto-Exercise Options</span>
						</label>
					</div>

				</div>
			</div>

			{/* SVG Chart Comparison Screen */}
			<div className="rounded-[2rem] border border-slate-800 bg-slate-950/45 p-6 shadow-xl relative select-none">
				<div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
					<div>
						<h3 className="text-base font-bold text-white tracking-tight">Spendable Cash & Tax Drag Projections</h3>
						<p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
							Year-by-year side-by-side analysis (Offer A Left, Offer B Right)
						</p>
					</div>
					<div className="flex items-center gap-4 text-[10px] font-mono">
						<div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
							<span className="w-2.5 h-1.5 bg-cyan-400 rounded-full" />
							Offer A Cash Line
						</div>
						<div className="flex items-center gap-1.5 text-purple-400 font-semibold">
							<span className="w-2.5 h-1.5 bg-purple-400 rounded-full" />
							Offer B Cash Line
						</div>
					</div>
				</div>

				<div className="relative">
					<svg
						ref={svgRef}
						width="100%"
						height={dimensions.height}
						onMouseMove={handleMouseMove}
						onMouseLeave={handleMouseLeave}
						className="overflow-visible cursor-crosshair font-mono text-[9px] text-slate-500"
					>
						{/* Grid Lines */}
						{[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
							const val = minY + p * (maxY - minY);
							const y = getY(val);
							return (
								<g key={`grid-y-${idx}`}>
									<line
										x1={margin.left}
										y1={y}
										x2={dimensions.width - margin.right}
										y2={y}
										stroke="#1e293b"
										strokeWidth="1"
										strokeDasharray="2, 4"
										className="opacity-40"
									/>
									<text x={margin.left - 8} y={y + 3} textAnchor="end" fill="#94a3b8" className="font-medium">
										{formatCurrency(val)}
									</text>
								</g>
							);
						})}

						{/* 0 Baseline Line */}
						<line
							x1={margin.left}
							y1={getY(0)}
							x2={dimensions.width - margin.right}
							y2={getY(0)}
							stroke="#64748b"
							strokeWidth="1.5"
							className="opacity-70"
						/>

						{/* Year Dividers */}
						{[1, 2, 3, 4].map((year) => {
							const x = getGroupX(year);
							return (
								<g key={`grid-x-${year}`}>
									<text x={x} y={dimensions.height - 12} textAnchor="middle" fill="#94a3b8" className="text-[10px] font-bold">
										Year {year}
									</text>
								</g>
							);
						})}

						{/* Stacked Bars Drawing */}
						{[summaryA, summaryB].map((summary, summaryIdx) => {
							const isOfferA = summaryIdx === 0;
							
							return summary.yearly.map((yearData) => {
								const groupX = getGroupX(yearData.year);
								const barX = isOfferA ? groupX - 22 : groupX + 22;
								const width = 28;
								const startX = barX - width / 2;

								// 1. Positive Stacks (Bottom up from 0)
								const posComponents = [
									{ val: yearData.baseCash, color: 'rgba(15, 118, 110, 0.85)', name: 'Base Cash' }, // teal-700
									{ val: yearData.bonusCash, color: 'rgba(6, 182, 212, 0.85)', name: 'Bonus Cash' }, // cyan-500
									{ val: yearData.liquidEquity, color: 'rgba(16, 185, 129, 0.85)', name: 'Liquid Equity' }, // emerald-500
									{ val: yearData.perksValue, color: 'rgba(99, 102, 241, 0.85)', name: 'Perks Value' } // indigo-500
								];

								let posRunning = 0;
								const posRects = posComponents.map((comp, compIdx) => {
									if (comp.val <= 0) return null;
									const yStart = getY(posRunning);
									posRunning += comp.val;
									const yEnd = getY(posRunning);
									const height = yStart - yEnd;
									return (
										<rect
											key={`pos-${compIdx}-${yearData.year}`}
											x={startX}
											y={yEnd}
											width={width}
											height={height}
											fill={comp.color}
											className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer"
										/>
									);
								});

								// 2. Negative Stacks (Top down from 0)
								const negComponents = [
									{ val: yearData.taxDrag, color: 'rgba(239, 68, 68, 0.75)', name: 'Tax Drag' }, // red-500
									{ val: globalInputs.autoExercise ? yearData.exerciseCost : 0, color: 'rgba(245, 158, 11, 0.75)', name: 'Exercise Cost' }, // amber-500
									{ val: yearData.healthPremium, color: 'rgba(100, 116, 139, 0.75)', name: 'Health Premium' } // slate-500
								];

								let negRunning = 0;
								const negRects = negComponents.map((comp, compIdx) => {
									if (comp.val <= 0) return null;
									const yStart = getY(-negRunning);
									negRunning += comp.val;
									const yEnd = getY(-negRunning);
									const height = yEnd - yStart;
									return (
										<rect
											key={`neg-${compIdx}-${yearData.year}`}
											x={startX}
											y={yStart}
											width={width}
											height={height}
											fill={comp.color}
											className="transition-all duration-300 hover:opacity-100 opacity-90 cursor-pointer"
										/>
									);
								});

								// If options auto-exercise is disabled, draw a dashed/hollow outline to represent "unrealized exercise liability"
								let optionOutline = null;
								if (!globalInputs.autoExercise && yearData.exerciseCost > 0) {
									const yStart = getY(-negRunning);
									const totalLiability = negRunning + yearData.exerciseCost;
									const yEnd = getY(-totalLiability);
									const height = yEnd - yStart;
									optionOutline = (
										<rect
											x={startX + 2}
											y={yStart}
											width={width - 4}
											height={height}
											fill="none"
											stroke="rgba(245, 158, 11, 0.6)"
											strokeWidth="1.5"
											strokeDasharray="2, 2"
											className="cursor-pointer"
										>
											<title>Unrealized option exercise liability</title>
										</rect>
									);
								}

								return (
									<g key={`bar-${summaryIdx}-${yearData.year}`}>
										{posRects}
										{negRects}
										{optionOutline}
									</g>
								);
							});
						})}

						{/* Net Spendable Cash Line Graphs */}
						<path
							d={pathA}
							fill="none"
							stroke="#22d3ee" // cyan-400
							strokeWidth="3.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="pointer-events-none drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]"
						/>
						<path
							d={pathB}
							fill="none"
							stroke="#c084fc" // purple-400
							strokeWidth="3.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="pointer-events-none drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]"
						/>

						{/* Points on Line Graphs */}
						{pointsA.map((p, idx) => (
							<circle
								key={`dotA-${idx}`}
								cx={p.x}
								cy={p.y}
								r="5.5"
								fill="#22d3ee"
								stroke="#020617"
								strokeWidth="2.5"
								className="pointer-events-none"
							/>
						))}
						{pointsB.map((p, idx) => (
							<circle
								key={`dotB-${idx}`}
								cx={p.x}
								cy={p.y}
								r="5.5"
								fill="#c084fc"
								stroke="#020617"
								strokeWidth="2.5"
								className="pointer-events-none"
							/>
						))}

						{/* Hover vertical line */}
						{hoveredData && (
							<line
								x1={hoveredData.x}
								y1={margin.top}
								x2={hoveredData.x}
								y2={dimensions.height - margin.bottom}
								stroke="#06b6d4"
								strokeWidth="1.5"
								strokeDasharray="3, 3"
								className="pointer-events-none"
							/>
						)}
					</svg>
				</div>

				{/* Floating Tooltip Data Panel */}
				{hoveredData ? (
					<div className="mt-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col md:flex-row gap-6 text-xs font-mono justify-between animate-fadeIn [.light_&]:bg-slate-50/95 [.light_&]:border-slate-200/80">
						<div className="flex items-center font-bold text-white pr-4 md:border-r border-slate-800 text-sm [.light_&]:text-slate-800! [.light_&]:border-slate-200">
							📅 Year {hoveredData.year} Projections
						</div>
						<div className="flex-1 grid gap-4 sm:grid-cols-2">
							{/* Offer A Tooltip */}
							<div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-slate-800/60 pb-3 sm:pb-0 pr-3 [.light_&]:border-slate-200">
								<p className="font-semibold text-cyan-400 text-[11px] truncate uppercase">{offerA.name}</p>
								<div className="flex justify-between mt-1 text-[11px] text-slate-400">
									<span>Base + Bonus Cash:</span>
									<span className="text-white font-semibold">{formatCurrency(hoveredData.offerA.baseCash + hoveredData.offerA.bonusCash)}</span>
								</div>
								{hoveredData.offerA.liquidEquity > 0 && (
									<div className="flex justify-between text-[11px] text-slate-400">
										<span>Vested Liquid Equity:</span>
										<span className="text-emerald-400 font-semibold">{formatCurrency(hoveredData.offerA.liquidEquity)}</span>
									</div>
								)}
								{hoveredData.offerA.paperEquity > 0 && (
									<div className="flex justify-between text-[11px] text-slate-500">
										<span>Paper Wealth (Illiquid):</span>
										<span className="text-slate-400 font-semibold">{formatCurrency(hoveredData.offerA.paperEquity)}</span>
									</div>
								)}
								<div className="flex justify-between text-[11px] text-slate-400">
									<span>Perks (401k/ESPP):</span>
									<span className="text-indigo-300 font-semibold [.light_&]:text-indigo-600!">{formatCurrency(hoveredData.offerA.perksValue)}</span>
								</div>
								<div className="flex justify-between text-[11px] text-rose-400/80 [.light_&]:text-rose-600!">
									<span>Tax Drag:</span>
									<span>-{formatCurrency(hoveredData.offerA.taxDrag)}</span>
								</div>
								{hoveredData.offerA.exerciseCost > 0 && (
									<div className="flex justify-between text-[11px] text-amber-500 [.light_&]:text-amber-700!">
										<span>Exercise Cost:</span>
										<span>-{formatCurrency(hoveredData.offerA.exerciseCost)} {globalInputs.autoExercise ? '(Subtracted)' : '(Deferred)'}</span>
									</div>
								)}
								<div className="flex justify-between border-t border-slate-800/80 mt-1 pt-1 text-white font-bold [.light_&]:border-slate-200">
									<span>Spendable Cash Flow:</span>
									<span className="text-cyan-300 [.light_&]:text-cyan-700!">{formatCurrency(hoveredData.offerA.netSpendableCash)}</span>
								</div>
								{hoveredData.offerA.isClawbackRisk && (
									<div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 [.light_&]:text-amber-800! [.light_&]:bg-amber-50/60 [.light_&]:border-amber-200/60">
										⚠️ Clawback risk: {formatCurrency(hoveredData.offerA.clawbackAmount)} clawed back if departing before Month {offerA.cash.clawbackMonths}.
									</div>
								)}
							</div>
							
							{/* Offer B Tooltip */}
							<div className="flex flex-col gap-1">
								<p className="font-semibold text-purple-400 text-[11px] truncate uppercase [.light_&]:text-purple-700!">{offerB.name}</p>
								<div className="flex justify-between mt-1 text-[11px] text-slate-400">
									<span>Base + Bonus Cash:</span>
									<span className="text-white font-semibold">{formatCurrency(hoveredData.offerB.baseCash + hoveredData.offerB.bonusCash)}</span>
								</div>
								{hoveredData.offerB.liquidEquity > 0 && (
									<div className="flex justify-between text-[11px] text-slate-400">
										<span>Vested Liquid Equity:</span>
										<span className="text-emerald-400 font-semibold">{formatCurrency(hoveredData.offerB.liquidEquity)}</span>
									</div>
								)}
								{hoveredData.offerB.paperEquity > 0 && (
									<div className="flex justify-between text-[11px] text-slate-500">
										<span>Paper Wealth (Illiquid):</span>
										<span className="text-slate-400 font-semibold">{formatCurrency(hoveredData.offerB.paperEquity)}</span>
									</div>
								)}
								<div className="flex justify-between text-[11px] text-slate-400">
									<span>Perks (401k/ESPP):</span>
									<span className="text-indigo-300 font-semibold [.light_&]:text-indigo-600!">{formatCurrency(hoveredData.offerB.perksValue)}</span>
								</div>
								<div className="flex justify-between text-[11px] text-rose-400/80 [.light_&]:text-rose-600!">
									<span>Tax Drag:</span>
									<span>-{formatCurrency(hoveredData.offerB.taxDrag)}</span>
								</div>
								{hoveredData.offerB.exerciseCost > 0 && (
									<div className="flex justify-between text-[11px] text-amber-500 [.light_&]:text-amber-700!">
										<span>Exercise Cost:</span>
										<span>-{formatCurrency(hoveredData.offerB.exerciseCost)} {globalInputs.autoExercise ? '(Subtracted)' : '(Deferred)'}</span>
									</div>
								)}
								<div className="flex justify-between border-t border-slate-800/80 mt-1 pt-1 text-white font-bold [.light_&]:border-slate-200">
									<span>Spendable Cash Flow:</span>
									<span className="text-purple-300 [.light_&]:text-purple-700!">{formatCurrency(hoveredData.offerB.netSpendableCash)}</span>
								</div>
								{hoveredData.offerB.isClawbackRisk && (
									<div className="mt-2 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 [.light_&]:text-amber-800! [.light_&]:bg-amber-50/60 [.light_&]:border-amber-200/60">
										⚠️ Clawback risk: {formatCurrency(hoveredData.offerB.clawbackAmount)} clawed back if departing before Month {offerB.cash.clawbackMonths}.
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="text-slate-500 text-center font-mono text-[10px] italic mt-4 py-2 bg-slate-950/20 border border-slate-900/40 rounded-xl [.light_&]:bg-slate-100/60 [.light_&]:text-slate-700! [.light_&]:border-slate-200/80">
						Hover mouse cursor over the chart columns to read exact yearly breakdowns.
					</div>
				)}
			</div>

			{/* Dual Offer Columns Setup */}
			<div className="grid gap-6 md:grid-cols-2">

				{/* Offer A Box */}
				<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/20 p-5 shadow-sm">
					<div className="flex items-center gap-3 mb-4">
						<span className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
						<input
							type="text"
							value={offerA.name}
							onChange={(e) => updateOffer('A', 'name' as any, '', e.target.value)}
							className="text-lg font-bold text-white bg-transparent border-b border-transparent focus:border-cyan-400 outline-none w-full"
							placeholder="Enter Offer A Name"
						/>
					</div>

					{/* Internal offer tabs */}
					<div className="flex border-b border-slate-900 mb-4 text-xs font-mono">
						<button
							onClick={() => setActiveASection('cash')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeASection === 'cash' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							💵 Cash
						</button>
						<button
							onClick={() => setActiveASection('equity')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeASection === 'equity' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							📈 Equity
						</button>
						<button
							onClick={() => setActiveASection('perks')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeASection === 'perks' ? 'border-cyan-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							🎁 Perks
						</button>
					</div>

					{/* Tab Panel contents */}
					{activeASection === 'cash' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							<CurrencyInput
								id={`${fieldId}-A-salary`}
								label="Base Salary"
								value={offerA.cash.baseSalary}
								step={5000}
								onChange={(val) => updateOffer('A', 'cash', 'baseSalary', val)}
								helpText="Gross annual cash salary before tax and retirement match deduction."
							/>
							<StepperInput
								id={`${fieldId}-A-bonus`}
								label="Target Bonus (%)"
								value={offerA.cash.targetBonusPercent}
								min={0}
								max={100}
								suffix="%"
								onChange={(val) => updateOffer('A', 'cash', 'targetBonusPercent', val)}
								helpText="Expected annual target performance bonus percentage."
							/>
							<CurrencyInput
								id={`${fieldId}-A-signon`}
								label="Sign-on Bonus"
								value={offerA.cash.signOnBonus}
								step={1000}
								onChange={(val) => updateOffer('A', 'cash', 'signOnBonus', val)}
								helpText="One-time cash signing bonus received in year 1."
							/>
							<StepperInput
								id={`${fieldId}-A-clawback`}
								label="Clawback Window (Months)"
								value={offerA.cash.clawbackMonths}
								min={0}
								suffix="Mos"
								onChange={(val) => updateOffer('A', 'cash', 'clawbackMonths', val)}
								helpText="Sign-on bonus return obligation threshold in case of early departure."
							/>
						</div>
					)}

					{activeASection === 'equity' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							{/* Equity Type Selection */}
							<label className="grid gap-2 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
								<span className="text-sm font-semibold text-slate-100">Equity Type</span>
								<select
									value={offerA.equity.type}
									onChange={(e) => updateOffer('A', 'equity', 'type', e.target.value)}
									className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
								>
									<option value="PUBLIC_RSU">Public RSU (Liquid immediately)</option>
									<option value="PRIVATE_RSU">Private RSU (Illiquid Paper)</option>
									<option value="ISO">ISO Options (Paper + Exercise Strike)</option>
									<option value="NSO">NSO Options (Paper + Exercise Strike)</option>
								</select>
							</label>

							{/* Option fields vs RSU value fields */}
							{(offerA.equity.type === 'PUBLIC_RSU' || offerA.equity.type === 'PRIVATE_RSU') ? (
								<CurrencyInput
									id={`${fieldId}-A-rsu-grant`}
									label="Total Grant Value"
									value={offerA.equity.totalGrantValue}
									step={5000}
									onChange={(val) => updateOffer('A', 'equity', 'totalGrantValue', val)}
									helpText="Combined target value of RSU grants distributed over the vesting schedule."
								/>
							) : (
								<>
									<StepperInput
										id={`${fieldId}-A-sharecount`}
										label="Number of Options"
										value={offerA.equity.shareCount}
										step={1000}
										onChange={(val) => updateOffer('A', 'equity', 'shareCount', val)}
										helpText="Total number of stock option shares granted."
									/>
									<div className="grid gap-4 sm:grid-cols-2">
										<CurrencyInput
											id={`${fieldId}-A-strike`}
											label="Strike Price"
											value={offerA.equity.strikePrice}
											step={0.5}
											onChange={(val) => updateOffer('A', 'equity', 'strikePrice', val)}
											helpText="Purchase price per option share."
										/>
										<CurrencyInput
											id={`${fieldId}-A-fmv`}
											label="Current FMV"
											value={offerA.equity.currentFmv}
											step={0.5}
											onChange={(val) => updateOffer('A', 'equity', 'currentFmv', val)}
											helpText="Fair Market Value per share."
										/>
									</div>
								</>
							)}

							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-A-vesting`}
									label="Vesting Horizon (Years)"
									value={offerA.equity.vestingYears}
									min={1}
									suffix="Yrs"
									onChange={(val) => updateOffer('A', 'equity', 'vestingYears', val)}
									helpText="Standard horizon for full vesting."
								/>
								<label className="inline-flex items-center gap-3 cursor-pointer p-4 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45">
									<input
										type="checkbox"
										checked={offerA.equity.hasOneYearCliff}
										onChange={(e) => updateOffer('A', 'equity', 'hasOneYearCliff', e.target.checked)}
										className="sr-only peer"
									/>
									<div className="relative w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-white"></div>
									<span className="text-xs font-semibold text-slate-300">1-Year Vesting Cliff</span>
								</label>
							</div>
						</div>
					)}

					{activeASection === 'perks' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-A-401k-match`}
									label="401(k) Match (%)"
									value={offerA.perks.kMatchPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('A', 'perks', 'kMatchPercent', val)}
									helpText="Company match percentage on contribution (e.g. 50%)."
								/>
								<StepperInput
									id={`${fieldId}-A-401k-cap`}
									label="401(k) Cap (%)"
									value={offerA.perks.kMatchCapPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('A', 'perks', 'kMatchCapPercent', val)}
									helpText="Maximum matched employee contribution (e.g. up to 6%)."
								/>
							</div>
							<CurrencyInput
								id={`${fieldId}-A-health`}
								label="Health Premium (Monthly)"
								value={offerA.perks.monthlyHealthPremium}
								step={20}
								onChange={(val) => updateOffer('A', 'perks', 'monthlyHealthPremium', val)}
								helpText="Employee monthly out-of-pocket health insurance premium cost."
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-A-espp-contrib`}
									label="ESPP Contribution (%)"
									value={offerA.perks.esppContributionPercent}
									min={0}
									max={15}
									suffix="%"
									onChange={(val) => updateOffer('A', 'perks', 'esppContributionPercent', val)}
									helpText="Percentage of salary contributed to ESPP (Max 15%)."
								/>
								<StepperInput
									id={`${fieldId}-A-espp-discount`}
									label="ESPP Discount (%)"
									value={offerA.perks.esppDiscountPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('A', 'perks', 'esppDiscountPercent', val)}
									helpText="ESPP share purchase discount rate (Default 15%)."
								/>
							</div>
						</div>
					)}
				</div>

				{/* Offer B Box */}
				<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/20 p-5 shadow-sm">
					<div className="flex items-center gap-3 mb-4">
						<span className="w-3.5 h-3.5 rounded-full bg-purple-400" />
						<input
							type="text"
							value={offerB.name}
							onChange={(e) => updateOffer('B', 'name' as any, '', e.target.value)}
							className="text-lg font-bold text-white bg-transparent border-b border-transparent focus:border-purple-400 outline-none w-full"
							placeholder="Enter Offer B Name"
						/>
					</div>

					{/* Internal offer tabs */}
					<div className="flex border-b border-slate-900 mb-4 text-xs font-mono">
						<button
							onClick={() => setActiveBSection('cash')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeBSection === 'cash' ? 'border-purple-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							💵 Cash
						</button>
						<button
							onClick={() => setActiveBSection('equity')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeBSection === 'equity' ? 'border-purple-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							📈 Equity
						</button>
						<button
							onClick={() => setActiveBSection('perks')}
							className={`flex-1 py-2 font-semibold text-center border-b-2 transition ${activeBSection === 'perks' ? 'border-purple-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
						>
							🎁 Perks
						</button>
					</div>

					{/* Tab Panel contents */}
					{activeBSection === 'cash' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							<CurrencyInput
								id={`${fieldId}-B-salary`}
								label="Base Salary"
								value={offerB.cash.baseSalary}
								step={5000}
								onChange={(val) => updateOffer('B', 'cash', 'baseSalary', val)}
								helpText="Gross annual cash salary before tax and retirement match deduction."
							/>
							<StepperInput
								id={`${fieldId}-B-bonus`}
								label="Target Bonus (%)"
								value={offerB.cash.targetBonusPercent}
								min={0}
								max={100}
								suffix="%"
								onChange={(val) => updateOffer('B', 'cash', 'targetBonusPercent', val)}
								helpText="Expected annual target performance bonus percentage."
							/>
							<CurrencyInput
								id={`${fieldId}-B-signon`}
								label="Sign-on Bonus"
								value={offerB.cash.signOnBonus}
								step={1000}
								onChange={(val) => updateOffer('B', 'cash', 'signOnBonus', val)}
								helpText="One-time cash signing bonus received in year 1."
							/>
							<StepperInput
								id={`${fieldId}-B-clawback`}
								label="Clawback Window (Months)"
								value={offerB.cash.clawbackMonths}
								min={0}
								suffix="Mos"
								onChange={(val) => updateOffer('B', 'cash', 'clawbackMonths', val)}
								helpText="Sign-on bonus return obligation threshold in case of early departure."
							/>
						</div>
					)}

					{activeBSection === 'equity' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							{/* Equity Type Selection */}
							<label className="grid gap-2 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
								<span className="text-sm font-semibold text-slate-100">Equity Type</span>
								<select
									value={offerB.equity.type}
									onChange={(e) => updateOffer('B', 'equity', 'type', e.target.value)}
									className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
								>
									<option value="PUBLIC_RSU">Public RSU (Liquid immediately)</option>
									<option value="PRIVATE_RSU">Private RSU (Illiquid Paper)</option>
									<option value="ISO">ISO Options (Paper + Exercise Strike)</option>
									<option value="NSO">NSO Options (Paper + Exercise Strike)</option>
								</select>
							</label>

							{/* Option fields vs RSU value fields */}
							{(offerB.equity.type === 'PUBLIC_RSU' || offerB.equity.type === 'PRIVATE_RSU') ? (
								<CurrencyInput
									id={`${fieldId}-B-rsu-grant`}
									label="Total Grant Value"
									value={offerB.equity.totalGrantValue}
									step={5000}
									onChange={(val) => updateOffer('B', 'equity', 'totalGrantValue', val)}
									helpText="Combined target value of RSU grants distributed over the vesting schedule."
								/>
							) : (
								<>
									<StepperInput
										id={`${fieldId}-B-sharecount`}
										label="Number of Options"
										value={offerB.equity.shareCount}
										step={1000}
										onChange={(val) => updateOffer('B', 'equity', 'shareCount', val)}
										helpText="Total number of stock option shares granted."
									/>
									<div className="grid gap-4 sm:grid-cols-2">
										<CurrencyInput
											id={`${fieldId}-B-strike`}
											label="Strike Price"
											value={offerB.equity.strikePrice}
											step={0.5}
											onChange={(val) => updateOffer('B', 'equity', 'strikePrice', val)}
											helpText="Purchase price per option share."
										/>
										<CurrencyInput
											id={`${fieldId}-B-fmv`}
											label="Current FMV"
											value={offerB.equity.currentFmv}
											step={0.5}
											onChange={(val) => updateOffer('B', 'equity', 'currentFmv', val)}
											helpText="Fair Market Value per share."
										/>
									</div>
								</>
							)}

							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-B-vesting`}
									label="Vesting Horizon (Years)"
									value={offerB.equity.vestingYears}
									min={1}
									suffix="Yrs"
									onChange={(val) => updateOffer('B', 'equity', 'vestingYears', val)}
									helpText="Standard horizon for full vesting."
								/>
								<label className="inline-flex items-center gap-3 cursor-pointer p-4 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45">
									<input
										type="checkbox"
										checked={offerB.equity.hasOneYearCliff}
										onChange={(e) => updateOffer('B', 'equity', 'hasOneYearCliff', e.target.checked)}
										className="sr-only peer"
									/>
									<div className="relative w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 peer-checked:after:bg-white"></div>
									<span className="text-xs font-semibold text-slate-300">1-Year Vesting Cliff</span>
								</label>
							</div>
						</div>
					)}

					{activeBSection === 'perks' && (
						<div className="grid gap-4 animate-[fadeIn_0.15s_ease-out]">
							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-B-401k-match`}
									label="401(k) Match (%)"
									value={offerB.perks.kMatchPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('B', 'perks', 'kMatchPercent', val)}
									helpText="Company match percentage on contribution (e.g. 50%)."
								/>
								<StepperInput
									id={`${fieldId}-B-401k-cap`}
									label="401(k) Cap (%)"
									value={offerB.perks.kMatchCapPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('B', 'perks', 'kMatchCapPercent', val)}
									helpText="Maximum matched employee contribution (e.g. up to 6%)."
								/>
							</div>
							<CurrencyInput
								id={`${fieldId}-B-health`}
								label="Health Premium (Monthly)"
								value={offerB.perks.monthlyHealthPremium}
								step={20}
								onChange={(val) => updateOffer('B', 'perks', 'monthlyHealthPremium', val)}
								helpText="Employee monthly out-of-pocket health insurance premium cost."
							/>
							<div className="grid gap-4 sm:grid-cols-2">
								<StepperInput
									id={`${fieldId}-B-espp-contrib`}
									label="ESPP Contribution (%)"
									value={offerB.perks.esppContributionPercent}
									min={0}
									max={15}
									suffix="%"
									onChange={(val) => updateOffer('B', 'perks', 'esppContributionPercent', val)}
									helpText="Percentage of salary contributed to ESPP (Max 15%)."
								/>
								<StepperInput
									id={`${fieldId}-B-espp-discount`}
									label="ESPP Discount (%)"
									value={offerB.perks.esppDiscountPercent}
									min={0}
									max={100}
									suffix="%"
									onChange={(val) => updateOffer('B', 'perks', 'esppDiscountPercent', val)}
									helpText="ESPP share purchase discount rate (Default 15%)."
								/>
							</div>
						</div>
					)}
				</div>

			</div>

			{/* Aggregated outcome Metrics Compare Panel */}
			<div className="grid gap-6 md:grid-cols-2">

				{/* Offer A Summary Cards */}
				<div className={`rounded-[2rem] border p-6 bg-slate-900/40 transition duration-300 hover:scale-[1.01] flex flex-col gap-4 ${summaryA.total4YearLiquidity >= summaryB.total4YearLiquidity ? 'border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.08)]' : 'border-slate-800'}`}>
					<div className="flex justify-between items-center border-b border-slate-900 pb-3">
						<h4 className="text-base font-bold text-white tracking-wide truncate">{offerA.name} Outcomes</h4>
						{summaryA.total4YearLiquidity >= summaryB.total4YearLiquidity && (
							<span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-300">
								Highest Cash Yield
							</span>
						)}
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-cyan-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">4-Yr Spendable Cash</p>
							<p className="mt-2 text-lg font-bold text-white">{formatCurrency(summaryA.total4YearLiquidity)}</p>
							<p className="text-[10px] text-slate-400 mt-1">Liquid, post-tax cash</p>
						</div>
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-cyan-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Total Paper Wealth</p>
							<p className="mt-2 text-lg font-bold text-slate-300">{formatCurrency(summaryA.totalPaperValue)}</p>
							<p className="text-[10px] text-slate-500 mt-1">Illiquid equity value</p>
						</div>
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-rose-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Out-of-Pocket Drag</p>
							<p className="mt-2 text-lg font-bold text-rose-300">-{formatCurrency(summaryA.totalOutofPocketDrag)}</p>
							<p className="text-[10px] text-slate-500 mt-1">Exercise cost + health</p>
						</div>
					</div>
				</div>

				{/* Offer B Summary Cards */}
				<div className={`rounded-[2rem] border p-6 bg-slate-900/40 transition duration-300 hover:scale-[1.01] flex flex-col gap-4 ${summaryB.total4YearLiquidity >= summaryA.total4YearLiquidity ? 'border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]' : 'border-slate-800'}`}>
					<div className="flex justify-between items-center border-b border-slate-900 pb-3">
						<h4 className="text-base font-bold text-white tracking-wide truncate">{offerB.name} Outcomes</h4>
						{summaryB.total4YearLiquidity >= summaryA.total4YearLiquidity && (
							<span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-purple-300">
								Highest Cash Yield
							</span>
						)}
					</div>
					<div className="grid gap-4 sm:grid-cols-3">
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-purple-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">4-Yr Spendable Cash</p>
							<p className="mt-2 text-lg font-bold text-white">{formatCurrency(summaryB.total4YearLiquidity)}</p>
							<p className="text-[10px] text-slate-400 mt-1">Liquid, post-tax cash</p>
						</div>
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-purple-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Total Paper Wealth</p>
							<p className="mt-2 text-lg font-bold text-slate-300">{formatCurrency(summaryB.totalPaperValue)}</p>
							<p className="text-[10px] text-slate-500 mt-1">Illiquid equity value</p>
						</div>
						<div className="rounded-2xl border border-white/5 bg-slate-950/45 p-4 hover:border-rose-500/20 transition">
							<p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Out-of-Pocket Drag</p>
							<p className="mt-2 text-lg font-bold text-rose-300">-{formatCurrency(summaryB.totalOutofPocketDrag)}</p>
							<p className="text-[10px] text-slate-500 mt-1">Exercise cost + health</p>
						</div>
					</div>
				</div>

			</div>
		</div>
	);
}
