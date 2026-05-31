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

export interface SimulationState {
	day: number;
	nodes: AccountNode[];
	edges: FlowEdge[];
	holdings: SettlementHolding[];
	totalWealthAccumulated: number;
	log: string[];
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
	const nextDay = state.day + 1;
	const nextLog: string[] = [];
	
	// Deep copy nodes and holdings
	const nextNodes = state.nodes.map((node) => ({ ...node }));
	let nextHoldings = state.holdings.map((h) => ({ ...h }));

	const checkingNode = nextNodes.find((n) => n.id === 'checking')!;

	// 1. Process daily income to primary checking
	if (dailyIncome > 0) {
		checkingNode.balance += dailyIncome;
		nextLog.push(`Day ${nextDay}: Deposited daily income of $${dailyIncome.toFixed(2)} to Checking.`);
	}

	// 2. Accrue interest on applicable nodes (Checking / HYSA / Debt) once every 30 days
	nextNodes.forEach((node) => {
		if (node.interestRate && nextDay % 30 === 0) {
			const monthlyRate = (node.interestRate / 100) / 12;
			if (node.type === 'debt') {
				// Debt increases by interest
				const interest = node.balance * monthlyRate;
				node.balance += interest;
				nextLog.push(`Day ${nextDay}: Debt charged $${interest.toFixed(2)} interest.`);
			} else if (node.type === 'hysa') {
				// Savings earn interest
				const yieldEarned = node.balance * monthlyRate;
				node.balance += yieldEarned;
				nextLog.push(`Day ${nextDay}: HYSA earned $${yieldEarned.toFixed(2)} yield.`);
			}
		}
	});

	// 3. Process clearing queue (Release holds)
	const pendingHoldings: SettlementHolding[] = [];
	nextHoldings.forEach((holding) => {
		if (holding.releaseDay <= nextDay) {
			// Find release account
			const targetNode = nextNodes.find((n) => n.id === holding.originAccountId);
			if (targetNode) {
				// Settlement finished, balance is fully cleared to invest / sweep
				// In simulator, we'll keep holds in a sub-balance state or just visual indicator
				nextLog.push(`Day ${nextDay}: Completed ${holding.type} hold of $${holding.amount.toFixed(2)} for ${targetNode.name}.`);
			}
		} else {
			pendingHoldings.push(holding);
		}
	});
	nextHoldings = pendingHoldings;

	// Helper for executing sweeps with latency rules
	const executeSweep = (source: AccountNode, target: AccountNode, amountToSweep: number, logMessage: string) => {
		if (amountToSweep <= 0) return;

		// ENFORCE IRA OUTBOUND BLOCK
		if (source.type === 'ira') {
			nextLog.push(`Day ${nextDay}: ERROR: Automated sweep from IRA to ${target.name} blocked to prevent early distribution penalties.`);
			return;
		}

		source.balance -= amountToSweep;
		target.balance += amountToSweep;
		
		// Enforce annual contribution trackers
		if (target.annualLimit !== undefined) {
			target.ytdContributions += amountToSweep;
		}

		// Enforce regulatory latencies
		let holdType: 'ACH' | 'ACAT' | 'T1' = 'T1';
		let delay = 1; // T+1 standard

		if (source.type === 'checking' && target.type === 'brokerage') {
			holdType = 'ACH';
			delay = 6; // 6-day ACH hold
		} else if (source.type === 'brokerage' && target.type === 'checking') {
			holdType = 'ACAT';
			delay = 15; // 15-day sweep lock
		}

		nextHoldings.push({
			amount: amountToSweep,
			originAccountId: target.id,
			releaseDay: nextDay + delay,
			type: holdType
		});

		nextLog.push(`Day ${nextDay}: ${logMessage} (Enforced ${holdType} hold of ${delay} days).`);
	};

	// 4. PROCESS UNDERBALANCE RULES (Restorative pulls)
	// If checking is below floor, pull from HYSA
	if (checkingNode.balance < checkingNode.floor) {
		const deficit = checkingNode.floor - checkingNode.balance;
		const hysaNode = nextNodes.find((n) => n.type === 'hysa');
		if (hysaNode && hysaNode.balance > 0) {
			const pullAmount = Math.min(deficit, hysaNode.balance);
			executeSweep(hysaNode, checkingNode, pullAmount, `Underbalance sweep: Restored checking floor by pulling $${pullAmount.toFixed(2)} from HYSA.`);
		}
	}

	// 5. PROCESS OVERBALANCE RULES (Sweeping surplus)
	// If checking is above ceiling, sweep surplus along the waterfall
	if (checkingNode.balance > checkingNode.ceiling) {
		let surplus = checkingNode.balance - checkingNode.ceiling;
		
		// Run waterfall prioritization queue
		for (const type of WATERFALL_ORDER) {
			if (surplus <= 0) break;
			
			const targetNode = nextNodes.find((n) => n.type === type);
			if (!targetNode) continue;

			// Determine allocation potential
			let capacity = Infinity;
			
			// If target has limit (like IRA, HSA, Match) check remaining YTD cap
			if (targetNode.annualLimit !== undefined) {
				const remainingCap = Math.max(0, targetNode.annualLimit - targetNode.ytdContributions);
				capacity = remainingCap;
			}

			// Special logic for specific accounts
			if (type === 'hysa') {
				// Fill HYSA up to its target emergency fund ceiling (e.g. 15,000)
				capacity = Math.max(0, targetNode.ceiling - targetNode.balance);
			} else if (type === 'debt') {
				// Pay down remaining debt balance
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

	// Calculate total wealth accumulated (sum of all asset nodes minus debt node)
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
		log: [...state.log, ...nextLog].slice(-100) // Keep last 100 logs
	};
}
