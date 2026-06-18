export interface PerformanceInputs {
	startingSalary: number;
	combinedTaxRate: number; // Combined state and federal tax rate (e.g. 0.30)
	marketReturnRate: number; // Compounding rate of brokerage portfolio (e.g. 0.08)
	bonusPercentage: number; // Annual performance bonus percentage (e.g. 0.10)
	employerMatchLimit: number; // Maximum matched percentage of salary (e.g. 0.03)
	deferralContribution: number; // Deferral contribution percentage (e.g. 0.06)
}

export interface StayerProfileConfig {
	annualRaiseRate: number; // Baseline internal merit raise rate (e.g. 0.041)
}

export interface SwitcherProfileConfig {
	nonHopRaiseRate: number; // Internal raise in non-transition years (e.g. 0.03)
	hopRaiseRate: number; // Average base salary bump when switching (e.g. 0.15)
	hopIntervalYears: number; // Number of years between switches (e.g. 3)
	unvestedMatchLossRate: number; // Vesting schedule forfeiture percentage (e.g. 1.0)
	unvestedBonusLossRate: number; // Forfeited bonus due to mid-year switch timing (e.g. 0.5)
	cobraTransitionCost: number; // Cost of health gap coverage (e.g. 1200)
	newHireSigningBonusGross: number; // Average gross signing bonus secured (e.g. 5000)
}

export interface GeographicProfile {
	costOfLivingIndex: number; // 1.0 = baseline (e.g., San Francisco)
	expectedWeeklyHours: number; // Expected working hours per week
	paidTimeOffDays: number; // Total annual vacation and sick days
}

export interface TrajectoryProjectionPoint {
	year: number;
	stayerSalary: number;
	stayerTotalCompNominal: number;
	stayerEffectiveHourlyRate: number;
	stayerNetAnnualCashFlow: number;
	switcherSalary: number;
	switcherTotalCompNominal: number;
	switcherEffectiveHourlyRate: number;
	switcherNetAnnualCashFlow: number;
	annualNetDelta: number;
	compoundedPortfolioDelta: number;
}

export class CareerVelocityEngine {
	public static calculateProjections(
		inputs: PerformanceInputs,
		stayerConfig: StayerProfileConfig,
		switcherConfig: SwitcherProfileConfig,
		geoStayer: GeographicProfile,
		geoSwitcher: GeographicProfile,
		horizonYears: number = 10
	): TrajectoryProjectionPoint[] {
		const projections: TrajectoryProjectionPoint[] = [];

		let stayerSalary = inputs.startingSalary;
		let switcherSalary = inputs.startingSalary;
		let compoundedDelta = 0;

		// Tracks accumulated employer matches for vesting calculation
		const switcherMatchHistory: number[] = [];

		for (let year = 1; year <= horizonYears; year++) {
			// Apply annual salary updates (compounded from year-end of preceding period)
			if (year > 1) {
				stayerSalary *= (1 + stayerConfig.annualRaiseRate);

				const isHopYear = year % switcherConfig.hopIntervalYears === 0;
				if (isHopYear) {
					switcherSalary *= (1 + switcherConfig.hopRaiseRate);
				} else {
					switcherSalary *= (1 + switcherConfig.nonHopRaiseRate);
				}
			}

			// Compute Stayer total compensation and effective hourly rate
			const stayerBonus = stayerSalary * inputs.bonusPercentage;
			const stayerMatch = stayerSalary * inputs.employerMatchLimit;
			const stayerTotalComp = stayerSalary + stayerBonus + stayerMatch;

			const stayerTotalCompCoL = stayerTotalComp / geoStayer.costOfLivingIndex;
			const stayerHourly =
				stayerTotalCompCoL /
				((52 - geoStayer.paidTimeOffDays / 5) * geoStayer.expectedWeeklyHours);
			const stayerNetCashFlow = (stayerSalary + stayerBonus) * (1 - inputs.combinedTaxRate) + stayerMatch;

			// Compute Switcher total compensation and match accumulation
			const switcherBonus = switcherSalary * inputs.bonusPercentage;
			const switcherMatch = switcherSalary * inputs.employerMatchLimit;
			switcherMatchHistory.push(switcherMatch);

			const switcherTotalComp = switcherSalary + switcherBonus + switcherMatch;
			const switcherTotalCompCoL = switcherTotalComp / geoSwitcher.costOfLivingIndex;
			const switcherHourly =
				switcherTotalCompCoL /
				((52 - geoSwitcher.paidTimeOffDays / 5) * geoSwitcher.expectedWeeklyHours);

			let switcherNetCashFlow =
				(switcherSalary + switcherBonus) * (1 - inputs.combinedTaxRate) + switcherMatch;

			// Apply transition friction on hop years
			const isHopYear = year > 1 && year % switcherConfig.hopIntervalYears === 0;
			if (isHopYear) {
				// Calculate matching funds lost based on the transition interval
				const historicalMatchRange = Math.min(
					switcherConfig.hopIntervalYears,
					switcherMatchHistory.length
				);
				let unvestedMatchSum = 0;
				for (let i = 0; i < historicalMatchRange; i++) {
					unvestedMatchSum += switcherMatchHistory[switcherMatchHistory.length - 1 - i] || 0;
				}
				const matchingLossFriction = unvestedMatchSum * switcherConfig.unvestedMatchLossRate;

				// Calculate bonus lost due to transition timing
				const bonusLossFriction =
					switcherBonus * (1 - inputs.combinedTaxRate) * switcherConfig.unvestedBonusLossRate;

				// Net signing bonus benefit (taxed at combined tax rate)
				const netSigningBonus = switcherConfig.newHireSigningBonusGross * (1 - inputs.combinedTaxRate);

				// Adjust switcher net cash flow
				switcherNetCashFlow =
					(switcherSalary + switcherBonus) * (1 - inputs.combinedTaxRate) +
					netSigningBonus -
					(matchingLossFriction + bonusLossFriction + switcherConfig.cobraTransitionCost);

				// Reset match history for the next vesting cycle
				switcherMatchHistory.length = 0;
				switcherMatchHistory.push(switcherMatch);
			}

			// Compute annual and compounded deltas
			const netDelta = switcherNetCashFlow - stayerNetCashFlow;
			compoundedDelta = compoundedDelta * (1 + inputs.marketReturnRate) + netDelta;

			projections.push({
				year,
				stayerSalary: Math.round(stayerSalary),
				stayerTotalCompNominal: Math.round(stayerTotalComp),
				stayerEffectiveHourlyRate: Math.round(stayerHourly * 100) / 100,
				stayerNetAnnualCashFlow: Math.round(stayerNetCashFlow),
				switcherSalary: Math.round(switcherSalary),
				switcherTotalCompNominal: Math.round(switcherTotalComp),
				switcherEffectiveHourlyRate: Math.round(switcherHourly * 100) / 100,
				switcherNetAnnualCashFlow: Math.round(switcherNetCashFlow),
				annualNetDelta: Math.round(netDelta),
				compoundedPortfolioDelta: Math.round(compoundedDelta)
			});
		}

		return projections;
	}
}
