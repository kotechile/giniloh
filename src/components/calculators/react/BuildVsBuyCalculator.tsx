import { useMemo, useState } from 'react';
import { AssumptionNote, Metric, NumberField, SectionTitle, VerdictBlock, formatUsd } from '../ui/CalcPrimitives';
import { calculateBuildVsBuy, type BuildVsBuyInputs } from '../../../lib/calculators/buildVsBuy';

const DEFAULTS: BuildVsBuyInputs = {
	engineers: 2,
	monthsToParity: 6,
	loadedMonthlyCostPerEngineer: 20000,
	maintenancePctPerYear: 18,
	infraMonthly: 1500,
	vendorAnnualPerSeat: 400,
	seats: 50,
	implementationFee: 15000,
	vendorEscalationPct: 5,
	horizonYears: 3,
	discountRatePct: 10
};

export default function BuildVsBuyCalculator() {
	const [inputs, setInputs] = useState<BuildVsBuyInputs>(DEFAULTS);
	const out = useMemo(() => calculateBuildVsBuy(inputs), [inputs]);
	const update = <K extends keyof BuildVsBuyInputs>(key: K, value: BuildVsBuyInputs[K]) =>
		setInputs((prev) => ({ ...prev, [key]: value }));
	const buildWins = out.recommendation === 'Build in-house';

	return (
		<div className="mx-auto max-w-6xl">
			<header className="max-w-3xl">
				<p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[#8C8C8C]">
					Stack economics · build vs. buy
				</p>
				<h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] sm:text-5xl">
					Build-vs-Buy Amortisation
				</h1>
				<p className="mt-4 text-lg leading-relaxed text-[#5E5E5E]">
					Loaded engineering time plus the permanent maintenance tax, against a vendor price that escalates
					every renewal — on one discounted cash-flow basis over the same horizon.
				</p>
			</header>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
				<section className="grid gap-7">
					<div>
						<SectionTitle index="01" title="Build it in-house" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Engineers assigned" value={inputs.engineers} onChange={(v) => update('engineers', v)} step={0.5} suffix="FTE" />
							<NumberField label="Months to parity" value={inputs.monthsToParity} onChange={(v) => update('monthsToParity', v)} suffix="months" />
							<NumberField
								label="Loaded cost per engineer"
								value={inputs.loadedMonthlyCostPerEngineer}
								onChange={(v) => update('loadedMonthlyCostPerEngineer', v)}
								step={500}
								suffix="$ / month"
								help="Salary, benefits, overhead — not base salary."
							/>
							<NumberField
								label="Maintenance per year"
								value={inputs.maintenancePctPerYear}
								onChange={(v) => update('maintenancePctPerYear', v)}
								step={1}
								suffix="% of build"
								help="The permanent tax a shipped internal tool carries."
							/>
							<NumberField label="Infrastructure" value={inputs.infraMonthly} onChange={(v) => update('infraMonthly', v)} step={100} suffix="$ / month" />
						</div>
					</div>

					<div>
						<SectionTitle index="02" title="Buy the vendor" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Licence per seat" value={inputs.vendorAnnualPerSeat} onChange={(v) => update('vendorAnnualPerSeat', v)} step={10} suffix="$ / year" />
							<NumberField label="Seats" value={inputs.seats} onChange={(v) => update('seats', v)} step={5} suffix="seats" />
							<NumberField label="Implementation fee" value={inputs.implementationFee} onChange={(v) => update('implementationFee', v)} step={1000} suffix="$ one-time" />
							<NumberField
								label="Renewal escalation"
								value={inputs.vendorEscalationPct}
								onChange={(v) => update('vendorEscalationPct', v)}
								step={0.5}
								suffix="% / yr"
							/>
						</div>
					</div>

					<div>
						<SectionTitle index="03" title="Comparison window" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Horizon" value={inputs.horizonYears} onChange={(v) => update('horizonYears', v)} min={1} max={10} suffix="years" />
							<NumberField label="Discount rate" value={inputs.discountRatePct} onChange={(v) => update('discountRatePct', v)} step={0.5} suffix="% / yr" />
						</div>
					</div>
				</section>

				<aside className="lg:sticky lg:top-24 lg:self-start">
					<div className="border-t-2 border-[#1A1A1A] pt-5">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">
							Present value over {inputs.horizonYears} years
						</p>
						<div className="mt-3 grid grid-cols-2 gap-4">
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Build</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buildWins ? '#1A1A1A' : '#B85C5C' }}>
									{formatUsd(out.buildNpv)}
								</p>
							</div>
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Buy</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buildWins ? '#B85C5C' : '#1A1A1A' }}>
									{formatUsd(out.vendorNpv)}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-6 grid gap-4">
						<Metric label="Build to reach parity" value={formatUsd(out.buildInitial)} hint={`${inputs.engineers} FTE × ${inputs.monthsToParity} months at loaded cost`} />
						<Metric label="Build run cost" value={`${formatUsd(out.buildAnnualRun)} / yr`} hint="Maintenance + infrastructure, held flat (salaries not escalated)." tone="accent" />
						<Metric label="Vendor run cost" value={`${formatUsd(out.vendorAnnual)} / yr`} hint={`Escalating ${inputs.vendorEscalationPct}% per renewal.`} />
						<Metric
							label={buildWins ? 'Build advantage' : 'Vendor advantage'}
							value={formatUsd(out.advantageAtHorizon)}
							hint={out.breakevenYear ? `Build becomes cheaper on a cumulative basis in year ${out.breakevenYear}.` : 'The vendor stays cheaper across the whole horizon.'}
							tone={buildWins ? 'accent' : 'mid'}
						/>
					</div>

					<VerdictBlock
						headline={out.recommendation}
						tone={buildWins ? 'accent' : 'mid'}
						body={
							<>
								The decision turns on the maintenance fraction, not the licence price. At{' '}
								{inputs.maintenancePctPerYear}% of build cost per year, the tool needs{' '}
								<strong className="text-[#1A1A1A]">{formatUsd(out.buildAnnualRun)}</strong> annually just to keep
								working.
							</>
						}
					/>
				</aside>
			</div>

			<section className="mt-14">
				<SectionTitle index="04" title="Cumulative cost by year" />
				<div className="mt-4 overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr className="border-b border-[#1A1A1A] text-left font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#8C8C8C]">
								<th className="py-2 pr-4">Year</th>
								<th className="py-2 pr-4 text-right">Build cost</th>
								<th className="py-2 pr-4 text-right">Build cumulative</th>
								<th className="py-2 pr-4 text-right">Vendor cost</th>
								<th className="py-2 text-right">Vendor cumulative</th>
							</tr>
						</thead>
						<tbody>
							{out.series.map((row) => (
								<tr key={row.year} className="border-b border-[#E5E5E5] tabular-nums">
									<td className="py-2 pr-4 font-mono text-[#8C8C8C]">{row.year === 0 ? 'Start' : row.year}</td>
									<td className="py-2 pr-4 text-right">{formatUsd(row.buildCost)}</td>
									<td className="py-2 pr-4 text-right font-semibold text-[#1A1A1A]">{formatUsd(row.buildCumulative)}</td>
									<td className="py-2 pr-4 text-right">{formatUsd(row.vendorCost)}</td>
									<td className="py-2 text-right font-semibold text-[#1A1A1A]">{formatUsd(row.vendorCumulative)}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			<AssumptionNote>
				Engineer cost is flat across the horizon and the build is treated as paid at the start, which favours
				building slightly. Vendor seats are assumed constant. No switching costs in either direction, and no
				revenue upside from owning the tool — those belong in the business case around this calculation, not
				inside it.
			</AssumptionNote>
		</div>
	);
}
