export type AccountType =
	| 'checking'
	| 'hysa' // Emergency Reserve
	| 'match401k' // Employer 401k Match
	| 'debt' // High-Interest Debt
	| 'hsa' // Health Savings Account
	| 'ira' // Traditional or Roth IRA
	| 'max401k' // Workplace 401k Max-Out
	| 'brokerage' // Taxable Brokerage
	| 'income' // Virtual input source
	| 'taxes_paid' // Virtual tracking node for IRS withholdings
	| 'corp_taxes' // Virtual tracking node for corporate taxes & VAT
	| 'mortgage' // Long-Term Low-Interest Debt
	| 'expense' // Living Expenses Node
	// Corporate Account Types
	| 'revenues'
	| 'receivables'
	| 'cogs'
	| 'hr_costs'
	| 'capex'
	| 'payables'
	| 'operating_cash_flow'
	| 'financing'
	| 'net_cash_flow'
	| 'mfs';

export interface AccountNode {
	id: string;
	name: string;
	type: AccountType;
	balance: number;
	ceiling: number; // T_over (or surplus sweep trigger)
	floor: number; // T_under (or deficit pull trigger)
	interestRate?: number;
	annualLimit?: number; // e.g. HSA $3,850, IRA $7,000, 401k $24,500
	ytdContributions: number;
	// Enterprise Metrics & Configuration
	dso?: number; // Days Sales Outstanding for Receivables
	insolvencyRisk?: number; // default risk percentage (e.g. 3.5)
	agingRisk?: { current: number; '30d': number; '60d': number; '90d+': number };
	dpoVariable?: number; // DPO for COGS (Variable Costs)
	dpoFixed?: number; // DPO for HR/Capex (Fixed Costs)
	legalEntity?: string;
	vatRate?: number; // e.g. 19.0 (%)
	factoringRate?: number; // e.g. 2.5 (%)
	loanLifetime?: number; // loan term in months
	fixedSpread?: number; // financing fixed spread %
	variableRateIndex?: number; // financing variable benchmark rate %
	loanType?: 'term' | 'revolving';
	// Income settings for Personal Mode
	grossIncome?: number; // gross amount per paycheck
	taxRate?: number; // withholding rate %
	frequency?: 'daily' | 'bi-weekly' | 'monthly';
	mortgagePayment?: number; // Fixed monthly mortgage minimum payment
	monthlyExpenses?: number; // Monthly budget/expenses for Living Expenses node
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
	type: 'ACH' | 'ACAT' | 'T1' | 'DSO' | 'DPO_COGS' | 'DPO_HR' | 'DPO_CAPEX';
	entityLabel?: string;
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

export interface HistoryDataPoint {
	day: number;
	netWorth: number;
	checking: number;
	hysa: number;
	investments: number;
	debt: number; // High-Interest Credit Card Debt only
	mortgage: number; // Mortgage Principal balance only
	// Enterprise mode values
	operatingCash?: number;
	receivables?: number;
	payables?: number;
	mfs?: number;
}

export interface SimulationState {
	day: number;
	nodes: AccountNode[];
	edges: FlowEdge[];
	holdings: SettlementHolding[];
	totalWealthAccumulated: number; // Personal wealth or Corporate total liquidity/net equity
	log: string[];
	transferHistory: TransferRecord[];
	pdtTradesToday: number;
	macroScenario: 'baseline' | 'inflation' | 'crash' | 'supply_delay';
	macroHistory: MacroDataPoint[];
	isPaused: boolean;
	checklistCompleted: boolean;
	checklistProgress: number; // progress through the questions
	// Mode configurations
	mode: 'personal' | 'enterprise';
	waterfallOrder: AccountType[];
	corporateInvoices?: Array<{
		id: string;
		amount: number;
		type: 'receivable' | 'payable';
		dueDay: number;
		paid: boolean;
	}>;
	history: HistoryDataPoint[];
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
 * Initialize default personal account nodes
 */
export function createDefaultNodes(): AccountNode[] {
	return [
		{ id: 'income', name: 'Gross Income', type: 'income', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, grossIncome: 3500, taxRate: 20, frequency: 'bi-weekly' },
		{ id: 'checking', name: 'Primary Checking', type: 'checking', balance: 4000, ceiling: 5000, floor: 1500, ytdContributions: 0 },
		{ id: 'hysa', name: 'HYSA (Emergency Fund)', type: 'hysa', balance: 5000, ceiling: 15000, floor: 0, interestRate: 4.5, ytdContributions: 0 },
		{ id: 'match401k', name: '401k (Base & Match)', type: 'match401k', balance: 2000, ceiling: 100000, floor: 0, annualLimit: 6000, ytdContributions: 2000 },
		{ id: 'debt', name: 'High-Interest Debt', type: 'debt', balance: 3500, ceiling: 0, floor: 0, interestRate: 18.0, ytdContributions: 0 },
		{ id: 'hsa', name: 'Pre-tax HSA', type: 'hsa', balance: 1000, ceiling: 4150, floor: 0, annualLimit: 4150, ytdContributions: 1000 },
		{ id: 'ira', name: 'Roth IRA', type: 'ira', balance: 3000, ceiling: 7000, floor: 0, annualLimit: 7000, ytdContributions: 3000 },
		{ id: 'max401k', name: '401k (Voluntary Max)', type: 'max401k', balance: 0, ceiling: 23000, floor: 0, annualLimit: 23000, ytdContributions: 0 },
		{ id: 'brokerage', name: 'Taxable Brokerage', type: 'brokerage', balance: 12000, ceiling: 1000000, floor: 0, ytdContributions: 0 },
		{ id: 'taxes_paid', name: 'Taxes Paid (IRS)', type: 'taxes_paid', balance: 0, ceiling: 1000000, floor: 0, ytdContributions: 0 },
		{ id: 'mortgage', name: 'Mortgage Loan', type: 'mortgage', balance: 300000, ceiling: 1000000, floor: 0, interestRate: 6.5, ytdContributions: 0, mortgagePayment: 1800 },
		{ id: 'expenses', name: 'Living Expenses', type: 'expense', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, monthlyExpenses: 2000 }
	];
}

/**
 * Initialize default enterprise corporate nodes
 */
export function createDefaultEnterpriseNodes(): AccountNode[] {
	return [
		{ id: 'revenues', name: 'Revenues Plan', type: 'revenues', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, vatRate: 19.0, factoringRate: 2.5 },
		{ id: 'receivables', name: 'Account Receivables', type: 'receivables', balance: 120000, ceiling: 0, floor: 0, ytdContributions: 0, dso: 35, insolvencyRisk: 3.5, agingRisk: { current: 1, '30d': 5, '60d': 15, '90d+': 50 } },
		{ id: 'cogs', name: 'COGS', type: 'cogs', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, dpoVariable: 45, legalEntity: 'Entity A' },
		{ id: 'hr_costs', name: 'HR Costs', type: 'hr_costs', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, dpoFixed: 30, legalEntity: 'Entity A' },
		{ id: 'capex', name: 'Capex', type: 'capex', balance: 0, ceiling: 0, floor: 0, ytdContributions: 0, dpoFixed: 60, legalEntity: 'Entity A' },
		{ id: 'payables', name: 'Account Payables', type: 'payables', balance: 80000, ceiling: 0, floor: 0, ytdContributions: 0 },
		{ id: 'operating_cash_flow', name: 'Operating Cash Flow', type: 'operating_cash_flow', balance: 100000, ceiling: 0, floor: 0, ytdContributions: 0 },
		{ id: 'financing', name: 'Strategic Financing', type: 'financing', balance: 0, ceiling: 500000, floor: 0, ytdContributions: 0, loanLifetime: 24, fixedSpread: 3.5, variableRateIndex: 4.0, loanType: 'revolving' },
		{ id: 'net_cash_flow', name: 'Net Cash Flow', type: 'net_cash_flow', balance: 75000, ceiling: 120000, floor: 30000, ytdContributions: 0 },
		{ id: 'mfs', name: 'Money Market Fund (MMF)', type: 'mfs', balance: 250000, ceiling: 5000000, floor: 0, interestRate: 4.2, ytdContributions: 0 },
		{ id: 'corp_taxes', name: 'Corporate Taxes & VAT', type: 'corp_taxes', balance: 25000, ceiling: 1000000, floor: 0, ytdContributions: 0 }
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
	const nextNodes = state.nodes.map((node) => ({ ...node }));
	let nextHoldings = state.holdings.map((h) => ({ ...h }));
	const nextTransferHistory = [...(state.transferHistory || [])];

	// Determine active mode (default to personal if not set)
	const mode = state.mode || 'personal';

	// 1. Process Macroeconomics
	let inflationRate = 2.0;
	let marketReturn = 1.0003; // daily growth ~8% annualized for personal stocks
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
			if (node.id === 'mfs') node.interestRate = 5.2; // High MMF corporate yield
		});
	} else if (state.macroScenario === 'crash') {
		inflationRate = 3.0;
		if (nextDay >= 15 && nextDay <= 35) {
			marketReturn = 0.985; // 1.5% daily crash
			eventLabel = 'Market Contraction Event';
		} else if (nextDay > 35 && nextDay <= 60) {
			marketReturn = 1.0001;
			eventLabel = 'Post-Crash Consolidation';
		} else {
			marketReturn = 1.0004;
		}
		marketIndexValue = marketIndexValue * marketReturn;
	} else if (state.macroScenario === 'supply_delay') {
		inflationRate = 4.0;
		marketReturn = 1.0001;
		eventLabel = 'Supply Chain Disruptions';
	} else {
		// Baseline growth
		marketIndexValue = marketIndexValue * marketReturn;
	}

	// 2. Fork logic by Mode
	if (mode === 'personal') {
		// --- PERSONAL WEALTH SIMULATION MODE ---
		
		// Apply market returns to equity accounts: Match401k, Workplace401kMax, RothIRA, Brokerage
		nextNodes.forEach((node) => {
			if (['match401k', 'ira', 'max401k', 'brokerage'].includes(node.type)) {
				node.balance = node.balance * marketReturn;
			}
		});

		// Behavioral Safeguard trigger: Pause on severe contraction
		let triggerPause = false;
		if (state.macroScenario === 'crash' && nextDay === 18 && !state.checklistCompleted) {
			triggerPause = true;
			nextLog.push(`Day ${nextDay}: [WARNING] Severe market contraction detected! S&P 500 dropped to ${marketIndexValue.toFixed(2)}. Simulation paused for behavioral cooling.`);
		}

		const checkingNode = nextNodes.find((n) => n.id === 'checking')!;

		// Process paycheck cycles and tax withholding to taxes_paid
		const incomeNode = nextNodes.find((n) => n.id === 'income');
		const taxesPaidNode = nextNodes.find((n) => n.id === 'taxes_paid');
		
		let isPayday = false;
		if (incomeNode && !triggerPause) {
			const freq = incomeNode.frequency || 'bi-weekly';
			if (freq === 'daily') {
				isPayday = true;
			} else if (freq === 'bi-weekly') {
				isPayday = (nextDay % 14 === 0);
			} else if (freq === 'monthly') {
				isPayday = (nextDay % 30 === 0);
			}
		}

		if (isPayday && incomeNode && !triggerPause) {
			const gross = incomeNode.grossIncome ?? 3500;
			const taxRate = incomeNode.taxRate ?? 20;
			const taxWithheld = gross * (taxRate / 100);
			const netPay = gross - taxWithheld;
			
			checkingNode.balance += netPay;
			incomeNode.balance += gross; // Increment YTD Gross Income visually on node
			if (taxesPaidNode) {
				taxesPaidNode.balance += taxWithheld;
			}
			
			nextLog.push(`Day ${nextDay}: [PAYDAY] Paycheck deposited. Gross: $${gross.toFixed(2)} | Tax Withheld: $${taxWithheld.toFixed(2)} | Net Deposit: $${netPay.toFixed(2)}.`);
		}

		// Accrue interest once every 30 days
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
				} else if (node.type === 'mortgage') {
					const interest = node.balance * monthlyRate;
					node.balance += interest;
					nextLog.push(`Day ${nextDay}: Mortgage charged $${interest.toFixed(2)} interest.`);
				}
			}
		});

		// Process clearing queue (Release holds)
		const pendingHoldings: SettlementHolding[] = [];
		if (!triggerPause) {
			nextHoldings.forEach((holding) => {
				if (holding.releaseDay <= nextDay) {
					const targetNode = nextNodes.find((n) => n.id === holding.originAccountId);
					if (targetNode) {
						if (targetNode.type === 'debt' || targetNode.type === 'mortgage') {
							targetNode.balance = Math.max(0, targetNode.balance - holding.amount);
						} else {
							targetNode.balance += holding.amount;
						}
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

		// Sweep function with compliance rules
		let pdtTradesToday = state.pdtTradesToday;
		const executeSweep = (source: AccountNode, target: AccountNode, amountToSweep: number, logMessage: string) => {
			if (amountToSweep <= 0) return;

			// A. ENFORCE IRA OUTBOUND BLOCK
			if (source.type === 'ira') {
				nextLog.push(`Day ${nextDay}: ERROR: Automated sweep from IRA to ${target.name} blocked to prevent early distribution penalties.`);
				return;
			}

			// B. ENFORCE 60-DAY AML SWEEP RESTRICTION (Bypass transactional checking)
			if (source.type !== 'checking') {
				const amlWindowStart = Math.max(0, nextDay - 60);
				const incomingTransfers = nextTransferHistory.filter(
					(record) => record.target === source.id && record.day >= amlWindowStart
				);
				if (incomingTransfers.length > 0) {
					const isReturnToOrigin = incomingTransfers.some((record) => record.source === target.id);
					if (!isReturnToOrigin) {
						nextLog.push(`Day ${nextDay}: [AML RESTRICTION] Blocked sweep of $${amountToSweep.toFixed(2)} from ${source.name} to ${target.name}. Within 60 days, funds can only return to their originating account.`);
						return;
					}
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
			
			// If holds apply
			let holdType: 'ACH' | 'ACAT' | 'T1' = 'T1';
			let delay = 1;

			if (source.type === 'checking' && target.type === 'brokerage') {
				holdType = 'ACH';
				delay = 6;
			} else if (source.type === 'brokerage' && target.type === 'checking') {
				holdType = 'ACAT';
				delay = 15;
			} else if (
				(source.type === 'hysa' && target.type === 'checking') ||
				(source.type === 'checking' && target.type === 'hysa')
			) {
				delay = 0;
			}

			// Record transfer details
			nextTransferHistory.push({
				day: nextDay,
				source: source.id,
				target: target.id,
				amount: amountToSweep
			});

			if (target.annualLimit !== undefined) {
				target.ytdContributions += amountToSweep;
			}

			if (delay === 0) {
				if (target.type === 'debt' || target.type === 'mortgage') {
					target.balance = Math.max(0, target.balance - amountToSweep);
				} else {
					target.balance += amountToSweep;
				}
				nextLog.push(`Day ${nextDay}: ${logMessage} (Settled instantly).`);
			} else {
				nextHoldings.push({
					amount: amountToSweep,
					originAccountId: target.id,
					releaseDay: nextDay + delay,
					type: holdType
				});
				nextLog.push(`Day ${nextDay}: ${logMessage} (Enforced ${holdType} hold of ${delay} days).`);
			}
		};

		// Process monthly mortgage payment once every 30 days
		if (nextDay % 30 === 0 && !triggerPause) {
			const mortgageNode = nextNodes.find((n) => n.type === 'mortgage');
			if (mortgageNode && mortgageNode.balance > 0) {
				const payment = mortgageNode.mortgagePayment ?? 1800;
				const actualPayment = Math.min(payment, mortgageNode.balance);
				if (actualPayment > 0) {
					checkingNode.balance -= actualPayment;
					mortgageNode.balance -= actualPayment;
					nextLog.push(`Day ${nextDay}: [MORTGAGE] Auto-debited monthly mortgage payment of $${actualPayment.toFixed(2)} from Checking. Remaining principal: $${mortgageNode.balance.toFixed(2)}.`);
				}
			}
		}

		// Process monthly living expenses once every 30 days
		if (nextDay % 30 === 0 && !triggerPause) {
			const expensesNode = nextNodes.find((n) => n.id === 'expenses');
			if (expensesNode) {
				const expensesAmount = expensesNode.monthlyExpenses !== undefined ? expensesNode.monthlyExpenses : 2000;
				if (expensesAmount > 0) {
					checkingNode.balance -= expensesAmount;
					expensesNode.balance += expensesAmount; // Accumulate YTD spending
					nextLog.push(`Day ${nextDay}: [EXPENSES] Auto-debited monthly living expenses of $${expensesAmount.toFixed(2)} from Checking.`);
				}
			}
		}

		// Deficit pull (underbalance checking)
		if (checkingNode.balance < checkingNode.floor && !triggerPause) {
			const deficit = checkingNode.floor - checkingNode.balance;
			const hysaNode = nextNodes.find((n) => n.type === 'hysa');
			if (hysaNode && hysaNode.balance > 0) {
				const pullAmount = Math.min(deficit, hysaNode.balance);
				executeSweep(hysaNode, checkingNode, pullAmount, `Underbalance sweep: Restored checking floor by pulling $${pullAmount.toFixed(2)} from HYSA.`);
			}
		}

		// Surplus sweeps (overbalance checking)
		if (checkingNode.balance > checkingNode.ceiling && !triggerPause) {
			let surplus = checkingNode.balance - checkingNode.ceiling;
			
			const activeOrder = state.waterfallOrder || WATERFALL_ORDER;
			for (const type of activeOrder) {
				if (surplus <= 0) break;
				
				const targetNode = nextNodes.find((n) => n.type === type);
				if (!targetNode) continue;

				let capacity = Infinity;
				if (targetNode.annualLimit !== undefined) {
					capacity = Math.max(0, targetNode.annualLimit - targetNode.ytdContributions);
				}
				if (type === 'hysa') {
					capacity = Math.max(0, targetNode.ceiling - targetNode.balance);
				} else if (type === 'debt') {
					capacity = targetNode.balance;
				}

				if (capacity > 0) {
					const sweepAmt = Math.min(surplus, capacity);
					if (sweepAmt > 0) {
						executeSweep(checkingNode, targetNode, sweepAmt, `Overbalance sweep: Routed $${sweepAmt.toFixed(2)} surplus to ${targetNode.name}.`);
						surplus -= sweepAmt;
					}
				}
			}
		}

		// Calculate total wealth
		let totalWealth = 0;
		nextNodes.forEach((node) => {
			if (node.type === 'debt' || node.type === 'mortgage') {
				totalWealth -= node.balance;
			} else if (['checking', 'hysa', 'match401k', 'hsa', 'ira', 'max401k', 'brokerage'].includes(node.type)) {
				totalWealth += node.balance;
			}
		});

		// Include personal funds currently in transit (settlement holds)
		nextHoldings.forEach((holding) => {
			if (['ACH', 'ACAT', 'T1'].includes(holding.type)) {
				totalWealth += holding.amount;
			}
		});

		const invSum = nextNodes
			.filter(n => ['match401k', 'hsa', 'ira', 'max401k', 'brokerage'].includes(n.type))
			.reduce((sum, n) => sum + n.balance, 0);

		const ccDebt = nextNodes.find(n => n.type === 'debt')?.balance || 0;
		const mortgageBal = nextNodes.find(n => n.type === 'mortgage')?.balance || 0;

		const hysaBal = nextNodes.find(n => n.type === 'hysa')?.balance || 0;
		const checkingBal = checkingNode.balance;

		const personalHistoryPoint: HistoryDataPoint = {
			day: nextDay,
			netWorth: totalWealth,
			checking: checkingBal,
			hysa: hysaBal,
			investments: invSum,
			debt: ccDebt,
			mortgage: mortgageBal
		};

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
			macroHistory: [...(state.macroHistory || []), { day: nextDay, inflationRate, marketReturn, marketIndexValue, eventLabel }],
			isPaused: triggerPause || state.isPaused,
			checklistCompleted: state.checklistCompleted,
			checklistProgress: state.checklistProgress,
			mode,
			waterfallOrder: state.waterfallOrder,
			history: [...(state.history || []), personalHistoryPoint]
		};

	} else {
		// --- ENTERPRISE CFO SIMULATION ROOM MODE ---

		const revenuesNode = nextNodes.find((n) => n.id === 'revenues')!;
		const receivablesNode = nextNodes.find((n) => n.id === 'receivables')!;
		const cogsNode = nextNodes.find((n) => n.id === 'cogs')!;
		const hrNode = nextNodes.find((n) => n.id === 'hr_costs')!;
		const capexNode = nextNodes.find((n) => n.id === 'capex')!;
		const payablesNode = nextNodes.find((n) => n.id === 'payables')!;
		const operatingNode = nextNodes.find((n) => n.id === 'operating_cash_flow')!;
		const financingNode = nextNodes.find((n) => n.id === 'financing')!;
		const netCashNode = nextNodes.find((n) => n.id === 'net_cash_flow')!;
		const mfsNode = nextNodes.find((n) => n.id === 'mfs')!;

		// A. Process daily drivers under macroeconomic shocks
		let baseDailyRevenue = dailyIncome * 50; // default corporate scale multiplier
		let baseDailyCOGS = dailyIncome * 20;
		let baseDailyHR = dailyIncome * 15;
		let baseDailyCapex = dailyIncome * 5;

		if (state.macroScenario === 'inflation') {
			// Inflation spikes HR costs/salaries by 15%, capex by 10%
			baseDailyHR *= 1.15;
			baseDailyCapex *= 1.10;
		}

		if (state.macroScenario === 'supply_delay') {
			// Supply chain delay increases COGS by 20%, reduces revenue by 10%
			baseDailyCOGS *= 1.20;
			baseDailyRevenue *= 0.90;
		}

		// Adjust DSO/DPO variables based on scenario
		let dsoVal = receivablesNode.dso || 35;
		let dpoCogsVal = cogsNode.dpoVariable || 45;
		let dpoHRVal = hrNode.dpoFixed || 30;
		let dpoCapexVal = capexNode.dpoFixed || 60;

		if (state.macroScenario === 'supply_delay') {
			// Supply delays visually delay receivables (DSO + 15 days)
			dsoVal += 15;
		}

		// Set current values for tracking UI parameters
		receivablesNode.dso = dsoVal;
		cogsNode.dpoVariable = dpoCogsVal;
		hrNode.dpoFixed = dpoHRVal;
		capexNode.dpoFixed = dpoCapexVal;

		// VAT computation
		const vatRate = revenuesNode.vatRate || 19.0;
		const vatMultiplier = 1 + (vatRate / 100);

		// Record daily generation metrics in balance sheet nodes for visual representation
		revenuesNode.balance += baseDailyRevenue;
		cogsNode.balance += baseDailyCOGS;
		hrNode.balance += baseDailyHR;
		capexNode.balance += baseDailyCapex;

		// Compute VAT and Corporate Income Tax provisions
		const vatAmountOnSales = baseDailyRevenue * (vatRate / 100);
		const vatCreditOnExpenses = (baseDailyCOGS + baseDailyCapex) * 0.15; // 15% VAT inputs credit
		const netVatLiability = vatAmountOnSales - vatCreditOnExpenses;
		const corporateNetMargin = baseDailyRevenue - baseDailyCOGS - baseDailyHR - baseDailyCapex;
		const corpIncomeTaxProvision = Math.max(0, corporateNetMargin * 0.20); // 20% profit tax
		const totalDailyTaxAccrued = netVatLiability + corpIncomeTaxProvision;

		const corpTaxesNode = nextNodes.find((n) => n.id === 'corp_taxes');
		if (corpTaxesNode) {
			corpTaxesNode.balance += totalDailyTaxAccrued;
		}

		// B. Receivables Revenue Pipeline (either factoring or DSO hold)
		const factoringRate = revenuesNode.factoringRate || 2.5;
		const useFactoring = state.edges.some(e => e.source === 'revenues' && e.target === 'operating_cash_flow');
		
		const grossReceivableAmount = baseDailyRevenue * vatMultiplier;

		if (useFactoring) {
			// Factoring: Liquidate 97.5% instantly into Operating Cash Flow, fee (2.5%) lost
			const factoredCash = grossReceivableAmount * (1 - (factoringRate / 100));
			operatingNode.balance += factoredCash;
			nextLog.push(`Day ${nextDay}: Factored revenue of $${factoredCash.toFixed(2)} cash received instantly (Fee paid: $${(grossReceivableAmount - factoredCash).toFixed(2)}).`);
		} else {
			// Default DSO track: Add to receivables outstanding, trigger DSO release hold
			receivablesNode.balance += grossReceivableAmount;
			
			// Insolvency defaults reduction
			const insolvRisk = receivablesNode.insolvencyRisk || 3.5;
			const netCollected = grossReceivableAmount * (1 - (insolvRisk / 100));

			nextHoldings.push({
				amount: netCollected,
				originAccountId: 'operating_cash_flow',
				releaseDay: nextDay + dsoVal,
				type: 'DSO'
			});
		}

		// C. Payables cost pipeline (COGS/HR/Capex scheduled via DPO)
		const variablesTaxMultiplier = 1.15; // approximate VAT inputs credit
		const rawCOGSAccrued = baseDailyCOGS * variablesTaxMultiplier;
		const rawHRAccrued = baseDailyHR; // HR costs generally have no VAT
		const rawCapexAccrued = baseDailyCapex * variablesTaxMultiplier;

		payablesNode.balance += (rawCOGSAccrued + rawHRAccrued + rawCapexAccrued);

		// Schedule DPO releases
		nextHoldings.push({
			amount: rawCOGSAccrued,
			originAccountId: 'operating_cash_flow_minus_cogs', // visual tag
			releaseDay: nextDay + dpoCogsVal,
			type: 'DPO_COGS',
			entityLabel: cogsNode.legalEntity
		});
		nextHoldings.push({
			amount: rawHRAccrued,
			originAccountId: 'operating_cash_flow_minus_hr',
			releaseDay: nextDay + dpoHRVal,
			type: 'DPO_HR',
			entityLabel: hrNode.legalEntity
		});
		nextHoldings.push({
			amount: rawCapexAccrued,
			originAccountId: 'operating_cash_flow_minus_capex',
			releaseDay: nextDay + dpoCapexVal,
			type: 'DPO_CAPEX',
			entityLabel: capexNode.legalEntity
		});

		// D. Process clearing holdings
		const pendingHoldings: SettlementHolding[] = [];
		nextHoldings.forEach((holding) => {
			if (holding.releaseDay <= nextDay) {
				if (holding.type === 'DSO') {
					// Cash collected
					operatingNode.balance += holding.amount;
					receivablesNode.balance = Math.max(0, receivablesNode.balance - holding.amount);
					nextLog.push(`Day ${nextDay}: Collected accounts receivable of $${holding.amount.toFixed(2)} after DSO hold.`);
				} else if (holding.type === 'DPO_COGS' || holding.type === 'DPO_HR' || holding.type === 'DPO_CAPEX') {
					// Bills paid from operating cash flow / net cash flow
					const payment = holding.amount;
					operatingNode.balance -= payment;
					payablesNode.balance = Math.max(0, payablesNode.balance - payment);
					
					// Visually register on net cash flow
					netCashNode.balance -= payment;
					nextLog.push(`Day ${nextDay}: Corporate payout for ${holding.type} ($${payment.toFixed(2)}) disbursed from treasury.`);
				}
			} else {
				pendingHoldings.push(holding);
			}
		});
		nextHoldings = pendingHoldings;

		// Move operating cash flow balance into Net Cash Flow on clock cycle
		if (operatingNode.balance !== 0) {
			const shift = operatingNode.balance;
			operatingNode.balance = 0;
			netCashNode.balance += shift;
		}

		// E. Active Treasury Management MMF Sweeping (Ceiling triggers)
		if (netCashNode.balance > netCashNode.ceiling) {
			const surplus = netCashNode.balance - netCashNode.ceiling;
			netCashNode.balance -= surplus;
			mfsNode.balance += surplus;
			nextLog.push(`Day ${nextDay}: [TREASURY SWEEP] Idle corporate surplus of $${surplus.toFixed(2)} swept to MMF (reducing cash drag).`);
		}

		// F. Strategic Financing Drawdown (Floor triggers)
		if (netCashNode.balance < netCashNode.floor) {
			const deficit = netCashNode.floor - netCashNode.balance;
			const maxFinancingDraw = financingNode.ceiling - financingNode.balance;
			if (maxFinancingDraw > 0) {
				const drawAmt = Math.min(deficit, maxFinancingDraw);
				financingNode.balance += drawAmt;
				netCashNode.balance += drawAmt;
				nextLog.push(`Day ${nextDay}: [STRATEGIC DRAW] Drew $${drawAmt.toFixed(2)} from Credit Line to protect corporate floor liquidity.`);
			} else {
				nextLog.push(`Day ${nextDay}: [LIQUIDITY ALERT] Net cash is below safety floor of $${netCashNode.floor.toFixed(2)} and financing capacity is exhausted!`);
			}
		}

		// G. Strategic Financing Interest & Yield Accruals (Every 30 Days)
		if (nextDay % 30 === 0) {
			// Yield on MMF
			const yieldRate = (mfsNode.interestRate || 4.2) / 100 / 12;
			const yieldEarned = mfsNode.balance * yieldRate;
			mfsNode.balance += yieldEarned;
			nextLog.push(`Day ${nextDay}: MMF Treasury accrued interest yield of $${yieldEarned.toFixed(2)}.`);

			// Cost of Financing
			if (financingNode.balance > 0) {
				const spread = financingNode.fixedSpread || 3.5;
				const variable = financingNode.variableRateIndex || 4.0;
				const interestRate = (spread + variable) / 100 / 12;
				const charges = financingNode.balance * interestRate;
				financingNode.balance += charges;
				nextLog.push(`Day ${nextDay}: Strategic Financing credit line charged interest fee of $${charges.toFixed(2)}.`);
			}
		}

		// Calculate total corporate asset value (total liquidity)
		const totalLiquidity = netCashNode.balance + mfsNode.balance + receivablesNode.balance - payablesNode.balance - financingNode.balance;

		const corpHistoryPoint: HistoryDataPoint = {
			day: nextDay,
			netWorth: totalLiquidity,
			checking: 0,
			hysa: 0,
			investments: 0,
			debt: 0,
			mortgage: 0,
			operatingCash: netCashNode.balance,
			receivables: receivablesNode.balance,
			payables: payablesNode.balance,
			mfs: mfsNode.balance
		};

		return {
			day: nextDay,
			nodes: nextNodes,
			edges: state.edges,
			holdings: nextHoldings,
			totalWealthAccumulated: totalLiquidity,
			log: [...state.log, ...nextLog].slice(-100),
			transferHistory: nextTransferHistory,
			pdtTradesToday: 0,
			macroScenario: state.macroScenario,
			macroHistory: [...(state.macroHistory || []), { day: nextDay, inflationRate, marketReturn, marketIndexValue, eventLabel }],
			isPaused: state.isPaused,
			checklistCompleted: state.checklistCompleted,
			checklistProgress: state.checklistProgress,
			mode,
			waterfallOrder: state.waterfallOrder,
			history: [...(state.history || []), corpHistoryPoint]
		};
	}
}
