import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

export interface RxRConfig {
	title: string;
	description: string;
	eyebrow?: string;

	// Inputs configuration
	ageLabel: string;
	ageHelp: string;
	ageDefault: number;
	ageUnit?: string;
	ageMin?: number;
	ageMax?: number;

	repairLabel: string;
	repairHelp: string;
	repairDefault: number;
	repairMin?: number;
	repairStep?: number;

	// Calculation parameters
	threshold: number; // e.g. 1500 for electronics, 5000 for infrastructure

	// Verdict customization
	repairVerdictTitle: string;
	repairVerdictSubtitle: string;
	replaceVerdictTitle: string;
	replaceVerdictSubtitle: string;

	currencySymbol?: string;
}

interface RxRTemplateProps {
	config: RxRConfig;
}

export default function RxRTemplate({ config }: RxRTemplateProps) {
	const currencySymbol = config.currencySymbol || '$';
	const ageUnit = config.ageUnit || 'Years';

	const [assetAge, setAssetAge] = useState(config.ageDefault);
	const [repairCost, setRepairCost] = useState(config.repairDefault);

	// Mathematical Engine
	const calculations = useMemo(() => {
		const repairIndex = assetAge * repairCost;
		const isReplace = repairIndex >= config.threshold;

		return {
			repairIndex,
			isReplace
		};
	}, [assetAge, repairCost, config.threshold]);

	return (
		<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: Inputs */}
			<div className="panel-soft rounded-[1.8rem] p-6 lg:p-8 space-y-6">
				<div>
					<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
						{config.eyebrow || 'Repair vs Replace Audit'}
					</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Configure Parameters
					</h2>
					<p className="mt-2 text-sm text-slate-400">
						Enter the asset's current condition and immediate repair costs.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{/* Asset Age */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.ageLabel}</span>
						<div className="flex items-center rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white mt-1">
							<button
								type="button"
								onClick={() => setAssetAge(prev => Math.max(config.ageMin || 0, prev - 1))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800 cursor-pointer"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono font-semibold text-white">
								{assetAge} {ageUnit}
							</span>
							<button
								type="button"
								onClick={() => setAssetAge(prev => Math.min(config.ageMax || 100, prev + 1))}
								className="h-12 w-12 text-lg text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800 cursor-pointer"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.ageHelp}</span>
					</div>

					{/* Repair Cost Quote */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/80 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-4">
						<span className="text-sm font-semibold text-slate-200">{config.repairLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">{currencySymbol}</span>
							<input
								type="number"
								min="0"
								step={config.repairStep || 50}
								value={repairCost}
								onChange={(e) => setRepairCost(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-10 py-3 text-base font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.repairHelp}</span>
					</div>
				</div>
			</div>

			{/* Right Column: Output */}
			<div className="space-y-6">
				{/* Verdict Card */}
				<div 
					className={`panel-soft overflow-hidden rounded-[1.8rem] border transition duration-300 ${
						calculations.isReplace 
							? 'border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.15)] bg-gradient-to-br from-slate-900/90 to-red-950/20 [.light_&]:border-red-200/60 [.light_&]:bg-[linear-gradient(135deg,rgba(254,242,242,0.8),rgba(254,226,226,0.4))] [.light_&]:shadow-[0_15px_30px_rgba(239,68,68,0.06)]' 
							: 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] bg-gradient-to-br from-slate-900/90 to-emerald-950/20 [.light_&]:border-emerald-200/60 [.light_&]:bg-[linear-gradient(135deg,rgba(240,253,250,0.8),rgba(209,250,229,0.4))] [.light_&]:shadow-[0_15px_30px_rgba(16,185,129,0.06)]'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span className={`inline-flex rounded-full px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.24em] font-semibold ${
							calculations.isReplace 
								? 'bg-red-500/10 text-red-400 border border-red-500/20 font-bold' 
								: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold'
						}`}>
							Verdict: {calculations.isReplace ? 'REPLACE' : 'PATCH / REPAIR'}
						</span>

						<h3 className="mt-4 text-2xl font-bold tracking-tight text-white leading-tight">
							{calculations.isReplace ? config.replaceVerdictTitle : config.repairVerdictTitle}
						</h3>

						<p className="mt-3 text-sm leading-6 text-slate-300">
							{calculations.isReplace ? config.replaceVerdictSubtitle : config.repairVerdictSubtitle}
						</p>

						<div className="mt-6 border-t border-slate-800/80 [.light_&]:border-slate-200 pt-6">
							<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
								Asset Debt Index Score
							</p>
							<p className={`mt-1 text-3xl font-extrabold tracking-tight ${calculations.isReplace ? 'text-red-400' : 'text-emerald-400'}`}>
								{calculations.repairIndex.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-slate-400 font-mono">
								Threshold limit for this category is {config.threshold.toLocaleString()}.
							</p>
						</div>
					</div>
				</div>

				{/* Methodology Card */}
				<div className="panel-soft rounded-[1.8rem] p-6 sm:p-8">
					<h4 className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400 mb-3">
						Decision Index Rule
					</h4>
					<p className="text-sm leading-6 text-slate-300">
						The adapted <strong>Index Rule</strong> calculates system vulnerability as <code>Age × Repair Quote</code>. 
						If the resulting score exceeds the target threshold index, rolling capital into a new asset is mathematically superior to continuing to patch legacy liabilities.
					</p>
				</div>
			</div>
		</div>
	);
}
