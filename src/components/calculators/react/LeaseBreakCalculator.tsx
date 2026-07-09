import { useId, useState } from 'react';

import { calculateLeaseBreakPenalty } from '../../../lib/calculators/leaseBreak';
import { formatCurrency } from '../../../lib/calculators/format';
import type { LeaseBreakInputs, LeasePenaltyMethod } from '../../../lib/calculators/types';
import { CurrencyInput } from './fields/CurrencyInput';
import { SelectField } from './fields/SelectField';
import { StepperInput } from './fields/StepperInput';

const INITIAL_INPUTS: LeaseBreakInputs = {
	monthlyRent: 2500,
	remainingMonths: 8,
	selectedMethod: 'months',
	fixedFee: 3500,
	percentageFee: 25,
	monthsFee: 2,
	additionalCosts: 450,
	securityDeposit: 1800
};

const METHOD_GUIDANCE: Record<LeasePenaltyMethod, string> = {
	fixed: 'Use this when the lease states a flat dollar amount for breaking early.',
	percentage:
		'Use this when the contract charges a percentage of the value remaining on the lease.',
	months: 'Use this when the lease requires a certain number of months of rent as the penalty.',
	remaining: 'Use this when you have to pay the remainder of the rent with no buyout clause.'
};

export default function LeaseBreakCalculator() {
	const [inputs, setInputs] = useState(INITIAL_INPUTS);
	const fieldId = useId();
	const breakdown = calculateLeaseBreakPenalty(inputs);
	const remainingLeaseValue = inputs.monthlyRent * inputs.remainingMonths;
	const depositCoverage = breakdown.basePenalty
		? Math.min((breakdown.securityDepositOffset / breakdown.basePenalty) * 100, 100)
		: 0;

	const updateInput = <K extends keyof LeaseBreakInputs>(key: K, value: LeaseBreakInputs[K]) => {
		setInputs((current) => ({ ...current, [key]: value }));
	};

	return (
		<div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
			{/* Left Column: Interactive Form Steps */}
			<div className="grid gap-6">
				{/* Step 1: Core Lease Details */}
				<div className="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/40 p-6 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 [.light_&]:bg-cyan-100 text-xs font-bold text-cyan-400 [.light_&]:text-cyan-600">1</span>
						<h3 className="text-lg font-bold text-white">Base Rent Details</h3>
					</div>
					<div className="grid gap-5 md:grid-cols-2">
						<CurrencyInput
							id={`${fieldId}-monthly-rent`}
							eyebrow="Rent input"
							label="Monthly Rent"
							value={inputs.monthlyRent}
							step={50}
							onChange={(value) => updateInput('monthlyRent', value)}
							helpText="Your monthly rent before utilities or other extras."
						/>
						<StepperInput
							id={`${fieldId}-remaining-term`}
							eyebrow="Lease term"
							label="Remaining Term"
							value={inputs.remainingMonths}
							min={0}
							step={1}
							suffix="Months"
							onChange={(value) => updateInput('remainingMonths', value)}
							helpText="Whole months left on the lease agreement."
						/>
					</div>
					<div className="mt-4 flex items-center justify-between rounded-[1rem] bg-slate-950/50 p-4 border border-slate-800/80">
						<span className="text-sm font-medium text-slate-500">Remaining Lease Value:</span>
						<span className="text-base font-bold text-white">{formatCurrency(remainingLeaseValue)}</span>
					</div>
				</div>

				{/* Step 2: Penalty Structure */}
				<div className="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/40 p-6 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 [.light_&]:bg-cyan-100 text-xs font-bold text-cyan-400 [.light_&]:text-cyan-600">2</span>
						<h3 className="text-lg font-bold text-white">Lease Break Penalty</h3>
					</div>
					<div className="grid gap-5">
						<SelectField
							id={`${fieldId}-termination-method`}
							label="Penalty Definition"
							value={inputs.selectedMethod}
							onChange={(value) => updateInput('selectedMethod', value)}
							helpText={METHOD_GUIDANCE[inputs.selectedMethod]}
						/>

						{inputs.selectedMethod === 'months' && (
							<StepperInput
								id={`${fieldId}-months-fee`}
								eyebrow="Rent multiplier"
								label="Months of Rent Penalty"
								value={inputs.monthsFee}
								min={0}
								step={1}
								suffix="Months"
								onChange={(value) => updateInput('monthsFee', value)}
								helpText="How many months of rent the lease requires as early termination fee."
							/>
						)}

						{inputs.selectedMethod === 'fixed' && (
							<CurrencyInput
								id={`${fieldId}-fixed-fee`}
								eyebrow="Buyout fee"
								label="Flat Buyout Fee"
								value={inputs.fixedFee}
								step={100}
								onChange={(value) => updateInput('fixedFee', value)}
								helpText="The exact buyout fee specified in your contract."
							/>
						)}

						{inputs.selectedMethod === 'percentage' && (
							<StepperInput
								id={`${fieldId}-percentage-fee`}
								eyebrow="Percentage charge"
								label="Percentage Penalty"
								value={inputs.percentageFee}
								min={0}
								max={100}
								step={1}
								suffix="%"
								onChange={(value) => updateInput('percentageFee', value)}
								helpText="Percentage applied to the remaining lease value."
							/>
						)}

						{inputs.selectedMethod === 'remaining' && (
							<div className="rounded-[1.1rem] border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
								<p className="font-semibold mb-1 flex items-center gap-1">
									⚠️ Full Lease Payout Applies
								</p>
								<p>
									No buyout clause is defined. You will be responsible for the full rent of the remaining lease term ({inputs.remainingMonths} months), totaling <strong className="text-slate-900 dark:text-white">{formatCurrency(remainingLeaseValue)}</strong>.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Step 3: Offsets & Adjustments */}
				<div className="rounded-[1.5rem] border border-slate-800/80 bg-slate-950/40 p-6 shadow-sm">
					<div className="flex items-center gap-2 mb-4">
						<span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-950 [.light_&]:bg-cyan-100 text-xs font-bold text-cyan-400 [.light_&]:text-cyan-600">3</span>
						<h3 className="text-lg font-bold text-white">Offsets & Repairs</h3>
					</div>
					<div className="grid gap-5 md:grid-cols-2">
						<CurrencyInput
							id={`${fieldId}-additional-costs`}
							eyebrow="Extra costs"
							label="Cleaning & Repairs"
							value={inputs.additionalCosts}
							step={50}
							onChange={(value) => updateInput('additionalCosts', value)}
							helpText="Estimated costs for repairs, cleanout, or other fees."
						/>
						<CurrencyInput
							id={`${fieldId}-security-deposit`}
							eyebrow="Offsets"
							label="Security Deposit Offset"
							value={inputs.securityDeposit}
							step={50}
							onChange={(value) => updateInput('securityDeposit', value)}
							helpText="Your security deposit amount to offset the final bill."
						/>
					</div>
				</div>
			</div>

			{/* Right Column: Real-time Exposure Summary */}
			<div className="lg:sticky lg:top-24">
				<div className="rounded-[1.8rem] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(2,6,23,0.82))] p-6 shadow-lg">
					<p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-400 font-semibold">
						Estimated Exposure
					</p>
					
					<div className="mt-4 mb-6">
						<h3 className="text-5xl font-black tracking-tight text-white">
							{formatCurrency(breakdown.netPenalty)}
						</h3>
						<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
							Net amount owed after applying deposit offsets and additional costs.
						</p>
					</div>

					<hr className="border-slate-200 dark:border-slate-800/80 my-5" />

					{/* Math Breakdown */}
					<div className="grid gap-3.5">
						<div className="flex justify-between items-center text-sm">
							<span className="text-slate-500 dark:text-slate-400">Base Penalty Fee</span>
							<span className="font-bold text-white">
								{formatCurrency(breakdown.basePenalty)}
							</span>
						</div>
						<div className="flex justify-between items-center text-sm">
							<span className="text-slate-500 dark:text-slate-400">Expected Cleaning & Repairs</span>
							<span className="font-bold text-white">
								+{formatCurrency(breakdown.additionalCosts)}
							</span>
						</div>
						<div className="flex justify-between items-center text-sm">
							<span className="text-emerald-450 dark:text-emerald-400">Security Deposit Offset</span>
							<span className="font-bold text-emerald-400">
								-{formatCurrency(breakdown.securityDepositOffset)}
							</span>
						</div>
						
						<div className="mt-2 pt-3.5 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
							<span className="text-base font-bold text-white">Net Estimated Penalty</span>
							<span className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400">
								{formatCurrency(breakdown.netPenalty)}
							</span>
						</div>
					</div>

					{/* Deposit Offset Coverage Progress */}
					<div className="mt-6 p-4 rounded-[1.2rem] bg-slate-950/50 border border-slate-800/80">
						<div className="flex items-center justify-between gap-3 mb-2">
							<p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">
								Deposit Coverage
							</p>
							<p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
								{Math.round(depositCoverage)}%
							</p>
						</div>
						<div className="h-2 rounded-full bg-slate-200 dark:bg-white/10">
							<div
								className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
								style={{ width: `${depositCoverage}%` }}
							/>
						</div>
						<p className="mt-2 text-xs text-slate-400">
							Percent of penalty covered by security deposit offset.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
