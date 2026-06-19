import React, { useState, useId, useMemo, useEffect } from 'react';
import {
	DecisionIntelligenceEngine,
	type DecisionIntelligenceInputs
} from '../../../lib/calculators/decisionIntelligence';
import { formatCurrency } from '../../../lib/calculators/format';

const INITIAL_INPUTS: DecisionIntelligenceInputs = {
	mau: 25000,
	devRate: 85,
	buildTime: 3,
	maintFte: 50,
	complianceLevel: 'soc2',
	codebaseAge: 3,
	remediationHours: 40,
	hasSunkCostFallacy: false,
	hasKeyPersonRisk: false,
	hasTinkeringTax: false
};

export default function DecisionIntelligenceCalculator() {
	const [inputs, setInputs] = useState<DecisionIntelligenceInputs>(INITIAL_INPUTS);
	const [isLoaded, setIsLoaded] = useState(false);
	const fieldId = useId();

	// Hydration sync from localStorage
	useEffect(() => {
		const stored = localStorage.getItem('gini_decision_intelligence_inputs');
		if (stored) {
			try {
				const data = JSON.parse(stored);
				setInputs((current) => ({
					...current,
					...data
				}));
			} catch (e) {
				console.error('Failed to restore decision intelligence inputs:', e);
			}
		}
		setIsLoaded(true);
	}, []);

	// Write back to localStorage on change
	useEffect(() => {
		if (isLoaded) {
			localStorage.setItem('gini_decision_intelligence_inputs', JSON.stringify(inputs));
		}
	}, [inputs, isLoaded]);

	const updateInput = <K extends keyof DecisionIntelligenceInputs>(
		key: K,
		value: DecisionIntelligenceInputs[K]
	) => {
		setInputs((current) => ({ ...current, [key]: value }));
	};

	// Calculate outputs in real-time
	const outputs = useMemo(() => DecisionIntelligenceEngine.calculate(inputs), [inputs]);

	const remediationCost = useMemo(() => inputs.remediationHours * inputs.devRate, [inputs.remediationHours, inputs.devRate]);

	return (
		<div className="grid gap-8">
			{/* STEP 1: DYNAMIC VERDICT BANNER */}
			<div
				className={`overflow-hidden rounded-[2rem] border transition-all duration-300 p-6 sm:p-8 ${
					outputs.verdict === 'BUY'
						? 'border-emerald-500/30 bg-[linear-gradient(135deg,rgba(2,44,34,0.6),rgba(2,6,23,0.96)_65%,rgba(16,185,129,0.12))] shadow-[0_0_50px_rgba(16,185,129,0.1)]'
						: outputs.verdict === 'PATCH'
							? 'border-indigo-500/30 bg-[linear-gradient(135deg,rgba(30,27,75,0.6),rgba(2,6,23,0.96)_65%,rgba(99,102,241,0.12))] shadow-[0_0_50px_rgba(99,102,241,0.1)]'
							: 'border-slate-800/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.6),rgba(2,6,23,0.96)_65%)] shadow-2xl'
				}`}
			>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
							Decision Verdict
						</span>
						<span
							className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] ${
								outputs.verdict === 'BUY'
									? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
									: outputs.verdict === 'PATCH'
										? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
										: 'border-slate-700/40 bg-slate-800/50 text-slate-400'
							}`}
						>
							{outputs.verdict === 'BUY' ? 'Buy SaaS' : outputs.verdict === 'PATCH' ? 'Repair / Patch' : 'Wait / Validate'}
						</span>
					</div>

					<h2
						className={`text-3xl font-extrabold tracking-tight sm:text-4xl uppercase ${
							outputs.verdict === 'BUY'
								? 'text-emerald-400'
								: outputs.verdict === 'PATCH'
									? 'text-indigo-400'
									: 'text-slate-200'
						}`}
					>
						{outputs.verdict === 'BUY'
							? 'Verdict: Buy SaaS Platform'
							: outputs.verdict === 'PATCH'
								? 'Verdict: Patch Legacy Auth'
								: 'Verdict: Skip / Wait'}
					</h2>

					<p className="text-base leading-7 text-slate-300 font-medium">
						{outputs.verdictRationale}
					</p>

					<div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-4 border-t border-slate-800/80 pt-6">
						<div>
							<p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
								3-Yr Custom TCO
							</p>
							<p className="mt-1 text-lg font-bold text-slate-400">
								{formatCurrency(outputs.custom3YrTco)}
							</p>
						</div>
						<div>
							<p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
								3-Yr SaaS TCO
							</p>
							<p className="mt-1 text-lg font-bold text-emerald-400">
								{formatCurrency(outputs.saas3YrTco)}
							</p>
						</div>
						<div>
							<p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
								Break-Even
							</p>
							<p className="mt-1 text-lg font-bold text-indigo-400">
								{outputs.breakEvenVerdict}
							</p>
						</div>
						<div>
							<p className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
								SaaS CPU / Mo
							</p>
							<p className="mt-1 text-lg font-bold text-slate-300">
								${outputs.cpuSaaS} <span className="text-[10px] text-slate-500">/MAU</span>
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* STEP 2: ROI SLIDERS & PARAMETERS */}
			<div className="rounded-[2rem] border border-slate-800 bg-slate-950/20 p-6 sm:p-8">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-xl font-bold tracking-tight text-white">⚙️ Operational parameters</h3>
					<span className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
						Step 2 of 4
					</span>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					{/* Monthly Active Users Slider */}
					<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
									Active scale
								</p>
								<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
									Monthly Active Users (MAUs)
								</span>
							</div>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.7rem] font-semibold text-cyan-300">
								{inputs.mau.toLocaleString()} MAUs
							</span>
						</div>
						<div className="mt-3">
							<input
								id={`${fieldId}-mau`}
								type="range"
								min="1000"
								max="500000"
								step="1000"
								value={inputs.mau}
								onChange={(e) => updateInput('mau', Number(e.target.value))}
								className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
							/>
							<div className="flex justify-between text-[10px] font-mono text-slate-600 mt-2">
								<span>1,000</span>
								<span>100,000</span>
								<span>250,000</span>
								<span>500,000</span>
							</div>
						</div>
					</div>

					{/* Loaded Developer Hourly Rate Slider */}
					<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
									Engineering salary cost
								</p>
								<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
									Loaded Developer Rate ($/hr)
								</span>
							</div>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.7rem] font-semibold text-cyan-300">
								${inputs.devRate} / hr
							</span>
						</div>
						<div className="mt-3">
							<input
								id={`${fieldId}-devrate`}
								type="range"
								min="40"
								max="250"
								step="5"
								value={inputs.devRate}
								onChange={(e) => updateInput('devRate', Number(e.target.value))}
								className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
							/>
							<div className="flex justify-between text-[10px] font-mono text-slate-600 mt-2">
								<span>$40 / hr</span>
								<span>$100 / hr</span>
								<span>$175 / hr</span>
								<span>$250 / hr</span>
							</div>
						</div>
					</div>

					{/* Initial Custom Build Time Stepper */}
					<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
									Labor time
								</p>
								<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
									Initial Custom Build Time
								</span>
							</div>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.7rem] font-semibold text-cyan-300">
								{inputs.buildTime} Months
							</span>
						</div>
						<div className="flex items-center justify-between border border-slate-700/60 rounded-xl bg-slate-950/60 p-1.5 mt-2">
							<button
								type="button"
								onClick={() => updateInput('buildTime', Math.max(1, inputs.buildTime - 1))}
								className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
							>
								−
							</button>
							<span className="font-semibold text-white">{inputs.buildTime} months</span>
							<button
								type="button"
								onClick={() => updateInput('buildTime', Math.min(12, inputs.buildTime + 1))}
								className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
							>
								+
							</button>
						</div>
					</div>

					{/* Maintenance Overhead FTE Stepper */}
					<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
									Upkeep burden
								</p>
								<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
									Maintenance Overhead FTE
								</span>
							</div>
							<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.7rem] font-semibold text-cyan-300">
								{inputs.maintFte}% FTE
							</span>
						</div>
						<div className="flex items-center justify-between border border-slate-700/60 rounded-xl bg-slate-950/60 p-1.5 mt-2">
							<button
								type="button"
								onClick={() => updateInput('maintFte', Math.max(10, inputs.maintFte - 10))}
								className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
							>
								−
							</button>
							<span className="font-semibold text-white">{inputs.maintFte}% FTE</span>
							<button
								type="button"
								onClick={() => updateInput('maintFte', Math.min(100, inputs.maintFte + 10))}
								className="h-10 w-10 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-lg font-bold"
							>
								+
							</button>
						</div>
					</div>
				</div>

				{/* Compliance Target Toggle Tabs */}
				<div className="mt-6">
					<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500 mb-3">
						Regulatory and Compliance standard Target
					</p>
					<div className="grid grid-cols-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-1">
						{(['none', 'soc2', 'hipaa'] as const).map((level) => (
							<button
								key={level}
								type="button"
								onClick={() => updateInput('complianceLevel', level)}
								className={`py-3 px-2 rounded-xl text-center font-semibold text-xs transition cursor-pointer uppercase tracking-wider ${
									inputs.complianceLevel === level
										? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shadow-md'
										: 'text-slate-400 hover:text-slate-200 border border-transparent'
								}`}
							>
								{level === 'none' ? 'None' : level === 'soc2' ? 'SOC 2 Type II' : 'HIPAA BAA'}
							</button>
						))}
					</div>
				</div>

				{/* Additional Existing Codebase Tech Debt Settings Accordion */}
				<div className="mt-6 border-t border-slate-800/80 pt-6">
					<details className="group">
						<summary className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.2em] text-slate-400 cursor-pointer list-none select-none hover:text-white">
							<span>🔧 Existing Codebase Settings (Adapted 5,000 Rule)</span>
							<span className="transition duration-200 group-open:rotate-180">▼</span>
						</summary>
						<div className="grid gap-4 sm:grid-cols-2 mt-4 animate-fadeIn">
							<div className="rounded-[1.2rem] border border-slate-800/80 bg-slate-950/30 p-4">
								<span className="block text-xs font-semibold text-slate-300">Codebase Structural Age</span>
								<div className="flex items-center justify-between border border-slate-700/60 rounded-xl bg-slate-950/60 p-1.5 mt-2">
									<button
										type="button"
										onClick={() => updateInput('codebaseAge', Math.max(0, inputs.codebaseAge - 1))}
										className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-sm"
									>
										−
									</button>
									<span className="font-semibold text-xs text-white">{inputs.codebaseAge} Years</span>
									<button
										type="button"
										onClick={() => updateInput('codebaseAge', Math.min(10, inputs.codebaseAge + 1))}
										className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-sm"
									>
										+
									</button>
								</div>
							</div>
							<div className="rounded-[1.2rem] border border-slate-800/80 bg-slate-950/30 p-4">
								<span className="block text-xs font-semibold text-slate-300">Remediation Labor required</span>
								<div className="flex items-center justify-between border border-slate-700/60 rounded-xl bg-slate-950/60 p-1.5 mt-2">
									<button
										type="button"
										onClick={() => updateInput('remediationHours', Math.max(10, inputs.remediationHours - 10))}
										className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-sm"
									>
										−
									</button>
									<span className="font-semibold text-xs text-white">{inputs.remediationHours} Hours</span>
									<button
										type="button"
										onClick={() => updateInput('remediationHours', Math.min(500, inputs.remediationHours + 10))}
										className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer text-sm"
									>
										+
									</button>
								</div>
							</div>
						</div>
					</details>
				</div>
			</div>

			{/* STEP 3: ICEBERG COST MATRIX */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Visible SaaS Managed Platform TCO */}
				<div className="panel-soft flex flex-col rounded-[1.8rem] border border-cyan-500/25 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(8,47,73,0.85)_80%,rgba(34,211,238,0.12))] p-6 shadow-[0_0_35px_rgba(6,182,212,0.06)] hover:border-cyan-500/40 transition-all duration-300 group">
					<div className="flex items-center justify-between">
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300/85">
							SaaS Managed Platform
						</p>
						<span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-200">
							Linear scaling
						</span>
					</div>

					<h4 className="mt-4 text-sm font-mono uppercase tracking-wider text-slate-400">
						3-Year SaaS Cumulative TCO
					</h4>
					<p className="mt-1 text-4xl font-extrabold tracking-tight text-white">
						{formatCurrency(outputs.saas3YrTco)}
					</p>

					<div className="mt-6 flex-1 grid gap-4">
						<div className="rounded-[1.2rem] border border-slate-800 bg-slate-950/65 p-4 shadow-sm group-hover:border-cyan-500/10 transition-colors">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 block">
								Visible setup and integration
							</span>
							<div className="flex items-baseline justify-between mt-1">
								<span className="text-sm font-semibold text-slate-200">SDK Setup Labor</span>
								<span className="text-sm font-bold text-white">{formatCurrency(outputs.saasIntegrateCost)}</span>
							</div>
							<p className="text-[11px] text-slate-400 mt-1">
								Estimated at 8 hours of loaded developer time to integrate SaaS libraries.
							</p>
						</div>

						<div className="rounded-[1.2rem] border border-slate-800 bg-slate-950/65 p-4 shadow-sm group-hover:border-cyan-500/10 transition-colors">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 block">
								Ongoing monthly license fee
							</span>
							<div className="flex items-baseline justify-between mt-1">
								<span className="text-sm font-semibold text-slate-200">Subscription Overage (Current)</span>
								<span className="text-sm font-bold text-cyan-400">{formatCurrency(outputs.saasMaintCostMonthly)} / mo</span>
							</div>
							<p className="text-[11px] text-slate-400 mt-1">
								Based on {inputs.mau.toLocaleString()} MAUs. 3-Year subscription sum: {formatCurrency(outputs.saasSubCost3Yr)}.
							</p>
						</div>
					</div>

					{/* Hover info text */}
					<div className="mt-5 rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] leading-5 text-slate-400">
						<span className="font-semibold text-slate-200">Platform Coverage:</span> Built-in Multi-Factor Auth (MFA), passkeys, session tokens, audit logs, and global SOC 2 Type II compliance controls. No maintenance drag.
					</div>
				</div>

				{/* Hidden Custom Build TCO */}
				<div className="panel-soft flex flex-col rounded-[1.8rem] border border-rose-500/20 bg-[linear-gradient(135deg,rgba(2,6,23,0.96),rgba(67,20,30,0.85)_80%,rgba(244,63,94,0.12))] p-6 shadow-[0_0_35px_rgba(244,63,94,0.06)] hover:border-rose-500/35 transition-all duration-300 group">
					<div className="flex items-center justify-between">
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-rose-300/85">
							In-House Custom Build
						</p>
						<span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-rose-200">
							Engineering tax
						</span>
					</div>

					<h4 className="mt-4 text-sm font-mono uppercase tracking-wider text-slate-400">
						3-Year Custom Cumulative TCO
					</h4>
					<p className="mt-1 text-4xl font-extrabold tracking-tight text-white">
						{formatCurrency(outputs.custom3YrTco)}
					</p>

					<div className="mt-6 flex-1 grid gap-4">
						<div className="rounded-[1.2rem] border border-slate-800 bg-slate-950/65 p-4 shadow-sm group-hover:border-rose-500/10 transition-colors">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500 block">
								Upfront CapEx (Visible)
							</span>
							<div className="flex items-baseline justify-between mt-1">
								<span className="text-sm font-semibold text-slate-200">Development Labor</span>
								<span className="text-sm font-bold text-white">{formatCurrency(outputs.customBuildCost)}</span>
							</div>
							<p className="text-[11px] text-slate-400 mt-1">
								{inputs.buildTime} months at loaded rate with a baseline team of 1.5 senior engineers.
							</p>
						</div>

						<div className="rounded-[1.2rem] border border-slate-800 bg-slate-950/65 p-4 shadow-sm group-hover:border-rose-500/10 transition-colors">
							<span className="font-mono text-[10px] uppercase tracking-[0.22em] text-rose-400 block">
								Hidden OpEx Drag (Iceberg)
							</span>
							<div className="grid gap-1.5 mt-2">
								<div className="flex justify-between text-xs text-slate-300">
									<span>3-Year Security Upkeep:</span>
									<span className="font-semibold text-slate-200">{formatCurrency(outputs.customMaintCost3Yr)}</span>
								</div>
								{inputs.complianceLevel !== 'none' && (
									<div className="flex justify-between text-xs text-slate-300">
										<span>3-Year Compliance Prep:</span>
										<span className="font-semibold text-slate-200">{formatCurrency(outputs.customComplianceCost3Yr)}</span>
									</div>
								)}
								<div className="flex justify-between text-xs text-slate-300">
									<span>Product Opportunity Cost:</span>
									<span className="font-semibold text-slate-200">{formatCurrency(outputs.customOpportunityCost3Yr)}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Hover info text */}
					<div className="mt-5 rounded-xl border border-white/5 bg-white/5 p-3 text-[11px] leading-5 text-slate-400">
						<span className="font-semibold text-rose-300">The Maintenance Tax:</span> 94% of custom web backends suffer from broken access control (OWASP Top 1). Upkeep consumes {inputs.maintFte}% FTE annually for middleware upgrades and CVE patching.
					</div>
				</div>
			</div>

			{/* STEP 4: PSYCHOLOGICAL VIBE KILLERS CHECKLIST */}
			<div className="rounded-[2rem] border border-slate-800 bg-slate-950/20 p-6 sm:p-8">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h3 className="text-xl font-bold tracking-tight text-white">⚠️ Strategic risk assessment</h3>
						<p className="text-xs text-slate-400 mt-1">Check the organizational conditions that apply to your system:</p>
					</div>
					<span className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-slate-500">
						Step 4 of 4
					</span>
				</div>

				<div className="grid gap-4">
					{/* Checklist Item 1 */}
					<label className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition hover:bg-slate-900/30 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={inputs.hasSunkCostFallacy}
							onChange={(e) => updateInput('hasSunkCostFallacy', e.target.checked)}
							className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
						/>
						<div>
							<span className="block text-sm font-semibold text-slate-200">
								Sunk Cost Bias
							</span>
							<span className="mt-1 block text-xs leading-5 text-slate-400">
								"We have already spent substantial resources and developer hours patching our custom auth logic, so we must keep maintaining it."
							</span>
						</div>
					</label>

					{/* Checklist Item 2 */}
					<label className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition hover:bg-slate-900/30 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={inputs.hasKeyPersonRisk}
							onChange={(e) => updateInput('hasKeyPersonRisk', e.target.checked)}
							className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
						/>
						<div>
							<span className="block text-sm font-semibold text-slate-200">
								Key-Person Turn-Over Risk
							</span>
							<span className="mt-1 block text-xs leading-5 text-slate-400">
								"Our custom auth middleware, OAuth flow, and token session validation were built and are maintained by a single senior engineer."
							</span>
						</div>
					</label>

					{/* Checklist Item 3 */}
					<label className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-4 transition hover:bg-slate-900/30 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={inputs.hasTinkeringTax}
							onChange={(e) => updateInput('hasTinkeringTax', e.target.checked)}
							className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
						/>
						<div>
							<span className="block text-sm font-semibold text-slate-200">
								Brittle Integration Tax
							</span>
							<span className="mt-1 block text-xs leading-5 text-slate-400">
								"We stitch multiple no-code visual tables and external databases (e.g. Notion, Zapier, Softr) to sync user sessions."
							</span>
						</div>
					</label>
				</div>

				{/* Dynamic Risk Warnings Panel */}
				<div className="mt-6 grid gap-4">
					{/* Sunk Cost Fallacy warning */}
					{inputs.hasSunkCostFallacy && (
						<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 animate-fadeIn">
							<span className="text-xl">⚠️</span>
							<div>
								<h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
									Active Exposure: Sunk Cost Fallacy Triggered
								</h4>
								<p className="text-xs leading-5 text-slate-300 mt-1">
									Continuing to patch this legacy custom build simply because of prior investment drains engineering focus that could be spent building core product features. Your codebase tech debt index is <span className="font-semibold text-white">{outputs.softwareIndex.toLocaleString()}</span> {outputs.isSoftwareIndexHigh ? '(Threshold exceeded: 5,000)' : '(Threshold: 5,000)'}.
								</p>
							</div>
						</div>
					)}

					{/* Key Person risk warning */}
					{inputs.hasKeyPersonRisk && (
						<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 animate-fadeIn">
							<span className="text-xl">🛑</span>
							<div>
								<h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
									Key-Person Risk: High Knowledge Loss Liability
								</h4>
								<p className="text-xs leading-5 text-slate-300 mt-1">
									Turnover will leave your core session pipeline completely unmaintained. If this engineer leaves, the loaded cost to onboarding a replacement developer and resolving immediate patches is estimated at <span className="font-semibold text-white">{formatCurrency(remediationCost)}</span> ({inputs.remediationHours} hours of remediation).
								</p>
							</div>
						</div>
					)}

					{/* Tinkering Tax warning */}
					{inputs.hasTinkeringTax && (
						<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex gap-3 animate-fadeIn">
							<span className="text-xl">⚡</span>
							<div>
								<h4 className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
									Brittle Integration: Tinkering Tax Alert
								</h4>
								<p className="text-xs leading-5 text-slate-300 mt-1">
									No-code integrations are highly sensitive to database schema renames and vendor API deprecations. Security session management through third-party automation tools introduces severe compliance and data leakage risks.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
