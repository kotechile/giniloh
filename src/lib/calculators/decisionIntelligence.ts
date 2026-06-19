export interface DecisionIntelligenceInputs {
	mau: number;
	devRate: number;
	buildTime: number; // in months
	maintFte: number; // as percentage, e.g. 50%
	complianceLevel: 'none' | 'soc2' | 'hipaa';
	codebaseAge: number; // in years
	remediationHours: number; // in hours
	hasSunkCostFallacy: boolean;
	hasKeyPersonRisk: boolean;
	hasTinkeringTax: boolean;
}

export interface DecisionIntelligenceOutputs {
	verdict: 'BUY' | 'PATCH' | 'WAIT';
	verdictRationale: string;
	custom3YrTco: number;
	saas3YrTco: number;
	customBuildCost: number;
	customMaintCostMonthly: number;
	customMaintCost3Yr: number;
	customComplianceCostAnnual: number;
	customComplianceCost3Yr: number;
	customOpportunityCost3Yr: number;
	saasIntegrateCost: number;
	saasMaintCostMonthly: number;
	saasSubCost3Yr: number;
	cpuCustom: number;
	cpuSaaS: number;
	breakEvenMonths: number;
	breakEvenVerdict: string;
	softwareIndex: number;
	isSoftwareIndexHigh: boolean;
}

// Volume-tiered overage subscription calculator for SaaS (Clerk-like B2C pricing model)
export function calculateSaaSMonthlySubscription(mau: number): number {
	if (mau <= 10000) {
		return 0;
	}
	if (mau <= 50000) {
		return 25 + (mau - 10000) * 0.02;
	}
	if (mau <= 100000) {
		return 825 + (mau - 50000) * 0.015;
	}
	return 1575 + (mau - 100000) * 0.01;
}

// Cost-Per-Use (CPU) Reality Check helper
export function calculateSafeCPU(tco3Year: number, mau: number, lifespanYears: number = 3): number {
	const safeMAU = Math.max(mau, 1);
	const safeMonths = Math.max(lifespanYears * 12, 1);
	const rawCPU = tco3Year / (safeMAU * safeMonths);
	return parseFloat(rawCPU.toFixed(4));
}

// Break-even horizon calculation
export function calculateTrueBreakEven(
	customBuild: number,
	customMaintAnnual: number,
	saasIntegrate: number,
	saasMaintAnnual: number
): { months: number; verdict: string } {
	const annualSavings = customMaintAnnual - saasMaintAnnual;
	const upfrontPremium = customBuild - saasIntegrate;

	if (annualSavings <= 0) {
		return {
			months: Infinity,
			verdict: 'Never: Custom maintenance is cheaper than SaaS overage.'
		};
	}

	const breakEvenMonths = (upfrontPremium / annualSavings) * 12;
	const safeMonths = Math.max(0, parseFloat(breakEvenMonths.toFixed(1)));
	return {
		months: safeMonths,
		verdict: breakEvenMonths <= 0 ? 'Immediate ROI' : `${safeMonths} Months`
	};
}

export class DecisionIntelligenceEngine {
	public static calculate(inputs: DecisionIntelligenceInputs): DecisionIntelligenceOutputs {
		// 1. Initial Custom Build Cost
		// Baseline: 1.5 developers * 160 hours/month * buildTime * devRate
		const customBuildCost = inputs.buildTime * 160 * 1.5 * inputs.devRate;

		// 2. Custom Maintenance Cost
		// FTE percentage * 160 hours/month * devRate
		const customMaintCostMonthly = (inputs.maintFte / 100) * 160 * inputs.devRate;
		const customMaintCost3Yr = customMaintCostMonthly * 36;

		// 3. Custom Compliance Cost
		let customComplianceCostAnnual = 0;
		if (inputs.complianceLevel === 'soc2') {
			customComplianceCostAnnual = 75000;
		} else if (inputs.complianceLevel === 'hipaa') {
			customComplianceCostAnnual = 150000;
		}
		const customComplianceCost3Yr = customComplianceCostAnnual * 3;

		// 4. Custom Opportunity Cost (Fixed $150,000 coefficient representing core value diversion)
		const customOpportunityCost3Yr = 150000;

		// 5. Total Custom 3-Year TCO
		const custom3YrTco = customBuildCost + customMaintCost3Yr + customComplianceCost3Yr + customOpportunityCost3Yr;

		// 6. SaaS Integration Cost (8 developer hours)
		const saasIntegrateCost = 8 * inputs.devRate;

		// 7. SaaS Monthly Subscription Cost & 3-Year Cumulative
		const saasMaintCostMonthly = calculateSaaSMonthlySubscription(inputs.mau);
		const saasSubCost3Yr = saasMaintCostMonthly * 36;

		// 8. Total SaaS 3-Year TCO
		const saas3YrTco = saasIntegrateCost + saasSubCost3Yr;

		// 9. Cost-Per-Use (CPU) calculation
		const cpuCustom = calculateSafeCPU(custom3YrTco, inputs.mau);
		const cpuSaaS = calculateSafeCPU(saas3YrTco, inputs.mau);

		// 10. Break-Even Horizon
		const customMaintAnnual = customMaintCostMonthly * 12 + customComplianceCostAnnual;
		const saasMaintAnnual = saasMaintCostMonthly * 12;
		const breakEven = calculateTrueBreakEven(customBuildCost, customMaintAnnual, saasIntegrateCost, saasMaintAnnual);

		// 11. Adapted Software Index (5,000 Rule)
		// I_software = codebase_age * remediation_cost
		const remediationCost = inputs.remediationHours * inputs.devRate;
		const softwareIndex = inputs.codebaseAge * remediationCost;
		const isSoftwareIndexHigh = softwareIndex >= 5000;

		// 12. Determine Dynamic Verdict
		let verdict: 'BUY' | 'PATCH' | 'WAIT' = 'BUY';
		let verdictRationale = '';

		if (custom3YrTco <= saas3YrTco && inputs.complianceLevel === 'none' && inputs.maintFte < 20) {
			if (inputs.mau < 1000) {
				verdict = 'WAIT';
				verdictRationale = 'Minimal operational scale. Keep session management basic until market validation is achieved.';
			} else {
				verdict = 'PATCH';
				verdictRationale = 'Small scale, low compliance needs, and minimal maintenance overhead make a custom patch viable.';
			}
		} else {
			verdict = 'BUY';
			if (inputs.complianceLevel !== 'none') {
				verdictRationale = `Managed SaaS saves $${(custom3YrTco - saas3YrTco).toLocaleString()} by eliminating manual ${inputs.complianceLevel === 'soc2' ? 'SOC 2 Type II' : 'HIPAA BAA'} audit and infrastructure engineering drag.`;
			} else if (isSoftwareIndexHigh) {
				verdictRationale = 'Codebase tech debt index exceeds the 5,000 threshold. Migrating to standard SaaS prevents systemic maintenance failure.';
			} else {
				verdictRationale = `Managed SaaS integration saves $${(custom3YrTco - saas3YrTco).toLocaleString()} in cumulative engineering labor and opportunity costs.`;
			}
		}

		return {
			verdict,
			verdictRationale,
			custom3YrTco,
			saas3YrTco,
			customBuildCost,
			customMaintCostMonthly,
			customMaintCost3Yr,
			customComplianceCostAnnual,
			customComplianceCost3Yr,
			customOpportunityCost3Yr,
			saasIntegrateCost,
			saasMaintCostMonthly,
			saasSubCost3Yr,
			cpuCustom,
			cpuSaaS,
			breakEvenMonths: breakEven.months,
			breakEvenVerdict: breakEven.verdict,
			softwareIndex,
			isSoftwareIndexHigh
		};
	}
}
