import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

export interface TimeDrainConfig {
	title: string;
	description: string;
	eyebrow?: string;

	// Inputs configuration
	hoursLabel: string;
	hoursHelp: string;
	hoursDefault: number;
	hoursUnit?: string;
	hoursMin?: number;
	hoursMax?: number;
	hoursStep?: number;

	timeValueLabel: string;
	timeValueHelp: string;
	timeValueDefault: number;

	premiumLabel: string;
	premiumHelp: string;
	premiumDefault: number;

	// Verdict customization
	buyVerdictTitle: string;
	buyVerdictSubtitle: string;
	waitVerdictTitle: string;
	waitVerdictSubtitle: string;

	currencySymbol?: string;
}

interface TimeDrainTemplateProps {
	config: TimeDrainConfig;
}

export default function TimeDrainTemplate({ config }: TimeDrainTemplateProps) {
	const currencySymbol = config.currencySymbol || '$';
	const hoursUnit = config.hoursUnit || 'hrs / mo';

	const [hoursWasted, setHoursWasted] = useState(config.hoursDefault);
	const [timeValue, setTimeValue] = useState(config.timeValueDefault);
	const [premiumCost, setPremiumCost] = useState(config.premiumDefault);

	// Mathematical Engine
	const calculations = useMemo(() => {
		const monthlyTimeCost = hoursWasted * timeValue;
		const timeCost3Yr = monthlyTimeCost * 36;
		const premiumCost3Yr = premiumCost * 36;
		const netSavings = timeCost3Yr - premiumCost3Yr;

		const isUpgrade = monthlyTimeCost > premiumCost;

		return {
			monthlyTimeCost,
			timeCost3Yr,
			premiumCost3Yr,
			netSavings,
			isUpgrade
		};
	}, [hoursWasted, timeValue, premiumCost]);

	return (
		<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: Inputs */}
			<div className="panel-soft rounded-[1.8rem] p-6 lg:p-8 space-y-6">
				<div>
					<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
						{config.eyebrow || 'Time Tinkering Tax Audit'}
					</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Configure Parameters
					</h2>
					<p className="mt-2 text-sm text-slate-400">
						Model the time lost tweaking or troubleshooting vs. the cost of a premium solution.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{/* Hours Wasted */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.hoursLabel}</span>
						<div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-950 mt-1">
							<button
								type="button"
								onClick={() => setHoursWasted(prev => Math.max(config.hoursMin || 0, prev - (config.hoursStep || 1)))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono font-semibold text-white">
								{hoursWasted} {hoursUnit}
							</span>
							<button
								type="button"
								onClick={() => setHoursWasted(prev => Math.min(config.hoursMax || 720, prev + (config.hoursStep || 1)))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.hoursHelp}</span>
					</div>

					{/* Time Value */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.timeValueLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								min="0"
								value={timeValue}
								onChange={(e) => setTimeValue(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-10 py-3 text-base font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.timeValueHelp}</span>
					</div>

					{/* Premium Software Cost */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:col-span-2">
						<span className="text-sm font-semibold text-slate-200">{config.premiumLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								min="0"
								value={premiumCost}
								onChange={(e) => setPremiumCost(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-10 py-3 text-base font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.premiumHelp}</span>
					</div>
				</div>
			</div>

			{/* Right Column: Output */}
			<div className="space-y-6">
				{/* Verdict Card */}
				<div 
					className={`panel-soft overflow-hidden rounded-[1.8rem] border transition duration-300 ${
						calculations.isUpgrade 
							? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-gradient-to-br from-slate-900/90 to-emerald-950/20' 
							: 'border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-gradient-to-br from-slate-900/90 to-cyan-950/20'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span className={`inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] font-semibold ${
							calculations.isUpgrade 
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
								: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
						}`}>
							Verdict: {calculations.isUpgrade ? 'UPGRADE / BUY' : 'SKIP / WAIT'}
						</span>

						<h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
							{calculations.isUpgrade ? config.buyVerdictTitle : config.waitVerdictTitle}
						</h3>

						<p className="mt-3 text-sm leading-6 text-slate-300">
							{calculations.isUpgrade ? config.buyVerdictSubtitle : config.waitVerdictSubtitle}
						</p>

						{calculations.netSavings !== 0 && (
							<div className="mt-6 border-t border-slate-800/80 pt-6">
								<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
									3-Year Net Opportunity Reclaimed
								</p>
								<p className={`mt-1 text-3xl font-extrabold tracking-tight ${calculations.isUpgrade ? 'text-emerald-400' : 'text-cyan-400'}`}>
									{calculations.isUpgrade ? '+' : ''}
									{formatCurrency(calculations.netSavings)}
								</p>
								<p className="mt-1 text-xs text-slate-400">
									Based on your opportunity value of time over 36 months.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Detailed Stats Panel */}
				<div className="panel-soft rounded-[1.8rem] p-6 sm:p-8 space-y-4">
					<p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
						Cost breakdown
					</p>

					<div className="grid grid-cols-2 gap-4 border-b border-slate-800/80 pb-4">
						<div>
							<p className="text-xs text-slate-500">Monthly Time Cost</p>
							<p className="text-lg font-semibold text-white">{formatCurrency(calculations.monthlyTimeCost)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Monthly Premium Cost</p>
							<p className="text-lg font-semibold text-white">{formatCurrency(premiumCost)}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 pt-1">
						<div>
							<p className="text-xs text-slate-500">3-Year Time Leak</p>
							<p className="text-sm font-semibold text-slate-300">{formatCurrency(calculations.timeCost3Yr)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">3-Year Solution Cost</p>
							<p className="text-sm font-semibold text-slate-300">{formatCurrency(calculations.premiumCost3Yr)}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
