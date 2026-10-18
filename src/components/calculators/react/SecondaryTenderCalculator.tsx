import { useMemo, useState } from 'react';
import {
	AssumptionNote,
	Metric,
	NumberField,
	SectionTitle,
	Toggle,
	VerdictBlock,
	formatUsd
} from '../ui/CalcPrimitives';
import {
	calculateSecondaryTender,
	type SecondaryTenderInputs
} from '../../../lib/calculators/secondaryTender';

const DEFAULTS: SecondaryTenderInputs = {
	shares: 10000,
	instrument: 'options',
	basisPerShare: 5,
	offerPricePerShare: 30,
	lastRoundPricePerShare: 50,
	expectedIpoPricePerShare: 60,
	monthsToIpo: 24,
	probabilityOfExitPct: 60,
	annualDiscountRatePct: 10,
	ordinaryTaxRatePct: 37,
	capitalGainsTaxRatePct: 23.8,
	heldOverOneYear: false,
	qsbsEligible: false,
	qsbsHeldYears: 0
};

export default function SecondaryTenderCalculator() {
	const [inputs, setInputs] = useState<SecondaryTenderInputs>(DEFAULTS);
	const out = useMemo(() => calculateSecondaryTender(inputs), [inputs]);
	const update = <K extends keyof SecondaryTenderInputs>(key: K, value: SecondaryTenderInputs[K]) =>
		setInputs((prev) => ({ ...prev, [key]: value }));

	const maxBar = Math.max(out.today.netCash, out.hold.riskAdjustedValue, 1);
	const todayPct = (out.today.netCash / maxBar) * 100;
	const holdPct = (out.hold.riskAdjustedValue / maxBar) * 100;
	const isOption = inputs.instrument === 'options';

	return (
		<div className="mx-auto max-w-6xl">
			<header className="max-w-3xl">
				<p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[#8C8C8C]">
					Portfolio capital · secondary liquidity
				</p>
				<h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] sm:text-5xl">
					Secondary Tender vs. IPO Horizon
				</h1>
				<p className="mt-4 text-lg leading-relaxed text-[#5E5E5E]">
					Price a tender offer against the exit you are actually waiting for: after-tax cash today, discounted
					and probability-weighted proceeds at IPO, and the IPO price at which holding breaks even.
				</p>
			</header>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
				<section className="grid gap-7">
					<div>
						<SectionTitle index="01" title="The position" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<div className="sm:col-span-2 flex gap-2">
								{(['options', 'shares'] as const).map((kind) => (
									<button
										key={kind}
										type="button"
										onClick={() => update('instrument', kind)}
										className={`flex-1 border px-4 py-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] transition ${
											inputs.instrument === kind
												? 'border-[#1A1A1A] bg-[#1A1A1A] text-white'
												: 'border-[#E5E5E5] bg-white text-[#5E5E5E] hover:border-[#8C8C8C]'
										}`}
									>
										{kind === 'options' ? 'Vested options' : 'Owned shares'}
									</button>
								))}
							</div>
							<NumberField label="Shares" value={inputs.shares} onChange={(v) => update('shares', v)} step={100} />
							<NumberField
								label={isOption ? 'Strike price' : 'Cost basis'}
								value={inputs.basisPerShare}
								onChange={(v) => update('basisPerShare', v)}
								step={0.5}
								suffix="$ / share"
								help={isOption ? 'Exercised cashlessly: netted out of the proceeds.' : 'What you paid per share.'}
							/>
							<NumberField
								label="Secondary offer"
								value={inputs.offerPricePerShare}
								onChange={(v) => update('offerPricePerShare', v)}
								step={1}
								suffix="$ / share"
							/>
							<NumberField
								label="Last preferred round"
								value={inputs.lastRoundPricePerShare}
								onChange={(v) => update('lastRoundPricePerShare', v)}
								step={1}
								suffix="$ / share"
								help="Used for the discount to the last marked price."
							/>
						</div>
					</div>

					<div>
						<SectionTitle index="02" title="The exit you are waiting for" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField
								label="Expected IPO price"
								value={inputs.expectedIpoPricePerShare}
								onChange={(v) => update('expectedIpoPricePerShare', v)}
								step={1}
								suffix="$ / share"
							/>
							<NumberField
								label="Months to liquidity"
								value={inputs.monthsToIpo}
								onChange={(v) => update('monthsToIpo', v)}
								step={1}
								suffix="months"
								help="Include any post-IPO lockup."
							/>
							<NumberField
								label="Probability of exit"
								value={inputs.probabilityOfExitPct}
								onChange={(v) => update('probabilityOfExitPct', v)}
								step={5}
								max={100}
								suffix="%"
								help="A failed exit is modelled at $0, not at the tender price."
							/>
							<NumberField
								label="Opportunity cost of capital"
								value={inputs.annualDiscountRatePct}
								onChange={(v) => update('annualDiscountRatePct', v)}
								step={0.5}
								suffix="% / yr"
								help="What the cash would earn if you took it today."
							/>
						</div>
					</div>

					<div>
						<SectionTitle index="03" title="Tax profile" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField
								label="Ordinary income rate"
								value={inputs.ordinaryTaxRatePct}
								onChange={(v) => update('ordinaryTaxRatePct', v)}
								step={1}
								suffix="%"
								help="Federal + state on option spread."
							/>
							<NumberField
								label="Long-term capital gains rate"
								value={inputs.capitalGainsTaxRatePct}
								onChange={(v) => update('capitalGainsTaxRatePct', v)}
								step={0.1}
								suffix="%"
								help="Federal + NIIT + state, blended."
							/>
							{!isOption && (
								<Toggle
									label="Held more than one year"
									value={inputs.heldOverOneYear}
									onChange={(v) => update('heldOverOneYear', v)}
									help="Short-term gain is taxed at ordinary rates."
								/>
							)}
							<Toggle
								label="QSBS-qualified shares (§1202)"
								value={inputs.qsbsEligible}
								onChange={(v) => update('qsbsEligible', v)}
								help="Excludes gains up to the lesser of $10M or 10× basis, only after a 5-year hold."
							/>
							{inputs.qsbsEligible && !isOption && (
								<NumberField
									label="Years held since issuance"
									value={inputs.qsbsHeldYears}
									onChange={(v) => update('qsbsHeldYears', v)}
									step={1}
									suffix="years"
								/>
							)}
						</div>
					</div>
				</section>

				<aside className="lg:sticky lg:top-24 lg:self-start">
					<div className="border-t-2 border-[#1A1A1A] pt-5">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">
							Net cash if you sign today
						</p>
						<p className="mt-1 font-mono text-4xl font-extrabold tabular-nums text-[#1A1A1A]">
							{formatUsd(out.today.netCash)}
						</p>
						<p className="mt-2 text-sm text-[#5E5E5E]">
							{formatUsd(out.today.grossProceeds)} gross − {formatUsd(out.today.exerciseCost)} exercise −{' '}
							{formatUsd(out.today.tax)} tax · {out.today.effectiveDiscountPct.toFixed(1)}% below the last round
						</p>
					</div>

					<div className="mt-6 grid gap-4">
						<Metric
							label="Risk-adjusted IPO value today"
							value={formatUsd(out.hold.riskAdjustedValue)}
							hint={`${formatUsd(out.hold.netAtIpo)} at IPO, discounted to ${formatUsd(out.hold.presentValue)} then weighted by ${inputs.probabilityOfExitPct}%`}
							tone="accent"
						/>
						<Metric
							label="Break-even IPO price"
							value={Number.isFinite(out.verdict.breakevenIpoPrice) ? formatUsd(out.verdict.breakevenIpoPrice, { decimals: 2 }) : 'Not reachable'}
							hint={
								Number.isFinite(out.verdict.breakevenMultipleOfOffer)
									? `${out.verdict.breakevenMultipleOfOffer.toFixed(2)}× the offer price`
									: 'The tender wins at any exit price'
							}
						/>
						<Metric
							label="Probability needed to justify holding"
							value={`${out.verdict.impliedProbabilityNeededPct.toFixed(0)}%`}
							hint="Exit probability at which holding equals the cash offer."
						/>
						{out.hold.qsbsExcludedGain > 0 && (
							<Metric
								label="QSBS gain excluded"
								value={formatUsd(out.hold.qsbsExcludedGain)}
								hint="Capped at the lesser of $10M or 10× basis."
								tone="mid"
							/>
						)}
					</div>

					<div className="mt-8">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">
							Today vs. risk-adjusted hold
						</p>
						<div className="mt-3 grid gap-3">
							<div>
								<div className="flex justify-between font-mono text-[0.66rem] text-[#5E5E5E]">
									<span>Cash today</span>
									<span>{formatUsd(out.today.netCash)}</span>
								</div>
								<div className="mt-1 h-2 w-full bg-[#E5E5E5]">
									<div className="h-2 bg-[#5A7A8F]" style={{ width: `${Math.max(2, todayPct)}%` }} />
								</div>
							</div>
							<div>
								<div className="flex justify-between font-mono text-[0.66rem] text-[#5E5E5E]">
									<span>Hold for IPO</span>
									<span>{formatUsd(out.hold.riskAdjustedValue)}</span>
								</div>
								<div className="mt-1 h-2 w-full bg-[#E5E5E5]">
									<div className="h-2 bg-[#C88D4E]" style={{ width: `${Math.max(2, holdPct)}%` }} />
								</div>
							</div>
						</div>
					</div>

					<VerdictBlock
						headline={out.verdict.recommendation}
						tone={out.verdict.recommendation === 'Take the secondary' ? 'mid' : 'accent'}
						body={
							<>
								By <strong className="text-[#1A1A1A]">{formatUsd(out.verdict.advantageToday)}</strong> on a
								risk-adjusted basis. The offer is a price, not a verdict — check the break-even price against
								what you actually believe about the exit.
							</>
						}
					/>
				</aside>
			</div>

			<AssumptionNote>
				Cashless exercise: the strike is netted from proceeds and the spread is taxed as ordinary income (NSO
				treatment; ISO/AMT is out of scope). A failed exit is $0 on the hold path. QSBS applies only to owned
				stock held five years, capped at the lesser of $10M or 10× basis. State tax is folded into the rates you
				enter; this is a deterministic model of the arithmetic, not tax advice.
			</AssumptionNote>
		</div>
	);
}
