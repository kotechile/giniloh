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
	let currentStr = conditionStr.trim().toLowerCase();
	
	// Resolve parenthesized expressions recursively
	while (true) {
		const parenMatch = currentStr.match(/\(([^()]+)\)/);
		if (!parenMatch) break;
		const subExpr = parenMatch[1];
		const res = evaluateLogicalExpressionWithoutParens(subExpr, state);
		currentStr = currentStr.replace(parenMatch[0], res ? 'true' : 'false');
	}
	
	return evaluateLogicalExpressionWithoutParens(currentStr, state);
}

function evaluateLogicalExpressionWithoutParens(exprStr: string, state: SimulationState): boolean {
	let str = exprStr.toLowerCase()
		.replace(/\bunless\b/g, 'and not')
		.replace(/&&/g, 'and')
		.replace(/\|\|/g, 'or')
		.replace(/!/g, 'not ');

	const orParts = str.split(/\bor\b/);
	return orParts.some(orPart => {
		const andParts = orPart.split(/\band\b/);
		return andParts.every(andPart => {
			let trimmed = andPart.trim();
			let isNegated = false;
			if (trimmed.startsWith('not ')) {
				isNegated = true;
				trimmed = trimmed.substring(4).trim();
			}
			const val = evaluateSimpleCondition(trimmed, state);
			return isNegated ? !val : val;
		});
	});
}

function evaluateSimpleCondition(expr: string, state: SimulationState): boolean {
	const trimmed = expr.trim();
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	
	const checking = state.nodes.find(n => n.id === 'checking')?.balance || 0;
	const debt = state.nodes.find(n => n.id === 'debt')?.balance || 0;
	const hysa = state.nodes.find(n => n.id === 'hysa')?.balance || 0;
	const sp500 = state.macroHistory.length > 0 
		? state.macroHistory[state.macroHistory.length - 1].marketIndexValue 
		: 5000;
	const day = state.day;
	const is_friday = (state.day % 7 === 5);

	if (trimmed === 'is_friday') return is_friday;

	// Matches e.g., variable operator value
	const match = trimmed.match(/^(checking|debt|hysa|sp500|day\s*%\s*\d+|day|is_friday)\s*(<|>|<=|>=|==|!=)\s*([0-9\.\-]+|true|false)/);
	if (!match) return false;

	const lhs = match[1].replace(/\s+/g, '');
	const op = match[2];
	const rhs = match[3];

	let lhsVal = 0;
	if (lhs === 'checking') lhsVal = checking;
	else if (lhs === 'debt') lhsVal = debt;
	else if (lhs === 'hysa') lhsVal = hysa;
	else if (lhs === 'sp500') lhsVal = sp500;
	else if (lhs === 'day') lhsVal = day;
	else if (lhs === 'is_friday') lhsVal = is_friday ? 1 : 0;
	else if (lhs.startsWith('day%')) {
		const divisor = parseInt(lhs.split('%')[1]);
		lhsVal = day % divisor;
	}

	let rhsVal = 0;
	if (rhs === 'true') rhsVal = 1;
	else if (rhs === 'false') rhsVal = 0;
	else rhsVal = parseFloat(rhs);

	switch (op) {
		case '<': return lhsVal < rhsVal;
		case '>': return lhsVal > rhsVal;
		case '<=': return lhsVal <= rhsVal;
		case '>=': return lhsVal >= rhsVal;
		case '==': return lhsVal === rhsVal;
		case '!=': return lhsVal !== rhsVal;
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
		},
		{
			id: 'rule-3',
			name: 'Lifestyle Booster',
			description: 'If debt is fully paid off, increase Checking ceiling to $3,500 to allow for more lifestyle flexibility.',
			conditionStr: 'debt == 0',
			actionStr: 'set checking ceiling 3500',
			isActive: false
		},
		{
			id: 'rule-4',
			name: 'Emergency Fund Overflow',
			description: 'If HYSA emergency savings exceed $10,000, automatically reorder the savings waterfall to prioritize stock market investments.',
			conditionStr: 'hysa >= 10000',
			actionStr: 'reorder match401k, hsa, ira, max401k, brokerage, hysa, debt',
			isActive: false
		},
		{
			id: 'rule-5',
			name: 'Monthly Roth IRA Auto-Pilot',
			description: 'Automatically invest a fixed $500 monthly from Checking to Roth IRA.',
			conditionStr: 'day % 30 == 0',
			actionStr: 'checking [500] ira',
			isActive: false
		},
		{
			id: 'rule-6',
			name: 'Weekend Discretionary Sweep',
			description: 'Every Friday, route $150 from Checking to Living Expenses to set aside discretionary cash.',
			conditionStr: 'is_friday',
			actionStr: 'checking [150] expenses',
			isActive: false
		},
		{
			id: 'rule-7',
			name: 'Dry Powder Accumulator',
			description: 'If S&P 500 falls below 4000 and you have >$6,000 in HYSA, pull $2,000 to buy cheap brokerage assets.',
			conditionStr: 'sp500 < 4000 and hysa > 6000',
			actionStr: 'hysa [2000] brokerage',
			isActive: false
		}
	];
}
