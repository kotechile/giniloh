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
import { parseNaturalLanguage } from '../../../lib/calculators/llmParser';
import { 
	createDefaultRules, 
	evaluateCondition, 
	type ScriptRule 
} from '../../../lib/calculators/scriptingEngine';
import MoneyFlowCanvas from './MoneyFlowCanvas';
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
	log: ['System initialized. Waiting for simulation triggers.'],
	transferHistory: [],
	pdtTradesToday: 0,
	macroScenario: 'baseline',
	macroHistory: [{ day: 0, inflationRate: 2.0, marketReturn: 1.0, marketIndexValue: 5000, eventLabel: 'Initial Setup' }],
	isPaused: false,
	checklistCompleted: false,
	checklistProgress: 0
};

const EMOTIONAL_QUESTIONS = [
	"Do you feel the impulse to sell your assets right now to avoid further losses?",
	"Are you aware that market contractions are historically followed by recovery periods?",
	"Is your emergency fund currently capable of covering 6 months of expenses?",
	"Do you agree that panic-selling locks in paper losses into permanent realized losses?",
	"Rate your current emotional heart rate/anxiety from 1 (completely calm) to 10 (panic).",
	"Will you promise to wait at least 24 hours before making any major liquidation decisions?"
];

export default function MoneyFlowSimulator() {
	const [state, setState] = useState<SimulationState>(INITIAL_STATE);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [speedMs, setSpeedMs] = useState(400); // simulation interval time
	const [dailyIncome, setDailyIncome] = useState(250);
	
	// Natural Language Chat State
	const [chatInput, setChatInput] = useState('');
	const [chatHistory, setChatHistory] = useState<Array<{ text: string; sender: 'user' | 'assistant' | 'system' }>>([
		{ text: "Welcome! I'm your AI Cash Flow Assistant. Tell me how you'd like to structure your cash routing (e.g., 'sweep $800 from checking to Roth IRA' or 'set checking floor to 2000').", sender: 'assistant' }
	]);
	const [isPendingAI, setIsPendingAI] = useState(false);

	// Scripting Rules State
	const [rules, setRules] = useState<ScriptRule[]>(createDefaultRules());

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Reset to defaults
	const handleReset = () => {
		setIsRunning(false);
		setState(INITIAL_STATE);
		setSelectedNodeId(null);
		setChatHistory([
			{ text: "System reset to defaults. How can I assist you with your cash flows today?", sender: 'assistant' }
		]);
	};

	// Start / Pause simulator clock
	useEffect(() => {
		if (isRunning && !state.isPaused) {
			timerRef.current = setInterval(() => {
				setState((current) => {
					if (current.isPaused) return current;
					let next = stepSimulation(current, dailyIncome);

					// Evaluate dynamic script rules
					rules.forEach((rule) => {
						if (rule.isActive && evaluateCondition(rule.conditionStr, next)) {
							// Trigger command action
							const result = executeRawCommand(rule.actionStr, next);
							if (result.success) {
								next = result.nextState;
								next.log.push(`[Rule Triggered] "${rule.name}" condition met. Action executed: ${rule.actionStr}`);
							}
						}
					});

					return next;
				});
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
	}, [isRunning, speedMs, dailyIncome, rules, state.isPaused]);

	// Single step trigger
	const handleStep = () => {
		setState((current) => {
			let next = stepSimulation(current, dailyIncome);
			
			// Evaluate dynamic script rules
			rules.forEach((rule) => {
				if (rule.isActive && evaluateCondition(rule.conditionStr, next)) {
					const result = executeRawCommand(rule.actionStr, next);
					if (result.success) {
						next = result.nextState;
						next.log.push(`[Rule Triggered] "${rule.name}" condition met. Action executed: ${rule.actionStr}`);
					}
				}
			});

			return next;
		});
	};

	// Update node settings via slider
	const handleNodeUpdate = (updatedNode: AccountNode) => {
		setState((current) => ({
			...current,
			nodes: current.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
		}));
	};

	// Helper to execute commands on a target state block
	const executeRawCommand = (cmd: string, targetState: SimulationState): { success: boolean; nextState: SimulationState; output: string } => {
		const parts = cmd.trim().split(/\s+/);
		const baseCommand = parts[0].toLowerCase();

		// Short syntax matcher: Checking [1500] HSA
		const shortSyntaxMatch = cmd.match(/^(\w+)\s*\[(\d+)\]\s*(\w+)$/i);
		if (shortSyntaxMatch) {
			const source = shortSyntaxMatch[1].toLowerCase();
			const amount = parseFloat(shortSyntaxMatch[2]);
			const target = shortSyntaxMatch[3].toLowerCase();

			const sourceNode = targetState.nodes.find((n) => n.id === source);
			const targetNode = targetState.nodes.find((n) => n.id === target);

			if (!sourceNode || !targetNode) {
				return { 
					success: false, 
					nextState: targetState, 
					output: `Error: Source "${source}" or Target "${target}" does not match a valid account ID.` 
				};
			}

			if (hasCircularDependency(targetState.edges, source, target)) {
				return {
					success: false,
					nextState: targetState,
					output: `Circular dependency detected: routing funds between ${sourceNode.name} and ${targetNode.name} forms an infinite loop! Action blocked.`
				};
			}

			const nextEdges = [
				...targetState.edges.filter((e) => !(e.source === source && e.target === target)),
				{ 
					id: `flow-${Date.now()}`, 
					source, 
					target, 
					amount, 
					type: 'fixed' as const 
				}
			];

			return {
				success: true,
				nextState: { ...targetState, edges: nextEdges },
				output: `Routed automated sweep of $${amount} from ${sourceNode.name} -> ${targetNode.name}.`
			};
		}

		if (baseCommand === 'set') {
			if (parts.length < 4) {
				return { success: false, nextState: targetState, output: 'Syntax: set [node] [balance|ceiling|floor] [value]' };
			}
			const nodeId = parts[1].toLowerCase();
			const field = parts[2].toLowerCase();
			const value = parseFloat(parts[3]);

			if (isNaN(value)) {
				return { success: false, nextState: targetState, output: `Error: "${parts[3]}" is not a valid number.` };
			}

			const node = targetState.nodes.find((n) => n.id === nodeId);
			if (!node) {
				return { success: false, nextState: targetState, output: `Error: Account "${nodeId}" not found.` };
			}

			if (field !== 'balance' && field !== 'ceiling' && field !== 'floor') {
				return { success: false, nextState: targetState, output: `Error: Field must be balance, ceiling, or floor.` };
			}

			return {
				success: true,
				nextState: {
					...targetState,
					nodes: targetState.nodes.map((n) => (n.id === nodeId ? { ...n, [field]: value } : n))
				},
				output: `Updated ${node.name} ${field} to ${formatCurrency(value)}.`
			};
		}

		return { success: false, nextState: targetState, output: `Command not recognized: "${cmd}".` };
	};

	// Process Natural Language Chat Submission
	const handleChatSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = chatInput.trim();
		if (!trimmed) return;

		setChatHistory(prev => [...prev, { text: trimmed, sender: 'user' }]);
		setChatInput('');
		setIsPendingAI(true);

		try {
			const { command, explanation } = await parseNaturalLanguage(trimmed);
			
			if (command === 'help') {
				setChatHistory(prev => [...prev, { text: explanation, sender: 'assistant' }]);
			} else if (command === 'reset') {
				handleReset();
			} else if (command === 'clear') {
				setChatHistory([]);
			} else {
				// Execute translated command
				setState(current => {
					const result = executeRawCommand(command, current);
					setChatHistory(prev => [...prev, { 
						text: `${explanation}\n\nResult: ${result.output}`, 
						sender: result.success ? 'assistant' : 'system' 
					}]);
					return result.success ? result.nextState : current;
				});
			}
		} catch (err) {
			setChatHistory(prev => [...prev, { text: "Error connecting to natural language parser.", sender: 'system' }]);
		} finally {
			setIsPendingAI(false);
		}
	};

	// Scenario Selector update
	const handleScenarioChange = (scenario: 'baseline' | 'inflation' | 'crash') => {
		setIsRunning(false);
		setState(prev => ({
			...prev,
			macroScenario: scenario,
			day: 0,
			nodes: createDefaultNodes(),
			macroHistory: [{ day: 0, inflationRate: scenario === 'inflation' ? 8.5 : 2.0, marketReturn: 1.0, marketIndexValue: 5000, eventLabel: 'Backtest Setup' }],
			isPaused: false,
			checklistCompleted: false,
			checklistProgress: 0,
			log: [`Backtest reset to ${scenario.toUpperCase()} scenario.`]
		}));
		setChatHistory([
			{ text: `Backtest scenario changed to ${scenario.toUpperCase()}. Click 'Start clock' to observe macro effects.`, sender: 'assistant' }
		]);
	};

	// Emotional centering progression
	const handleChecklistNext = () => {
		setState(prev => {
			const nextProgress = prev.checklistProgress + 1;
			const isDone = nextProgress >= EMOTIONAL_QUESTIONS.length;
			return {
				...prev,
				checklistProgress: nextProgress,
				checklistCompleted: isDone,
				isPaused: !isDone,
				log: isDone 
					? [...prev.log, "Emotional centering exercise complete. Simulation unblocked."]
					: prev.log
			};
		});
	};

	const currentSAndP = state.macroHistory.length > 0
		? state.macroHistory[state.macroHistory.length - 1].marketIndexValue
		: 5000;
	const currentInflation = state.macroHistory.length > 0
		? state.macroHistory[state.macroHistory.length - 1].inflationRate
		: 2.0;

	return (
		<div className="grid gap-6 relative">
			{/* Ardal Loh-Gronager Safeguard Overlay */}
			{state.isPaused && !state.checklistCompleted && state.macroScenario === 'crash' && (
				<div className="absolute inset-0 bg-slate-950/90 z-50 rounded-[2rem] flex flex-col items-center justify-center p-8 backdrop-blur-lg animate-[fadeIn_0.3s_ease-out]">
					<div className="max-w-xl w-full bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
						<div className="flex items-center gap-3 border-b border-slate-800 pb-4">
							<span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
							<h3 className="text-xl font-bold text-white tracking-tight">Safeguard Active: Behavioral Intervention</h3>
						</div>
						<p className="text-sm text-slate-300 leading-relaxed">
							The macro backtest has encountered a severe market drop (&gt;10%). To avoid panic-driven portfolio liquidation, you must complete the Ardal Loh-Gronager emotional centering assessment.
						</p>

						{/* Question wizard */}
						{state.checklistProgress < EMOTIONAL_QUESTIONS.length ? (
							<div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col gap-4">
								<div className="flex justify-between text-xs font-mono text-slate-500">
									<span>EXERCISE {state.checklistProgress + 1} OF {EMOTIONAL_QUESTIONS.length}</span>
									<span>{Math.round(((state.checklistProgress) / EMOTIONAL_QUESTIONS.length) * 100)}%</span>
								</div>
								<p className="text-sm text-white font-medium">{EMOTIONAL_QUESTIONS[state.checklistProgress]}</p>
								<div className="flex gap-3 mt-2">
									<button 
										onClick={handleChecklistNext}
										className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs rounded-xl transition cursor-pointer"
									>
										Acknowledge & Proceed
									</button>
								</div>
							</div>
						) : (
							<p className="text-emerald-400 text-sm font-mono">Checklist complete. Ready to resume.</p>
						)}
					</div>
				</div>
			)}

			{/* Main Simulator Dashboard */}
			<div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-md">
				<div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-400">High-Fidelity Backtesting & AI Engine</p>
						<h2 className="mt-3 text-3xl font-bold tracking-tight text-white">System Flow Control</h2>
					</div>
					
					{/* Status Stats */}
					<div className="flex flex-wrap gap-4 text-left">
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Macro Feed</span>
							<span className="block text-sm font-bold font-mono text-white mt-1">S&P 500: {currentSAndP.toFixed(2)}</span>
						</div>
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Inflation</span>
							<span className="block text-sm font-bold font-mono text-red-400 mt-1">{currentInflation.toFixed(1)}%</span>
						</div>
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Day count</span>
							<span className="block text-sm font-bold font-mono text-white mt-1">{state.day} days</span>
						</div>
						<div className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Wealth projection</span>
							<span className="block text-sm font-bold font-mono text-emerald-400 mt-1">
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
							disabled={state.isPaused}
							className={[
								'py-2 px-5 rounded-full text-xs font-mono uppercase tracking-wider transition font-bold select-none border cursor-pointer disabled:opacity-30',
								isRunning
									? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25'
									: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
							].join(' ')}
						>
							{isRunning ? 'Pause clock' : 'Start clock'}
						</button>
						<button
							onClick={handleStep}
							disabled={isRunning || state.isPaused}
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

					<div className="flex flex-wrap items-center gap-6">
						{/* Backtest Scenarios */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Backtest:</span>
							<select
								value={state.macroScenario}
								onChange={(e) => handleScenarioChange(e.target.value as any)}
								className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1 text-xs outline-none"
							>
								<option value="baseline">Baseline (Steady Growth)</option>
								<option value="inflation">Stagflation Regime (High Rates)</option>
								<option value="crash">Market Contraction (2008 Crash)</option>
							</select>
						</div>

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

			{/* AI Chat & Scripting bottom panel */}
			<div className="grid gap-6 md:grid-cols-3">
				{/* AI Conversational Assistant */}
				<div className="flex flex-col h-[350px] rounded-2xl border border-slate-800 bg-slate-950/90 font-mono text-xs shadow-2xl overflow-hidden md:col-span-2">
					<div className="h-9 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between">
						<div className="flex items-center gap-1.5">
							<span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
							<span className="font-semibold text-slate-400 text-[10px] tracking-wider uppercase">AI_Orchestration_Chat</span>
						</div>
						<span className="text-[9px] text-slate-500">LOW-COST LLM WRAPPER</span>
					</div>
					
					{/* Message Logs */}
					<div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
						{chatHistory.map((chat, idx) => {
							const isUser = chat.sender === 'user';
							const isSystem = chat.sender === 'system';
							return (
								<div 
									key={idx} 
									className={[
										'p-3 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-wrap',
										isUser 
											? 'ml-auto bg-cyan-950/40 border border-cyan-800/40 text-cyan-200' 
											: isSystem 
												? 'bg-red-950/40 border border-red-900/40 text-red-300' 
												: 'bg-slate-900/60 border border-slate-800 text-slate-300'
									].join(' ')}
								>
									{chat.text}
								</div>
							);
						})}
						{isPendingAI && (
							<div className="text-slate-500 italic animate-pulse">Assistant is translating prompt...</div>
						)}
					</div>

					<form onSubmit={handleChatSubmit} className="border-t border-slate-800 bg-slate-900/40 p-3 flex gap-2">
						<input
							type="text"
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							placeholder="Tell the AI what to do (e.g. 'Route $600 from checking to Roth IRA')..."
							className="flex-1 bg-transparent text-slate-200 border-none outline-none focus:ring-0 p-0 text-xs placeholder:text-slate-600 font-mono"
						/>
						<button type="submit" className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer">
							Send
						</button>
					</form>
				</div>

				{/* Scripting Rules & Audit Logs */}
				<div className="flex flex-col h-[350px] rounded-2xl border border-slate-800 bg-slate-950/90 font-mono text-xs shadow-2xl overflow-hidden">
					<div className="h-9 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between">
						<span className="font-semibold text-slate-400 text-[10px] tracking-wider uppercase">Market_Scripting_Rules</span>
						<span className="text-[9px] text-slate-500">CONDITIONAL RUNNER</span>
					</div>
					
					<div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
						<div className="space-y-3">
							{rules.map((rule) => (
								<div key={rule.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-2">
									<div className="flex-1">
										<p className="font-bold text-slate-200 text-xs">{rule.name}</p>
										<p className="text-[10px] text-slate-400 mt-1 leading-normal">{rule.description}</p>
										<div className="mt-2 flex gap-2 text-[9px] font-mono">
											<span className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400">IF: {rule.conditionStr}</span>
											<span className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400">THEN: {rule.actionStr}</span>
										</div>
									</div>
									<button 
										onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
										className={[
											'px-2 py-1 rounded text-[9px] font-mono cursor-pointer uppercase transition font-bold',
											rule.isActive 
												? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
												: 'bg-slate-800 text-slate-500 border border-slate-700'
										].join(' ')}
									>
										{rule.isActive ? 'Active' : 'Disabled'}
									</button>
								</div>
							))}
						</div>

						{/* Mini Log section */}
						<div className="border-t border-slate-800/80 pt-3">
							<p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Audit Trails</p>
							<div className="space-y-1 max-h-[100px] overflow-y-auto text-[10px] leading-relaxed text-slate-400">
								{state.log.slice(-10).map((line, idx) => (
									<div key={idx} className="truncate">&gt; {line}</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
