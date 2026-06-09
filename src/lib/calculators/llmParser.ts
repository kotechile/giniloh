/**
 * LLM Natural Language Wrapper / Parser
 * 
 * Translates conversational inputs like "send $500 from checking to emergency fund"
 * into the simulator's internal command syntax (e.g. "checking [500] hysa").
 */

// Normalized account aliases to resolve user speech to account IDs
const ACCOUNT_ALIASES: Record<string, string> = {
	checking: 'checking',
	'primary checking': 'checking',
	'checking account': 'checking',
	hysa: 'hysa',
	'emergency fund': 'hysa',
	'savings': 'hysa',
	'savings account': 'hysa',
	'high yield savings': 'hysa',
	match401k: 'match401k',
	'401k match': 'match401k',
	'employer match': 'match401k',
	debt: 'debt',
	'credit card': 'debt',
	'high-interest debt': 'debt',
	'loan': 'debt',
	hsa: 'hsa',
	'health savings': 'hsa',
	ira: 'ira',
	'roth ira': 'ira',
	max401k: 'max401k',
	'401k max': 'max401k',
	'workplace 401k': 'max401k',
	brokerage: 'brokerage',
	'taxable brokerage': 'brokerage',
	'investments': 'brokerage',
	'stocks': 'brokerage',
	mortgage: 'mortgage',
	'home loan': 'mortgage',
	'house loan': 'mortgage',
	'mortgage payment': 'mortgage',
	// Corporate Account Aliases
	revenues: 'revenues',
	'revenue plan': 'revenues',
	revenue: 'revenues',
	sales: 'revenues',
	receivables: 'receivables',
	'account receivables': 'receivables',
	cogs: 'cogs',
	'cost of goods': 'cogs',
	'cost of goods sold': 'cogs',
	'hr costs': 'hr_costs',
	'hr': 'hr_costs',
	salaries: 'hr_costs',
	payroll: 'hr_costs',
	capex: 'capex',
	'capital expenditures': 'capex',
	payables: 'payables',
	'account payables': 'payables',
	'operating cash flow': 'operating_cash_flow',
	'operating cash': 'operating_cash_flow',
	financing: 'financing',
	'credit line': 'financing',
	'net cash flow': 'net_cash_flow',
	'net cash': 'net_cash_flow',
	mfs: 'mfs',
	'money market': 'mfs',
	'money market fund': 'mfs',
	'treasury fund': 'mfs'
};

/**
 * Local regex-based parser used as fallback
 */
function localRegexParse(prompt: string): string | null {
	const text = prompt.toLowerCase().trim();

	if (text === 'reset' || text === 'reset system' || text === 'start over') {
		return 'reset';
	}
	if (text === 'clear' || text === 'clear console') {
		return 'clear';
	}
	if (text === 'help' || text === 'what can i say' || text === 'commands') {
		return 'help';
	}

	// 0. Match qualitative priority sweeps locally
	if (text.includes('prioritize debt') || text.includes('pay off debt') || text.includes('debt reduction')) {
		return 'reorder debt, hysa, match401k, hsa, ira, max401k, brokerage; set checking ceiling 2000';
	}
	if (text.includes('prioritize savings') || text.includes('emergency savings') || text.includes('save more')) {
		return 'reorder hysa, match401k, debt, hsa, ira, max401k, brokerage; set checking ceiling 4000';
	}
	if (text.includes('prioritize invest') || text.includes('stock market') || text.includes('investing')) {
		return 'reorder match401k, hysa, hsa, ira, max401k, brokerage, debt; set checking ceiling 3000';
	}

	// 1. Match set parameters e.g., "set checking ceiling to 6000" or "set checking floor to 2000"
	// matches: set [account] [field] (to) [value]
	const setRegex = /set\s+([a-zA-Z0-9\s\-\(\)_]+?)\s+(balance|ceiling|floor|threshold|dso|dpo|risk|spread|grossincome|gross\s+income|taxrate|tax\s+rate|frequency|interestrate|interest\s+rate|mortgagepayment|mortgage\s+payment)\s*(?:to)?\s*\$?([0-9\.,a-zA-Z\-]+)/i;
	const setMatch = text.match(setRegex);
	if (setMatch) {
		const accountRaw = setMatch[1].trim();
		let field = setMatch[2].trim().replace(/\s+/g, '').toLowerCase();
		const val = setMatch[3].trim();
		
		if (field === 'threshold') field = 'ceiling'; // default threshold to ceiling
		if (field === 'dpo') field = 'dpoVariable'; // default dpo variable
		if (field === 'grossincome') field = 'grossIncome';
		if (field === 'taxrate') field = 'taxRate';
		if (field === 'interestrate') field = 'interestRate';
		if (field === 'mortgagepayment') field = 'mortgagePayment';

		// resolve account alias
		const nodeId = ACCOUNT_ALIASES[accountRaw] || accountRaw;
		return `set ${nodeId} ${field} ${val}`;
	}

	// 2. Match sweep commands e.g., "send $500 from checking to hysa" or "route 1000 from checking to brokerage"
	// matches: (send/sweep/route/transfer) [amount] (from) [source] (to) [target]
	const sweepRegex = /(?:send|sweep|route|transfer|move)\s*\$?([0-9\.,]+)\s*(?:from)?\s+([a-zA-Z0-9\s\-\(\)_]+?)\s+to\s+([a-zA-Z0-9\s\-\(\)_]+)/i;
	const sweepMatch = text.match(sweepRegex);
	if (sweepMatch) {
		const amount = parseFloat(sweepMatch[1].replace(/,/g, ''));
		const sourceRaw = sweepMatch[2].trim();
		const targetRaw = sweepMatch[3].trim();

		const sourceId = ACCOUNT_ALIASES[sourceRaw] || sourceRaw;
		const targetId = ACCOUNT_ALIASES[targetRaw] || targetRaw;

		return `${sourceId} [${amount}] ${targetId}`;
	}

	// 3. Alternative sweep e.g., "checking to hysa $500"
	const altSweepRegex = /([a-zA-Z0-9\s\-\(\)_]+?)\s+to\s+([a-zA-Z0-9\s\-\(\)_]+?)\s*(?:for)?\s*\$?([0-9\.,]+)/i;
	const altMatch = text.match(altSweepRegex);
	if (altMatch) {
		const sourceRaw = altMatch[1].trim();
		const targetRaw = altMatch[2].trim();
		const amount = parseFloat(altMatch[3].replace(/,/g, ''));

		const sourceId = ACCOUNT_ALIASES[sourceRaw] || sourceRaw;
		const targetId = ACCOUNT_ALIASES[targetRaw] || targetRaw;

		return `${sourceId} [${amount}] ${targetId}`;
	}

	return null;
}

/**
 * Main parse method. Tries LLM query if keys are present; falls back to local parser.
 */
export async function parseNaturalLanguage(prompt: string): Promise<{ command: string; explanation: string }> {
	const localCmd = localRegexParse(prompt);
	if (localCmd) {
		return {
			command: localCmd,
			explanation: `[Local Natural Language Parser] Successfully translated "${prompt}" to native syntax: "${localCmd}".`
		};
	}

	const geminiApiKey = typeof process !== 'undefined' ? process.env?.PUBLIC_GEMINI_API_KEY : undefined;
	const deepseekApiKey = typeof process !== 'undefined' ? process.env?.PUBLIC_DEEPSEEK_API_KEY : undefined;

	const promptSystemText = `You are an API translation layer. Translate user requests into commands for a finance simulator.
Available commands:
1. "Source [Amount] Target" (e.g. "checking [3000] hysa", "revenues [10] operating_cash_flow")
2. "set [node] [balance|ceiling|floor|dso|dpoVariable|dpoFixed|fixedSpread|grossIncome|taxRate|frequency] [value]" (e.g. "set checking ceiling 6000", "set receivables dso 45", "set income grossIncome 5000")
3. "reorder [comma-separated account types]" (e.g. "reorder debt, hysa, match401k, hsa, ira, max401k, brokerage" to prioritize debt paydown over HYSA)
4. "reset"
5. "clear"

Available account IDs (Personal & Corporate): 
checking, hysa, match401k, debt, hsa, ira, max401k, brokerage, income, taxes_paid, corp_taxes,
revenues, receivables, cogs, hr_costs, capex, payables, operating_cash_flow, financing, net_cash_flow, mfs.

QUALITATIVE INTENTS & BATCHING:
If the user expresses a qualitative intent like "prioritize debt" or "focus on emergency savings" or "invest checking surplus in stocks", output a sequence of semicolon-separated commands that configure the simulator parameters to align with their goal. E.g.:
- "prioritize debt paydown" -> "reorder debt, hysa, match401k, hsa, ira, max401k, brokerage; set checking ceiling 2000"
- "focus on emergency savings" -> "reorder hysa, match401k, debt, hsa, ira, max401k, brokerage; set checking ceiling 4000; set hysa ceiling 20000"
- "invest in stocks and market" -> "reorder match401k, hysa, hsa, ira, max401k, brokerage, debt; set checking ceiling 3000"

Translate the user request: "${prompt}"
Return raw command output (can be semicolon-separated for multiple operations) on the first line, followed by a short explanation on the second line.`;

	if (deepseekApiKey) {
		try {
			const response = await fetch('https://api.deepseek.com/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${deepseekApiKey}`
				},
				body: JSON.stringify({
					model: 'deepseek-chat',
					messages: [{ role: 'user', content: promptSystemText }],
					temperature: 0.0
				})
			});
			const data = await response.json();
			const text = data.choices?.[0]?.message?.content || '';
			const lines = text.trim().split('\n');
			if (lines.length > 0 && lines[0].trim()) {
				return {
					command: lines[0].trim(),
					explanation: lines[1] ? lines[1].trim() : 'Translated via DeepSeek.'
				};
			}
		} catch (e) {
			console.warn('DeepSeek API query failed, trying other backends.', e);
		}
	}

	if (geminiApiKey) {
		try {
			const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{
						parts: [{ text: promptSystemText }]
					}]
				})
			});
			const data = await response.json();
			const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
			const lines = text.trim().split('\n');
			if (lines.length > 0 && lines[0].trim()) {
				return {
					command: lines[0].trim(),
					explanation: lines[1] ? lines[1].trim() : 'Translated via Gemini.'
				};
			}
		} catch (e) {
			console.warn('Gemini API query failed, falling back to local heuristic.', e);
		}
	}

	return {
		command: 'help',
		explanation: `I couldn't fully map "${prompt}" to an automation command. Try saying: "Sweep 500 from checking to HYSA", "Set receivables DSO to 45", or "Revenues to Operating Cash Flow 10".`
	};
}
