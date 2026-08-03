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
					<p className="font-mono text-xs uppercase tracking-[0.3em] text-[#5A7A8F]/80">
						{config.eyebrow || 'Repair vs Replace Audit'}
					</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1A1A1A] sm:text-3xl">
						Configure Parameters
					</h2>
					<p className="mt-2 text-sm text-[#5E5E5E]">
						Enter the asset's current condition and immediate repair costs.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{/* Asset Age */}
					<div className="flex flex-col gap-2 rounded-2xl border border-gray-200/80 [.light_&]:border-slate-200 bg-white [.light_&]:bg-slate-50 p-4">
						<span className="text-sm font-semibold text-[#5E5E5E]">{config.ageLabel}</span>
						<div className="flex items-center rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-white [.light_&]:bg-white mt-1">
							<button
								type="button"
								onClick={() => setAssetAge(prev => Math.max(config.ageMin || 0, prev - 1))}
								className="h-12 w-12 text-lg text-[#5E5E5E] hover:bg-slate-900 rounded-l-xl border-r border-gray-200 cursor-pointer"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono font-semibold text-[#1A1A1A]">
								{assetAge} {ageUnit}
							</span>
							<button
								type="button"
								onClick={() => setAssetAge(prev => Math.min(config.ageMax || 100, prev + 1))}
								className="h-12 w-12 text-lg text-[#5E5E5E] hover:bg-slate-900 rounded-r-xl border-l border-gray-200 cursor-pointer"
							>
								+
							</button>
						</div>
						<span className="text-xs text-[#8C8C8C] mt-1">{config.ageHelp}</span>
					</div>

					{/* Repair Cost Quote */}
					<div className="flex flex-col gap-2 rounded-2xl border border-gray-200/80 [.light_&]:border-slate-200 bg-white [.light_&]:bg-slate-50 p-4">
						<span className="text-sm font-semibold text-[#5E5E5E]">{config.repairLabel}</span>
						<div className="relative mt-1">
							<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#8C8C8C]">{currencySymbol}</span>
							<input
								type="number"
								min="0"
								step={config.repairStep || 50}
								value={repairCost}
								onChange={(e) => setRepairCost(Math.max(0, Number(e.target.value)))}
								className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-white [.light_&]:bg-white px-10 py-3 text-base font-semibold text-[#1A1A1A] [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							/>
						</div>
						<span className="text-xs text-[#8C8C8C] mt-1">{config.repairHelp}</span>
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
								? 'bg-red-500/10 text-[#B85C5C] border border-red-500/20 font-bold' 
								: 'bg-emerald-500/10 #1A1A1A border border-emerald-500/20 font-bold'
						}`}>
							Verdict: {calculations.isReplace ? 'REPLACE' : 'PATCH / REPAIR'}
						</span>

						<h3 className="mt-4 text-2xl font-bold tracking-tight text-[#1A1A1A] leading-tight">
							{calculations.isReplace ? config.replaceVerdictTitle : config.repairVerdictTitle}
						</h3>

						<p className="mt-3 text-sm leading-6 text-[#5E5E5E]">
							{calculations.isReplace ? config.replaceVerdictSubtitle : config.repairVerdictSubtitle}
						</p>

						<div className="mt-6 border-t border-gray-200/80 [.light_&]:border-slate-200 pt-6">
							<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-[#8C8C8C]">
								Asset Debt Index Score
							</p>
							<p className={`mt-1 text-3xl font-extrabold tracking-tight ${calculations.isReplace ? 'text-[#B85C5C]' : '#1A1A1A'}`}>
								{calculations.repairIndex.toLocaleString()}
							</p>
							<p className="mt-1 text-xs text-[#5E5E5E] font-mono">
								Threshold limit for this category is {config.threshold.toLocaleString()}.
							</p>
						</div>
					</div>
				</div>

				{/* Methodology Card */}
				<div className="panel-soft rounded-[1.8rem] p-6 sm:p-8">
					<h4 className="font-mono text-xs uppercase tracking-[0.28em] text-[#5E5E5E] mb-3">
						Decision Index Rule
					</h4>
					<p className="text-sm leading-6 text-[#5E5E5E]">
						The adapted <strong>Index Rule</strong> calculates system vulnerability as <code>Age × Repair Quote</code>. 
						If the resulting score exceeds the target threshold index, rolling capital into a new asset is mathematically superior to continuing to patch legacy liabilities.
					</p>
				</div>
			</div>
		</div>
	);
}
