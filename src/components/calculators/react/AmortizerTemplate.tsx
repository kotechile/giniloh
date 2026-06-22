import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '../../../lib/calculators/format';

export interface LocalProduct {
	id: string;
	name: string;
	cost: number;
	secondaryCost?: number; // e.g. electricity per hour or beans per cup
	info?: string; // e.g. "8GB VRAM, 220W"
}

export interface OutsourceProduct {
	id: string;
	name: string;
	rate: number;
	setupFee?: number;
	info?: string; // e.g. "Setup: $10"
	affiliateUrl?: string;
	ctaText?: string;
}

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
	frequencyUnit: string; // e.g. "drinks/week", "hours/week"
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

	// Custom catalogs
	localProducts?: LocalProduct[];
	outsourceProducts?: OutsourceProduct[];

	// Verdict customization
	buyVerdictTitle: string;
	buyVerdictSubtitle: string;
	skipVerdictTitle: string;
	skipVerdictSubtitle: string;

	// Optional settings
	aspirationalThreshold?: number;
	aspirationalWarning?: string;
	currencySymbol?: string;

	// Guides / Tutorial Links at the bottom
	tutorials?: {
		label: string;
		url: string;
	}[];
}

interface AmortizerTemplateProps {
	config: AmortizerConfig;
}

export default function AmortizerTemplate({ config }: AmortizerTemplateProps) {
	const currencySymbol = config.currencySymbol || '$';

	// Selected local/outsource product states
	const [selectedLocalId, setSelectedLocalId] = useState<string>(
		config.localProducts && config.localProducts.length > 0 ? config.localProducts[0].id : ''
	);
	const [selectedOutsourceId, setSelectedOutsourceId] = useState<string>(
		config.outsourceProducts && config.outsourceProducts.length > 0 ? config.outsourceProducts[0].id : ''
	);

	// Standard slider/input states
	const [stickerPrice, setStickerPrice] = useState(config.stickerDefault);
	const [frequency, setFrequency] = useState(config.frequencyDefault);
	const [outsourceCost, setOutsourceCost] = useState(config.outsourceDefault);
	const [secondaryCost, setSecondaryCost] = useState(config.secondaryDefault);
	const [lifespanYears, setLifespanYears] = useState(config.lifespanDefault);

	// Sync local product selection with inputs
	useEffect(() => {
		if (config.localProducts && selectedLocalId) {
			const prod = config.localProducts.find((p) => p.id === selectedLocalId);
			if (prod) {
				setStickerPrice(prod.cost);
				if (prod.secondaryCost !== undefined) {
					setSecondaryCost(prod.secondaryCost);
				}
			}
		}
	}, [selectedLocalId, config.localProducts]);

	// Sync outsource product selection with inputs
	useEffect(() => {
		if (config.outsourceProducts && selectedOutsourceId) {
			const prod = config.outsourceProducts.find((p) => p.id === selectedOutsourceId);
			if (prod) {
				setOutsourceCost(prod.rate);
			}
		}
	}, [selectedOutsourceId, config.outsourceProducts]);

	// Mathematical Engine
	const calculations = useMemo(() => {
		const usesPerYear = frequency * 52;
		const totalUses = usesPerYear * lifespanYears;

		// Calculate Maintenance (5% of sticker per year)
		const maintenance = stickerPrice * 0.05 * lifespanYears;

		// Local TCO = Sticker Price + Operating Cost + Maintenance
		const homeTco = stickerPrice + totalUses * secondaryCost + maintenance;

		// Find setup fee for selected outsource provider
		const selectedOutsourceProd = config.outsourceProducts?.find((p) => p.id === selectedOutsourceId);
		const setupFee = selectedOutsourceProd?.setupFee || 0;

		// Outsource TCO = Setup Fee + Operating Cost
		const outsourceTco = setupFee + totalUses * outsourceCost;

		const netSavings = outsourceTco - homeTco;
		const absSavings = Math.abs(netSavings);

		const homePerUse = totalUses > 0 ? homeTco / totalUses : 0;
		const outsourcePerUse = totalUses > 0 ? outsourceTco / totalUses : outsourceCost;

		// Break Even
		const priceDiffPerUse = outsourceCost - secondaryCost;
		let breakEvenUses = Infinity;
		let breakEvenMonths = Infinity;

		if (priceDiffPerUse > 0) {
			breakEvenUses = (stickerPrice + maintenance - setupFee) / priceDiffPerUse;
			const usesPerMonth = usesPerYear / 12;
			breakEvenMonths = usesPerMonth > 0 ? breakEvenUses / usesPerMonth : Infinity;
		}

		const isBuy = homeTco <= outsourceTco;

		return {
			totalUses,
			maintenance,
			setupFee,
			homeTco,
			outsourceTco,
			netSavings,
			absSavings,
			homePerUse,
			outsourcePerUse,
			breakEvenUses: Math.max(0, Math.ceil(breakEvenUses)),
			breakEvenMonths: Math.max(0, parseFloat(breakEvenMonths.toFixed(1))),
			isBuy
		};
	}, [
		stickerPrice,
		frequency,
		outsourceCost,
		secondaryCost,
		lifespanYears,
		selectedOutsourceId,
		config.outsourceProducts
	]);

	const selectedOutsourceProduct = config.outsourceProducts?.find((p) => p.id === selectedOutsourceId);
	const isAspirationalWarningTriggered =
		config.aspirationalThreshold !== undefined && frequency >= config.aspirationalThreshold;

	return (
		<div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
			{/* Left Column: Input Panel */}
			<div className="panel-soft rounded-[2rem] p-6 lg:p-8 space-y-8">
				<div>
					<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/80">
						{config.eyebrow || 'Cost-Per-Use Arbitrage'}
					</p>
					<h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
						Configure Parameters
					</h2>
					<p className="mt-2 text-sm text-slate-400">
						Configure your usage patterns and select hardware or outsource providers.
					</p>
				</div>

				<div className="space-y-6">
					{/* Usage Frequency Stepper */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
						<div className="flex items-center justify-between">
							<span className="text-base font-semibold text-slate-200">{config.frequencyLabel}</span>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
								{frequency} {config.frequencyUnit}
							</span>
						</div>
						<div className="flex items-center rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white mt-2">
							<button
								type="button"
								onClick={() =>
									setFrequency((prev) => Math.max(config.frequencyMin || 0, prev - (config.frequencyStep || 1)))
								}
								className="h-14 w-14 text-xl text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800 cursor-pointer"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono text-lg font-bold text-white">
								{frequency} {config.frequencyUnit}
							</span>
							<button
								type="button"
								onClick={() =>
									setFrequency((prev) =>
										Math.min(config.frequencyMax || 168, prev + (config.frequencyStep || 1))
									)
								}
								className="h-14 w-14 text-xl text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800 cursor-pointer"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.frequencyHelp}</span>
					</div>

					{/* Lifespan Stepper */}
					<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
						<div className="flex items-center justify-between">
							<span className="text-base font-semibold text-slate-200">{config.lifespanLabel}</span>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
								{lifespanYears} Years
							</span>
						</div>
						<div className="flex items-center rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white mt-2">
							<button
								type="button"
								onClick={() => setLifespanYears((prev) => Math.max(1, prev - 1))}
								className="h-14 w-14 text-xl text-slate-400 hover:bg-slate-900 rounded-l-xl border-r border-slate-800 cursor-pointer"
							>
								−
							</button>
							<span className="flex-1 text-center font-mono text-lg font-bold text-white">
								{lifespanYears} Years
							</span>
							<button
								type="button"
								onClick={() => setLifespanYears((prev) => Math.min(20, prev + 1))}
								className="h-14 w-14 text-xl text-slate-400 hover:bg-slate-900 rounded-r-xl border-l border-slate-800 cursor-pointer"
							>
								+
							</button>
						</div>
						<span className="text-xs text-slate-500 mt-1">{config.lifespanHelp}</span>
					</div>

					{/* Predefined Local Product Dropdown (if provided) */}
					{config.localProducts && config.localProducts.length > 0 && (
						<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
							<span className="text-base font-semibold text-slate-200">Select Hardware Option</span>
							<select
								value={selectedLocalId}
								onChange={(e) => setSelectedLocalId(e.target.value)}
								className="mt-2 w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-4 py-3.5 text-base text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
							>
								{config.localProducts.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} — {formatCurrency(p.cost)} {p.info ? `(${p.info})` : ''}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Manual Sticker & Secondary Inputs (rendered only if no presets are set, or as a customization fallback) */}
					{!config.localProducts && (
						<div className="grid gap-6 sm:grid-cols-2">
							<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
								<span className="text-sm font-semibold text-slate-200">{config.stickerLabel}</span>
								<div className="relative mt-1">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
										{currencySymbol}
									</span>
									<input
										type="number"
										min="0"
										value={stickerPrice}
										onChange={(e) => setStickerPrice(Math.max(0, Number(e.target.value)))}
										className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-10 py-3 text-base font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
									/>
								</div>
								<span className="text-xs text-slate-500 mt-1">{config.stickerHelp}</span>
							</div>

							<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
								<span className="text-sm font-semibold text-slate-200">{config.secondaryLabel}</span>
								<div className="relative mt-1">
									<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
										{currencySymbol}
									</span>
									<input
										type="number"
										step="0.01"
										min="0"
										value={secondaryCost}
										onChange={(e) => setSecondaryCost(Math.max(0, Number(e.target.value)))}
										className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-10 py-3 text-base font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
									/>
								</div>
								<span className="text-xs text-slate-500 mt-1">{config.secondaryHelp}</span>
							</div>
						</div>
					)}

					{/* Predefined Outsource Providers Cards (if provided) */}
					{config.outsourceProducts && config.outsourceProducts.length > 0 && (
						<div className="flex flex-col gap-3 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
							<span className="text-base font-semibold text-slate-200">Select Alternative/Cloud Provider</span>
							<div className="grid gap-3 sm:grid-cols-2">
								{config.outsourceProducts.map((p) => {
									const isSelected = selectedOutsourceId === p.id;
									return (
										<button
											key={p.id}
											type="button"
											onClick={() => setSelectedOutsourceId(p.id)}
											className={`flex flex-col items-start gap-1 p-4 rounded-xl border text-left transition duration-150 cursor-pointer ${
												isSelected
													? 'border-cyan-500 bg-cyan-950/30 [.light_&]:border-cyan-400 [.light_&]:bg-cyan-50/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
													: 'border-slate-800 bg-slate-950/60 [.light_&]:border-slate-200 [.light_&]:bg-white hover:border-slate-700 [.light_&]:hover:border-slate-300'
											}`}
										>
											<div className="flex items-center justify-between w-full">
												<span className="font-semibold text-white text-sm">{p.name}</span>
												<span className="font-mono text-xs font-bold text-cyan-400">
													{currencySymbol}
													{p.rate.toFixed(2)}/hr
												</span>
											</div>
											{p.info && <span className="text-[10px] text-slate-400 mt-1">{p.info}</span>}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{/* Manual Outsource Inputs (if no presets exist) */}
					{!config.outsourceProducts && (
						<div className="flex flex-col gap-2 rounded-2xl border border-slate-800/85 [.light_&]:border-slate-200 bg-slate-950/40 [.light_&]:bg-slate-50 p-5">
							<span className="text-sm font-semibold text-slate-200">{config.outsourceLabel}</span>
							<div className="relative mt-1">
								<span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
									{currencySymbol}
								</span>
								<input
									type="number"
									step="0.01"
									min="0"
									value={outsourceCost}
									onChange={(e) => setOutsourceCost(Math.max(0, Number(e.target.value)))}
									className="w-full rounded-xl border border-slate-700/80 [.light_&]:border-slate-200 bg-slate-950 [.light_&]:bg-white px-10 py-3 text-base font-semibold text-white [.light_&]:text-slate-800 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
								/>
							</div>
							<span className="text-xs text-slate-500 mt-1">{config.outsourceHelp}</span>
						</div>
					)}
				</div>
			</div>

			{/* Right Column: Output / Verdict */}
			<div className="space-y-6">
				{/* Verdict Card (Premium Styling, Larger Characters) */}
				<div
					className={`panel-soft overflow-hidden rounded-[2rem] border transition duration-300 ${
						calculations.isBuy
							? 'border-emerald-500/35 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 shadow-[0_0_60px_rgba(16,185,129,0.2)] [.light_&]:border-emerald-200/60 [.light_&]:bg-[linear-gradient(135deg,rgba(240,253,250,0.8),rgba(209,250,229,0.4))] [.light_&]:shadow-[0_15px_30px_rgba(16,185,129,0.06)]'
							: 'border-cyan-500/35 bg-gradient-to-br from-slate-900/90 to-cyan-950/20 shadow-[0_0_60px_rgba(56,189,248,0.2)] [.light_&]:border-cyan-200/60 [.light_&]:bg-[linear-gradient(135deg,rgba(236,254,255,0.8),rgba(207,250,254,0.4))] [.light_&]:shadow-[0_15px_30px_rgba(34,211,238,0.06)]'
					}`}
				>
					<div className="p-6 sm:p-8">
						<span
							className={`inline-flex rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] font-bold ${
								calculations.isBuy
									? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
									: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
							}`}
						>
							Verdict: {calculations.isBuy ? 'OWN / BUY' : 'OUTSOURCE'}
						</span>

						<h3 className="mt-5 text-3xl font-extrabold tracking-tight text-white leading-tight">
							{calculations.isBuy ? config.buyVerdictTitle : config.skipVerdictTitle}
						</h3>

						<p className="mt-4 text-base leading-7 text-slate-300">
							{calculations.isBuy ? config.buyVerdictSubtitle : config.skipVerdictSubtitle}
						</p>

						{calculations.netSavings !== 0 && (
							<div className="mt-8 border-t border-slate-800/80 [.light_&]:border-slate-200 pt-6">
								<p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500">
									Net Financial Impact
								</p>
								<p
									className={`mt-2 text-4xl font-black tracking-tight ${
										calculations.isBuy ? 'text-emerald-400' : 'text-cyan-400'
									}`}
								>
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

				{/* Affiliate CTA Box (integrated dynamically when outsource provider is selected) */}
				{selectedOutsourceProduct?.affiliateUrl && (
					<div className="panel-soft rounded-[2rem] border border-pink-500/35 [.light_&]:border-pink-200/60 bg-gradient-to-br from-slate-900/90 to-pink-950/15 [.light_&]:bg-[linear-gradient(135deg,rgba(253,242,248,0.85),rgba(252,231,243,0.4))] p-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] [.light_&]:shadow-[0_15px_30px_rgba(236,72,153,0.05)] flex flex-col gap-4">
						<div>
							<p className="font-mono text-xs uppercase tracking-[0.24em] text-pink-400 font-bold">
								Special Partner Offer
							</p>
							<h4 className="mt-2 text-xl font-bold text-white">
								{selectedOutsourceProduct.ctaText || `Start with ${selectedOutsourceProduct.name} first`}
							</h4>
							<p className="mt-1.5 text-xs leading-5 text-slate-300">
								Zero hardware cost, scale up instantly, and only pay for active runtime.
							</p>
						</div>
						<a
							href={selectedOutsourceProduct.affiliateUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full text-center py-3.5 px-6 font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg transition duration-150 cursor-pointer"
						>
							{selectedOutsourceProduct.ctaText || `Try ${selectedOutsourceProduct.name} (No Upfront Cost) →`}
						</a>
					</div>
				)}

				{/* Quick Metrics (Break-even and monthly difference) */}
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
						<p className="text-xs text-slate-500 font-medium">Monthly Diff</p>
						<p className="text-2xl font-black text-white mt-1.5 font-mono">
							{formatCurrency(calculations.absSavings / (lifespanYears * 12))}
						</p>
					</div>
				</div>

				{/* Detailed Cost Breakdown */}
				<div className="panel-soft rounded-[2rem] p-6 sm:p-8 space-y-4">
					<p className="font-mono text-xs uppercase tracking-[0.28em] text-slate-400">
						Cost breakdown
					</p>

					<div className="grid grid-cols-2 gap-4 border-b border-slate-800/80 [.light_&]:border-slate-200 pb-4">
						<div>
							<p className="text-xs text-slate-500">Ownership Cost/Unit</p>
							<p className="text-lg font-bold text-white mt-0.5 font-mono">{formatCurrency(calculations.homePerUse)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Outsourced Cost/Unit</p>
							<p className="text-lg font-bold text-white mt-0.5 font-mono">{formatCurrency(calculations.outsourcePerUse)}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 border-b border-slate-800/80 [.light_&]:border-slate-200 pb-4">
						<div>
							<p className="text-xs text-slate-500">Local TCO (Sticker + Upkeep)</p>
							<p className="text-sm font-semibold text-slate-300 font-mono">{formatCurrency(calculations.homeTco)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Outsource TCO {calculations.setupFee > 0 ? '(+Setup)' : ''}</p>
							<p className="text-sm font-semibold text-slate-300 font-mono">{formatCurrency(calculations.outsourceTco)}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 pt-1">
						<div>
							<p className="text-xs text-slate-500">Total Expected Runs</p>
							<p className="text-sm font-semibold text-slate-300 font-mono">
								{calculations.totalUses.toLocaleString()} runs
							</p>
						</div>
						<div>
							<p className="text-xs text-slate-500">Total Setup/Maintenance</p>
							<p className="text-sm font-semibold text-slate-300 font-mono">
								{calculations.isBuy
									? formatCurrency(calculations.maintenance)
									: formatCurrency(calculations.setupFee)}
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

				{/* Tutorial Affiliate Links */}
				{config.tutorials && config.tutorials.length > 0 && (
					<div className="panel-soft rounded-[2rem] p-6 space-y-4">
						<p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500 font-bold">
							Ready to Start?
						</p>
						<div className="flex flex-wrap gap-3">
							{config.tutorials.map((t, idx) => (
								<a
									key={idx}
									href={t.url}
									target="_blank"
									rel="noopener noreferrer"
									className="py-2.5 px-4 font-semibold text-xs text-slate-300 [.light_&]:text-slate-700 hover:text-white [.light_&]:hover:text-slate-900 rounded-lg border border-slate-800 [.light_&]:border-slate-200 bg-slate-950/60 [.light_&]:bg-white hover:bg-slate-900 [.light_&]:hover:bg-slate-50 transition"
								>
									{t.label}
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
