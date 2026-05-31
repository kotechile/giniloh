import React from 'react';
import type { AccountNode, FlowEdge } from '../../../lib/calculators/moneyFlowEngine';
import { formatCurrency } from '../../../lib/calculators/format';

interface MoneyFlowCanvasProps {
	nodes: AccountNode[];
	edges: FlowEdge[];
	selectedNodeId: string | null;
	setSelectedNodeId: (id: string | null) => void;
	onNodeUpdate: (updatedNode: AccountNode) => void;
}

// Layout positions (x, y) coordinates for each account type
const NODE_COORDINATES: Record<string, { x: number; y: number }> = {
	checking: { x: 120, y: 220 },
	hysa: { x: 420, y: 70 },
	match401k: { x: 420, y: 220 },
	debt: { x: 420, y: 370 },
	hsa: { x: 720, y: 70 },
	ira: { x: 720, y: 220 },
	max401k: { x: 720, y: 370 },
	brokerage: { x: 1000, y: 220 }
};

const ACCENT_COLORS: Record<string, { border: string; glow: string; text: string; bg: string }> = {
	checking: { border: 'border-cyan-500/30', glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
	hysa: { border: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
	match401k: { border: 'border-blue-500/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]', text: 'text-blue-400', bg: 'bg-blue-500/10' },
	debt: { border: 'border-red-500/30', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]', text: 'text-red-400', bg: 'bg-red-500/10' },
	hsa: { border: 'border-teal-500/30', glow: 'shadow-[0_0_20px_rgba(20,184,166,0.15)]', text: 'text-teal-400', bg: 'bg-teal-500/10' },
	ira: { border: 'border-indigo-500/30', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
	max401k: { border: 'border-purple-500/30', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)]', text: 'text-purple-400', bg: 'bg-purple-500/10' },
	brokerage: { border: 'border-violet-500/30', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.15)]', text: 'text-violet-400', bg: 'bg-violet-500/10' }
};

const NODE_TOOLTIPS: Record<string, { title: string; desc: string; numbers: string }> = {
	checking: {
		title: 'Primary Checking',
		desc: 'The central clearing hub for cash flow. Daily income is deposited here first.',
		numbers: 'Large number: current balance. C/F: Ceiling sweep threshold (surplus routes to savings/investing) and Floor safety threshold (deficit pulls from HYSA).'
	},
	hysa: {
		title: 'HYSA (Emergency Fund)',
		desc: 'High-Yield Savings Account for liquid emergency reserves.',
		numbers: 'Large number: accumulated balance (earns yield monthly at 4.5% APY). Sweeps fill this up to its target ceiling (default $15,000).'
	},
	match401k: {
		title: 'Employer 401k Match',
		desc: 'Workplace 401(k) contributions up to the employer matching cap (100% risk-free return).',
		numbers: 'Large number: accumulated balance. Automated sweeps cap out at the annual limit (default $6,000 employer matching limit).'
	},
	debt: {
		title: 'High-Interest Debt',
		desc: 'Credit cards or other high-interest liabilities. Target of aggressive pay-downs.',
		numbers: 'Large number: outstanding debt balance. Interest charges accrue monthly at 18% APY, increasing the debt unless paid.'
	},
	hsa: {
		title: 'Pre-tax HSA',
		desc: 'Health Savings Account. Double tax-sheltered: tax-free contributions, growth, and medical withdrawals.',
		numbers: 'Large number: accumulated balance. Subject to annual contribution limit (default $4,150).'
	},
	ira: {
		title: 'Roth IRA',
		desc: 'Individual Retirement Account with post-tax contributions and 100% tax-free growth and withdrawals.',
		numbers: 'Large number: accumulated balance. Subject to annual contribution limit (default $7,000).'
	},
	max401k: {
		title: 'Workplace 401k Max',
		desc: 'Workplace 401(k) contributions beyond the matching limit to maximize tax-deferred savings.',
		numbers: 'Large number: accumulated balance. Subject to annual contribution limit (default $23,000).'
	},
	brokerage: {
		title: 'Taxable Brokerage',
		desc: 'Standard taxable investing account for broad-market index funds. The final overflow bucket.',
		numbers: 'Large number: accumulated investment balance. No annual limits.'
	}
};

export default function MoneyFlowCanvas({
	nodes,
	edges,
	selectedNodeId,
	setSelectedNodeId,
	onNodeUpdate
}: MoneyFlowCanvasProps) {
	const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

	// Computes horizontal Bezier curve control points
	const calculateBezierPath = (sourceId: string, targetId: string) => {
		const start = NODE_COORDINATES[sourceId];
		const end = NODE_COORDINATES[targetId];
		if (!start || !end) return '';

		// Account for node dimensions: nodes are 240px wide, start is on right border, end is on left border
		const startX = start.x + 240;
		const startY = start.y + 40; // centered vertically (height 80px)
		const endX = end.x;
		const endY = end.y + 40;

		const controlOffset = Math.abs(endX - startX) / 2;
		return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
	};

	const handleSliderChange = (field: 'balance' | 'ceiling' | 'floor', value: number) => {
		console.log('Slider change triggered:', field, value);
		if (selectedNode) {
			onNodeUpdate({
				...selectedNode,
				[field]: value
			});
		}
	};

	return (
		<div className="relative w-full rounded-3xl border border-slate-800 bg-slate-950/45 p-6 shadow-2xl backdrop-blur-md overflow-hidden min-h-[520px]">
			{/* Background Grid Pattern */}
			<div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTQwIDBIMHY0MGg0MFYweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] pointer-events-none"></div>

			{/* Visual canvas window */}
			<div className="relative overflow-x-auto w-full h-[460px] scrollbar-thin scrollbar-thumb-slate-800">
				<div className="w-[1280px] h-full relative">
					{/* SVG Flow Connections Layer */}
					<svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
						<defs>
							<linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#06b6d4" />
								<stop offset="50%" stopColor="#3b82f6" />
								<stop offset="100%" stopColor="#10b981" />
							</linearGradient>
							<filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
								<feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.4" />
							</filter>
						</defs>

						{/* Inactive default waterfall flows */}
						{Object.keys(NODE_COORDINATES).map((key) => {
							if (key === 'checking') return null;
							return (
								<path
									key={`base-${key}`}
									d={calculateBezierPath('checking', key)}
									fill="none"
									stroke="rgba(30, 41, 59, 0.5)"
									strokeWidth="2"
								/>
							);
						})}

						{/* Custom interactive connection edges */}
						{edges.map((edge) => {
							const path = calculateBezierPath(edge.source, edge.target);
							return (
								<g key={edge.id}>
									{/* Glow path */}
									<path
										d={path}
										fill="none"
										stroke="url(#activeGradient)"
										strokeWidth="4"
										filter="url(#glow)"
										className="opacity-70"
									/>
									{/* Animated dash flow */}
									<path
										d={path}
										fill="none"
										stroke="url(#activeGradient)"
										strokeWidth="2"
										strokeDasharray="6, 12"
										className="animate-[dash_1.5s_linear_infinite]"
									/>
								</g>
							);
						})}
					</svg>

					{/* Nodes Layer */}
					{nodes.map((node) => {
						const coords = NODE_COORDINATES[node.id];
						if (!coords) return null;

						const colors = ACCENT_COLORS[node.id] || ACCENT_COLORS.checking;
						const isSelected = selectedNodeId === node.id;
						const tooltip = NODE_TOOLTIPS[node.id];
						const isTopRow = node.id === 'hysa' || node.id === 'hsa';

						return (
							<button
								key={node.id}
								onClick={() => setSelectedNodeId(node.id)}
								style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
								className={[
									'absolute w-[240px] h-[80px] text-left p-4 rounded-2xl border bg-slate-900/60 backdrop-blur-md transition flex flex-col justify-between hover:scale-103 cursor-pointer z-10 group',
									isSelected
										? 'border-cyan-400 bg-slate-800/80 shadow-[0_0_25px_rgba(6,182,212,0.25)]'
										: `${colors.border} ${colors.glow} hover:border-slate-600`
								].join(' ')}
							>
								{/* Tooltip Hover Overlay */}
								{tooltip && (
									<div className={[
										'absolute w-72 p-4 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl backdrop-blur-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-50 normal-case whitespace-normal leading-relaxed text-[11px] text-slate-300 font-normal',
										isTopRow ? 'top-full mt-3 left-1/2 -translate-x-1/2' : 'bottom-full mb-3 left-1/2 -translate-x-1/2'
									].join(' ')}>
										<div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-850">
											<span className={`h-1.5 w-1.5 rounded-full ${colors.bg} ${colors.text} shadow-[0_0_8px_currentColor]`}></span>
											<span className="font-bold text-white text-xs">{tooltip.title}</span>
										</div>
										<div className="space-y-2">
											<p><strong className="text-slate-200">Concept:</strong> {tooltip.desc}</p>
											<p><strong className="text-slate-200">Values:</strong> {tooltip.numbers}</p>
										</div>
									</div>
								)}

								<div className="flex items-center justify-between w-full">
									<span className="font-bold text-white text-xs tracking-tight">{node.name}</span>
									<span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-semibold ${colors.bg} ${colors.text}`}>
										{node.type}
									</span>
								</div>

								<div className="flex items-end justify-between w-full mt-2">
									<span className="text-sm font-semibold font-mono text-slate-200">
										{formatCurrency(node.balance)}
									</span>
									{node.type === 'checking' && (
										<span className="text-[9px] text-slate-500 font-mono">
											C:{Math.round(node.ceiling)} / F:{Math.round(node.floor)}
										</span>
									)}
									{node.interestRate !== undefined && (
										<span className="text-[9px] text-emerald-400 font-mono font-bold">
											{node.interestRate}% APY
										</span>
									)}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Parameters Drawer Overlay */}
			{selectedNode && (
				<div className="relative z-20 mt-6 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col gap-4 animate-[slideUp_0.2s_ease-out]">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-bold text-white text-base">Node settings: {selectedNode.name}</h3>
							<p className="text-xs text-slate-400 mt-1">Configure threshold variables and balances manually.</p>
						</div>
						<button
							onClick={() => setSelectedNodeId(null)}
							className="text-xs font-mono uppercase px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition"
						>
							Close
						</button>
					</div>

					<div className="grid gap-6 sm:grid-cols-3">
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs font-mono text-slate-400">
								<span>Current balance</span>
								<span className="text-white font-bold">{formatCurrency(selectedNode.balance)}</span>
							</div>
							<input
								type="range"
								min="0"
								max="50000"
								step="250"
								value={selectedNode.balance}
								onChange={(e) => handleSliderChange('balance', parseFloat(e.target.value))}
								className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:rounded-lg [&::-moz-range-track]:w-full [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:rounded-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
							/>
						</div>

						{selectedNode.type === 'checking' && (
							<>
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs font-mono text-slate-400">
										<span>Ceiling sweep threshold (T_over)</span>
										<span className="text-cyan-400 font-bold">{formatCurrency(selectedNode.ceiling)}</span>
									</div>
									<input
										type="range"
										min="2000"
										max="15000"
										step="250"
										value={selectedNode.ceiling}
										onChange={(e) => handleSliderChange('ceiling', parseFloat(e.target.value))}
										className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:rounded-lg [&::-moz-range-track]:w-full [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:rounded-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
									/>
								</div>

								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs font-mono text-slate-400">
										<span>Floor safety threshold (T_under)</span>
										<span className="text-emerald-400 font-bold">{formatCurrency(selectedNode.floor)}</span>
									</div>
									<input
										type="range"
										min="500"
										max="5000"
										step="100"
										value={selectedNode.floor}
										onChange={(e) => handleSliderChange('floor', parseFloat(e.target.value))}
										className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:rounded-lg [&::-moz-range-track]:w-full [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:rounded-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
									/>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
