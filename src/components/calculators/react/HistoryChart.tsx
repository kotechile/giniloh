import React, { useState, useRef, useEffect } from 'react';
import type { HistoryDataPoint } from '../../../lib/calculators/moneyFlowEngine';
import { formatCurrency } from '../../../lib/calculators/format';

interface HistoryChartProps {
	history: HistoryDataPoint[];
	mode: 'personal' | 'enterprise';
}

// Clean helper to format Y-axis tick values cleanly ($0, $5k, $10k, $15k, $20k)
function formatYAxisTick(val: number): string {
	const abs = Math.abs(val);
	const sign = val < 0 ? '-' : '';
	if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`;
	if (abs >= 10000) return `${sign}$${Math.round(abs / 1000)}k`;
	if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`.replace('.0k', 'k');
	return `${sign}$${Math.round(abs)}`;
}

// Smooth bezier spline path generator (natural interpolation)
function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
	if (points.length === 0) return '';
	if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
	if (points.length === 2) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;

	let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
	for (let i = 0; i < points.length - 1; i++) {
		const p0 = points[Math.max(0, i - 1)];
		const p1 = points[i];
		const p2 = points[i + 1];
		const p3 = points[Math.min(points.length - 1, i + 2)];

		const cp1x = p1.x + (p2.x - p0.x) / 6;
		const cp1y = p1.y + (p2.y - p0.y) / 6;
		const cp2x = p2.x - (p3.x - p1.x) / 6;
		const cp2y = p2.y - (p3.y - p1.y) / 6;

		d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
	}
	return d;
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

	// Auto-resize observer
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
			<div className="rounded-2xl border border-gray-200 bg-white p-6 flex items-center justify-center h-[260px] text-xs font-sans text-gray-500">
				No simulation history data collected yet.
			</div>
		);
	}

	const margin = { top: 25, right: 35, bottom: 40, left: 65 };
	const plotWidth = dimensions.width - margin.left - margin.right;
	const plotHeight = dimensions.height - margin.top - margin.bottom;

	const maxDay = Math.max(30, history[history.length - 1].day);

	// Personal Series definitions with exact color palette
	const personalSeriesDef = [
		{ key: 'netWorth', label: 'Net Worth', stroke: '#059669', fill: 'rgba(16, 185, 129, 0.04)' },
		{ key: 'investments', label: 'Investments', stroke: '#10B981', fill: 'none' },
		{ key: 'hysa', label: 'HYSA Savings', stroke: '#3B82F6', fill: 'none' },
		{ key: 'checking', label: 'Checking Balance', stroke: '#6366F1', fill: 'none' },
		{ key: 'debt', label: 'High-Interest Debt', stroke: '#F43F5E', fill: 'none' },
		{ key: 'mortgage', label: 'Mortgage Loan', stroke: '#8B5CF6', fill: 'none' }
	];

	// Enterprise Series definitions
	const enterpriseSeriesDef = [
		{ key: 'netWorth', label: 'Net Position', stroke: '#059669', fill: 'rgba(16, 185, 129, 0.04)' },
		{ key: 'operatingCash', label: 'Net Cash Flow', stroke: '#6366F1', fill: 'none' },
		{ key: 'mfs', label: 'MMF reserves', stroke: '#3B82F6', fill: 'none' },
		{ key: 'receivables', label: 'Receivables', stroke: '#F59E0B', fill: 'none' },
		{ key: 'payables', label: 'Payables', stroke: '#F43F5E', fill: 'none' }
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
		minY = 0;
		maxY = 25000;
	} else {
		const diff = maxY - minY;
		if (diff === 0) {
			minY = Math.max(0, minY - 5000);
			maxY += 5000;
		} else {
			minY = Math.min(0, minY);
			maxY += diff * 0.12;
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

	// Generate lines path data with smooth curves
	const paths = visibleSeriesDef.map((def) => {
		const points = history.map((point) => {
			const val = (point as any)[def.key] ?? 0;
			return { x: getX(point.day), y: getY(val) };
		});

		const linePath = buildSmoothPath(points);
		
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

	// Grid & Y-Axis Ticks
	const yTicksCount = 4;
	const yGridLines = Array.from({ length: yTicksCount + 1 }).map((_, i) => {
		const val = minY + (i / yTicksCount) * (maxY - minY);
		const y = getY(val);
		return { val, y };
	});

	// X-Axis Regular Ticks (Day 0, Day 7, Day 14, Day 21, Day 30)
	const xTicksCount = 5;
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
		<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4 font-sans animate-[fadeIn_0.3s_ease-out]">
			{/* Header & Interactive Top Legend */}
			<div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
				<div>
					<h3 className="text-base font-semibold text-gray-900 tracking-tight">
						{isEnterprise ? 'Treasury Evolution History' : 'Historical Trend Evolution'}
					</h3>
					<p className="text-xs text-gray-500 font-normal mt-0.5">
						Daily variable logs over {maxDay} days
					</p>
				</div>

				{/* Top Legend Filter Pills */}
				<div className="flex flex-wrap gap-2 text-xs font-sans">
					{activeSeriesDef.map((def) => {
						const isVisible = visibleSeries[def.key];
						return (
							<button
								key={def.key}
								onClick={() => toggleSeries(def.key)}
								className={[
									'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition cursor-pointer text-xs font-medium',
									isVisible 
										? 'bg-gray-100 border-gray-300 text-gray-900 opacity-100 shadow-2xs' 
										: 'bg-gray-50 border-gray-200 text-gray-400 opacity-40 hover:opacity-70'
								].join(' ')}
							>
								<span 
									className="w-2 h-2 rounded-full inline-block"
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
					className="overflow-visible select-none cursor-crosshair font-sans"
				>
					{/* Light Chart Background Area */}
					<rect
						x={margin.left}
						y={margin.top}
						width={plotWidth}
						height={plotHeight}
						fill="#FAFAFA"
						stroke="#F3F4F6"
						strokeWidth="1"
						rx="6"
					/>

					{/* Y-Axis Grid Lines & Tick Labels */}
					{yGridLines.map((line, idx) => (
						<g key={`y-grid-${idx}`}>
							<line
								x1={margin.left}
								y1={line.y}
								x2={margin.left + plotWidth}
								y2={line.y}
								stroke="#E5E7EB"
								strokeWidth="1"
								strokeDasharray="3 3"
							/>
							<text
								x={margin.left - 10}
								y={line.y + 4}
								textAnchor="end"
								fill="#9CA3AF"
								fontSize="11"
								fontWeight="400"
								className="font-sans"
							>
								{formatYAxisTick(line.val)}
							</text>
						</g>
					))}

					{/* X-Axis Regular Ticks & Labels */}
					{xGridLines.map((line, idx) => (
						<g key={`x-grid-${idx}`}>
							<line
								x1={line.x}
								y1={margin.top}
								x2={line.x}
								y2={margin.top + plotHeight}
								stroke="#E5E7EB"
								strokeWidth="1"
								strokeDasharray="3 3"
							/>
							<text
								x={line.x}
								y={margin.top + plotHeight + 18}
								textAnchor="middle"
								fill="#9CA3AF"
								fontSize="11"
								fontWeight="400"
								className="font-sans"
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
							x2={margin.left + plotWidth}
							y2={zeroY}
							stroke="#9CA3AF"
							strokeWidth="1"
							strokeDasharray="3 3"
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

					{/* Smooth Line paths */}
					{paths.map((path) => (
						<path
							key={`line-${path.key}`}
							d={path.linePath}
							fill="none"
							stroke={path.stroke}
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="pointer-events-none transition-all duration-200"
						/>
					))}

					{/* Hover interaction crosshair */}
					{hoverPoint && (
						<>
							<line
								x1={getX(hoverPoint.day)}
								y1={margin.top}
								x2={getX(hoverPoint.day)}
								y2={margin.top + plotHeight}
								stroke="#D1D5DB"
								strokeWidth="1"
								strokeDasharray="3 3"
							/>

							{/* Dynamic markers for each active series */}
							{visibleSeriesDef.map((def) => {
								const val = (hoverPoint as any)[def.key] ?? 0;
								return (
									<circle
										key={`hover-dot-${def.key}`}
										cx={getX(hoverPoint.day)}
										cy={getY(val)}
										r="4"
										fill={def.stroke}
										stroke="#FFFFFF"
										strokeWidth="2"
										className="shadow-sm"
									/>
								);
							})}
						</>
					)}
				</svg>
			</div>

			{/* Hover Itemized Breakdown Card / Bottom Tooltip */}
			{hoverPoint ? (
				<div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-sans shadow-xs">
					<div className="flex-shrink-0 text-gray-900 font-semibold text-xs border-r border-gray-200 pr-4 mr-1 flex items-center">
						Day {hoverPoint.day}
					</div>
					{visibleSeriesDef.map((def) => {
						const val = (hoverPoint as any)[def.key] ?? 0;
						return (
							<div key={def.key} className="flex items-center gap-1.5 font-sans">
								<span 
									className="w-2 h-2 rounded-full inline-block flex-shrink-0" 
									style={{ backgroundColor: def.stroke }} 
								/>
								<span className="text-gray-600 font-medium">{def.label}:</span>
								<span className="text-gray-900 font-semibold font-mono text-xs">
									{formatCurrency(val)}
								</span>
							</div>
						);
					})}
				</div>
			) : (
				<div className="bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-4 text-center">
					<span className="text-gray-500 font-normal font-sans text-xs">
						Hover mouse over the chart to inspect daily balances
					</span>
				</div>
			)}
		</div>
	);
}
