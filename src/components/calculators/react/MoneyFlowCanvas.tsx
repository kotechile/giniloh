import React from 'react';
import type { AccountNode, FlowEdge } from '../../../lib/calculators/moneyFlowEngine';
import { formatCurrency } from '../../../lib/calculators/format';

interface MoneyFlowCanvasProps {
	nodes: AccountNode[];
	edges: FlowEdge[];
	selectedNodeId: string | null;
	setSelectedNodeId: (id: string | null) => void;
	onNodeUpdate: (updatedNode: AccountNode) => void;
	mode: 'personal' | 'enterprise';
}

// Layout positions (x, y) coordinates for Personal Mode
const PERSONAL_NODE_COORDINATES: Record<string, { x: number; y: number }> = {
	checking: { x: 120, y: 260 },
	hysa: { x: 420, y: 110 },
	match401k: { x: 420, y: 260 },
	debt: { x: 420, y: 410 },
	hsa: { x: 720, y: 110 },
	ira: { x: 720, y: 260 },
	max401k: { x: 720, y: 410 },
	brokerage: { x: 1000, y: 260 }
};

// Layout positions (x, y) coordinates for Enterprise Mode (left-to-right cascade)
const ENTERPRISE_NODE_COORDINATES: Record<string, { x: number; y: number }> = {
	revenues: { x: 50, y: 100 },
	receivables: { x: 350, y: 100 },
	operating_cash_flow: { x: 350, y: 250 },
	capex: { x: 650, y: 100 },
	cogs: { x: 650, y: 250 },
	hr_costs: { x: 650, y: 400 },
	payables: { x: 950, y: 250 },
	financing: { x: 950, y: 400 },
	net_cash_flow: { x: 1250, y: 250 },
	mfs: { x: 1550, y: 250 }
};

// Styles mapping for Personal Mode
const PERSONAL_ACCENT_COLORS: Record<string, { text: string; bg: string }> = {
	checking: { text: 'text-cyan-400 [.light_&]:text-cyan-700', bg: 'bg-cyan-900/40 [.light_&]:bg-cyan-100' },
	hysa: { text: 'text-emerald-400 [.light_&]:text-emerald-700', bg: 'bg-emerald-900/40 [.light_&]:bg-emerald-100' },
	match401k: { text: 'text-blue-400 [.light_&]:text-blue-700', bg: 'bg-blue-900/40 [.light_&]:bg-blue-100' },
	debt: { text: 'text-red-400 [.light_&]:text-red-700', bg: 'bg-red-900/40 [.light_&]:bg-red-100' },
	hsa: { text: 'text-teal-400 [.light_&]:text-teal-700', bg: 'bg-teal-900/40 [.light_&]:bg-teal-100' },
	ira: { text: 'text-indigo-400 [.light_&]:text-indigo-700', bg: 'bg-indigo-900/40 [.light_&]:bg-indigo-100' },
	max401k: { text: 'text-purple-400 [.light_&]:text-purple-700', bg: 'bg-purple-900/40 [.light_&]:bg-purple-100' },
	brokerage: { text: 'text-violet-400 [.light_&]:text-violet-700', bg: 'bg-violet-900/40 [.light_&]:bg-violet-100' }
};

// Styles mapping for Enterprise Mode
const ENTERPRISE_ACCENT_COLORS: Record<string, { text: string; bg: string }> = {
	revenues: { text: 'text-emerald-400 [.light_&]:text-emerald-700', bg: 'bg-emerald-900/40 [.light_&]:bg-emerald-100' },
	receivables: { text: 'text-amber-400 [.light_&]:text-amber-700', bg: 'bg-amber-900/40 [.light_&]:bg-amber-100' },
	payables: { text: 'text-rose-400 [.light_&]:text-rose-700', bg: 'bg-rose-900/40 [.light_&]:bg-rose-100' },
	operating_cash_flow: { text: 'text-cyan-400 [.light_&]:text-cyan-700', bg: 'bg-cyan-900/40 [.light_&]:bg-cyan-100' },
	cogs: { text: 'text-orange-400 [.light_&]:text-orange-700', bg: 'bg-orange-900/40 [.light_&]:bg-orange-100' },
	hr_costs: { text: 'text-red-400 [.light_&]:text-red-700', bg: 'bg-red-900/40 [.light_&]:bg-red-100' },
	capex: { text: 'text-fuchsia-400 [.light_&]:text-fuchsia-700', bg: 'bg-fuchsia-900/40 [.light_&]:bg-fuchsia-100' },
	financing: { text: 'text-violet-400 [.light_&]:text-violet-700', bg: 'bg-violet-900/40 [.light_&]:bg-violet-100' },
	net_cash_flow: { text: 'text-blue-400 [.light_&]:text-blue-700', bg: 'bg-blue-900/40 [.light_&]:bg-blue-100' },
	mfs: { text: 'text-teal-400 [.light_&]:text-teal-700', bg: 'bg-teal-900/40 [.light_&]:bg-teal-100' }
};

const PERSONAL_NODE_TOOLTIPS: Record<string, { title: string; desc: string; numbers: string }> = {
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
		title: '401k (Base & Match)',
		desc: 'Workplace 401(k) contributions up to the employer matching cap. Split from the Voluntary Max tier because capturing the 100% risk-free company match is the highest-priority investment, routed immediately after your HYSA is filled.',
		numbers: 'Large number: accumulated balance (including historical principal). Automated sweeps cap out at the annual matching limit (default $6,000 YTD).'
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
		title: '401k (Voluntary Max)',
		desc: 'Voluntary workplace 401(k) contributions beyond the matching limit to maximize tax-deferred savings. Split from the Base & Match tier because voluntary contributions (without matching) have a lower priority than paying high-interest debt, HSAs, or Roth IRAs.',
		numbers: 'Large number: accumulated balance. Subject to the remaining IRS annual contribution limit (default $23,000 YTD).'
	},
	brokerage: {
		title: 'Taxable Brokerage',
		desc: 'Standard taxable investing account for broad-market index funds. The final overflow bucket.',
		numbers: 'Large number: accumulated investment balance. No annual limits.'
	}
};

const ENTERPRISE_NODE_TOOLTIPS: Record<string, { title: string; desc: string; numbers: string }> = {
	revenues: {
		title: 'Revenues Plan',
		desc: 'Gross corporate earnings. Direct inputs drive balance sheet receipts.',
		numbers: 'Configures top-down additions, VAT rate, and factoring capabilities.'
	},
	receivables: {
		title: 'Account Receivables',
		desc: 'Unpaid revenue invoices awaiting DSO settlement.',
		numbers: 'Affected by Days Sales Outstanding (DSO) latency and regional default risks.'
	},
	payables: {
		title: 'Account Payables',
		desc: 'Pending bills and expenses accrued awaiting DPO disbursement.',
		numbers: 'Sum of COGS, HR costs, and Capex delayed by respective DPO settings.'
	},
	operating_cash_flow: {
		title: 'Operating Cash Flow',
		desc: 'Current cash generated from core business operations before distributions.',
		numbers: 'Disbursed cash inflows minus active outflows.'
	},
	cogs: {
		title: 'Variable Cost: COGS',
		desc: 'Cost of Goods Sold. Directly affects variable capital requirements.',
		numbers: 'Drives working capital based on Days Payable Outstanding (DPO).'
	},
	hr_costs: {
		title: 'Fixed Cost: HR & Salaries',
		desc: 'Monthly payroll commitments across entities.',
		numbers: 'Drives fixed payment releases based on payroll schedules.'
	},
	capex: {
		title: 'Fixed Cost: Capex',
		desc: 'Capital expenditures for equipment, software, and structures.',
		numbers: 'Settled after fixed delay periods to measure capital drag.'
	},
	financing: {
		title: 'Strategic Financing',
		desc: 'Loans and Revolving Credit Lines used to protect company floor liquidity.',
		numbers: 'Drawn balance charged interest (Spread + benchmark Index).'
	},
	net_cash_flow: {
		title: 'Net Cash Flow',
		desc: 'Active treasury cash buffer. Deficits draw financing; surpluses sweep to MMF.',
		numbers: 'C/F: Treasury ceiling (MMF sweep trigger) and Floor liquidity buffer.'
	},
	mfs: {
		title: 'Money Market Fund (MMF)',
		desc: 'Highly liquid yields accumulator holding corporate reserve surplus.',
		numbers: 'Accumulates cash swept from Net Cash Flow; yields interest monthly.'
	}
};

export default function MoneyFlowCanvas({
	nodes,
	edges,
	selectedNodeId,
	setSelectedNodeId,
	onNodeUpdate,
	mode
}: MoneyFlowCanvasProps) {
	const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;
	const isEnterprise = mode === 'enterprise';

	const activeCoordinates = isEnterprise ? ENTERPRISE_NODE_COORDINATES : PERSONAL_NODE_COORDINATES;
	const activeColors = isEnterprise ? ENTERPRISE_ACCENT_COLORS : PERSONAL_ACCENT_COLORS;
	const activeTooltips = isEnterprise ? ENTERPRISE_NODE_TOOLTIPS : PERSONAL_NODE_TOOLTIPS;

	// Computes horizontal Bezier curve control points
	const calculateBezierPath = (sourceId: string, targetId: string) => {
		const start = activeCoordinates[sourceId];
		const end = activeCoordinates[targetId];
		if (!start || !end) return '';

		// Account for node dimensions: nodes are 240px wide, start is on right border, end is on left border
		const startX = start.x + 240;
		const startY = start.y + 48; // centered vertically (height 96px)
		const endX = end.x;
		const endY = end.y + 48;

		const controlOffset = Math.abs(endX - startX) / 2;
		return `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`;
	};

	const handleSliderChange = (field: keyof AccountNode, value: any) => {
		if (selectedNode) {
			onNodeUpdate({
				...selectedNode,
				[field]: value
			});
		}
	};

	const getBalanceSliderConfig = (nodeId: string) => {
		if (isEnterprise) {
			switch (nodeId) {
				case 'revenues':
				case 'cogs':
				case 'hr_costs':
				case 'capex':
					return { max: 1000000, step: 5000 };
				case 'receivables':
				case 'payables':
				case 'operating_cash_flow':
				case 'net_cash_flow':
					return { max: 2000000, step: 10000 };
				case 'financing':
				case 'mfs':
					return { max: 5000000, step: 25000 };
				default:
					return { max: 500000, step: 5000 };
			}
		}
		switch (nodeId) {
			case 'checking':
				return { max: 100000, step: 500 };
			case 'debt':
			case 'hsa':
				return { max: 100000, step: 500 };
			case 'hysa':
			case 'ira':
				return { max: 500000, step: 1000 };
			case 'match401k':
			case 'max401k':
				return { max: 2000000, step: 5000 };
			case 'brokerage':
				return { max: 5000000, step: 10000 };
			default:
				return { max: 100000, step: 500 };
		}
	};

	return (
		<div className="relative w-full rounded-2xl border border-slate-800 bg-slate-950 p-2 md:p-6 shadow-inner overflow-hidden min-h-[600px] [.light_&]:border-slate-300 [.light_&]:bg-slate-100">
			{/* Background Grid Pattern */}
			<div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTQwIDBIMHY0MGg0MFYweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjM2YzZjRmIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] pointer-events-none [.light_&]:opacity-[0.05]"></div>

			{/* Visual canvas window */}
			<div className="relative overflow-x-auto w-full h-[540px] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800">
				<div className="w-[1850px] h-full relative">
					{/* Flow lines (SVG) */}
					<svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
						<defs>
							<linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#06b6d4" />
								<stop offset="50%" stopColor="#3b82f6" />
								<stop offset="100%" stopColor="#10b981" />
							</linearGradient>
							<linearGradient id="corpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" stopColor="#10b981" />
								<stop offset="35%" stopColor="#06b6d4" />
								<stop offset="70%" stopColor="#6366f1" />
								<stop offset="100%" stopColor="#3b82f6" />
							</linearGradient>
							<filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
								<feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.5" />
							</filter>
						</defs>

						{/* Inactive base structure linkages */}
						{!isEnterprise ? (
							Object.keys(activeCoordinates).map((key) => {
								if (key === 'checking') return null;
								return (
									<path
										key={`base-${key}`}
										d={calculateBezierPath('checking', key)}
										fill="none"
										className="stroke-slate-700/60 [.light_&]:stroke-slate-300"
										strokeWidth="3"
									/>
								);
							})
						) : (
							<>
								{/* Revenues -> Receivables & Operating Cash Flow link */}
								<path d={calculateBezierPath('revenues', 'operating_cash_flow')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('revenues', 'receivables')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('receivables', 'operating_cash_flow')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />

								{/* Costs links */}
								<path d={calculateBezierPath('operating_cash_flow', 'cogs')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('operating_cash_flow', 'hr_costs')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('operating_cash_flow', 'capex')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('cogs', 'payables')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('hr_costs', 'payables')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('capex', 'payables')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />

								{/* Discharges */}
								<path d={calculateBezierPath('payables', 'net_cash_flow')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('financing', 'net_cash_flow')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
								<path d={calculateBezierPath('net_cash_flow', 'mfs')} fill="none" className="stroke-slate-700/60 [.light_&]:stroke-slate-300" strokeWidth="3" />
							</>
						)}

						{/* Custom interactive connection edges */}
						{edges.map((edge) => {
							const path = calculateBezierPath(edge.source, edge.target);
							return (
								<g key={edge.id}>
									<path
										d={path}
										fill="none"
										stroke={isEnterprise ? "url(#corpGradient)" : "url(#activeGradient)"}
										strokeWidth="4"
										filter="url(#glow)"
										className="opacity-70 [.light_&]:opacity-50"
									/>
									<path
										d={path}
										fill="none"
										stroke={isEnterprise ? "#10b981" : "#3b82f6"}
										strokeWidth="3"
										strokeDasharray="6, 24"
										className="animate-[dash_1s_linear_infinite]"
									/>
								</g>
							);
						})}
					</svg>

					{/* Nodes Layer */}
					{nodes.map((node) => {
						const coords = activeCoordinates[node.id];
						if (!coords) return null;

						const colors = activeColors[node.id] || activeColors.checking;
						const isSelected = selectedNodeId === node.id;
						const tooltip = activeTooltips[node.id];
						
						// Tooltip placement helpers
						const isTopRow = node.id === 'hysa' || node.id === 'hsa' || node.id === 'revenues' || node.id === 'capex';

						return (
							<button
								key={node.id}
								onClick={() => setSelectedNodeId(node.id)}
								style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
								className={[
									'absolute w-[240px] h-[96px] text-left p-4 rounded-xl border bg-slate-800 transition flex flex-col justify-between hover:scale-105 cursor-pointer z-10 hover:z-30 focus-within:z-30 group shadow-sm [.light_&]:hover:shadow-md [.light_&]:bg-white',
									isSelected
										? 'border-cyan-400 shadow-[0_0_0_2px_rgba(59,130,246,0.3)] z-20 [.light_&]:border-blue-500'
										: `border-slate-700 hover:border-slate-600 [.light_&]:border-slate-300 [.light_&]:hover:border-slate-400`
								].join(' ')}
							>
								{/* Tooltip Hover Overlay */}
								{tooltip && (
									<div className={[
										'absolute w-72 p-4 rounded-xl border border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur-lg opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-50 normal-case whitespace-normal leading-relaxed text-[11px] text-slate-300 font-normal [.light_&]:border-slate-200 [.light_&]:bg-white [.light_&]:text-slate-600',
										isTopRow ? 'top-full mt-3 left-1/2 -translate-x-1/2' : 'bottom-full mb-3 left-1/2 -translate-x-1/2'
									].join(' ')}>
										<div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800 [.light_&]:border-slate-100">
											<span className="font-bold text-white text-xs [.light_&]:text-slate-900">{tooltip.title}</span>
										</div>
										<div className="space-y-2">
											<p><strong className="text-slate-200 [.light_&]:text-slate-900">Concept:</strong> {tooltip.desc}</p>
											<p><strong className="text-slate-200 [.light_&]:text-slate-900">Values:</strong> {tooltip.numbers}</p>
										</div>
									</div>
								)}

								<div className="flex items-center justify-between w-full">
									<span className="font-bold text-white text-sm tracking-tight [.light_&]:text-slate-900">{node.name}</span>
									<span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-semibold ${colors.bg} ${colors.text}`}>
										{node.type}
									</span>
								</div>

								<div className="flex items-end justify-between w-full mt-1">
									<span className="text-xl font-bold font-sans text-white [.light_&]:text-black">
										{formatCurrency(node.balance)}
									</span>
									{!isEnterprise ? (
										node.type === 'checking' && (
											<span className="text-[10px] text-slate-500 font-mono">
												C:{Math.round(node.ceiling)} / F:{Math.round(node.floor)}
											</span>
										)
									) : (
										node.type === 'net_cash_flow' && (
											<span className="text-[10px] text-slate-500 font-mono">
												C:{Math.round(node.ceiling)} / F:{Math.round(node.floor)}
											</span>
										)
									)}
									{node.interestRate !== undefined && (
										<span className="text-[10px] text-emerald-400 font-mono font-bold [.light_&]:text-emerald-600">
											{node.interestRate}% APY
										</span>
									)}
									{isEnterprise && node.id === 'receivables' && (
										<span className="text-[10px] text-amber-400 font-mono [.light_&]:text-amber-600">
											DSO: {node.dso}d
										</span>
									)}
									{isEnterprise && node.id === 'financing' && node.balance > 0 && (
										<span className="text-[10px] text-violet-400 font-mono font-bold [.light_&]:text-violet-600">
											Rate: {((node.fixedSpread || 0) + (node.variableRateIndex || 0)).toFixed(1)}%
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
							<h3 className="font-bold text-white text-base">Node Settings: {selectedNode.name}</h3>
							<p className="text-xs text-slate-400 mt-1">Configure threshold variables and metrics manually.</p>
						</div>
						<button
							onClick={() => setSelectedNodeId(null)}
							className="text-xs font-mono uppercase px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition cursor-pointer"
						>
							Close
						</button>
					</div>

					<div className="grid gap-6 sm:grid-cols-3">
						<div className="flex flex-col gap-2">
							<div className="flex justify-between text-xs font-mono text-slate-400">
								<span>Current Balance</span>
								<span className="text-white font-bold">{formatCurrency(selectedNode.balance)}</span>
							</div>
							<input
								type="range"
								min="0"
								max={getBalanceSliderConfig(selectedNode.id).max}
								step={getBalanceSliderConfig(selectedNode.id).step}
								value={selectedNode.balance}
								onChange={(e) => handleSliderChange('balance', parseFloat(e.target.value))}
								className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-runnable-track]:rounded-lg [&::-moz-range-track]:w-full [&::-moz-range-track]:h-1 [&::-moz-range-track]:bg-slate-800 [&::-moz-range-track]:rounded-lg [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:mt-[-6px] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(6,182,212,0.8)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
							/>
						</div>

						{/* --- PERSONAL WEALTH DRAWERS --- */}
						{!isEnterprise && selectedNode.type === 'checking' && (
							<>
								<div className="flex flex-col gap-2">
									<div className="flex justify-between text-xs font-mono text-slate-400">
										<span>Ceiling Sweep Threshold (T_over)</span>
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
										<span>Floor Safety Threshold (T_under)</span>
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

						{/* --- ENTERPRISE DRIVER DRAWERS --- */}
						{isEnterprise && (
							<>
								{/* 1. Revenues Plan Drawdown Settings */}
								{selectedNode.id === 'revenues' && (
									<>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>VAT Tax Rate (%)</span>
												<span className="text-emerald-400 font-bold">{selectedNode.vatRate || 19}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="25"
												step="1"
												value={selectedNode.vatRate || 19}
												onChange={(e) => handleSliderChange('vatRate', parseInt(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Factoring Fee Rate (%)</span>
												<span className="text-cyan-400 font-bold">{selectedNode.factoringRate || 2.5}%</span>
											</div>
											<input
												type="range"
												min="0.5"
												max="10"
												step="0.5"
												value={selectedNode.factoringRate || 2.5}
												onChange={(e) => handleSliderChange('factoringRate', parseFloat(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
									</>
								)}

								{/* 2. Account Receivables Settings */}
								{selectedNode.id === 'receivables' && (
									<>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Days Sales Outstanding (DSO)</span>
												<span className="text-amber-400 font-bold">{selectedNode.dso || 35} days</span>
											</div>
											<input
												type="range"
												min="10"
												max="90"
												step="5"
												value={selectedNode.dso || 35}
												onChange={(e) => handleSliderChange('dso', parseInt(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Insolvency Default Risk (%)</span>
												<span className="text-red-400 font-bold">{selectedNode.insolvencyRisk || 3.5}%</span>
											</div>
											<input
												type="range"
												min="0"
												max="15"
												step="0.5"
												value={selectedNode.insolvencyRisk || 3.5}
												onChange={(e) => handleSliderChange('insolvencyRisk', parseFloat(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
									</>
								)}

								{/* 3. Cost & Entity Settings (COGS/HR/Capex) */}
								{['cogs', 'hr_costs', 'capex'].includes(selectedNode.id) && (
									<>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Days Payable Outstanding (DPO)</span>
												<span className="text-orange-400 font-bold">
													{selectedNode.id === 'cogs' ? selectedNode.dpoVariable : selectedNode.dpoFixed} days
												</span>
											</div>
											<input
												type="range"
												min="10"
												max="90"
												step="5"
												value={selectedNode.id === 'cogs' ? (selectedNode.dpoVariable || 45) : (selectedNode.dpoFixed || 30)}
												onChange={(e) => handleSliderChange(
													selectedNode.id === 'cogs' ? 'dpoVariable' : 'dpoFixed',
													parseInt(e.target.value)
												)}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<label className="text-xs font-mono text-slate-400">Legal Entity Assignment</label>
											<input
												type="text"
												value={selectedNode.legalEntity || 'Entity A'}
												onChange={(e) => handleSliderChange('legalEntity', e.target.value)}
												className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2.5 py-1 text-xs outline-none font-mono"
											/>
										</div>
									</>
								)}

								{/* 4. Strategic Financing (Credit lines & loans) */}
								{selectedNode.id === 'financing' && (
									<>
										<div className="flex flex-col gap-2">
											<label className="text-xs font-mono text-slate-400">Financing Product Type</label>
											<select
												value={selectedNode.loanType || 'revolving'}
												onChange={(e) => handleSliderChange('loanType', e.target.value)}
												className="bg-slate-950 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs outline-none font-mono"
											>
												<option value="revolving">Revolving Line of Credit</option>
												<option value="term">Term Loan Agreement</option>
											</select>
										</div>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Spread over Index (%)</span>
												<span className="text-violet-400 font-bold">{selectedNode.fixedSpread || 3.5}%</span>
											</div>
											<input
												type="range"
												min="1.0"
												max="8.0"
												step="0.25"
												value={selectedNode.fixedSpread || 3.5}
												onChange={(e) => handleSliderChange('fixedSpread', parseFloat(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
									</>
								)}

								{/* 5. Treasury Net Cash buffers (Ceiling & Floor) */}
								{selectedNode.id === 'net_cash_flow' && (
									<>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>MMF Sweep Trigger (Ceiling)</span>
												<span className="text-cyan-400 font-bold">{formatCurrency(selectedNode.ceiling)}</span>
											</div>
											<input
												type="range"
												min="50000"
												max="500000"
												step="10000"
												value={selectedNode.ceiling}
												onChange={(e) => handleSliderChange('ceiling', parseFloat(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<div className="flex justify-between text-xs font-mono text-slate-400">
												<span>Safety Buffers (Floor)</span>
												<span className="text-emerald-400 font-bold">{formatCurrency(selectedNode.floor)}</span>
											</div>
											<input
												type="range"
												min="10000"
												max="100000"
												step="5000"
												value={selectedNode.floor}
												onChange={(e) => handleSliderChange('floor', parseFloat(e.target.value))}
												className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
											/>
										</div>
									</>
								)}

								{/* 6. MMF interest rate settings */}
								{selectedNode.id === 'mfs' && (
									<div className="flex flex-col gap-2">
										<div className="flex justify-between text-xs font-mono text-slate-400">
											<span>MMF Yield Rate (% APY)</span>
											<span className="text-emerald-400 font-bold">{selectedNode.interestRate || 4.2}%</span>
										</div>
										<input
											type="range"
											min="1.0"
											max="7.0"
											step="0.1"
											value={selectedNode.interestRate || 4.2}
											onChange={(e) => handleSliderChange('interestRate', parseFloat(e.target.value))}
											className="w-full h-6 bg-transparent appearance-none cursor-pointer focus:outline-none"
										/>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
