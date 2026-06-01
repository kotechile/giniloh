export type AccountType =
	| 'checking'
	| 'hysa' // Emergency Reserve
	| 'match401k' // Employer 401k Match
	| 'debt' // High-Interest Debt
	| 'hsa' // Health Savings Account
	| 'ira' // Traditional or Roth IRA
	| 'max401k' // Workplace 401k Max-Out
	| 'brokerage' // Taxable Brokerage
	| 'income'; // Virtual input source

export interface AccountNode {
	id: string;
	name: string;
	type: AccountType;
	balance: number;
	ceiling: number; // T_over
	floor: number; // T_under
	interestRate?: number;
	annualLimit?: number; // e.g. HSA $3,850, IRA $7,000, 401k $24,500
	ytdContributions: number;
}

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
	amount: number; // The visual/commanded routing rate or percentage
	type: 'percent' | 'fixed';
}

export interface SettlementHolding {
	amount: number;
	originAccountId: string;
	releaseDay: number;
	type: 'ACH' | 'ACAT' | 'T1';
}

export interface TransferRecord {
	day: number;
	source: string;
	target: string;
	amount: number;
}

export interface MacroDataPoint {
	day: number;
	inflationRate: number; // annual percentage, e.g. 2.1
	marketReturn: number; // daily asset return multiplier, e.g. 1.0002
	marketIndexValue: number;
	eventLabel?: string;
}

export interface SimulationState {
	day: number;
	nodes: AccountNode[];
	edges: FlowEdge[];
	holdings: SettlementHolding[];
	totalWealthAccumulated: number;
	log: string[];
	transferHistory: TransferRecord[];
	pdtTradesToday: number;
	macroScenario: 'baseline' | 'inflation' | 'crash';
	macroHistory: MacroDataPoint[];
	isPaused: boolean;
	checklistCompleted: boolean;
	checklistProgress: number; // progress through the 250 questions
}

export const WATERFALL_ORDER: AccountType[] = [
	'hysa',
	'match401k',
	'debt',
	'hsa',
	'ira',
	'max401k',
	'brokerage'
];

/**
 * Validates whether adding a flow edge creates a circular dependency
 */
export function hasCircularDependency(edges: FlowEdge[], candidateSource: string, candidateTarget: string): boolean {
	const adjacencyList: Record<string, string[]> = {};
	
	// Build graph adjacency list
	for (const edge of edges) {
		if (!adjacencyList[edge.source]) {
			adjacencyList[edge.source] = [];
		}
		adjacencyList[edge.source].push(edge.target);
	}
	
	// Add candidate edge
	if (!adjacencyList[candidateSource]) {
		adjacencyList[candidateSource] = [];
	}
	adjacencyList[candidateSource].push(candidateTarget);

	const visited = new Set<string>();
	const recStack = new Set<string>();

	function dfs(nodeId: string): boolean {
		if (recStack.has(nodeId)) return true;
		if (visited.has(nodeId)) return false;

		visited.add(nodeId);
		recStack.add(nodeId);

		const neighbors = adjacencyList[nodeId] || [];
		for (const neighbor of neighbors) {
			if (dfs(neighbor)) {
				return true;
			}
		}

		recStack.delete(nodeId);
		return false;
	}

	// Run DFS from checking/income nodes
	for (const node of Object.keys(adjacencyList)) {
		if (dfs(node)) return true;
	}

	return false;
}

/**
 * Initialize default account nodes
 */
export function createDefaultNodes(): AccountNode[] {
	return [
		{ id: 'checking', name: 'Primary Checking', type: 'checking', balance: 4000, ceiling: 5000, floor: 1500, ytdContributions: 0 },
		{ id: 'hysa', name: 'HYSA (Emergency Fund)', type: 'hysa', balance: 5000, ceiling: 15000, floor: 0, interestRate: 4.5, ytdContributions: 0 },
		{ id: 'match401k', name: 'Employer 401k Match', type: 'match401k', balance: 2000, ceiling: 100000, floor: 0, annualLimit: 6000, ytdContributions: 2000 },
		{ id: 'debt', name: 'High-Interest Debt', type: 'debt', balance: 3500, ceiling: 0, floor: 0, interestRate: 18.0, ytdContributions: 0 },
		{ id: 'hsa', name: 'Pre-tax HSA', type: 'hsa', balance: 1000, ceiling: 4150, floor: 0, annualLimit: 4150, ytdContributions: 1000 },
		{ id: 'ira', name: 'Roth IRA', type: 'ira', balance: 3000, ceiling: 7000, floor: 0, annualLimit: 7000, ytdContributions: 3000 },
		{ id: 'max401k', name: 'Workplace 401k Max', type: 'max401k', balance: 0, ceiling: 23000, floor: 0, annualLimit: 23000, ytdContributions: 0 },
		{ id: 'brokerage', name: 'Taxable Brokerage', type: 'brokerage', balance: 12000, ceiling: 1000000, floor: 0, ytdContributions: 0 }
	];
}

/**
 * Executes a single simulation step (one business day)
 */
export function stepSimulation(state: SimulationState, dailyIncome: number = 200): SimulationState {
	// If the system is paused, return the current state unchanged
	if (state.isPaused) {
		return state;
	}

	const nextDay = state.day + 1;
	const nextLog: string[] = [];
	
	// Deep copy nodes, holdings, and history
	const nextNodes = state.nodes.map((node) => ({ ...node }));
	let nextHoldings = state.holdings.map((h) => ({ ...h }));
	const nextTransferHistory = [...(state.transferHistory || [])];
	let pdtTradesToday = 0;

	// 1. Process Macroeconomics & Market Performance
	let inflationRate = 2.0;
	let marketReturn = 1.0003; // daily growth ~8% annualized
	let marketIndexValue = state.macroHistory.length > 0 
		? state.macroHistory[state.macroHistory.length - 1].marketIndexValue 
		: 5000;
	let eventLabel = '';

	if (state.macroScenario === 'inflation') {
		inflationRate = 8.5;
		marketReturn = 0.9998; // flat to slight decline
		marketIndexValue = marketIndexValue * marketReturn;
		eventLabel = 'High Inflation Volatility';
		
		// Update interest rates dynamically under inflation regime
		nextNodes.forEach(node => {
			if (node.id === 'hysa') node.interestRate = 5.5; // High HYSA yield
			if (node.id === 'debt') node.interestRate = 22.0; // High borrowing rates
		});
	} else if (state.macroScenario === 'crash') {
		inflationRate = 3.0;
		// A sharp crash happens between Day 15 and Day 35
		if (nextDay >= 15 && nextDay <= 35) {
			marketReturn = 0.985; // 1.5% daily crash
			eventLabel = 'Market Contraction Event';
		} else if (nextDay > 35 && nextDay <= 60) {
			marketReturn = 1.0001; // sluggish recovery
			eventLabel = 'Post-Crash Consolidation';
		} else {
			marketReturn = 1.0004; // standard recovery
		}
		marketIndexValue = marketIndexValue * marketReturn;
	} else {
		// Baseline growth
		marketIndexValue = marketIndexValue * marketReturn;
	}

	// Apply market returns to equity accounts: Match401k, Workplace401kMax, RothIRA, Brokerage
	nextNodes.forEach((node) => {
		if (['match401k', 'ira', 'max401k', 'brokerage'].includes(node.type)) {
			node.balance = node.balance * marketReturn;
		}
	});

	// Append macro snapshot
	const macroDataPoint: MacroDataPoint = {
		day: nextDay,
		inflationRate,
		marketReturn,
		marketIndexValue,
		eventLabel
	};
	const nextMacroHistory = [...(state.macroHistory || []), macroDataPoint];

	// Behavioral Safeguard trigger: Pause on severe contraction
	let triggerPause = false;
	if (state.macroScenario === 'crash' && nextDay === 18 && !state.checklistCompleted) {
		triggerPause = true;
		nextLog.push(`Day ${nextDay}: [WARNING] Severe market contraction detected! S&P 500 dropped to ${marketIndexValue.toFixed(2)}. Simulation paused for behavioral cooling.`);
	}

	const checkingNode = nextNodes.find((n) => n.id === 'checking')!;

	// 2. Process daily income to primary checking
	if (dailyIncome > 0 && !triggerPause) {
		checkingNode.balance += dailyIncome;
		nextLog.push(`Day ${nextDay}: Deposited daily income of $${dailyIncome.toFixed(2)} to Checking.`);
	}

	// 3. Accrue interest on applicable nodes (Checking / HYSA / Debt) once every 30 days
	nextNodes.forEach((node) => {
		if (node.interestRate && nextDay % 30 === 0 && !triggerPause) {
			const monthlyRate = (node.interestRate / 100) / 12;
			if (node.type === 'debt') {
				const interest = node.balance * monthlyRate;
				node.balance += interest;
				nextLog.push(`Day ${nextDay}: Debt charged $${interest.toFixed(2)} interest.`);
			} else if (node.type === 'hysa') {
				const yieldEarned = node.balance * monthlyRate;
				node.balance += yieldEarned;
				nextLog.push(`Day ${nextDay}: HYSA earned $${yieldEarned.toFixed(2)} yield.`);
			}
		}
	});

	// 4. Process clearing queue (Release holds)
	const pendingHoldings: SettlementHolding[] = [];
	if (!triggerPause) {
		nextHoldings.forEach((holding) => {
			if (holding.releaseDay <= nextDay) {
				const targetNode = nextNodes.find((n) => n.id === holding.originAccountId);
				if (targetNode) {
					nextLog.push(`Day ${nextDay}: Completed ${holding.type} hold of $${holding.amount.toFixed(2)} for ${targetNode.name}.`);
				}
			} else {
				pendingHoldings.push(holding);
			}
		});
	} else {
		pendingHoldings.push(...nextHoldings);
	}
	nextHoldings = pendingHoldings;

	// Helper for executing sweeps with compliance rules
	const executeSweep = (source: AccountNode, target: AccountNode, amountToSweep: number, logMessage: string) => {
		if (amountToSweep <= 0) return;

		// A. ENFORCE IRA OUTBOUND BLOCK
		if (source.type === 'ira') {
			nextLog.push(`Day ${nextDay}: ERROR: Automated sweep from IRA to ${target.name} blocked to prevent early distribution penalties.`);
			return;
		}

		// B. ENFORCE 60-DAY AML SWEEP RESTRICTION
		// Look for any incoming transfers to source in the last 60 days
		const amlWindowStart = Math.max(0, nextDay - 60);
		const incomingTransfers = nextTransferHistory.filter(
			(record) => record.target === source.id && record.day >= amlWindowStart
		);
		if (incomingTransfers.length > 0) {
			// Find if the target is one of the originating accounts
			const isReturnToOrigin = incomingTransfers.some((record) => record.source === target.id);
			if (!isReturnToOrigin) {
				nextLog.push(`Day ${nextDay}: [AML RESTRICTION] Blocked sweep of $${amountToSweep.toFixed(2)} from ${source.name} to ${target.name}. Within a 60-day window, funds can only be swept back to their originating account.`);
				return;
			}
		}

		// C. ENFORCE PATTERN DAY TRADER (PDT) LIMITS
		const isEquityTarget = ['brokerage', 'ira', 'max401k', 'match401k'].includes(target.id);
		if (isEquityTarget) {
			const totalEquity = nextNodes
				.filter(n => ['brokerage', 'ira', 'max401k', 'match401k'].includes(n.id))
				.reduce((sum, n) => sum + n.balance, 0);
			if (totalEquity < 25000) {
				if (pdtTradesToday >= 2) {
					nextLog.push(`Day ${nextDay}: [PDT LIMIT REACHED] Sweep to equity ${target.name} blocked. Account under $25k is limited to 2 daily sweeps.`);
					return;
				}
				pdtTradesToday++;
			}
		}

		source.balance -= amountToSweep;
		target.balance += amountToSweep;
		
		// Record transfer history
		nextTransferHistory.push({
			day: nextDay,
			source: source.id,
			target: target.id,
			amount: amountToSweep
		});

		// Enforce annual contribution trackers
		if (target.annualLimit !== undefined) {
			target.ytdContributions += amountToSweep;
		}

		// Enforce regulatory latencies
		let holdType: 'ACH' | 'ACAT' | 'T1' = 'T1';
		let delay = 1;

		if (source.type === 'checking' && target.type === 'brokerage') {
			holdType = 'ACH';
			delay = 6;
		} else if (source.type === 'brokerage' && target.type === 'checking') {
			holdType = 'ACAT';
			delay = 15;
		}

		nextHoldings.push({
			amount: amountToSweep,
			originAccountId: target.id,
			releaseDay: nextDay + delay,
			type: holdType
		});

		nextLog.push(`Day ${nextDay}: ${logMessage} (Enforced ${holdType} hold of ${delay} days).`);
	};

	// 5. PROCESS UNDERBALANCE RULES (Restorative pulls)
	if (checkingNode.balance < checkingNode.floor && !triggerPause) {
		const deficit = checkingNode.floor - checkingNode.balance;
		const hysaNode = nextNodes.find((n) => n.type === 'hysa');
		if (hysaNode && hysaNode.balance > 0) {
			const pullAmount = Math.min(deficit, hysaNode.balance);
			executeSweep(hysaNode, checkingNode, pullAmount, `Underbalance sweep: Restored checking floor by pulling $${pullAmount.toFixed(2)} from HYSA.`);
		}
	}

	// 6. PROCESS OVERBALANCE RULES (Sweeping surplus)
	if (checkingNode.balance > checkingNode.ceiling && !triggerPause) {
		let surplus = checkingNode.balance - checkingNode.ceiling;
		
		for (const type of WATERFALL_ORDER) {
			if (surplus <= 0) break;
			
			const targetNode = nextNodes.find((n) => n.type === type);
			if (!targetNode) continue;

			let capacity = Infinity;
			
			if (targetNode.annualLimit !== undefined) {
				const remainingCap = Math.max(0, targetNode.annualLimit - targetNode.ytdContributions);
				capacity = remainingCap;
			}

			if (type === 'hysa') {
				capacity = Math.max(0, targetNode.ceiling - targetNode.balance);
			} else if (type === 'debt') {
				capacity = targetNode.balance;
			}

			if (capacity > 0) {
				const sweepAmt = Math.min(surplus, capacity);
				if (sweepAmt > 0) {
					executeSweep(
						checkingNode,
						targetNode,
						sweepAmt,
						`Overbalance sweep: Routed $${sweepAmt.toFixed(2)} surplus to ${targetNode.name}.`
					);
					surplus -= sweepAmt;
				}
			}
		}
	}

	// Calculate total wealth accumulated
	let totalWealth = 0;
	nextNodes.forEach((node) => {
		if (node.type === 'debt') {
			totalWealth -= node.balance;
		} else {
			totalWealth += node.balance;
		}
	});

	return {
		day: nextDay,
		nodes: nextNodes,
		edges: state.edges,
		holdings: nextHoldings,
		totalWealthAccumulated: totalWealth,
		log: [...state.log, ...nextLog].slice(-100),
		transferHistory: nextTransferHistory,
		pdtTradesToday,
		macroScenario: state.macroScenario,
		macroHistory: nextMacroHistory,
		isPaused: triggerPause || state.isPaused,
		checklistCompleted: state.checklistCompleted,
		checklistProgress: state.checklistProgress
	};
}
