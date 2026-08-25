// Dual-Mode Wealth & Treasury Orchestrator - Force Fresh Rebuild
import React, { useState, useEffect, useRef } from 'react';
import type { 
	SimulationState, 
	AccountNode,
	AccountType
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
import HistoryChart from './HistoryChart';

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
	mode: 'personal',
	waterfallOrder: ['hysa', 'match401k', 'debt', 'hsa', 'ira', 'max401k', 'brokerage'],
	history: [{
		day: 0,
		netWorth: -276500,
		checking: 4000,
		hysa: 5000,
		investments: 18000,
		debt: 3500,
		mortgage: 300000
	}]
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
	mode: 'enterprise',
	waterfallOrder: [],
	history: [{
		day: 0,
		netWorth: 365000,
		checking: 0,
		hysa: 0,
		investments: 0,
		debt: 0,
		mortgage: 0,
		operatingCash: 75000,
		receivables: 120000,
		payables: 80000,
		mfs: 250000
	}]
};

const WATERFALL_ACCOUNT_LABELS: Record<string, { name: string; subtext: string }> = {
	hysa: { name: 'HYSA', subtext: 'Emergency Fund' },
	match401k: { name: '401(k)', subtext: 'Base & Match' },
	debt: { name: 'High-Interest Debt', subtext: 'Credit Cards' },
	hsa: { name: 'Pre-tax HSA', subtext: 'Health Savings' },
	ira: { name: 'Roth IRA', subtext: 'Tax-Free Growth' },
	max401k: { name: '401(k)', subtext: 'Voluntary Max' },
	brokerage: { name: 'Taxable Brokerage', subtext: 'Index Funds' },
	mortgage: { name: 'Mortgage Loan', subtext: 'Primary Home' },
	checking: { name: 'Primary Checking', subtext: 'Clearing Hub' }
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
	const logsContainerRef = useRef<HTMLDivElement>(null);

	// Auto-scroll logs container internally to bottom
	useEffect(() => {
		if (logsContainerRef.current) {
			logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
		}
	}, [state.log]);

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

	// Clock toggle handler
	const handleToggleClock = () => {
		if (isRunning) {
			setIsRunning(false);
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		} else {
			if (state.isPaused) {
				setState((prev) => ({ ...prev, isPaused: false }));
			}
			setIsRunning(true);
		}
	};

	// Synchronized simulation clock step
	useEffect(() => {
		if (isRunning && !state.isPaused) {
			timerRef.current = setInterval(() => {
				// Step Active Main State
				setState((current) => {
					if (current.isPaused) {
						setIsRunning(false);
						return current;
					}
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

					if (next.isPaused) {
						setIsRunning(false);
					}

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
				timerRef.current = null;
			}
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [isRunning, speedMs, dailyIncome, rules, state.isPaused, state.mode]);
				clearInterval(timerRef.current);
			}
		};
	}, [isRunning, speedMs, dailyIncome, rules, state.isPaused, state.mode]);

	// Synchronize Day 0 history point when node balances change at Day 0
	useEffect(() => {
		if (state.day === 0 && state.history.length > 0) {
			let invSum = 0;
			let checkingBal = 0;
			let hysaBal = 0;
			let ccDebt = 0;
			let mortgageBal = 0;
			let totalWealth = 0;

			state.nodes.forEach((node) => {
				if (node.type === 'debt' || node.type === 'mortgage') {
					totalWealth -= node.balance;
				} else if (['checking', 'hysa', 'match401k', 'hsa', 'ira', 'max401k', 'brokerage'].includes(node.type)) {
					totalWealth += node.balance;
				}
				
				if (['match401k', 'hsa', 'ira', 'max401k', 'brokerage'].includes(node.type)) {
					invSum += node.balance;
				}
				if (node.id === 'checking') checkingBal = node.balance;
				if (node.id === 'hysa') hysaBal = node.balance;
				if (node.id === 'debt') ccDebt = node.balance;
				if (node.id === 'mortgage') mortgageBal = node.balance;
			});

			const hist0 = state.history[0];
			if (
				hist0.checking !== checkingBal ||
				hist0.hysa !== hysaBal ||
				hist0.debt !== ccDebt ||
				hist0.mortgage !== mortgageBal ||
				hist0.investments !== invSum ||
				hist0.netWorth !== totalWealth
			) {
				setState((current) => {
					if (current.day !== 0) return current;
					const updatedHistory = [...current.history];
					updatedHistory[0] = {
						...updatedHistory[0],
						netWorth: totalWealth,
						checking: checkingBal,
						hysa: hysaBal,
						investments: invSum,
						debt: ccDebt,
						mortgage: mortgageBal
					};
					return {
						...current,
						history: updatedHistory
					};
				});
			}
		}
	}, [state.nodes, state.day, state.history]);

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

		if (baseCommand === 'reorder') {
			if (parts.length < 2) {
				return { success: false, nextState: targetState, output: 'Syntax: reorder [list of accounts separated by spaces or commas]' };
			}
			const orderArgs = cmd.substring(baseCommand.length).toLowerCase().replace(/_/g, '').split(/[\s,]+/).map(x => x.trim()).filter(Boolean);
			const validPersonalTypes: AccountType[] = ['hysa', 'match401k', 'debt', 'hsa', 'ira', 'max401k', 'brokerage', 'mortgage'];
			
			const normalizedOrder = orderArgs.map(arg => {
				if (arg === 'rothira' || arg === 'ira') return 'ira';
				if (arg === 'emergency' || arg === 'emergencyfund' || arg === 'hysa') return 'hysa';
				if (arg === 'checking') return 'checking';
				if (arg === 'brokerage' || arg === 'investments' || arg === 'stocks') return 'brokerage';
				if (arg === '401kmatch' || arg === 'match401k') return 'match401k';
				if (arg === '401kmax' || arg === 'max401k') return 'max401k';
				if (arg === 'mortgage' || arg === 'homeloan' || arg === 'houseloan') return 'mortgage';
				return arg;
			});

			const filteredOrder = normalizedOrder.filter(x => validPersonalTypes.includes(x as AccountType)) as AccountType[];
			
			if (filteredOrder.length === 0) {
				return { success: false, nextState: targetState, output: 'Error: No valid personal account types provided for reordering. Valid options: hysa, match401k, debt, hsa, ira, max401k, brokerage' };
			}

			const newOrder = [...filteredOrder];
			validPersonalTypes.forEach(type => {
				if (!newOrder.includes(type)) {
					newOrder.push(type);
				}
			});

			return {
				success: true,
				nextState: {
					...targetState,
					waterfallOrder: newOrder
				},
				output: `Waterfall priority order updated to: ${newOrder.join(' -> ')}.`
			};
		}

		if (baseCommand === 'set') {
			if (parts.length < 4) {
				return { success: false, nextState: targetState, output: 'Syntax: set [node] [balance|ceiling|floor|dso|dpoVariable|dpoFixed|fixedSpread|grossIncome|taxRate|frequency|interestRate|mortgagePayment|monthlyExpenses] [value]' };
			}
			const nodeId = parts[1].toLowerCase();
			const field = parts[2].toLowerCase();
			const rawVal = parts[3];
			let value: any = parseFloat(rawVal.replace(/,/g, ''));

			if (field === 'frequency') {
				value = rawVal.toLowerCase();
				if (!['daily', 'bi-weekly', 'monthly'].includes(value)) {
					return { success: false, nextState: targetState, output: `Error: Frequency must be daily, bi-weekly, or monthly.` };
				}
			} else if (isNaN(value)) {
				return { success: false, nextState: targetState, output: `Error: "${parts[3]}" is not a valid number.` };
			}

			const node = targetState.nodes.find((n) => n.id === nodeId);
			if (!node) {
				return { success: false, nextState: targetState, output: `Error: Account "${nodeId}" not found.` };
			}

			const validFields = ['balance', 'ceiling', 'floor', 'dso', 'dpovariable', 'dpofixed', 'fixedspread', 'grossincome', 'taxrate', 'frequency', 'interestrate', 'mortgagepayment', 'monthlyexpenses'];
			if (!validFields.includes(field)) {
				return { success: false, nextState: targetState, output: `Error: Field must be balance, ceiling, floor, dso, dpoVariable, dpoFixed, fixedSpread, grossIncome, taxRate, frequency, interestRate, mortgagePayment, or monthlyExpenses.` };
			}

			let normalizedField = field;
			if (field === 'dpovariable') normalizedField = 'dpoVariable';
			if (field === 'dpofixed') normalizedField = 'dpoFixed';
			if (field === 'fixedspread') normalizedField = 'fixedSpread';
			if (field === 'grossincome') normalizedField = 'grossIncome';
			if (field === 'taxrate') normalizedField = 'taxRate';
			if (field === 'interestrate') normalizedField = 'interestRate';
			if (field === 'mortgagepayment') normalizedField = 'mortgagePayment';
			if (field === 'monthlyexpenses') normalizedField = 'monthlyExpenses';

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
				// Execute translated command list sequentially
				setState(current => {
					const commandList = command.split(';').map(c => c.trim()).filter(Boolean);
					let tempState = current;
					let finalOutput = '';
					let allSuccess = true;

					for (const cmd of commandList) {
						const res = executeRawCommand(cmd, tempState);
						if (res.success) {
							tempState = res.nextState;
							finalOutput += `• ${res.output}\n`;
						} else {
							finalOutput += `• Error: ${res.output}\n`;
							allSuccess = false;
						}
					}

					setChatHistory(prev => [...prev, { 
						text: `${explanation}\n\nResult:\n${finalOutput}`, 
						sender: allSuccess ? 'assistant' : 'system' 
					}]);
					return tempState;
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
		
		const initialHistory = isEnterprise ? [{
			day: 0,
			netWorth: 365000,
			checking: 0,
			hysa: 0,
			investments: 0,
			debt: 0,
			mortgage: 0,
			operatingCash: 75000,
			receivables: 120000,
			payables: 80000,
			mfs: 250000
		}] : [{
			day: 0,
			netWorth: -276500,
			checking: 4000,
			hysa: 5000,
			investments: 18000,
			debt: 3500,
			mortgage: 300000
		}];

		setState(prev => ({
			...prev,
			macroScenario: scenario,
			day: 0,
			nodes: baseNodes,
			macroHistory: [{ day: 0, inflationRate: scenario === 'inflation' ? 8.5 : 2.0, marketReturn: 1.0, marketIndexValue: 5000, eventLabel: 'Backtest Setup' }],
			isPaused: false,
			checklistCompleted: false,
			checklistProgress: 0,
			log: [`Backtest reset to ${scenario.toUpperCase()} scenario.`],
			history: initialHistory
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
				<div className="absolute inset-0 bg-white/90 z-50 rounded-[2rem] flex flex-col items-center justify-center p-8 backdrop-blur-lg animate-[fadeIn_0.3s_ease-out]">
					<div className="max-w-xl w-full bg-slate-900 border border-red-500/30 p-8 rounded-3xl shadow-2xl flex flex-col gap-6">
						<div className="flex items-center gap-3 border-b border-gray-200 pb-4">
							<span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
							<h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">Safeguard Active: Behavioral Intervention</h3>
						</div>
						<p className="text-sm text-[#5E5E5E] leading-relaxed">
							The macro backtest has encountered a severe market drop (&gt;10%). To avoid panic-driven portfolio liquidation, you must complete the Ardal Loh-Gronager emotional centering assessment.
						</p>

						{state.checklistProgress < EMOTIONAL_QUESTIONS.length ? (
							<div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col gap-4">
								<div className="flex justify-between text-xs font-mono text-[#8C8C8C]">
									<span>EXERCISE {state.checklistProgress + 1} OF {EMOTIONAL_QUESTIONS.length}</span>
									<span>{Math.round(((state.checklistProgress) / EMOTIONAL_QUESTIONS.length) * 100)}%</span>
								</div>
								<p className="text-sm text-[#1A1A1A] font-medium">{EMOTIONAL_QUESTIONS[state.checklistProgress]}</p>
								<div className="flex gap-3 mt-2">
									<button 
										onClick={handleChecklistNext}
										className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-[#1A1A1A] font-mono text-xs rounded-xl transition cursor-pointer"
									>
										Acknowledge & Proceed
									</button>
								</div>
							</div>
						) : (
							<p className="#1A1A1A text-sm font-mono">Checklist complete. Ready to resume.</p>
						)}
					</div>
				</div>
			)}

			{/* Mode Toggles Header Section */}
			<div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-gray-200/80 backdrop-blur-sm">
				<div className="flex gap-2">
					<button
						onClick={() => handleModeSwitch('personal')}
						className={[
							'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition duration-200 cursor-pointer',
							state.mode === 'personal'
								? 'bg-gray-200 text-[#1A1A1A] dark:bg-slate-700'
								: 'bg-transparent text-[#8C8C8C] hover:text-slate-800 dark:text-[#5E5E5E] dark:hover:text-[#5E5E5E]'
						].join(' ')}
					>
						👤 Personal Wealth Orchestrator
					</button>
					<button
						onClick={() => handleModeSwitch('enterprise')}
						className={[
							'px-4 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition duration-200 cursor-pointer',
							state.mode === 'enterprise'
								? 'bg-gray-200 text-[#1A1A1A] dark:bg-slate-700'
								: 'bg-transparent text-[#8C8C8C] hover:text-slate-800 dark:text-[#5E5E5E] dark:hover:text-[#5E5E5E]'
						].join(' ')}
					>
						🏢 Enterprise CFO Simulation Room
					</button>
				</div>
				<span className="text-[10px] font-mono text-[#8C8C8C] uppercase tracking-widest px-3">
					Active Engine Core: T+1 Event loops
				</span>
			</div>

			{/* Main Simulator Dashboard - Unboxed */}
			<div className="w-full bg-white py-6">
				<div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-[#5A7A8F]">
							{isEnterprise ? 'SPV Waterfall Cash Simulator' : 'High-Fidelity Backtesting & AI Engine'}
						</p>
						<h2 className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A]">
							{isEnterprise ? 'Enterprise CFO Controls' : 'System Flow Control'}
						</h2>
					</div>
					
					{/* Status Stats - Naked Data */}
					<div className="flex flex-wrap items-center gap-6 text-left">
						<div className="flex flex-col">
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">Macro Feed</span>
							<span className="text-2xl font-black text-[#1A1A1A] mt-1">Index {currentSAndP.toFixed(0)}</span>
						</div>
						<div className="h-8 w-px bg-[#E5E5E5]"></div>
						<div className="flex flex-col">
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">Inflation</span>
							<span className="text-2xl font-black text-[#B85C5C] mt-1">{currentInflation.toFixed(1)}%</span>
						</div>
						<div className="h-8 w-px bg-[#E5E5E5]"></div>
						<div className="flex flex-col">
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">Day Count</span>
							<span className="text-2xl font-black text-[#1A1A1A] mt-1">{state.day} days</span>
						</div>
						<div className="h-8 w-px bg-[#E5E5E5]"></div>
						<div className="flex flex-col">
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C8C8C]">
								{isEnterprise ? 'Treasury net' : 'Wealth Projection'}
							</span>
							<span className="text-2xl font-black text-[#5A7A8F] mt-1">
								{formatCurrency(state.totalWealthAccumulated)}
							</span>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center justify-between gap-6 py-5">
					<div className="flex items-center gap-3">
						<button
							onClick={handleToggleClock}
							className={[
								'py-2.5 px-5 rounded-lg text-xs font-mono uppercase tracking-wider transition font-bold select-none border cursor-pointer',
								isRunning
									? 'bg-[#B85C5C] border-[#B85C5C] !text-white hover:bg-[#a64e4e]'
									: 'bg-[#1A1A1A] border-[#1A1A1A] !text-white hover:bg-black'
							].join(' ')}
						>
							{isRunning ? 'Pause clock' : 'Start clock'}
						</button>
						<button
							onClick={handleStep}
							disabled={isRunning || state.isPaused}
							className="py-2.5 px-4 rounded-lg text-xs font-mono uppercase tracking-wider border border-[#E5E5E5] bg-white hover:border-[#1A1A1A] text-[#1A1A1A] disabled:opacity-30 cursor-pointer"
						>
							Step 1 day
						</button>
						<button
							onClick={() => handleReset()}
							className="py-2.5 px-4 rounded-lg text-xs font-mono uppercase tracking-wider border border-[#E5E5E5] bg-white hover:border-[#1A1A1A] text-[#1A1A1A] cursor-pointer"
						>
							Reset
						</button>
					</div>

					<div className="flex flex-wrap items-center gap-6">
						{/* Backtest Scenarios */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-[#8C8C8C] uppercase tracking-[0.2em] font-bold">Macro Shock:</span>
							<select
								value={state.macroScenario}
								onChange={(e) => handleScenarioChange(e.target.value as any)}
								className="bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%231A1A1A%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_4px_center] pr-8 focus:border-[#1A1A1A]"
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
							<span className="text-xs font-mono text-[#8C8C8C] uppercase tracking-[0.2em] font-bold">Speed:</span>
							<select
								value={speedMs}
								onChange={(e) => setSpeedMs(parseInt(e.target.value))}
								className="bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs outline-none cursor-pointer font-medium appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M7%2010L12%2015L17%2010%22%20stroke%3D%22%231A1A1A%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_4px_center] pr-8 focus:border-[#1A1A1A]"
							>
								<option value="800">1x (Slow)</option>
								<option value="400">2x (Normal)</option>
								<option value="150">5x (Fast)</option>
							</select>
						</div>

						{/* Daily savings factor */}
						<div className="flex items-center gap-2">
							<span className="text-xs font-mono text-[#8C8C8C] uppercase tracking-[0.2em] font-bold">
								{isEnterprise ? 'Daily Base Revenue:' : 'Income/day:'}
							</span>
							<input
								type="number"
								min="0"
								step="10"
								value={dailyIncome}
								onChange={(e) => setDailyIncome(parseFloat(e.target.value) || 0)}
								className="w-20 bg-white border border-[#E5E5E5] text-[#1A1A1A] rounded-lg px-3 py-1.5 text-xs outline-none font-mono focus:border-[#1A1A1A]"
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
					isRunning={isRunning}
				/>
			</div>

			{/* Historical Evolution Chart */}
			<HistoryChart history={state.history} mode={state.mode} />

			{/* Interactive Bottom-up Liquidity Projections Grid */}
			{isEnterprise && liquidityRows.length > 0 && (
				<div className="rounded-[1.8rem] border border-gray-200 bg-white/75 p-6 shadow-xl backdrop-blur-sm animate-[fadeIn_0.3s_ease-out] [.light_&]:bg-slate-50 [.light_&]:border-slate-200 [.light_&]:shadow-lg">
					<h3 className="text-lg font-bold text-[#1A1A1A] mb-2 [.light_&]:text-slate-900">Liquidity Projections Data Grid</h3>
					<p className="text-xs text-[#5E5E5E] mb-4 leading-normal [.light_&]:text-[#8C8C8C]">
						Effortless top-down projection calculated bottom-up by running simulated clock steps forwards in real time.
					</p>
					
					<div className="overflow-x-auto">
						<table className="w-full text-left font-mono text-xs border-collapse">
							<thead>
								<tr className="border-b border-gray-200 text-[#8C8C8C] [.light_&]:border-slate-200 [.light_&]:text-[#8C8C8C]">
									<th className="py-2.5 px-3">Treasury Account Node</th>
									<th className="py-2.5 px-3">Category</th>
									<th className="py-2.5 px-3 text-right">Current Ledger</th>
									<th className="py-2.5 px-3 text-right text-[#5A7A8F] [.light_&]:text-cyan-700">Month-End Forecast (30d)</th>
									<th className="py-2.5 px-3 text-right #1A1A1A [.light_&]:text-emerald-700">Year-End Forecast (365d)</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-800 text-[#5E5E5E] [.light_&]:divide-slate-200 [.light_&]:text-slate-700">
								{liquidityRows.map((row, idx) => {
									const isTotal = row.type === 'net';
									return (
										<tr 
											key={idx} 
											className={[
												isTotal ? 'bg-slate-900/35 font-bold text-[#1A1A1A] [.light_&]:bg-slate-100 [.light_&]:text-slate-900' : 'hover:bg-slate-900/10 [.light_&]:hover:bg-slate-50',
												row.type === 'liability' ? 'text-[#B85C5C] [.light_&]:text-rose-600' : ''
											].join(' ')}
										>
											<td className="py-2.5 px-3">{row.name}</td>
											<td className="py-2.5 px-3 uppercase text-[10px] tracking-wider text-[#8C8C8C]">
												{row.type}
											</td>
											<td className="py-2.5 px-3 text-right">{formatCurrency(row.cur)}</td>
											<td className="py-2.5 px-3 text-right text-[#5A7A8F]">{formatCurrency(row.month)}</td>
											<td className="py-2.5 px-3 text-right #1A1A1A">{formatCurrency(row.year)}</td>
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
										<span className="text-xs font-mono uppercase font-bold text-[#5E5E5E] [.light_&]:text-[#8C8C8C]">{scKey}</span>
										<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-[#5E5E5E] [.light_&]:bg-slate-200 [.light_&]:text-[#8C8C8C]">
											{scState.day}d Simulated
										</span>
									</div>
									<h4 className="text-sm font-bold text-[#1A1A1A] mt-2 leading-tight [.light_&]:text-slate-900">{label}</h4>
									
									<div className="mt-4 space-y-2 font-mono text-[11px] text-[#5E5E5E] [.light_&]:text-[#8C8C8C]">
										<div className="flex justify-between">
											<span>Total Net Assets:</span>
											<span className="font-bold text-[#1A1A1A] [.light_&]:text-slate-900">{formatCurrency(scState.totalWealthAccumulated)}</span>
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
									className="w-full py-2 bg-slate-900 hover:bg-gray-200 border border-slate-700/60 rounded-xl text-xs font-mono text-[#5E5E5E] transition cursor-pointer text-center [.light_&]:bg-white [.light_&]:border-slate-200 [.light_&]:text-slate-700"
								>
									Apply to Active Canvas
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* AI Chat, Market Rules, & Savings Waterfall Bottom Panel */}
			<div className={["grid gap-6", isEnterprise ? "md:grid-cols-2" : "md:grid-cols-3"].join(' ')}>
				{/* A. AI Assistant Card */}
				<div className="flex flex-col h-[380px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm font-sans">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<h3 className="text-sm font-semibold text-slate-900 tracking-tight">AI Assistant</h3>
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
							LLM Powered
						</span>
					</div>
					
					{/* Message Logs */}
					<div className="flex-1 py-3 overflow-y-auto space-y-3 font-sans pr-1 scrollbar-thin scrollbar-thumb-slate-200">
						{chatHistory.map((chat, idx) => {
							const isUser = chat.sender === 'user';
							const isSystem = chat.sender === 'system';
							return (
								<div 
									key={idx} 
									className={[
										'p-3 rounded-2xl max-w-[85%] text-sm font-normal leading-relaxed shadow-xs',
										isUser 
											? 'ml-auto bg-cyan-600 text-white' 
											: isSystem 
												? 'bg-rose-50 border border-rose-200 text-rose-900' 
												: 'bg-slate-100 border border-slate-200 text-slate-900'
									].join(' ')}
								>
									{chat.text}
								</div>
							);
						})}
						{isPendingAI && (
							<div className="text-xs text-slate-500 italic animate-pulse py-1">Assistant is processing prompt...</div>
						)}
					</div>

					<form onSubmit={handleChatSubmit} className="pt-3 border-t border-slate-100 flex gap-2 font-sans">
						<input
							type="text"
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							placeholder={isEnterprise ? "Ask AI or enter command (e.g., Set receivables DSO to 45)..." : "Ask AI or enter command (e.g., Route $600 from Checking to Roth)..."}
							className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 font-sans tracking-normal shadow-inner"
						/>
						<button 
							type="submit" 
							disabled={!chatInput.trim() || isPendingAI}
							className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-sm flex-shrink-0"
						>
							Send
						</button>
					</form>
				</div>

				{/* B. Market & Scripting Rules Card */}
				<div className="flex flex-col h-[380px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm font-sans">
					<div className="flex items-center justify-between pb-3 border-b border-slate-100">
						<h3 className="text-sm font-semibold text-slate-900 tracking-tight">Market & Scripting Rules</h3>
						<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
							Conditional Runner
						</span>
					</div>
					
					<div className="flex-1 py-3 overflow-y-auto space-y-3 font-sans pr-1 scrollbar-thin scrollbar-thumb-slate-200">
						{rules.map((rule) => (
							<div key={rule.id} className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col gap-2 hover:border-slate-300 transition">
								<div className="flex items-start justify-between gap-2">
									<h4 className="font-semibold text-slate-900 text-xs">{rule.name}</h4>
									<button 
										onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))}
										className={[
											'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition cursor-pointer flex-shrink-0',
											rule.isActive 
												? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
												: 'bg-slate-100 text-slate-500 border border-slate-200'
										].join(' ')}
									>
										<span className={['w-1.5 h-1.5 rounded-full', rule.isActive ? 'bg-emerald-500' : 'bg-slate-400'].join(' ')}></span>
										{rule.isActive ? 'Active' : 'Inactive'}
									</button>
								</div>

								<p className="text-xs text-slate-600 leading-relaxed font-sans">{rule.description}</p>

								<div className="flex flex-wrap gap-1.5 text-xs font-sans mt-1">
									<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
										Trigger: {rule.conditionStr}
									</span>
									<span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium">
										Action: {rule.actionStr}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* C. Savings Waterfall Priority Card (Personal Mode) */}
				{!isEnterprise && (
					<div className="flex flex-col h-[380px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm font-sans">
						<div className="flex items-center justify-between pb-3 border-b border-slate-100">
							<h3 className="text-sm font-semibold text-slate-900 tracking-tight">Savings Waterfall Order</h3>
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
								Priority Config
							</span>
						</div>
						
						<p className="text-xs font-semibold text-slate-500 tracking-normal my-2.5 font-sans">Sweep Priority Order</p>
						
						<div className="flex-1 overflow-y-auto space-y-2 font-sans pr-1 scrollbar-thin scrollbar-thumb-slate-200">
							{state.waterfallOrder.map((type, idx) => {
								const node = state.nodes.find(n => n.type === type);
								const fallbackName = node ? node.name : type;
								const details = WATERFALL_ACCOUNT_LABELS[type] || { name: fallbackName, subtext: '' };

								const handleMoveUp = () => {
									if (idx === 0) return;
									const newOrder = [...state.waterfallOrder];
									const temp = newOrder[idx];
									newOrder[idx] = newOrder[idx - 1];
									newOrder[idx - 1] = temp;
									setState(prev => ({
										...prev,
										waterfallOrder: newOrder,
										log: [...prev.log, `Reordered waterfall: Moved ${details.name} up.`].slice(-100)
									}));
								};

								const handleMoveDown = () => {
									if (idx === state.waterfallOrder.length - 1) return;
									const newOrder = [...state.waterfallOrder];
									const temp = newOrder[idx];
									newOrder[idx] = newOrder[idx + 1];
									newOrder[idx + 1] = temp;
									setState(prev => ({
										...prev,
										waterfallOrder: newOrder,
										log: [...prev.log, `Reordered waterfall: Moved ${details.name} down.`].slice(-100)
									}));
								};

								return (
									<div key={type} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition">
										<div className="flex items-center gap-2.5 overflow-hidden mr-2">
											<span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200/80 text-slate-800 text-xs font-bold font-mono flex-shrink-0">
												#{idx + 1}
											</span>
											<span className="text-xs font-semibold text-slate-900 truncate">
												{details.name} {details.subtext && <span className="text-slate-500 font-normal ml-1">({details.subtext})</span>}
											</span>
										</div>
										<div className="flex items-center gap-1 flex-shrink-0">
											<button
												onClick={handleMoveUp}
												disabled={idx === 0}
												title="Move Up"
												className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-20 transition cursor-pointer"
											>
												▲
											</button>
											<button
												onClick={handleMoveDown}
												disabled={idx === state.waterfallOrder.length - 1}
												title="Move Down"
												className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-20 transition cursor-pointer"
											>
												▼
											</button>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* D. System Audit Ledger & Console */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-3 font-sans animate-[fadeIn_0.3s_ease-out]">
				<div className="flex items-center justify-between border-b border-slate-100 pb-3">
					<h3 className="text-sm font-semibold text-slate-900 tracking-tight font-sans">System Audit Ledger & Console</h3>
					<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						Live Simulation Engine
					</span>
				</div>
				<div 
					ref={logsContainerRef}
					className="max-h-[190px] min-h-[130px] overflow-y-auto space-y-1.5 p-3.5 bg-slate-900 rounded-xl text-slate-100 font-mono text-xs leading-5 shadow-inner pr-2"
				>
					{state.log.length > 0 ? (
						state.log.map((line, idx) => {
							const isWarning = line.includes('WARNING') || line.includes('ALERT') || line.includes('ERROR');
							const isPayday = line.includes('PAYDAY') || line.includes('Paycheck');
							const isSweep = line.includes('sweep') || line.includes('swept') || line.includes('Routed');
							const isDraw = line.includes('DRAW') || line.includes('pulling') || line.includes('Restored');
							
							const colorClass = isWarning 
								? 'text-rose-400 font-semibold' 
								: isPayday 
									? 'text-emerald-400 font-semibold' 
									: isSweep 
										? 'text-cyan-300 font-medium' 
										: isDraw
											? 'text-amber-300 font-medium'
											: 'text-slate-200';
							return (
								<div key={idx} className={colorClass}>
									&gt; {line}
								</div>
							);
						})
					) : (
						<div className="text-slate-400 italic font-sans">No transactions or events logged yet. Advance the clock to run.</div>
					)}
				</div>
			</div>
		</div>
	);
}
