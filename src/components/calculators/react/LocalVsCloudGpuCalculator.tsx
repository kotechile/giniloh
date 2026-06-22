import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

interface GpuModel {
	id: string;
	name: string;
	cost: number;
	tdp: number; // in Watts
	vram: string;
}

interface CloudProvider {
	id: string;
	name: string;
	rate: number; // hourly rate
	setupFee: number;
	vram: string;
	affiliateUrl: string;
	ctaText?: string;
}

const GPU_MODELS: GpuModel[] = [
	{ id: 'rtx3070', name: 'RTX 3070 - $499 - 8GB VRAM', cost: 499, tdp: 220, vram: '8GB' },
	{ id: 'rtx4070', name: 'RTX 4070 - $599 - 12GB VRAM', cost: 599, tdp: 200, vram: '12GB' },
	{ id: 'rtx4080', name: 'RTX 4080 - $1199 - 16GB VRAM', cost: 1199, tdp: 320, vram: '16GB' },
	{ id: 'rtx4090', name: 'RTX 4090 - $1599 - 24GB VRAM', cost: 1599, tdp: 450, vram: '24GB' }
];

const CLOUD_PROVIDERS: CloudProvider[] = [
	{ 
		id: 'runpod', 
		name: 'RunPod', 
		rate: 0.74, 
		setupFee: 10, 
		vram: '24GB VRAM',
		affiliateUrl: 'https://runpod.io?rc=giniloh',
		ctaText: 'Try RunPod (No Upfront Cost) →'
	},
	{ 
		id: 'vastai', 
		name: 'Vast.ai', 
		rate: 0.40, 
		setupFee: 5, 
		vram: '24GB VRAM',
		affiliateUrl: 'https://vast.ai?ref=giniloh',
		ctaText: 'Try Vast.ai (Best Pricing) →'
	},
	{ 
		id: 'lambda', 
		name: 'Lambda Labs', 
		rate: 1.10, 
		setupFee: 0, 
		vram: '24GB VRAM',
		affiliateUrl: 'https://lambdalabs.com',
		ctaText: 'Deploy on Lambda Labs →'
	},
	{ 
		id: 'paperspace', 
		name: 'Paperspace', 
		rate: 2.30, 
		setupFee: 0, 
		vram: '24GB VRAM',
		affiliateUrl: 'https://paperspace.com',
		ctaText: 'Start on Paperspace →'
	}
];

export default function LocalVsCloudGpuCalculator() {
	// 1. Usage Pattern States (Sliders)
	const [hoursPerDay, setHoursPerDay] = useState<number>(6);
	const [daysPerMonth, setDaysPerMonth] = useState<number>(18);
	const [timePeriodMonths, setTimePeriodMonths] = useState<number>(12);
	const [electricityRate, setElectricityRate] = useState<number>(0.12);
	const [storageSizeGb, setStorageSizeGb] = useState<number>(100);
	const [systemCost, setSystemCost] = useState<number>(1000);

	// 2. Selection States
	const [selectedGpuId, setSelectedGpuId] = useState<string>('rtx4090');
	const [selectedProviderId, setSelectedProviderId] = useState<string>('runpod');

	// Find active items
	const activeGpu = useMemo(() => GPU_MODELS.find(g => g.id === selectedGpuId) || GPU_MODELS[3], [selectedGpuId]);
	const activeProvider = useMemo(() => CLOUD_PROVIDERS.find(p => p.id === selectedProviderId) || CLOUD_PROVIDERS[0], [selectedProviderId]);

	// 3. Mathematical Calculations
	const calculations = useMemo(() => {
		const monthlyHours = hoursPerDay * daysPerMonth;
		const totalHours = monthlyHours * timePeriodMonths;

		// Local Cost Calculations
		const hardwareCost = activeGpu.cost + systemCost;
		const totalPowerDrawKw = (activeGpu.tdp + 250) / 1000; // Adding 250W base system draw (CPU, RAM, fans, motherboard)
		const electricityCost = totalHours * totalPowerDrawKw * electricityRate;
		const maintenanceCost = hardwareCost * 0.05 * (timePeriodMonths / 12); // 5% maintenance budget per year
		
		const localTco = hardwareCost + electricityCost + maintenanceCost;
		const localCostPerHour = totalHours > 0 ? localTco / totalHours : 0;

		// Cloud Cost Calculations
		const cloudUsageCost = totalHours * activeProvider.rate;
		const cloudStorageCost = storageSizeGb * 0.15 * timePeriodMonths; // Assuming $0.15 per GB / month for persistent volume
		
		const cloudTco = activeProvider.setupFee + cloudUsageCost + cloudStorageCost;
		const cloudCostPerHour = totalHours > 0 ? cloudTco / totalHours : 0;

		// Savings & TCO Comparison
		const localWins = localTco < cloudTco;
		const netSavings = Math.abs(cloudTco - localTco);
		const monthlyDifference = netSavings / timePeriodMonths;

		// Break-Even Calculations
		const upfrontPremium = (hardwareCost + maintenanceCost) - activeProvider.setupFee;
		const monthlySavings = (monthlyHours * activeProvider.rate + storageSizeGb * 0.15) - (monthlyHours * totalPowerDrawKw * electricityRate);
		
		let breakEvenMonths = Infinity;
		if (monthlySavings > 0) {
			breakEvenMonths = upfrontPremium / monthlySavings;
		}

		return {
			monthlyHours,
			totalHours,
			hardwareCost,
			electricityCost,
			maintenanceCost,
			localTco,
			localCostPerHour,
			cloudUsageCost,
			cloudStorageCost,
			cloudTco,
			cloudCostPerHour,
			localWins,
			netSavings,
			monthlyDifference,
			breakEvenMonths: breakEvenMonths === Infinity ? Infinity : parseFloat(breakEvenMonths.toFixed(1))
		};
	}, [hoursPerDay, daysPerMonth, timePeriodMonths, electricityRate, storageSizeGb, systemCost, activeGpu, activeProvider]);

	return (
		<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: User Controls & Sliders */}
			<div className="space-y-6">
				{/* Usage Pattern Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">⚙️</span>
						<h3 className="text-xl font-bold text-white">Your Usage Pattern</h3>
					</div>

					{/* Hours per Day Slider */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>Hours per Day</span>
							<span className="text-cyan-400 font-mono text-base">{hoursPerDay} hours</span>
						</div>
						<input
							type="range"
							min="1"
							max="24"
							step="1"
							value={hoursPerDay}
							onChange={(e) => setHoursPerDay(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 hour</span>
							<span>24 hours</span>
						</div>
					</div>

					{/* Days per Month Slider */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>Days per Month</span>
							<span className="text-cyan-400 font-mono text-base">{daysPerMonth} days</span>
						</div>
						<input
							type="range"
							min="1"
							max="30"
							step="1"
							value={daysPerMonth}
							onChange={(e) => setDaysPerMonth(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 day</span>
							<span>30 days</span>
						</div>
					</div>

					{/* Time Period Months Slider */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>Time Period (Months)</span>
							<span className="text-cyan-400 font-mono text-base">{timePeriodMonths} months</span>
						</div>
						<input
							type="range"
							min="1"
							max="36"
							step="1"
							value={timePeriodMonths}
							onChange={(e) => setTimePeriodMonths(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>1 month</span>
							<span>36 months</span>
						</div>
					</div>

					{/* Computed Monthly Hours Summary */}
					<div className="rounded-[1.4rem] border border-cyan-500/15 bg-cyan-950/20 p-4">
						<p className="font-mono text-xs uppercase tracking-wider text-slate-400">Monthly Usage</p>
						<p className="text-3xl font-black text-cyan-400 mt-1 font-mono">{calculations.monthlyHours} hours</p>
					</div>
				</div>

				{/* Select GPU Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">🎮</span>
						<h3 className="text-xl font-bold text-white">Select GPU</h3>
					</div>

					<div>
						<label htmlFor="gpu-select" className="sr-only">GPU Model Option</label>
						<select
							id="gpu-select"
							value={selectedGpuId}
							onChange={(e) => setSelectedGpuId(e.target.value)}
							className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-4 py-3.5 text-base font-semibold text-white outline-none focus:border-cyan-400"
						>
							{GPU_MODELS.map(g => (
								<option key={g.id} value={g.id}>{g.name}</option>
							))}
						</select>
					</div>

					{/* GPU Metric displays */}
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
							<p className="text-xs text-slate-500">Hardware Cost</p>
							<p className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{formatCurrency(activeGpu.cost)}</p>
						</div>
						<div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
							<p className="text-xs text-slate-500">Power Draw (TDP)</p>
							<p className="text-lg font-bold text-amber-400 mt-0.5 font-mono">{activeGpu.tdp}W</p>
						</div>
					</div>

					{/* System components price slider */}
					<div className="space-y-2 border-t border-slate-800/60 pt-4">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>System components (CPU, RAM, Motherboard, etc.)</span>
							<span className="text-emerald-400 font-mono">{formatCurrency(systemCost)}</span>
						</div>
						<input
							type="range"
							min="500"
							max="2000"
							step="50"
							value={systemCost}
							onChange={(e) => setSystemCost(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>$500</span>
							<span>$2,000</span>
						</div>
					</div>

					{/* Electricity Rate Slider */}
					<div className="space-y-2 border-t border-slate-800/60 pt-4">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>Local Electricity Rate</span>
							<span className="text-cyan-400 font-mono">${electricityRate.toFixed(2)}/kWh</span>
						</div>
						<input
							type="range"
							min="0.05"
							max="0.50"
							step="0.01"
							value={electricityRate}
							onChange={(e) => setElectricityRate(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>$0.05/kWh</span>
							<span>$0.50/kWh</span>
						</div>
					</div>
				</div>

				{/* Select Cloud Provider Card */}
				<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">☁️</span>
						<h3 className="text-xl font-bold text-white">Select Cloud Provider</h3>
					</div>

					<div className="grid gap-3 sm:grid-cols-2">
						{CLOUD_PROVIDERS.map(p => {
							const isSelected = selectedProviderId === p.id;
							return (
								<button
									key={p.id}
									type="button"
									onClick={() => setSelectedProviderId(p.id)}
									className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition duration-150 cursor-pointer ${
										isSelected
											? 'border-cyan-500 bg-cyan-950/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
											: 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
									}`}
								>
									<div className="flex items-center justify-between w-full">
										<span className="font-semibold text-white text-sm">{p.name}</span>
										<span className="font-mono text-xs font-bold text-cyan-400">
											${p.rate.toFixed(2)}/hr
										</span>
									</div>
									<span className="text-[10px] text-slate-400 mt-1">{p.vram}</span>
									{p.setupFee > 0 && <span className="text-[9px] text-slate-500 font-mono">Setup Fee: ${p.setupFee}</span>}
								</button>
							);
						})}
					</div>

					{/* Persistent Cloud Storage Slider */}
					<div className="space-y-2 border-t border-slate-800/60 pt-4">
						<div className="flex justify-between text-sm font-semibold text-slate-300">
							<span>Cloud Storage Size</span>
							<span className="text-cyan-400 font-mono">{storageSizeGb} GB</span>
						</div>
						<input
							type="range"
							min="10"
							max="1000"
							step="10"
							value={storageSizeGb}
							onChange={(e) => setStorageSizeGb(Number(e.target.value))}
							className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
						/>
						<div className="flex justify-between text-[10px] text-slate-500 font-mono">
							<span>10 GB</span>
							<span>1,000 GB</span>
						</div>
						<p className="text-[10px] text-slate-500">Persistent storage priced at $0.15 / GB / month</p>
					</div>
				</div>
			</div>

			{/* Right Column: Output / Verdict Panels */}
			<div className="space-y-6">
				{/* Cost Analysis Card */}
				<div className="panel-soft rounded-[2rem] p-6 sm:p-8 space-y-6">
					<div className="flex items-center gap-2">
						<span className="text-xl">💰</span>
						<h3 className="text-xl font-bold text-white">Cost Analysis</h3>
					</div>

					{/* Local Hardware Breakdown */}
					<div className="space-y-3 pb-5 border-b border-slate-800/80">
						<p className="text-sm font-bold text-slate-200 uppercase tracking-wide">Local Hardware</p>
						<div className="flex justify-between text-sm text-slate-400">
							<span>GPU Cost ({activeGpu.vram}):</span>
							<span className="font-mono text-white">{formatCurrency(activeGpu.cost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>System components:</span>
							<span className="font-mono text-white">{formatCurrency(systemCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Electricity ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.electricityCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Maintenance budget:</span>
							<span className="font-mono text-white">{formatCurrency(calculations.maintenanceCost)}</span>
						</div>
						<div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-slate-800/40">
							<span>Total Cost:</span>
							<span className="text-2xl text-amber-400 font-mono">{formatCurrency(calculations.localTco)}</span>
						</div>
						<div className="flex justify-between text-xs text-slate-400 font-mono">
							<span>Cost per Hour:</span>
							<span className="text-cyan-400">${calculations.localCostPerHour.toFixed(3)}/hr</span>
						</div>
					</div>

					{/* Cloud GPU Breakdown */}
					<div className="space-y-3 pt-1">
						<p className="text-sm font-bold text-slate-200 uppercase tracking-wide">{activeProvider.name} Cloud GPU</p>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Setup Fee:</span>
							<span className="font-mono text-white">{formatCurrency(activeProvider.setupFee)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Usage ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.cloudUsageCost)}</span>
						</div>
						<div className="flex justify-between text-sm text-slate-400">
							<span>Storage ({timePeriodMonths} months):</span>
							<span className="font-mono text-white">{formatCurrency(calculations.cloudStorageCost)}</span>
						</div>
						<div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-slate-800/40">
							<span>Total Cost:</span>
							<span className="text-2xl text-cyan-400 font-mono">{formatCurrency(calculations.cloudTco)}</span>
						</div>
						<div className="flex justify-between text-xs text-slate-400 font-mono">
							<span>Cost per Hour:</span>
							<span className="text-cyan-400">${calculations.cloudCostPerHour.toFixed(3)}/hr</span>
						</div>
					</div>
				</div>

				{/* Verdict Card */}
				<div 
					className={`panel-soft rounded-[2rem] border transition duration-300 ${
						calculations.localWins 
							? 'border-emerald-500/35 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 shadow-[0_0_50px_rgba(16,185,129,0.15)]' 
							: 'border-cyan-500/35 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 shadow-[0_0_50px_rgba(34,211,238,0.15)]'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span className={`inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] font-bold ${
							calculations.localWins 
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
								: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
						}`}>
							{calculations.localWins ? '🏠 Local Wins!' : '☁️ Cloud Wins!'}
						</span>

						<h3 className="mt-4 text-3xl font-extrabold text-white leading-tight">
							{calculations.localWins 
								? `Local saves ${formatCurrency(calculations.netSavings)}` 
								: `Cloud saves ${formatCurrency(calculations.netSavings)}`
							}
						</h3>

						<p className="mt-3 text-sm leading-6 text-slate-300">
							{calculations.localWins 
								? `Local hardware pays off after ${Number.isFinite(calculations.breakEvenMonths) ? `${calculations.breakEvenMonths} months` : 'Never'}.`
								: 'Renting on demand prevents costly hardware depreciation and upfront CapEx.'
							}
						</p>
					</div>
				</div>

				{/* Recommendation Card */}
				<div className="panel-soft rounded-[2rem] border border-pink-500/35 bg-gradient-to-br from-slate-900/90 to-pink-950/15 p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] flex flex-col gap-4">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.24em] text-pink-400 font-bold">
							🎯 Recommendation
						</p>
						<p className="mt-2 text-sm leading-6 text-slate-200">
							{calculations.localWins ? (
								<>
									For heavy usage of <strong>{calculations.monthlyHours} hours/month</strong>, local hardware becomes cost-effective after <strong>{calculations.breakEvenMonths} months</strong>.
								</>
							) : (
								<>
									For light usage of <strong>{calculations.monthlyHours} hours/month</strong>, cloud GPUs remain superior to offset the high hardware setup price.
								</>
							)}
						</p>
					</div>
					<a
						href={activeProvider.affiliateUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="w-full text-center py-3.5 px-6 font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg transition duration-150 cursor-pointer"
					>
						{activeProvider.ctaText || `Try ${activeProvider.name} (No Upfront Cost) →`}
					</a>
				</div>

				{/* Metrics Widgets */}
				<div className="grid grid-cols-2 gap-4">
					<div className="panel-soft rounded-[1.5rem] p-5">
						<p className="text-xs text-slate-500 font-medium">Break-Even Point</p>
						<p className="text-2xl font-black text-white mt-1.5 font-mono">
							{Number.isFinite(calculations.breakEvenMonths)
								? `${calculations.breakEvenMonths} mo`
								: 'Never'}
						</p>
					</div>
					<div className="panel-soft rounded-[1.5rem] p-5">
						<p className="text-xs text-slate-500 font-medium">Monthly Difference</p>
						<p className="text-2xl font-black text-white mt-1.5 font-mono">
							{formatCurrency(calculations.monthlyDifference)}
						</p>
					</div>
				</div>

				{/* Ready to Start tutorials */}
				<div className="panel-soft rounded-[2rem] p-6 space-y-4">
					<p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500 font-bold">
						Ready to Start?
					</p>
					<p className="text-xs text-slate-400">Get started with cloud GPUs in 5 minutes. No hardware required.</p>
					<div className="flex flex-wrap gap-3">
						<a
							href="https://runpod.io"
							target="_blank"
							rel="noopener noreferrer"
							className="py-2.5 px-4 font-semibold text-xs text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900 transition"
						>
							RunPod Tutorial
						</a>
						<a
							href="https://vast.ai"
							target="_blank"
							rel="noopener noreferrer"
							className="py-2.5 px-4 font-semibold text-xs text-slate-300 hover:text-white rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-900 transition"
						>
							Vast.ai Guide
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
