import type { SimulationState } from './moneyFlowEngine';

export interface ScriptRule {
	id: string;
	name: string;
	description: string;
	conditionStr: string; // e.g. "sp500 < 4500" or "debt > 1000"
	actionStr: string; // e.g. "checking [1000] brokerage" or "set checking ceiling 2500"
	isActive: boolean;
}

/**
 * Checks if a condition is met in the current simulation state
 */
export function evaluateCondition(conditionStr: string, state: SimulationState): boolean {
	const clean = conditionStr.trim().toLowerCase();
	
	// Fetch variables
	const checking = state.nodes.find(n => n.id === 'checking')?.balance || 0;
	const debt = state.nodes.find(n => n.id === 'debt')?.balance || 0;
	const hysa = state.nodes.find(n => n.id === 'hysa')?.balance || 0;
	const sp500 = state.macroHistory.length > 0 
		? state.macroHistory[state.macroHistory.length - 1].marketIndexValue 
		: 5000;

	// Regex match: [variable] [operator] [value]
	const match = clean.match(/^(checking|debt|hysa|sp500)\s*(<|>|<=|>=|==)\s*([0-9\.]+)/);
	if (!match) return false;

	const variable = match[1];
	const operator = match[2];
	const value = parseFloat(match[3]);

	let currentVal = 0;
	if (variable === 'checking') currentVal = checking;
	if (variable === 'debt') currentVal = debt;
	if (variable === 'hysa') currentVal = hysa;
	if (variable === 'sp500') currentVal = sp500;

	switch (operator) {
		case '<': return currentVal < value;
		case '>': return currentVal > value;
		case '<=': return currentVal <= value;
		case '>=': return currentVal >= value;
		case '==': return currentVal === value;
		default: return false;
	}
}

/**
 * Get default presets for the scripting engine
 */
export function createDefaultRules(): ScriptRule[] {
	return [
		{
			id: 'rule-1',
			name: 'Buy the Dip Indicator',
			description: 'If S&P 500 drops below 4300, aggressively route an extra $1,200 to taxable brokerage.',
			conditionStr: 'sp500 < 4300',
			actionStr: 'checking [1200] brokerage',
			isActive: false
		},
		{
			id: 'rule-2',
			name: 'Aggressive Debt Paydown',
			description: 'If credit card debt exceeds $1,000, trigger emergency $1,500 sweeps from Checking.',
			conditionStr: 'debt > 1000',
			actionStr: 'checking [1500] debt',
			isActive: false
		}
	];
}
