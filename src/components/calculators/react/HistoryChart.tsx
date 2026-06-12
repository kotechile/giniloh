import React, { useState, useRef, useEffect } from 'react';
import type { HistoryDataPoint } from '../../../lib/calculators/moneyFlowEngine';
import { formatCurrency } from '../../../lib/calculators/format';

interface HistoryChartProps {
	history: HistoryDataPoint[];
	mode: 'personal' | 'enterprise';
}

export default function HistoryChart({ history, mode }: HistoryChartProps) {
	const isEnterprise = mode === 'enterprise';

	// Series visibility state
	const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
		netWorth: false,
		checking: true,
		hysa: true,
		investments: true,
		debt: true,
		mortgage: false,
		operatingCash: false,
		receivables: false,
		payables: false,
		mfs: false
	});

	// Reset default visibility when switching modes
	useEffect(() => {
		if (isEnterprise) {
			setVisibleSeries({
				netWorth: true,
				checking: false,
				hysa: false,
				investments: false,
				debt: false,
				mortgage: false,
				operatingCash: true,
				receivables: true,
				payables: true,
				mfs: true
			});
		} else {
			setVisibleSeries({
				netWorth: false,
				checking: true,
				hysa: true,
				investments: true,
				debt: true,
				mortgage: false,
				operatingCash: false,
				receivables: false,
				payables: false,
				mfs: false
			});
		}
	}, [mode]);

	// Toggle series visibility
	const toggleSeries = (key: string) => {
		setVisibleSeries((prev) => ({
			...prev,
			[key]: !prev[key]
		}));
	};

	// Mouse interaction state
	const [hoverIndex, setHoverIndex] = useState<number | null>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const [dimensions, setDimensions] = useState({ width: 800, height: 260 });

	// Auto-resize listener
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

	// Default empty fallback
	if (!history || history.length === 0) {
		return (
			<div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex items-center justify-center h-[260px] text-xs font-mono text-slate-500 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
				No simulation history data collected yet.
			</div>
		);
	}

	const margin = { top: 20, right: 30, bottom: 40, left: 75 };
	const plotWidth = dimensions.width - margin.left - margin.right;
	const plotHeight = dimensions.height - margin.top - margin.bottom;

	const maxDay = Math.max(30, history[history.length - 1].day);

	// Personal Series definitions
	const personalSeriesDef = [
		{ key: 'netWorth', label: 'Net Worth', stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.04)' },
		{ key: 'checking', label: 'Checking Balance', stroke: '#06b6d4', fill: 'none' },
		{ key: 'hysa', label: 'HYSA Savings', stroke: '#3b82f6', fill: 'none' },
		{ key: 'investments', label: 'Investments', stroke: '#8b5cf6', fill: 'none' },
		{ key: 'debt', label: 'High-Interest Debt', stroke: '#f43f5e', fill: 'none' },
		{ key: 'mortgage', label: 'Mortgage Loan', stroke: '#6366f1', fill: 'none' }
	];

	// Enterprise Series definitions
	const enterpriseSeriesDef = [
		{ key: 'netWorth', label: 'Net Position', stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.04)' },
		{ key: 'operatingCash', label: 'Net Cash Flow', stroke: '#3b82f6', fill: 'none' },
		{ key: 'mfs', label: 'MMF reserves', stroke: '#06b6d4', fill: 'none' },
		{ key: 'receivables', label: 'Receivables', stroke: '#f59e0b', fill: 'none' },
		{ key: 'payables', label: 'Payables', stroke: '#f43f5e', fill: 'none' }
	];

	const activeSeriesDef = isEnterprise ? enterpriseSeriesDef : personalSeriesDef;
	const visibleSeriesDef = activeSeriesDef.filter((s) => visibleSeries[s.key]);

	// Calculate absolute min and max bounds for scaling
	let minY = Infinity;
	let maxY = -Infinity;

	history.forEach((point) => {
		visibleSeriesDef.forEach((def) => {
			const val = (point as any)[def.key] ?? 0;
			if (val < minY) minY = val;
			if (val > maxY) maxY = val;
		});
	});

	// Bounds padding
	if (minY === Infinity || maxY === -Infinity) {
		minY = -10000;
		maxY = 50000;
	} else {
		const diff = maxY - minY;
		if (diff === 0) {
			minY -= 5000;
			maxY += 5000;
		} else {
			minY -= diff * 0.1;
			maxY += diff * 0.1;
		}
	}

	// Helper to calculate X coord
	const getX = (day: number) => {
		return margin.left + (day / maxDay) * plotWidth;
	};

	// Helper to calculate Y coord
	const getY = (val: number) => {
		return margin.top + plotHeight - ((val - minY) / (maxY - minY)) * plotHeight;
	};

	// Generate lines path data
	const paths = visibleSeriesDef.map((def) => {
		let pathPoints = history.map((point) => {
			const val = (point as any)[def.key] ?? 0;
			return `${getX(point.day)},${getY(val)}`;
		});

		const linePath = `M ${pathPoints.join(' L ')}`;
		
		// Fill path (only for Net Worth/Net Position)
		let fillPath = '';
		if (def.fill !== 'none' && history.length > 0) {
			const zeroY = Math.min(margin.top + plotHeight, Math.max(margin.top, getY(0)));
			const firstX = getX(history[0].day);
			const lastX = getX(history[history.length - 1].day);
			fillPath = `${linePath} L ${lastX},${zeroY} L ${firstX},${zeroY} Z`;
		}

		return {
			...def,
			linePath,
			fillPath
		};
	});

	// Grid calculations
	const yTicks = 4;
	const yGridLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
		const val = minY + (i / yTicks) * (maxY - minY);
		const y = getY(val);
		return { val, y };
	});

	const xTicksCount = Math.min(6, Math.max(2, Math.floor(maxDay / 15)));
	const xGridLines = Array.from({ length: xTicksCount }).map((_, i) => {
		const day = Math.round((i / (xTicksCount - 1)) * maxDay);
		const x = getX(day);
		return { day, x };
	});

	// Zero line position
	const zeroY = getY(0);
	const showZeroLine = minY < 0 && maxY > 0;

	// Mouse Move logic
	const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
		if (!svgRef.current || history.length === 0) return;

		const rect = svgRef.current.getBoundingClientRect();
		const relativeX = e.clientX - rect.left;
		const plotX = relativeX - margin.left;
		
		if (plotX < 0 || plotX > plotWidth) {
			setHoverIndex(null);
			return;
		}

		// Find closest day in history
		const targetDay = (plotX / plotWidth) * maxDay;
		let closestIdx = 0;
		let minDiff = Infinity;

		history.forEach((point, idx) => {
			const diff = Math.abs(point.day - targetDay);
			if (diff < minDiff) {
				minDiff = diff;
				closestIdx = idx;
			}
		});

		setHoverIndex(closestIdx);
	};

	const handleMouseLeave = () => {
		setHoverIndex(null);
	};

	const hoverPoint = hoverIndex !== null ? history[hoverIndex] : null;

	return (
		<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/70 p-6 shadow-xl backdrop-blur-md flex flex-col gap-4 animate-[fadeIn_0.3s_ease-out] [.light_&]:border-slate-200 [.light_&]:bg-white/90">
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4 [.light_&]:border-slate-100">
				<div>
					<h3 className="text-base font-bold text-white tracking-tight [.light_&]:text-slate-900">
						{isEnterprise ? 'Treasury Evolution History' : 'Historical Trend Evolution'}
					</h3>
					<p className="text-[11px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
						Visualizing daily variable logs over {maxDay} days
					</p>
				</div>

				{/* Checkbox pills */}
				<div className="flex flex-wrap gap-2 text-[10px] font-mono">
					{activeSeriesDef.map((def) => {
						const isVisible = visibleSeries[def.key];
						return (
							<button
								key={def.key}
								onClick={() => toggleSeries(def.key)}
								style={{
									borderColor: isVisible ? `${def.stroke}40` : 'transparent',
									backgroundColor: isVisible ? `${def.stroke}12` : 'rgba(30, 41, 59, 0.4)'
								}}
								className={[
									'px-2.5 py-1 rounded-full border transition hover:scale-105 cursor-pointer font-bold',
									isVisible 
										? 'text-white' 
										: 'text-slate-500 [.light_&]:bg-slate-100 [.light_&]:text-slate-400'
								].join(' ')}
							>
								<span 
									className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
									style={{ backgroundColor: def.stroke }}
								/>
								{def.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* SVG Chart Plotter */}
			<div className="relative w-full">
				<svg
					ref={svgRef}
					width="100%"
					height={dimensions.height}
					onMouseMove={handleMouseMove}
					onMouseLeave={handleMouseLeave}
					className="overflow-visible select-none cursor-crosshair font-mono text-[9px] text-slate-500"
				>
					{/* Grid lines */}
					{yGridLines.map((line, idx) => (
						<g key={`y-grid-${idx}`}>
							<line
								x1={margin.left}
								y1={line.y}
								x2={dimensions.width - margin.right}
								y2={line.y}
								stroke="#1e293b"
								strokeWidth="1"
								strokeDasharray="2, 4"
								className="opacity-40 [.light_&]:opacity-80 [.light_&]:stroke-slate-200"
							/>
							<text
								x={margin.left - 8}
								y={line.y + 3}
								textAnchor="end"
								fill="#cbd5e1"
								className="[.light_&]:fill-slate-500 font-medium"
							>
								{formatCurrency(line.val)}
							</text>
						</g>
					))}

					{xGridLines.map((line, idx) => (
						<g key={`x-grid-${idx}`}>
							<line
								x1={line.x}
								y1={margin.top}
								x2={line.x}
								y2={dimensions.height - margin.bottom}
								stroke="#1e293b"
								strokeWidth="1"
								strokeDasharray="2, 4"
								className="opacity-40 [.light_&]:opacity-80 [.light_&]:stroke-slate-200"
							/>
							<text
								x={line.x}
								y={dimensions.height - margin.bottom + 14}
								textAnchor="middle"
								fill="#cbd5e1"
								className="[.light_&]:fill-slate-500 font-medium"
							>
								Day {line.day}
							</text>
						</g>
					))}

					{/* Dotted Zero line baseline */}
					{showZeroLine && (
						<line
							x1={margin.left}
							y1={zeroY}
							x2={dimensions.width - margin.right}
							y2={zeroY}
							stroke="#64748b"
							strokeWidth="1"
							strokeDasharray="3, 3"
							className="opacity-70"
						/>
					)}

					{/* Fills paths */}
					{paths.map((path) => (
						path.fillPath && (
							<path
								key={`fill-${path.key}`}
								d={path.fillPath}
								fill={path.fill}
								className="pointer-events-none"
							/>
						)
					))}

					{/* Line paths */}
					{paths.map((path) => (
						<path
							key={`line-${path.key}`}
							d={path.linePath}
							fill="none"
							stroke={path.stroke}
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="pointer-events-none transition-all duration-200"
						/>
					))}

					{/* Hover interaction markers */}
					{hoverPoint && (
						<>
							{/* Vertical tracking line */}
							<line
								x1={getX(hoverPoint.day)}
								y1={margin.top}
								x2={getX(hoverPoint.day)}
								y2={dimensions.height - margin.bottom}
								stroke="#38bdf8"
								strokeWidth="1"
								strokeDasharray="4, 4"
							/>

							{/* Dynamic dots for each active series */}
							{visibleSeriesDef.map((def) => {
								const val = (hoverPoint as any)[def.key] ?? 0;
								return (
									<circle
										key={`hover-dot-${def.key}`}
										cx={getX(hoverPoint.day)}
										cy={getY(val)}
										r="4"
										fill={def.stroke}
										stroke="#0f172a"
										strokeWidth="1.5"
										className="[.light_&]:stroke-white shadow"
									/>
								);
							})}
						</>
					)}
				</svg>
			</div>

			{/* Hover tooltip values overlay */}
			{hoverPoint ? (
				<div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono select-none [.light_&]:bg-slate-50 [.light_&]:border-slate-200">
					<div className="flex-shrink-0 text-white font-bold [.light_&]:text-slate-900 border-r border-slate-800 pr-4 mr-2 [.light_&]:border-slate-200 flex items-center">
						📅 Day {hoverPoint.day}
					</div>
					{visibleSeriesDef.map((def) => {
						const val = (hoverPoint as any)[def.key] ?? 0;
						return (
							<div key={def.key} className="flex items-center gap-1.5">
								<span 
									className="w-2.5 h-2.5 rounded-full" 
									style={{ backgroundColor: def.stroke }} 
								/>
								<span className="text-slate-400 font-semibold">{def.label}:</span>
								<span className="text-white font-bold [.light_&]:text-slate-900">
									{formatCurrency(val)}
								</span>
							</div>
						);
					})}
				</div>
			) : (
				<div className="text-slate-500 text-center font-mono text-[10px] italic py-2">
					Hover mouse pointer over the chart to read daily balances.
				</div>
			)}
		</div>
	);
}
