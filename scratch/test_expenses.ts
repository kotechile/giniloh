import type { SimulationState } from '../src/lib/calculators/moneyFlowEngine';
import { createDefaultNodes, stepSimulation } from '../src/lib/calculators/moneyFlowEngine';

async function runTests() {
	console.log('=== Expenses & History Verification ===');

	// 1. Initial State verification
	const nodes = createDefaultNodes();
	const checking = nodes.find(n => n.id === 'checking')!;
	const expenses = nodes.find(n => n.id === 'expenses')!;

	console.log(`Initial Checking Balance: $${checking.balance}`);
	console.log(`Initial Expenses Balance: $${expenses.balance}`);
	console.log(`Initial Expenses Monthly budget: $${expenses.monthlyExpenses}`);

	if (expenses.monthlyExpenses === 2000) {
		console.log('✅ Default expenses budget is $2,000.');
	} else {
		console.error('❌ Default expenses budget mismatch.');
		process.exit(1);
	}

	// 2. Day-30 Debit test
	const cleanNodes1 = createDefaultNodes();
	const checking1 = cleanNodes1.find(n => n.id === 'checking')!;
	const income1 = cleanNodes1.find(n => n.id === 'income')!;
	const hysa1 = cleanNodes1.find(n => n.id === 'hysa')!;
	const mortgage1 = cleanNodes1.find(n => n.id === 'mortgage')!;
	
	// Disable paychecks and interest for an isolated math test
	income1.grossIncome = 0;
	hysa1.interestRate = 0;
	mortgage1.interestRate = 0;
	mortgage1.balance = 0; // Disable mortgage payment debit
	checking1.balance = 4000;
	checking1.floor = 0; // Disable floor pulls

	let state: SimulationState = {
		day: 0,
		nodes: cleanNodes1,
		edges: [],
		holdings: [],
		totalWealthAccumulated: 0,
		log: [],
		transferHistory: [],
		pdtTradesToday: 0,
		macroScenario: 'baseline' as const,
		macroHistory: [],
		isPaused: false,
		checklistCompleted: false,
		checklistProgress: 0,
		mode: 'personal' as const,
		waterfallOrder: ['hysa'] as any[],
		history: []
	};

	console.log('Stepping 30 days to check monthly expenses debit...');
	for (let d = 1; d <= 30; d++) {
		state = stepSimulation(state, 0);
	}

	const updatedChecking = state.nodes.find(n => n.id === 'checking')!;
	const updatedExpenses = state.nodes.find(n => n.id === 'expenses')!;

	console.log(`Day 30 Checking Balance: $${updatedChecking.balance} (Expected: $2000)`);
	console.log(`Day 30 YTD Expenses: $${updatedExpenses.balance} (Expected: $2000)`);

	if (updatedExpenses.balance === 2000 && updatedChecking.balance === 2000) {
		console.log('✅ Living expenses YTD accumulated $2,000 successfully.');
	} else {
		console.error('❌ Living expenses balance mismatch.');
		process.exit(1);
	}

	// 3. Underbalance Sweep triggered by expenses debit
	console.log('\nTesting HYSA sweep when checking hits floor due to expenses...');
	
	const cleanNodes2 = createDefaultNodes();
	const checking2 = cleanNodes2.find(n => n.id === 'checking')!;
	const income2 = cleanNodes2.find(n => n.id === 'income')!;
	const hysa2 = cleanNodes2.find(n => n.id === 'hysa')!;
	const expenses2 = cleanNodes2.find(n => n.id === 'expenses')!;
	const mortgage2 = cleanNodes2.find(n => n.id === 'mortgage')!;

	income2.grossIncome = 0;
	hysa2.interestRate = 0;
	mortgage2.interestRate = 0;
	mortgage2.balance = 0; // Disable mortgage payment debit

	// Set balances
	checking2.balance = 1600;
	checking2.floor = 1500; // Floor threshold
	hysa2.balance = 5000;
	expenses2.balance = 0;
	expenses2.monthlyExpenses = 2000;

	let state2: SimulationState = {
		day: 0,
		nodes: cleanNodes2,
		edges: [],
		holdings: [],
		totalWealthAccumulated: 0,
		log: [],
		transferHistory: [],
		pdtTradesToday: 0,
		macroScenario: 'baseline' as const,
		macroHistory: [],
		isPaused: false,
		checklistCompleted: false,
		checklistProgress: 0,
		mode: 'personal' as const,
		waterfallOrder: ['hysa'] as any[],
		history: []
	};

	// Step 30 days. On Day 30, checking drops to 1600 - 2000 = -400.
	// Restored checking floor to 1500: pulls 1900 from HYSA
	for (let d = 1; d <= 30; d++) {
		state2 = stepSimulation(state2, 0);
	}

	// Settle hold on Day 31
	state2 = stepSimulation(state2, 0);

	const settledChecking = state2.nodes.find(n => n.id === 'checking')!;
	const settledHYSA = state2.nodes.find(n => n.id === 'hysa')!;
	const settledExpenses = state2.nodes.find(n => n.id === 'expenses')!;

	console.log(`Day 31 Settled Checking: $${settledChecking.balance} (Expected: $1500)`);
	console.log(`Day 31 Settled HYSA: $${settledHYSA.balance} (Expected: $3100)`);
	console.log(`Day 31 YTD Expenses: $${settledExpenses.balance} (Expected: $2000)`);

	if (settledChecking.balance === 1500 && settledHYSA.balance === 3100) {
		console.log('✅ Underbalance floor sweep triggered by expenses passed.');
	} else {
		console.error('❌ Underbalance floor sweep failed.');
		process.exit(1);
	}

	// 4. History data collection test
	console.log(`History length: ${state2.history.length} (Expected: 31)`);
	if (state2.history.length === 31) {
		console.log('✅ History array recorded all simulation steps.');
		const lastPt = state2.history[state2.history.length - 1];
		console.log(`- Day ${lastPt.day} History Net Worth: ${lastPt.netWorth}`);
		console.log(`- Day ${lastPt.day} History Checking: ${lastPt.checking}`);
		console.log(`- Day ${lastPt.day} History HYSA: ${lastPt.hysa}`);
	} else {
		console.error('❌ History collection size mismatch.');
		process.exit(1);
	}

	console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(e => {
	console.error(e);
	process.exit(1);
});
