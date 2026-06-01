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
	'stocks': 'brokerage'
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

	// 1. Match set parameters e.g., "set checking ceiling to 6000" or "set checking floor to 2000"
	// matches: set [account] [field] (to) [value]
	const setRegex = /set\s+([a-zA-Z0-9\s\-\(\)]+?)\s+(balance|ceiling|floor|threshold)\s*(?:to)?\s*\$?([0-9\.,]+)/i;
	const setMatch = text.match(setRegex);
	if (setMatch) {
		const accountRaw = setMatch[1].trim();
		let field = setMatch[2].trim();
		const val = parseFloat(setMatch[3].replace(/,/g, ''));
		
		if (field === 'threshold') field = 'ceiling'; // default threshold to ceiling

		// resolve account alias
		const nodeId = ACCOUNT_ALIASES[accountRaw] || accountRaw;
		return `set ${nodeId} ${field} ${val}`;
	}

	// 2. Match sweep commands e.g., "send $500 from checking to hysa" or "route 1000 from checking to brokerage"
	// matches: (send/sweep/route/transfer) [amount] (from) [source] (to) [target]
	const sweepRegex = /(?:send|sweep|route|transfer|move)\s*\$?([0-9\.,]+)\s*(?:from)?\s+([a-zA-Z0-9\s\-\(\)]+?)\s+to\s+([a-zA-Z0-9\s\-\(\)]+)/i;
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
	const altSweepRegex = /([a-zA-Z0-9\s\-\(\)]+?)\s+to\s+([a-zA-Z0-9\s\-\(\)]+?)\s*(?:for)?\s*\$?([0-9\.,]+)/i;
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

	// Simulated low-cost LLM API query (in production, fetch/endpoint can be called)
	// We check for environment keys
	const geminiApiKey = typeof process !== 'undefined' ? process.env?.PUBLIC_GEMINI_API_KEY : undefined;
	const deepseekApiKey = typeof process !== 'undefined' ? process.env?.PUBLIC_DEEPSEEK_API_KEY : undefined;

	const promptSystemText = `You are an API translation layer. Translate user requests into commands for a finance simulator.
Available commands:
1. "Source [Amount] Target" (e.g. "checking [3000] hysa", "checking [1000] brokerage")
2. "set [node] [balance|ceiling|floor] [value]" (e.g. "set checking ceiling 6000")
3. "reset"
4. "clear"

Available account IDs: checking, hysa, match401k, debt, hsa, ira, max401k, brokerage.

Translate the user request: "${prompt}"
Return raw command output on the first line, followed by a short explanation on the second line.`;

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

	// Default fallback explanation when heuristics don't match
	return {
		command: 'help',
		explanation: `I couldn't fully map "${prompt}" to an automation command. Try saying: "Sweep $500 from checking to HYSA" or "Set checking ceiling to 6000".`
	};
}
