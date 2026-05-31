import React, { useState, useEffect, useRef } from 'react';
import type { 
	SimulationState, 
	AccountNode
} from '../../../lib/calculators/moneyFlowEngine';
import { 
	createDefaultNodes, 
	stepSimulation, 
	hasCircularDependency 
} from '../../../lib/calculators/moneyFlowEngine';
import MoneyFlowCanvas from './MoneyFlowCanvas';
import TerminalPanel from './TerminalPanel';
import { formatCurrency } from '../../../lib/calculators/format';

const INITIAL_STATE: SimulationState = {
	day: 0,
	nodes: createDefaultNodes(),
	edges: [
		{ id: 'flow-1', source: 'checking', target: 'hysa', amount: 1500, type: 'fixed' },
		{ id: 'flow-2', source: 'checking', target: 'match401k', amount: 500, type: 'percent' }
	],
	holdings: [],
	totalWealthAccumulated: 24000, // Sum of initial assets minus debt
	log: ['System initialized. Waiting for simulation triggers.']
};

export default function MoneyFlowSimulator() {
	const [state, setState] = useState<SimulationState>(INITIAL_STATE);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [speedMs, setSpeedMs] = useState(400); // simulation interval time
	const [dailyIncome, setDailyIncome] = useState(250);
	
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Reset to defaults
	const handleReset = () => {
		setIsRunning(false);
		setState(INITIAL_STATE);
		setSelectedNodeId(null);
	};

	// Start / Pause simulator clock
	useEffect(() => {
		if (isRunning) {
			timerRef.current = setInterval(() => {
				setState((current) => stepSimulation(current, dailyIncome));
			}, speedMs);
		} else {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		};
	}, [isRunning, speedMs, dailyIncome]);

	// Single step trigger
	const handleStep = () => {
		setState((current) => stepSimulation(current, dailyIncome));
	};

	// Update node settings via slider
	const handleNodeUpdate = (updatedNode: AccountNode) => {
		console.log('handleNodeUpdate called with:', updatedNode);
		setState((current) => {
			const updated = {
				...current,
				nodes: current.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
			};
			console.log('New state nodes:', updated.nodes);
			return updated;
		});
	};

	// Process terminal input
	const handleCommand = (cmd: string): { output: string; success: boolean } => {
		const parts = cmd.trim().split(/\s+/);
		const baseCommand = parts[0].toLowerCase();

		// Short syntax matcher: Checking [1500] HSA
		const shortSyntaxMatch = cmd.match(/^(\w+)\s*\[(\d+)\]\s*(\w+)$/i);
		if (shortSyntaxMatch) {
			const source = shortSyntaxMatch[1].toLowerCase();
			const amount = parseFloat(shortSyntaxMatch[2]);
			const target = shortSyntaxMatch[3].toLowerCase();

			// Validate nodes
			const sourceNode = state.nodes.find((n) => n.id === source);
			const targetNode = state.nodes.find((n) => n.id === target);

			if (!sourceNode || !targetNode) {
				return { 
					output: `Error: Source "${source}" or Target "${target}" does not match a valid account ID.`, 
					success: false 
				};
			}

			// Validate circular logic
			if (hasCircularDependency(state.edges, source, target)) {
				return {
					output: `Circular dependency detected: routing funds between ${sourceNode.name} and ${targetNode.name} forms an infinite loop! Action blocked.`,
					success: false
				};
			}

			// Add flow connection
			const nextEdges = [
				...state.edges.filter((e) => !(e.source === source && e.target === target)),
				{ 
					id: `flow-${Date.now()}`, 
					source, 
					target, 
					amount, 
					type: 'fixed' as const 
				}
			];

			setState((curr) => ({ ...curr, edges: nextEdges }));
			return {
				output: `Success: Routed automated sweep of $${amount} from ${sourceNode.name} -> ${targetNode.name}.`,
				success: true
			};
		}

		if (baseCommand === 'help') {
			return {
				output: `Available Commands:
1. Short Syntax: Source [Amount] Target (e.g. "checking [3000] hysa")
2. set [node] [balance|ceiling|floor] [value] (e.g. "set checking ceiling 6000")
3. reset - Returns accounts to initial settings.
4. clear - Clear terminal lines.`,
				success: true
			};
		}

		if (baseCommand === 'reset') {
			handleReset();
			return { output: 'System reset to default configurations.', success: true };
		}

		if (baseCommand === 'set') {
			if (parts.length < 4) {
				return { output: 'Syntax: set [node] [balance|ceiling|floor] [value]', success: false };
			}
			const nodeId = parts[1].toLowerCase();
			const field = parts[2].toLowerCase();
			const value = parseFloat(parts[3]);

			if (isNaN(value)) {
				return { output: `Error: "${parts[3]}" is not a valid number.`, success: false };
			}

			const targetNode = state.nodes.find((n) => n.id === nodeId);
			if (!targetNode) {
				return { output: `Error: Account "${nodeId}" not found.`, success: false };
			}

			if (field !== 'balance' && field !== 'ceiling' && field !== 'floor') {
				return { output: `Error: Field must be balance, ceiling, or floor.`, success: false };
			}

			setState((curr) => ({
				...curr,
				nodes: curr.nodes.map((n) => (n.id === nodeId ? { ...n, [field]: value } : n))
			}));

			return {
				output: `Updated ${targetNode.name} ${field} to ${formatCurrency(value)}.`,
				success: true
			};
		}

		return {
			output: `Command not recognized: "${cmd}". Type "help" for syntax rules.`,
			success: false
		};
	};

	return (
		<div className="grid gap-6">
			{/* Main Simulator Dashboard */}
			<div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-md">
				<div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-400">Simulation Engine</p>
						<h2 className="mt-3 text-3xl font-bold tracking-tight text-white">System Flow Control</h2>
					</div>
					
					{/* Status Stats */}
					<div className="flex flex-wrap gap-6 text-left">
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Day count</span>
							<span className="block text-xl font-bold font-mono text-white mt-1">{state.day} days</span>
						</div>
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-5 py-3">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Wealth projection</span>
							<span className="block text-xl font-bold font-mono text-emerald-400 mt-1">
								{formatCurrency(state.totalWealthAccumulated)}
							</span>
						</div>
					</div>
				</div>

				{/* Simulation Controls Panel */}
				<div className="flex flex-wrap items-center justify-between gap-6 py-5">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsRunning(!isRunning)}
							className={[
								'py-2 px-5 rounded-full text-xs font-mono uppercase tracking-wider transition font-bold select-none border cursor-pointer',
								isRunning
									? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
									: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
							].join(' ')}
						>
							{isRunning ? 'Pause clock' : 'Start clock'}
						</button>
						<button
							onClick={handleStep}
							disabled={isRunning}
							className="py-2 px-4 rounded-full text-xs font-mono uppercase tracking-wider border border-slate-700 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
						>
							Step 1 day
						</button>
						<button
							onClick={handleReset}
							className="py-2 px-4 rounded-full text-xs font-mono uppercase tracking-wider border border-slate-800 hover:bg-slate-900 text-slate-400 cursor-pointer"
						>
							Reset
						</button>
					</div>

					<div className="flex items-center gap-6">
						{/* Daily speed settings */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Speed:</span>
							<select
								value={speedMs}
								onChange={(e) => setSpeedMs(parseInt(e.target.value))}
								className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-xs outline-none"
							>
								<option value="800">1x (Slow)</option>
								<option value="400">2x (Normal)</option>
								<option value="150">5x (Fast)</option>
							</select>
						</div>

						{/* Daily savings factor */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Income/day:</span>
							<input
								type="number"
								min="0"
								step="10"
								value={dailyIncome}
								onChange={(e) => setDailyIncome(parseFloat(e.target.value) || 0)}
								className="w-16 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs outline-none font-mono"
							/>
						</div>
					</div>
				</div>

				{/* Canvas */}
				<MoneyFlowCanvas
					nodes={state.nodes}
					edges={state.edges}
					selectedNodeId={selectedNodeId}
					setSelectedNodeId={setSelectedNodeId}
					onNodeUpdate={handleNodeUpdate}
				/>
			</div>

			{/* Terminal and Logs bottom panel */}
			<div className="grid gap-6 md:grid-cols-2">
				<TerminalPanel onCommand={handleCommand} />
				
				{/* Audit Engine log panel */}
				<div className="flex flex-col h-[320px] rounded-2xl border border-slate-800 bg-slate-950/90 font-mono text-xs shadow-2xl overflow-hidden">
					<div className="h-9 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between">
						<div className="flex items-center gap-1.5">
							<span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
							<span className="font-semibold text-slate-400 text-[10px] tracking-wider uppercase">System_Audit_Log</span>
						</div>
						<span className="text-[9px] text-slate-500">WATERFALL ROUTER</span>
					</div>
					<div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
						{state.log.map((line, idx) => (
							<div key={idx} className="text-slate-400 leading-relaxed">
								&gt; {line}
							</div>
						))}
						{state.log.length === 0 && (
							<div className="text-slate-600 italic">No events logged yet. Start simulation.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
