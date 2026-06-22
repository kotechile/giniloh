import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

export interface AmortizerConfig {
	title: string;
	description: string;
	eyebrow?: string;

	// Inputs configuration
	stickerLabel: string;
	stickerHelp: string;
	stickerDefault: number;

	frequencyLabel: string;
	frequencyHelp: string;
	frequencyUnit: string; // e.g. "drinks/week", "commutes/week", "hours/week"
	frequencyDefault: number;
	frequencyStep?: number;
	frequencyMin?: number;
	frequencyMax?: number;

	outsourceLabel: string;
	outsourceHelp: string;
	outsourceDefault: number;

	secondaryLabel: string;
	secondaryHelp: string;
	secondaryDefault: number;

	lifespanLabel: string;
	lifespanHelp: string;
	lifespanDefault: number; // in years

	// Verdict customization
	buyVerdictTitle: string;
	buyVerdictSubtitle: string;
	skipVerdictTitle: string;
	skipVerdictSubtitle: string;

	// Optional settings
	aspirationalThreshold?: number;
	aspirationalWarning?: string;
	currencySymbol?: string;
}

interface AmortizerTemplateProps {
	config: AmortizerConfig;
}

export default function AmortizerTemplate({ config }: AmortizerTemplateProps) {
	const currencySymbol = config.currencySymbol || '$';
	
	const [stickerPrice, setStickerPrice] = useState(config.stickerDefault);
	const [frequency, setFrequency] = useState(config.frequencyDefault);
	const [outsourceCost, setOutsourceCost] = useState(config.outsourceDefault);
	const [secondaryCost, setSecondaryCost] = useState(config.secondaryDefault);
	const [lifespanYears, setLifespanYears] = useState(config.lifespanDefault);

	// Mathematical Engine
	const calculations = useMemo(() => {
		const usesPerYear = frequency * 52;
		const totalUses = usesPerYear * lifespanYears;
		
		// Depreciation (35% over lifespan) and Maintenance (5% of sticker per year)
		const depreciation = stickerPrice * 0.35;
		const maintenance = stickerPrice * 0.05 * lifespanYears;
		
		const homeTco = stickerPrice + (totalUses * secondaryCost) + maintenance;
		const outsourceTco = totalUses * outsourceCost;
		const netSavings = outsourceTco - homeTco;
		
		const homePerUse = totalUses > 0 ? homeTco / totalUses : 0;
		const outsourcePerUse = outsourceCost;
		
		// Break Even
		const priceDiffPerUse = outsourceCost - secondaryCost;
		let breakEvenUses = Infinity;
		let breakEvenMonths = Infinity;
		
		if (priceDiffPerUse > 0) {
			breakEvenUses = (stickerPrice + maintenance) / priceDiffPerUse;
			const usesPerMonth = usesPerYear / 12;
			breakEvenMonths = usesPerMonth > 0 ? breakEvenUses / usesPerMonth : Infinity;
		}

		const isBuy = homePerUse <= outsourcePerUse;

		return {
			totalUses,
			depreciation,
			maintenance,
			homeTco,
			outsourceTco,
			netSavings,
			homePerUse,
			outsourcePerUse,
			breakEvenUses: Math.ceil(breakEvenUses),
			breakEvenMonths: parseFloat(breakEvenMonths.toFixed(1)),
			isBuy
		};
	}, [stickerPrice, frequency, outsourceCost, secondaryCost, lifespanYears]);

	const isAspirationalWarningTriggered = 
		config.aspirationalThreshold !== undefined && 
		frequency >= config.aspirationalThreshold;

	return (
		<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: Input Form (No sliders, clean steppers/number inputs) */}
			<div className="panel-soft rounded-[1.8rem] p-6 lg:p-8 space-y-6">
				<div>
					<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
						{config.eyebrow || 'Cost-Per-Use Arbitrage'}
					</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Configure Parameters
					</h2>
					<p className="mt-2 text-sm text-slate-400">
						Modify values below to compare ownership vs. transactional cost.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{/* Sticker Price */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.stickerLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								min="0"
								value={stickerPrice}
								onChange={(e) => setStickerPrice(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-10 py-3 text-base font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.stickerHelp}</span>
					</div>

					{/* Weekly Frequency */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.frequencyLabel}</span>
						<div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-950 mt-1">
							<button
								type="button"
								onClick={() => setFrequency(prev => Math.max(config.frequencyMin || 0, prev - (config.frequencyStep || 1)))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono font-semibold text-white">
								{frequency} {config.frequencyUnit}
							</span>
							<button
								type="button"
								onClick={() => setFrequency(prev => Math.min(config.frequencyMax || 168, prev + (config.frequencyStep || 1)))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.frequencyHelp}</span>
					</div>

					{/* Outsource Rate */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.outsourceLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								step="0.01"
								min="0"
								value={outsourceCost}
								onChange={(e) => setOutsourceCost(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-10 py-3 text-base font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.outsourceHelp}</span>
					</div>

					{/* Secondary / Upkeep Cost */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.secondaryLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								step="0.01"
								min="0"
								value={secondaryCost}
								onChange={(e) => setSecondaryCost(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-10 py-3 text-base font-semibold text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.secondaryHelp}</span>
					</div>

					{/* Lifespan Years */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:col-span-2">
						<span className="text-sm font-semibold text-slate-200">{config.lifespanLabel}</span>
						<div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-950 mt-1">
							<button
								type="button"
								onClick={() => setLifespanYears(prev => Math.max(1, prev - 1))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono font-semibold text-white">
								{lifespanYears} Years
							</span>
							<button
								type="button"
								onClick={() => setLifespanYears(prev => Math.min(20, prev + 1))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.lifespanHelp}</span>
					</div>
				</div>
			</div>

			{/* Right Column: Output & Verdict */}
			<div className="space-y-6">
				{/* Verdict Card */}
				<div 
					className={`panel-soft overflow-hidden rounded-[1.8rem] border transition duration-300 ${
						calculations.isBuy 
							? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-gradient-to-br from-slate-900/90 to-emerald-950/20' 
							: 'border-cyan-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)] bg-gradient-to-br from-slate-900/90 to-cyan-950/20'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span className={`inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] font-semibold ${
							calculations.isBuy 
								? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
								: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
						}`}>
							Verdict: {calculations.isBuy ? 'OWN / BUY' : 'OUTSOURCE'}
						</span>
						
						<h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
							{calculations.isBuy ? config.buyVerdictTitle : config.skipVerdictTitle}
						</h3>
						
						<p className="mt-3 text-sm leading-6 text-slate-300">
							{calculations.isBuy ? config.buyVerdictSubtitle : config.skipVerdictSubtitle}
						</p>

						{calculations.netSavings !== 0 && (
							<div className="mt-6 border-t border-slate-800/80 pt-6">
								<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
									Net Financial Impact
								</p>
								<p className={`mt-1 text-3xl font-extrabold tracking-tight ${calculations.isBuy ? 'text-emerald-400' : 'text-cyan-400'}`}>
									{calculations.isBuy ? '+' : ''}
									{formatCurrency(calculations.netSavings)}
								</p>
								<p className="mt-1 text-xs text-slate-400">
									Calculated over the target {lifespanYears}-year lifespan.
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
							<p className="text-xs text-slate-500">Ownership CPU</p>
							<p className="text-lg font-semibold text-white">{formatCurrency(calculations.homePerUse)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Outsourced CPU</p>
							<p className="text-lg font-semibold text-white">{formatCurrency(calculations.outsourcePerUse)}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 border-b border-slate-800/80 pb-4">
						<div>
							<p className="text-xs text-slate-500">Ownership TCO</p>
							<p className="text-sm font-semibold text-slate-300">{formatCurrency(calculations.homeTco)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Outsourced TCO</p>
							<p className="text-sm font-semibold text-slate-300">{formatCurrency(calculations.outsourceTco)}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 pt-1">
						<div>
							<p className="text-xs text-slate-500">Break-Even Uses</p>
							<p className="text-sm font-semibold text-slate-300">
								{Number.isFinite(calculations.breakEvenUses) ? `${calculations.breakEvenUses} runs` : 'Never'}
							</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Break-Even Horizon</p>
							<p className="text-sm font-semibold text-slate-300">
								{Number.isFinite(calculations.breakEvenMonths) ? `${calculations.breakEvenMonths} Months` : 'Never'}
							</p>
						</div>
					</div>
				</div>

				{/* Aspirational Warning */}
				{isAspirationalWarningTriggered && config.aspirationalWarning && (
					<div className="rounded-[1.4rem] border border-amber-500/25 bg-amber-500/5 p-5 text-amber-200">
						<div className="flex gap-3">
							<span className="text-lg">⚠️</span>
							<div>
								<p className="text-xs font-mono uppercase tracking-wider font-semibold">Frequency Advisory</p>
								<p className="mt-1 text-xs leading-5 text-amber-300/90">{config.aspirationalWarning}</p>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
