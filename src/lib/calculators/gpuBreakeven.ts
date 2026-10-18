/**
 * Local Workstation vs. Cloud GPU Break-even.
 *
 * A local GPU box is a capital purchase; cloud GPUs are a usage bill. The only fair comparison
 * is cost per GPU-hour at the utilisation you will actually run, over the life you will actually
 * keep the hardware — including power, maintenance and residual value. Low-utilisation boxes lose
 * this comparison far more often than buyers expect, because idle silicon still depreciates.
 */

export interface GpuBreakevenInputs {
	hardwarePrice: number;
	/** Expected resale value as a percentage of purchase price at end of life. */
	resaleValuePct: number;
	usefulLifeYears: number;
	hoursPerMonth: number;
	/** Cloud on-demand price per GPU-hour for a comparable card. */
	cloudHourlyRate: number;
	/** Wall power draw of the whole box under load. */
	powerDrawWatts: number;
	electricityRatePerKwh: number;
	annualMaintenance: number;
}

export interface GpuBreakevenOutputs {
	ownedTotalCost: number;
	powerCost: number;
	resaleValue: number;
	ownedCostPerHour: number;
	cloudCostPerHour: number;
	cloudCostForSameHours: number;
	annualOwnedCost: number;
	annualCloudCost: number;
	breakevenHoursPerMonth: number;
	breakevenMonths: number;
	utilizationPctOfLife: number;
	recommendation: 'Buy local hardware' | 'Rent cloud GPUs';
	advantageAtLifeEnd: number;
}

const money = (n: number) => Math.round(n * 100) / 100;

export function calculateGpuBreakeven(inputs: GpuBreakevenInputs): GpuBreakevenOutputs {
	const price = Math.max(0, inputs.hardwarePrice);
	const lifeYears = Math.max(0.5, inputs.usefulLifeYears);
	const lifeMonths = lifeYears * 12;
	const hoursPerMonth = Math.max(0, inputs.hoursPerMonth);
	const totalHours = hoursPerMonth * lifeMonths;

	const resaleValue = price * (Math.max(0, Math.min(100, inputs.resaleValuePct)) / 100);
	const powerCost =
		(Math.max(0, inputs.powerDrawWatts) / 1000) * totalHours * Math.max(0, inputs.electricityRatePerKwh);
	const maintenance = Math.max(0, inputs.annualMaintenance) * lifeYears;

	const ownedTotalCost = price - resaleValue + powerCost + maintenance;
	const cloudCostForSameHours = totalHours * Math.max(0, inputs.cloudHourlyRate);

	const ownedCostPerHour = totalHours > 0 ? ownedTotalCost / totalHours : Number.POSITIVE_INFINITY;
	const annualOwnedCost = ownedTotalCost / lifeYears;
	const annualCloudCost = hoursPerMonth * 12 * Math.max(0, inputs.cloudHourlyRate);

	// Hours per month at which the owned box and the cloud bill are equal over its life. Power
	// scales with hours, so it belongs on the usage side of the equation, not in a fixed pot.
	const powerPerHour = (Math.max(0, inputs.powerDrawWatts) / 1000) * Math.max(0, inputs.electricityRatePerKwh);
	const fixedOwnedCost = price - resaleValue + maintenance;
	const netCloudPerHour = Math.max(0, inputs.cloudHourlyRate) - powerPerHour;
	const breakevenHoursPerMonth =
		netCloudPerHour > 0 ? fixedOwnedCost / (lifeMonths * netCloudPerHour) : Number.POSITIVE_INFINITY;

	// Months to recoup the net hardware outlay from the cloud bill it displaces.
	const monthlyCloudBill = hoursPerMonth * inputs.cloudHourlyRate;
	const monthlyOwnedRun = (powerCost + maintenance) / lifeMonths;
	const monthlySaving = monthlyCloudBill - monthlyOwnedRun;
	const breakevenMonths = monthlySaving > 0 ? (price - resaleValue) / monthlySaving : Number.POSITIVE_INFINITY;

	const buyWins = ownedTotalCost < cloudCostForSameHours;
	return {
		ownedTotalCost: money(ownedTotalCost),
		powerCost: money(powerCost),
		resaleValue: money(resaleValue),
		ownedCostPerHour: Math.round(ownedCostPerHour * 100) / 100,
		cloudCostPerHour: Math.round(Math.max(0, inputs.cloudHourlyRate) * 100) / 100,
		cloudCostForSameHours: money(cloudCostForSameHours),
		annualOwnedCost: money(annualOwnedCost),
		annualCloudCost: money(annualCloudCost),
		breakevenHoursPerMonth: Number.isFinite(breakevenHoursPerMonth)
			? Math.round(breakevenHoursPerMonth * 10) / 10
			: Number.POSITIVE_INFINITY,
		breakevenMonths: Number.isFinite(breakevenMonths) ? Math.round(breakevenMonths * 10) / 10 : Number.POSITIVE_INFINITY,
		utilizationPctOfLife: Math.round((totalHours / (lifeMonths * 24 * 30.44)) * 1000) / 10,
		recommendation: buyWins ? 'Buy local hardware' : 'Rent cloud GPUs',
		advantageAtLifeEnd: money(Math.abs(ownedTotalCost - cloudCostForSameHours))
	};
}
