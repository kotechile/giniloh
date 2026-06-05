// Dual-Mode Wealth & Treasury Orchestrator - Force Fresh Rebuild
import React, { useState, useEffect, useRef } from 'react';
import type { 
	SimulationState, 
	AccountNode
} from '../../../lib/calculators/moneyFlowEngine';
import { 
	createDefaultNodes, 
	createDefaultEnterpriseNodes,
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
	checklistProgress: 0,
	mode: 'personal'
};

const INITIAL_ENTERPRISE_STATE: SimulationState = {
	day: 0,
	nodes: createDefaultEnterpriseNodes(),
	edges: [
		{ id: 'flow-e1', source: 'revenues', target: 'receivables', amount: 100, type: 'percent' },
		{ id: 'flow-e2', source: 'payables', target: 'net_cash_flow', amount: 100, type: 'percent' },
		{ id: 'flow-e3', source: 'net_cash_flow', target: 'mfs', amount: 100, type: 'percent' }
	],
	holdings: [],
	totalWealthAccumulated: 415000, // Net assets: net cash + MMF + receivables - payables - debt
	log: ['Corporate Treasury initialized. Waiting for revenue projections.'],
	transferHistory: [],
	pdtTradesToday: 0,
	macroScenario: 'baseline',
	macroHistory: [{ day: 0, inflationRate: 2.0, marketReturn: 1.0, marketIndexValue: 5000, eventLabel: 'Initial Corporate Setup' }],
	isPaused: false,
	checklistCompleted: false,
	checklistProgress: 0,
	mode: 'enterprise'
};

const EMOTIONAL_QUESTIONS = [
	"Do you feel the impulse to sell your assets right now to avoid further losses?",
	"Are you aware that market contractions are historically followed by recovery periods?",
	"Is your emergency fund currently capable of covering 6 months of expenses?",
	"Do you agree that panic-selling locks in paper losses into permanent realized losses?",
	"Rate your current emotional heart rate/anxiety from 1 (completely calm) to 10 (panic).",
	"Will you promise to wait at least 24 hours before making any major liquidation decisions?"
];

// Helper to fast-forward simulate projections
function projectFutureLiquidity(currentState: SimulationState, days: number, dailyInc: number): { netCash: number; MMF: number; receivables: number; payables: number; financing: number; total: number } {
	let tempState = { ...currentState, isPaused: false };
	for (let d = 0; d < days; d++) {
		tempState = stepSimulation(tempState, dailyInc);
	}
	const netCash = tempState.nodes.find(n => n.id === 'net_cash_flow')?.balance || 0;
	const MMF = tempState.nodes.find(n => n.id === 'mfs')?.balance || 0;
	const receivables = tempState.nodes.find(n => n.id === 'receivables')?.balance || 0;
	const payables = tempState.nodes.find(n => n.id === 'payables')?.balance || 0;
	const financing = tempState.nodes.find(n => n.id === 'financing')?.balance || 0;
	return {
		netCash,
		MMF,
		receivables,
		payables,
		financing,
		total: netCash + MMF + receivables - payables - financing
	};
}

export default function MoneyFlowSimulator() {
	const [state, setState] = useState<SimulationState>(INITIAL_STATE);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [speedMs, setSpeedMs] = useState(400); // simulation interval time
	const [dailyIncome, setDailyIncome] = useState(250); // custom income slider
	
	// Natural Language Chat State
	const [chatInput, setChatInput] = useState('');
	const [chatHistory, setChatHistory] = useState<Array<{ text: string; sender: 'user' | 'assistant' | 'system' }>>([
		{ text: "Welcome! I'm your AI Cash Flow Assistant. Tell me how you'd like to structure your cash routing (e.g., 'sweep $800 from checking to Roth IRA' or 'set checking floor to 2000').", sender: 'assistant' }
	]);
	const [isPendingAI, setIsPendingAI] = useState(false);

	// Parallel Scenario states for Enterprise comparisons
	const [enterpriseScenarios, setEnterpriseScenarios] = useState<Record<string, SimulationState>>({
		baseline: INITIAL_ENTERPRISE_STATE,
		inflation: { ...INITIAL_ENTERPRISE_STATE, macroScenario: 'inflation' },
		supply_delay: { ...INITIAL_ENTERPRISE_STATE, macroScenario: 'supply_delay' }
	});

	// Scripting Rules State
	const [rules, setRules] = useState<ScriptRule[]>(createDefaultRules);

	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// Reset to defaults based on current active mode
	const handleReset = (targetMode?: 'personal' | 'enterprise') => {
		setIsRunning(false);
		const activeMode = targetMode || state.mode;
		setSelectedNodeId(null);
		
		if (activeMode === 'personal') {
			setState(INITIAL_STATE);
			setChatHistory([
				{ text: "System reset to Personal Wealth Defaults. How can I assist you with your cash flows today?", sender: 'assistant' }
			]);
		} else {
			setState(INITIAL_ENTERPRISE_STATE);
			setEnterpriseScenarios({
				baseline: INITIAL_ENTERPRISE_STATE,
				inflation: { ...INITIAL_ENTERPRISE_STATE, macroScenario: 'inflation' },
				supply_delay: { ...INITIAL_ENTERPRISE_STATE, macroScenario: 'supply_delay' }
			});
			setChatHistory([
				{ text: "System reset to Enterprise CFO Room Defaults. How can I assist you with corporate treasury forecasting?", sender: 'assistant' }
			]);
		}
	};

	// Switch Mode Handler
	const handleModeSwitch = (newMode: 'personal' | 'enterprise') => {
		if (newMode === state.mode) return;
		handleReset(newMode);
	};

	// Synchronized simulation clock step
	useEffect(() => {
		if (isRunning && !state.isPaused) {
			timerRef.current = setInterval(() => {
				// Step Active Main State
				setState((current) => {
					if (current.isPaused) return current;
					let next = stepSimulation(current, dailyIncome);

					// Evaluate dynamic script rules
					rules.forEach((rule) => {
						if (rule.isActive && evaluateCondition(rule.conditionStr, next)) {
							const result = executeRawCommand(rule.actionStr, next);
							if (result.success) {
								next = result.nextState;
								next.log.push(`[Rule Triggered] "${rule.name}" met. Action: ${rule.actionStr}`);
							}
						}
					});

					return next;
				});

				// Step Enterprise Parallel Scenarios
				if (state.mode === 'enterprise') {
					setEnterpriseScenarios((prev) => ({
						baseline: stepSimulation(prev.baseline, dailyIncome),
						inflation: { ...stepSimulation(prev.inflation, dailyIncome), macroScenario: 'inflation' },
						supply_delay: { ...stepSimulation(prev.supply_delay, dailyIncome), macroScenario: 'supply_delay' }
					}));
				}

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
	}, [isRunning, speedMs, dailyIncome, rules, state.isPaused, state.mode]);

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
						next.log.push(`[Rule Triggered] "${rule.name}" met. Action: ${rule.actionStr}`);
					}
				}
			});

			return next;
		});

		if (state.mode === 'enterprise') {
			setEnterpriseScenarios((prev) => ({
				baseline: stepSimulation(prev.baseline, dailyIncome),
				inflation: { ...stepSimulation(prev.inflation, dailyIncome), macroScenario: 'inflation' },
				supply_delay: { ...stepSimulation(prev.supply_delay, dailyIncome), macroScenario: 'supply_delay' }
			}));
		}
	};

	// Update node settings via slider
	const handleNodeUpdate = (updatedNode: AccountNode) => {
		setState((current) => ({
			...current,
			nodes: current.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
		}));
		
		// Sync sliders configurations to all comparison tracks in enterprise mode
		if (state.mode === 'enterprise') {
			setEnterpriseScenarios((prev) => {
				const sync = (s: SimulationState) => ({
					...s,
					nodes: s.nodes.map((n) => (n.id === updatedNode.id ? { ...n, balance: updatedNode.balance, ceiling: updatedNode.ceiling, floor: updatedNode.floor, interestRate: updatedNode.interestRate, dso: updatedNode.dso, insolvencyRisk: updatedNode.insolvencyRisk, dpoVariable: updatedNode.dpoVariable, dpoFixed: updatedNode.dpoFixed, vatRate: updatedNode.vatRate, factoringRate: updatedNode.factoringRate, fixedSpread: updatedNode.fixedSpread, variableRateIndex: updatedNode.variableRateIndex, loanType: updatedNode.loanType, loanLifetime: updatedNode.loanLifetime } : n))
				});
				return {
					baseline: sync(prev.baseline),
					inflation: sync(prev.inflation),
					supply_delay: sync(prev.supply_delay)
				};
			});
		}
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
				return { success: false, nextState: targetState, output: 'Syntax: set [node] [balance|ceiling|floor|dso|dpoVariable|dpoFixed|fixedSpread] [value]' };
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

			const validFields = ['balance', 'ceiling', 'floor', 'dso', 'dpovariable', 'dpofixed', 'fixedspread'];
			if (!validFields.includes(field)) {
				return { success: false, nextState: targetState, output: `Error: Field must be balance, ceiling, floor, dso, dpoVariable, dpoFixed, or fixedSpread.` };
			}

			let normalizedField = field;
			if (field === 'dpovariable') normalizedField = 'dpoVariable';
			if (field === 'dpofixed') normalizedField = 'dpoFixed';
			if (field === 'fixedspread') normalizedField = 'fixedSpread';

			return {
				success: true,
				nextState: {
					...targetState,
					nodes: targetState.nodes.map((n) => (n.id === nodeId ? { ...n, [normalizedField]: value } : n))
				},
				output: `Updated ${node.name} ${field} to ${value}.`
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

	// Scenario Selector update for Main simulation view
	const handleScenarioChange = (scenario: 'baseline' | 'inflation' | 'crash' | 'supply_delay') => {
		setIsRunning(false);
		
		const isEnterprise = state.mode === 'enterprise';
		const baseNodes = isEnterprise ? createDefaultEnterpriseNodes() : createDefaultNodes();
		
		setState(prev => ({
			...prev,
			macroScenario: scenario,
			day: 0,
			nodes: baseNodes,
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

	// Promo Scenario Application Handler
	const applyScenarioForecast = (scKey: string) => {
		const targetSc = enterpriseScenarios[scKey];
		if (!targetSc) return;
		setState({
			...targetSc,
			macroScenario: scKey as any
		});
		setChatHistory(prev => [...prev, { text: `Approved and merged ${scKey.toUpperCase()} scenario forecast as the Official Corporate Plan.`, sender: 'assistant' }]);
	};

	const currentSAndP = state.macroHistory.length > 0
		? state.macroHistory[state.macroHistory.length - 1].marketIndexValue
		: 5000;
	const currentInflation = state.macroHistory.length > 0
		? state.macroHistory[state.macroHistory.length - 1].inflationRate
		: 2.0;

	// Bottom-up projections computation
	const isEnterprise = state.mode === 'enterprise';
	const monthProj = isEnterprise ? projectFutureLiquidity(state, 30, dailyIncome) : null;
	const yearProj = isEnterprise ? projectFutureLiquidity(state, 365, dailyIncome) : null;

	const getProjectionGrid = () => {
		if (!isEnterprise || !monthProj || !yearProj) return [];
		
		const receivables = state.nodes.find(n => n.id === 'receivables')?.balance || 0;
		const payables = state.nodes.find(n => n.id === 'payables')?.balance || 0;
		const netCash = state.nodes.find(n => n.id === 'net_cash_flow')?.balance || 0;
		const mmf = state.nodes.find(n => n.id === 'mfs')?.balance || 0;
		const financing = state.nodes.find(n => n.id === 'financing')?.balance || 0;

		return [
			{ name: 'Receivables Outstanding', cur: receivables, month: monthProj.receivables, year: yearProj.receivables, type: 'asset' },
			{ name: 'Money Market Funds', cur: mmf, month: monthProj.MMF, year: yearProj.MMF, type: 'asset' },
			{ name: 'Primary Cash buffer', cur: netCash, month: monthProj.netCash, year: yearProj.netCash, type: 'asset' },
			{ name: 'Payables Accrued', cur: payables, month: monthProj.payables, year: yearProj.payables, type: 'liability' },
			{ name: '战略Strategic Debt (Credit Line)', cur: financing, month: monthProj.financing, year: yearProj.financing, type: 'liability' },
			{ name: 'Total Net Position', cur: netCash + mmf + receivables - payables - financing, month: monthProj.total, year: yearProj.total, type: 'net' }
		];
	};

	const liquidityRows = getProjectionGrid();

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

			{/* Mode Toggles Header Section */}
			<div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
				<div className="flex gap-2">
					<button
						onClick={() => handleModeSwitch('personal')}
						className={[
							'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition duration-200 cursor-pointer',
							state.mode === 'personal'
								? 'bg-slate-800 text-white dark:bg-slate-700'
								: 'bg-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
						].join(' ')}
					>
						👤 Personal Wealth Orchestrator
					</button>
					<button
						onClick={() => handleModeSwitch('enterprise')}
						className={[
							'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition duration-200 cursor-pointer',
							state.mode === 'enterprise'
								? 'bg-slate-800 text-white dark:bg-slate-700'
								: 'bg-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
						].join(' ')}
					>
						🏢 Enterprise CFO Simulation Room
					</button>
				</div>
				<span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-3">
					Active Engine Core: T+1 Event loops
				</span>
			</div>

			{/* Main Simulator Dashboard */}
			<div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-4 md:p-6 shadow-xl [.light_&]:border-slate-200 [.light_&]:bg-white">
				<div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-400 [.light_&]:text-cyan-600">
							{isEnterprise ? 'SPV Waterfall Cash Simulator' : 'High-Fidelity Backtesting & AI Engine'}
						</p>
						<h2 className="mt-2 text-2xl font-bold tracking-tight text-white [.light_&]:text-slate-900">
							{isEnterprise ? 'Enterprise CFO Controls' : 'System Flow Control'}
						</h2>
					</div>
					
					{/* Status Stats */}
					<div className="flex flex-wrap gap-3 text-left">
						<div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Macro Feed</span>
							<span className="block text-sm font-bold font-sans text-white [.light_&]:text-slate-900 mt-1">Index: {currentSAndP.toFixed(2)}</span>
						</div>
						<div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Inflation</span>
							<span className="block text-sm font-bold font-sans text-red-400 [.light_&]:text-red-600 mt-1">{currentInflation.toFixed(1)}%</span>
						</div>
						<div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">Day Count</span>
							<span className="block text-sm font-bold font-sans text-white [.light_&]:text-slate-900 mt-1">{state.day} days</span>
						</div>
						<div className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-50">
							<span className="block font-mono text-[9px] uppercase tracking-widest text-slate-500">
								{isEnterprise ? 'Treasury Net Position' : 'Wealth Projection'}
							</span>
							<span className="block text-sm font-bold font-sans text-emerald-400 [.light_&]:text-emerald-600 mt-1">
								{formatCurrency(state.totalWealthAccumulated)}
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-6 py-5">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setIsRunning(!isRunning)}
							disabled={state.isPaused}
							className={[
								'py-2 px-5 rounded-lg text-xs font-mono uppercase tracking-wider transition font-bold select-none border cursor-pointer disabled:opacity-30 shadow-sm',
								isRunning
									? 'bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25 [.light_&]:bg-red-50 [.light_&]:border-red-200 [.light_&]:text-red-600 [.light_&]:hover:bg-red-100'
									: isEnterprise
										? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 [.light_&]:bg-emerald-50 [.light_&]:border-emerald-200 [.light_&]:text-emerald-600 [.light_&]:hover:bg-emerald-100'
										: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 [.light_&]:bg-cyan-50 [.light_&]:border-cyan-200 [.light_&]:text-cyan-700 [.light_&]:hover:bg-cyan-100'
							].join(' ')}
						>
							{isRunning ? 'Pause clock' : 'Start clock'}
						</button>
						<button
							onClick={handleStep}
							disabled={isRunning || state.isPaused}
							className="py-2 px-4 rounded-lg text-xs font-mono uppercase tracking-wider border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer shadow-sm [.light_&]:border-slate-200 [.light_&]:bg-white [.light_&]:text-slate-700 [.light_&]:hover:bg-slate-50"
						>
							Step 1 day
						</button>
						<button
							onClick={() => handleReset()}
							className="py-2 px-4 rounded-lg text-xs font-mono uppercase tracking-wider border border-slate-800 bg-transparent hover:bg-slate-900 text-slate-400 cursor-pointer shadow-sm [.light_&]:border-slate-200 [.light_&]:bg-white [.light_&]:text-slate-600 [.light_&]:hover:bg-slate-50"
						>
							Reset
						</button>
					</div>

					<div className="flex flex-wrap items-center gap-6">
						{/* Backtest Scenarios */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Macro Shock:</span>
							<select
								value={state.macroScenario}
								onChange={(e) => handleScenarioChange(e.target.value as any)}
								className="bg-slate-800 border border-slate-700 text-slate-200 [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer shadow-sm font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_4px_center] pr-8"
							>
								<option value="baseline">Baseline Growth</option>
								<option value="inflation">Stagflation Shock</option>
								{isEnterprise ? (
									<option value="supply_delay">Supply Chain Interruption</option>
								) : (
									<option value="crash">Market Contraction (Crash)</option>
								)}
							</select>
						</div>

						{/* Daily speed settings */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Speed:</span>
							<select
								value={speedMs}
								onChange={(e) => setSpeedMs(parseInt(e.target.value))}
								className="bg-slate-800 border border-slate-700 text-slate-200 [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer shadow-sm font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_4px_center] pr-8"
							>
								<option value="800">1x (Slow)</option>
								<option value="400">2x (Normal)</option>
								<option value="150">5x (Fast)</option>
							</select>
						</div>

						{/* Daily savings factor */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
								{isEnterprise ? 'Daily Base Revenue:' : 'Income/day:'}
							</span>
							<input
								type="number"
								min="0"
								step="10"
								value={dailyIncome}
								onChange={(e) => setDailyIncome(parseFloat(e.target.value) || 0)}
								className="w-20 bg-slate-800 border border-slate-700 text-slate-200 [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none font-mono shadow-sm"
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
					mode={state.mode}
				/>
			</div>

			{/* Interactive Bottom-up Liquidity Projections Grid */}
			{isEnterprise && liquidityRows.length > 0 && (
				<div className="rounded-[1.8rem] border border-slate-800 bg-slate-950/75 p-6 shadow-xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out] [.light_&]:bg-slate-50 [.light_&]:border-slate-200 [.light_&]:shadow-lg">
					<h3 className="text-lg font-bold text-white mb-2 [.light_&]:text-slate-900">Liquidity Projections Data Grid</h3>
					<p className="text-xs text-slate-400 mb-4 leading-normal [.light_&]:text-slate-500">
						Effortless top-down projection calculated bottom-up by running simulated clock steps forwards in real time.
					</p>
					
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-xs border-collapse">
							<thead>
								<tr className="border-b border-slate-800 text-slate-500 [.light_&]:border-slate-200 [.light_&]:text-slate-600">
									<th className="py-2.5 px-3">Treasury Account Node</th>
									<th className="py-2.5 px-3">Category</th>
									<th className="py-2.5 px-3 text-right">Current Ledger</th>
									<th className="py-2.5 px-3 text-right text-cyan-400 [.light_&]:text-cyan-700">Month-End Forecast (30d)</th>
									<th className="py-2.5 px-3 text-right text-emerald-400 [.light_&]:text-emerald-700">Year-End Forecast (365d)</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-800 text-slate-300 [.light_&]:divide-slate-200 [.light_&]:text-slate-700">
								{liquidityRows.map((row, idx) => {
									const isTotal = row.type === 'net';
									return (
										<tr 
											key={idx} 
											className={[
												isTotal ? 'bg-slate-900/35 font-bold text-white [.light_&]:bg-slate-100 [.light_&]:text-slate-900' : 'hover:bg-slate-900/10 [.light_&]:hover:bg-slate-50',
												row.type === 'liability' ? 'text-rose-300 [.light_&]:text-rose-600' : ''
											].join(' ')}
										>
											<td className="py-2.5 px-3">{row.name}</td>
											<td className="py-2.5 px-3 uppercase text-[10px] tracking-wider text-slate-500">
												{row.type}
											</td>
											<td className="py-2.5 px-3 text-right">{formatCurrency(row.cur)}</td>
											<td className="py-2.5 px-3 text-right text-cyan-400">{formatCurrency(row.month)}</td>
											<td className="py-2.5 px-3 text-right text-emerald-400">{formatCurrency(row.year)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* Parallel Scenario Comparisons (CFO Scenario Room) */}
			{isEnterprise && (
				<div className="grid gap-6 md:grid-cols-3">
					{Object.keys(enterpriseScenarios).map((scKey) => {
						const scState = enterpriseScenarios[scKey];
						const label = scKey === 'baseline' ? 'Steady Growth Baseline' : scKey === 'inflation' ? 'Stagflation Shock' : 'Supply Chain Interruptions';
						const colorClass = scKey === 'baseline' ? 'border-emerald-500/25 bg-emerald-500/5' : scKey === 'inflation' ? 'border-red-500/25 bg-red-500/5' : 'border-amber-500/25 bg-amber-500/5';
						
						return (
							<div key={scKey} className={["p-5 rounded-2xl border flex flex-col justify-between gap-4 [.light_&]:border-slate-200 [.light_&]:bg-slate-50", colorClass].join(' ')}>
								<div>
									<div className="flex items-center justify-between">
										<span className="text-xs font-mono uppercase font-bold text-slate-400 [.light_&]:text-slate-600">{scKey}</span>
										<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 [.light_&]:bg-slate-200 [.light_&]:text-slate-600">
											{scState.day}d Simulated
										</span>
									</div>
									<h4 className="text-sm font-bold text-white mt-2 leading-tight [.light_&]:text-slate-900">{label}</h4>
									
									<div className="mt-4 space-y-2 font-mono text-[11px] text-slate-300 [.light_&]:text-slate-600">
										<div className="flex justify-between">
											<span>Total Net Assets:</span>
											<span className="font-bold text-white [.light_&]:text-slate-900">{formatCurrency(scState.totalWealthAccumulated)}</span>
										</div>
										<div className="flex justify-between">
											<span>Receivables Outstanding:</span>
											<span>{formatCurrency(scState.nodes.find(n => n.id === 'receivables')?.balance || 0)}</span>
										</div>
										<div className="flex justify-between">
											<span>MMF Treasury Yields:</span>
											<span>{formatCurrency(scState.nodes.find(n => n.id === 'mfs')?.balance || 0)}</span>
										</div>
									</div>
								</div>

								<button
									onClick={() => applyScenarioForecast(scKey)}
									className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-mono text-slate-200 transition cursor-pointer text-center [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-700"
								>
									Apply to Active Canvas
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* AI Chat & Scripting bottom panel */}
			<div className="grid gap-6 md:grid-cols-3">
				{/* AI Conversational Assistant */}
				<div className="flex flex-col h-[350px] rounded-2xl border border-slate-800 bg-slate-950/90 font-mono text-xs shadow-2xl overflow-hidden md:col-span-2 [.light_&]:border-slate-200 [.light_&]:bg-slate-50 [.light_&]:shadow-lg">
					<div className="h-9 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between [.light_&]:border-slate-200 [.light_&]:bg-slate-100">
						<div className="flex items-center gap-1.5">
							<span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
							<span className="font-semibold text-slate-400 text-[10px] tracking-wider uppercase [.light_&]:text-slate-600">AI_Orchestration_Chat</span>
						</div>
						<span className="text-[9px] text-slate-500 [.light_&]:text-slate-400">LOW-COST LLM WRAPPER</span>
					</div>
					
					{/* Message Logs */}
					<div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-slate-800 [.light_&]:scrollbar-thumb-slate-300">
						{chatHistory.map((chat, idx) => {
							const isUser = chat.sender === 'user';
							const isSystem = chat.sender === 'system';
							return (
								<div 
									key={idx} 
									className={[
										'p-3 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-wrap',
										isUser 
											? 'ml-auto bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 [.light_&]:bg-cyan-50 [.light_&]:border-cyan-200 [.light_&]:text-cyan-800' 
											: isSystem 
												? 'bg-red-950/40 border border-red-900/40 text-red-300 [.light_&]:bg-red-50 [.light_&]:border-red-200 [.light_&]:text-red-800' 
												: 'bg-slate-900/60 border border-slate-800 text-slate-300 [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-700'
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

					<form onSubmit={handleChatSubmit} className="border-t border-slate-800 bg-slate-900/80 p-4 flex gap-3 [.light_&]:border-slate-200 [.light_&]:bg-slate-100/80">
						<div className="flex-1 relative flex items-center">
							<div className="absolute left-3 text-cyan-500/70 [.light_&]:text-cyan-600">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
							</div>
							<input
								type="text"
								value={chatInput}
								onChange={(e) => setChatInput(e.target.value)}
								placeholder={isEnterprise ? "Command the AI (e.g. 'Set receivables DSO to 45')..." : "Command the AI (e.g. 'Route $600 from checking to Roth IRA')..."}
								className="w-full bg-slate-950 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 py-3 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 [.light_&]:bg-white [.light_&]:border-slate-300 [.light_&]:text-slate-800 [.light_&]:placeholder:text-slate-400 font-mono transition-all shadow-inner"
							/>
						</div>
						<button 
							type="submit" 
							disabled={!chatInput.trim() || isPendingAI}
							className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_20px_rgba(8,145,178,0.5)]"
						>
							Send
						</button>
					</form>
				</div>

				{/* Scripting Rules & Audit Logs */}
				<div className="flex flex-col h-[350px] rounded-2xl border border-slate-800 bg-slate-950/90 font-mono text-xs shadow-2xl overflow-hidden [.light_&]:border-slate-200 [.light_&]:bg-slate-50 [.light_&]:shadow-lg">
					<div className="h-9 border-b border-slate-800 bg-slate-900/60 flex items-center px-4 justify-between [.light_&]:border-slate-200 [.light_&]:bg-slate-100">
						<span className="font-semibold text-slate-400 text-[10px] tracking-wider uppercase [.light_&]:text-slate-600">Market_Scripting_Rules</span>
						<span className="text-[9px] text-slate-500 [.light_&]:text-slate-400">CONDITIONAL RUNNER</span>
					</div>
					
					<div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800 [.light_&]:scrollbar-thumb-slate-300">
						<div className="space-y-3">
							{rules.map((rule) => (
								<div key={rule.id} className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl flex items-start justify-between gap-2 [.light_&]:bg-white [.light_&]:border-slate-200">
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
