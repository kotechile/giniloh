import { useId, useState } from 'react';

import { calculateBasicRemodeling } from '../../../lib/calculators/basicRemodeling';
import { formatCurrency, formatPercent } from '../../../lib/calculators/format';
import type {
	BasicProjectType,
	BasicRemodelingInputs,
	EnjoymentLevel
} from '../../../lib/calculators/basicRemodelingTypes';
import { CurrencyInput } from './fields/CurrencyInput';
import { StepperInput } from './fields/StepperInput';

const INITIAL_INPUTS: BasicRemodelingInputs = {
	projectType: 'kitchen',
	projectCost: 45000,
	estimatedResaleLift: 30000,
	yearsStaying: 7,
	enjoymentLevel: 'high',
	maintenanceSavingsAnnual: 1200
};

const PROJECT_OPTIONS: Array<{ value: BasicProjectType; label: string; hint: string }> = [
	{ value: 'kitchen', label: 'Kitchen remodel', hint: 'Big lifestyle impact, mixed recovery.' },
	{ value: 'bathroom', label: 'Bathroom remodel', hint: 'Usually steady but not spectacular recovery.' },
	{ value: 'windows-insulation', label: 'Windows / insulation', hint: 'Comfort and utility savings first.' },
	{ value: 'hvac', label: 'HVAC / heat pump', hint: 'Often more practical than flashy.' },
	{ value: 'solar', label: 'Solar', hint: 'Longer-horizon decision with utility upside.' },
	{ value: 'deck-patio', label: 'Deck / patio', hint: 'Lifestyle-heavy, moderate resale help.' },
	{ value: 'curb-appeal', label: 'Curb appeal exterior', hint: 'Often supports resale and listing appeal.' },
	{ value: 'flooring-paint', label: 'Flooring / paint', hint: 'Usually lower scope and easier to justify.' },
	{ value: 'other', label: 'Other', hint: 'Use when the project does not fit a preset.' }
];

const ENJOYMENT_OPTIONS: Array<{
	value: EnjoymentLevel;
	label: string;
	shortLabel: string;
	description: string;
}> = [
	{
		value: 'very-low',
		label: 'Very low',
		shortLabel: 'Very low',
		description: 'Mostly a practical fix, not something you care much about day to day.'
	},
	{
		value: 'low',
		label: 'Low',
		shortLabel: 'Low',
		description: 'Some benefit, but not enough to drive the decision by itself.'
	},
	{
		value: 'medium',
		label: 'Medium',
		shortLabel: 'Medium',
		description: 'Useful and pleasant, but not a dream-upgrade situation.'
	},
	{
		value: 'high',
		label: 'High',
		shortLabel: 'High',
		description: 'This would noticeably improve daily life while you live there.'
	},
	{
		value: 'very-high',
		label: 'Very high',
		shortLabel: 'Very high',
		description: 'This is a meaningful quality-of-life project, not just a financial one.'
	}
];

function formatRatioAsPercent(ratio: number) {
	return formatPercent(Math.round(ratio * 100));
}

function getRecommendationLabel(recommendation: ReturnType<typeof calculateBasicRemodeling>['recommendation']) {
	if (recommendation === 'worth-it') {
		return 'Worth it';
	}

	if (recommendation === 'skip') {
		return 'Skip';
	}

	return 'Maybe';
}

function getRecommendationTone(recommendation: ReturnType<typeof calculateBasicRemodeling>['recommendation']) {
	if (recommendation === 'worth-it') {
		return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100 shadow-[0_0_36px_rgba(16,185,129,0.12)]';
	}

	if (recommendation === 'skip') {
		return 'border-rose-400/25 bg-rose-500/10 text-rose-100 shadow-[0_0_36px_rgba(244,63,94,0.12)]';
	}

	return 'border-amber-400/25 bg-amber-500/10 text-amber-100 shadow-[0_0_36px_rgba(245,158,11,0.12)]';
}

function getRecommendationSupport(recommendation: ReturnType<typeof calculateBasicRemodeling>['recommendation']) {
	if (recommendation === 'worth-it') {
		return 'Strong enough on value, timeline, and day-to-day benefit to look like a smart move.';
	}

	if (recommendation === 'skip') {
		return 'The cost is doing more work than the likely recovery, savings, and enjoyment.';
	}

	return 'This can make sense, but it depends on how realistic your assumptions are and how much you value the upgrade.';
}

export default function BasicRemodelingCalculator() {
	const [inputs, setInputs] = useState(INITIAL_INPUTS);
	const fieldId = useId();
	const breakdown = calculateBasicRemodeling(inputs);
	const selectedEnjoyment =
		ENJOYMENT_OPTIONS.find((option) => option.value === inputs.enjoymentLevel) ?? ENJOYMENT_OPTIONS[2];

	const updateInput = <K extends keyof BasicRemodelingInputs>(
		key: K,
		value: BasicRemodelingInputs[K]
	) => {
		setInputs((current) => ({ ...current, [key]: value }));
	};

	return (
		<div className="grid gap-6">
			<div className="overflow-hidden rounded-[1.8rem] border border-cyan-500/20 bg-[linear-gradient(135deg,rgba(8,47,73,0.9),rgba(2,6,23,0.96)_65%,rgba(16,185,129,0.16))]">
				<div className="grid gap-6 px-6 py-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] 2xl:px-7">
					<div>
						<p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/75">
							Quick homeowner decision
						</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
							Get to a real answer without building a spreadsheet
						</h2>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
							Use six simple inputs to estimate whether a remodel looks financially sensible,
							mostly personal, or hard to justify. This version is built for speed, not underwriting.
						</p>
						<div className="mt-6 flex flex-wrap gap-3">
							<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								Fast inputs
							</div>
							<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								Plain-language result
							</div>
							<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-200">
								Stay-horizon logic
							</div>
						</div>
					</div>

					<div className={`rounded-[1.6rem] border p-5 ${getRecommendationTone(breakdown.recommendation)}`}>
						<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-current/70">
							Recommendation
						</p>
						<h3 className="mt-3 text-4xl font-semibold tracking-tight">
							{getRecommendationLabel(breakdown.recommendation)}
						</h3>
						<p className="mt-3 text-sm leading-7 text-current/85">
							{getRecommendationSupport(breakdown.recommendation)}
						</p>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<div className="rounded-[1.1rem] border border-white/10 bg-slate-950/35 p-4">
								<p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-current/60">
									Decision score
								</p>
								<p className="mt-2 text-2xl font-semibold tabular-nums">
									{Math.round(breakdown.decisionScore)}/100
								</p>
							</div>
							<div className="rounded-[1.1rem] border border-white/10 bg-slate-950/35 p-4">
								<p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-current/60">
									Value during stay
								</p>
								<p className="mt-2 text-2xl font-semibold tabular-nums">
									{formatCurrency(breakdown.netValue)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="grid gap-5">
				<div className="grid gap-5">
					<div className="rounded-[1.8rem] border border-slate-800/90 bg-slate-950/40 p-5">
						<div className="flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300/70">
									Project setup
								</p>
								<h3 className="mt-2 text-xl font-semibold text-white">
									Start with the remodel and your timeline
								</h3>
							</div>
							<div className="rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-slate-400">
								6 inputs only
							</div>
						</div>

						<div className="mt-5 grid gap-5">
							<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
											Core input
										</p>
										<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
											Project type
										</span>
									</div>
									<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] text-cyan-200/80">
										Use case
									</span>
								</div>
								<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
									{PROJECT_OPTIONS.map((option) => {
										const active = inputs.projectType === option.value;

										return (
											<button
												key={option.value}
												type="button"
												onClick={() => updateInput('projectType', option.value)}
												className={[
													'rounded-[1.1rem] border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/30',
													active
														? 'border-cyan-400/35 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
														: 'border-slate-800 bg-slate-950/55 hover:border-slate-700/90'
												].join(' ')}
											>
												<p className="text-sm font-semibold text-white">{option.label}</p>
												<p className="mt-2 text-xs leading-5 text-slate-400">{option.hint}</p>
											</button>
										);
									})}
								</div>
							</div>

							<div className="grid gap-5 md:grid-cols-2">
								<CurrencyInput
									id={`${fieldId}-project-cost`}
									eyebrow="Core input"
									label="Project cost"
									value={inputs.projectCost}
									step={1000}
									onChange={(value) => updateInput('projectCost', value)}
									helpText="Your expected all-in out-of-pocket cost."
								/>
								<CurrencyInput
									id={`${fieldId}-resale-lift`}
									eyebrow="Core input"
									label="Estimated resale lift"
									value={inputs.estimatedResaleLift}
									step={1000}
									onChange={(value) => updateInput('estimatedResaleLift', value)}
									helpText="How much extra home value you think this project adds if you sold after completion."
								/>
							</div>

							<div className="grid gap-5 md:grid-cols-2">
								<StepperInput
									id={`${fieldId}-years-staying`}
									eyebrow="Timeline"
									label="Years staying"
									value={inputs.yearsStaying}
									min={0}
									max={20}
									step={1}
									suffix="Years"
									onChange={(value) => updateInput('yearsStaying', value)}
									helpText="How long you realistically expect to stay in the home."
								/>
								<CurrencyInput
									id={`${fieldId}-maintenance-savings`}
									eyebrow="Savings"
									label="Maintenance savings"
									value={inputs.maintenanceSavingsAnnual}
									step={100}
									onChange={(value) => updateInput('maintenanceSavingsAnnual', value)}
									helpText="Annual repair, maintenance, or utility savings from the project."
								/>
							</div>

							<div className="grid gap-3 rounded-[1.5rem] border border-slate-800/80 bg-slate-950/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="font-mono text-[0.64rem] uppercase tracking-[0.24em] text-slate-500">
											Lifestyle
										</p>
										<span className="mt-1 block text-sm font-semibold tracking-wide text-slate-100">
											Enjoyment value
										</span>
									</div>
										<span className="rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1 font-mono text-[0.64rem] uppercase tracking-[0.22em] text-cyan-200/80">
											Personal fit
										</span>
									</div>
								<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
									{ENJOYMENT_OPTIONS.map((option) => {
										const active = inputs.enjoymentLevel === option.value;

										return (
											<button
												key={option.value}
												type="button"
												onClick={() => updateInput('enjoymentLevel', option.value)}
												className={[
													'rounded-[1.1rem] border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/30',
													active
														? 'border-cyan-400/35 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
														: 'border-slate-800 bg-slate-950/55 hover:border-slate-700/90'
												].join(' ')}
											>
												<p className="text-sm font-semibold text-white">{option.shortLabel}</p>
											</button>
										);
									})}
								</div>
								<div className="rounded-[1.1rem] border border-slate-800 bg-slate-950/55 p-4">
									<p className="font-mono text-[0.66rem] uppercase tracking-[0.22em] text-slate-500">
										Selected enjoyment level
									</p>
									<p className="mt-2 text-base font-semibold text-white">{selectedEnjoyment.label}</p>
									<p className="mt-2 text-sm leading-6 text-slate-400">
										{selectedEnjoyment.description}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="grid gap-6">
					<div className="rounded-[1.8rem] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.11),rgba(2,6,23,0.86))] p-6 shadow-[0_0_40px_rgba(56,189,248,0.12)]">
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200/80">
							Quick read
						</p>
						<div className="mt-5 grid gap-4 xl:grid-cols-3">
							<div className="rounded-[1.4rem] border border-slate-800 bg-slate-950/55 p-4">
								<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
									Resale recovery
								</p>
								<p className="mt-3 text-3xl font-semibold text-white">
									{formatRatioAsPercent(breakdown.resaleRecovery)}
								</p>
								<p className="mt-2 text-sm text-slate-400">
									How much of the project cost your resale estimate recovers.
								</p>
							</div>
							<div className="rounded-[1.4rem] border border-slate-800 bg-slate-950/55 p-4">
								<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
									Simple payback
								</p>
								<p className="mt-3 text-3xl font-semibold text-white">
									{breakdown.paybackYears ? `${breakdown.paybackYears.toFixed(1)} years` : 'No clear payback'}
								</p>
								<p className="mt-2 text-sm text-slate-400">
									Based on annual maintenance or utility savings only.
								</p>
							</div>
							<div className="rounded-[1.4rem] border border-slate-800 bg-slate-950/55 p-4">
								<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
									Value during your stay
								</p>
								<p className="mt-3 text-3xl font-semibold text-white">
									{formatCurrency(breakdown.totalRealizedValue)}
								</p>
								<p className="mt-2 text-sm text-slate-400">
									Resale lift, stay-period savings, and a conservative enjoyment credit combined.
								</p>
							</div>
						</div>
					</div>

					<div className="rounded-[1.8rem] border border-slate-800/90 bg-slate-900/45 p-6 shadow-2xl backdrop-blur-md">
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-300/70">Decision notes</p>
						<div className="mt-5 grid gap-4 xl:grid-cols-3">
							{breakdown.decisionNotes.map((note) => (
								<div key={note} className="rounded-[1.2rem] border border-slate-800/80 bg-slate-950/55 p-4">
									<p className="text-sm leading-7 text-slate-300">{note}</p>
								</div>
							))}
						</div>
					</div>

					<div className="rounded-[1.8rem] border border-amber-400/15 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(2,6,23,0.96))] p-6 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
						<p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200/80">Method note</p>
						<p className="mt-3 text-sm leading-7 text-slate-300">
							Basic is intentionally simple. It helps you pressure-test the decision quickly, but it
							does not use live comps, local cost feeds, incentives, or loan-program rules. That depth
							lives in Premium.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
