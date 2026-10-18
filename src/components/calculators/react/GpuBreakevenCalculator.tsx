import { useMemo, useState } from 'react';
import { AssumptionNote, Metric, NumberField, SectionTitle, VerdictBlock, formatUsd } from '../ui/CalcPrimitives';
import { calculateGpuBreakeven, type GpuBreakevenInputs } from '../../../lib/calculators/gpuBreakeven';

const DEFAULTS: GpuBreakevenInputs = {
	hardwarePrice: 9000,
	resaleValuePct: 40,
	usefulLifeYears: 4,
	hoursPerMonth: 120,
	cloudHourlyRate: 0.8,
	powerDrawWatts: 600,
	electricityRatePerKwh: 0.3,
	annualMaintenance: 150
};

export default function GpuBreakevenCalculator() {
	const [inputs, setInputs] = useState<GpuBreakevenInputs>(DEFAULTS);
	const out = useMemo(() => calculateGpuBreakeven(inputs), [inputs]);
	const update = <K extends keyof GpuBreakevenInputs>(key: K, value: GpuBreakevenInputs[K]) =>
		setInputs((prev) => ({ ...prev, [key]: value }));
	const buyWins = out.recommendation === 'Buy local hardware';
	const maxCost = Math.max(out.annualOwnedCost, out.annualCloudCost, 1);

	return (
		<div className="mx-auto max-w-6xl">
			<header className="max-w-3xl">
				<p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[#8C8C8C]">
					Compute capital · local vs. cloud
				</p>
				<h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] sm:text-5xl">
					Local Workstation vs. Cloud GPU
				</h1>
				<p className="mt-4 text-lg leading-relaxed text-[#5E5E5E]">
					Cost per GPU-hour at the utilisation you will actually run — purchase price, power, maintenance and
					residual value against the on-demand rate, over the life you will actually keep the box.
				</p>
			</header>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
				<section className="grid gap-7">
					<div>
						<SectionTitle index="01" title="The hardware" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Purchase price" value={inputs.hardwarePrice} onChange={(v) => update('hardwarePrice', v)} step={250} suffix="$" />
							<NumberField
								label="Residual value"
								value={inputs.resaleValuePct}
								onChange={(v) => update('resaleValuePct', v)}
								step={5}
								max={100}
								suffix="% of price"
								help="What it is worth when you sell or replace it."
							/>
							<NumberField label="Useful life" value={inputs.usefulLifeYears} onChange={(v) => update('usefulLifeYears', v)} step={0.5} min={0.5} suffix="years" />
							<NumberField label="Maintenance" value={inputs.annualMaintenance} onChange={(v) => update('annualMaintenance', v)} step={50} suffix="$ / yr" />
						</div>
					</div>

					<div>
						<SectionTitle index="02" title="How you will use it" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField
								label="Hours per month"
								value={inputs.hoursPerMonth}
								onChange={(v) => update('hoursPerMonth', v)}
								step={10}
								suffix="hours"
								help="Actual GPU-busy hours, not hours the machine is switched on."
							/>
							<NumberField label="Power draw" value={inputs.powerDrawWatts} onChange={(v) => update('powerDrawWatts', v)} step={50} suffix="watts" />
							<NumberField label="Electricity" value={inputs.electricityRatePerKwh} onChange={(v) => update('electricityRatePerKwh', v)} step={0.01} suffix="$ / kWh" />
							<NumberField label="Cloud rate" value={inputs.cloudHourlyRate} onChange={(v) => update('cloudHourlyRate', v)} step={0.05} suffix="$ / GPU-hr" help="On-demand, comparable card." />
						</div>
					</div>
				</section>

				<aside className="lg:sticky lg:top-24 lg:self-start">
					<div className="border-t-2 border-[#1A1A1A] pt-5">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">
							Your cost per GPU-hour
						</p>
						<div className="mt-3 grid grid-cols-2 gap-4">
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Owned</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buyWins ? '#1A1A1A' : '#B85C5C' }}>
									{Number.isFinite(out.ownedCostPerHour) ? formatUsd(out.ownedCostPerHour, { decimals: 2 }) : '—'}
								</p>
							</div>
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Cloud</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buyWins ? '#B85C5C' : '#1A1A1A' }}>
									{formatUsd(out.cloudCostPerHour, { decimals: 2 })}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-6 grid gap-4">
						<Metric
							label="Break-even utilisation"
							value={Number.isFinite(out.breakevenHoursPerMonth) ? `${out.breakevenHoursPerMonth.toFixed(0)} h / mo` : 'Never'}
							hint={
								Number.isFinite(out.breakevenHoursPerMonth)
									? `Below this, renting is cheaper. You are at ${inputs.hoursPerMonth} h/mo (${out.utilizationPctOfLife.toFixed(1)}% of the box's life).`
									: 'Power cost alone meets or exceeds the cloud rate.'
							}
							tone="accent"
						/>
						<Metric label="Annual cost, owned" value={formatUsd(out.annualOwnedCost)} hint="Amortised purchase + power + maintenance." />
						<Metric label="Annual cost, cloud" value={formatUsd(out.annualCloudCost)} hint="Same hours at the on-demand rate." />
						<Metric
							label={buyWins ? 'Owned advantage over life' : 'Cloud advantage over life'}
							value={formatUsd(out.advantageAtLifeEnd)}
							hint={`${formatUsd(out.ownedTotalCost)} owned all-in vs ${formatUsd(out.cloudCostForSameHours)} of cloud hours.`}
							tone={buyWins ? 'accent' : 'mid'}
						/>
					</div>

					<div className="mt-8">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">Annual cost</p>
						<div className="mt-3 grid gap-3">
							{[['Owned', out.annualOwnedCost, '#5A7A8F'], ['Cloud', out.annualCloudCost, '#C88D4E']].map(([label, value, color]) => (
								<div key={String(label)}>
									<div className="flex justify-between font-mono text-[0.66rem] text-[#5E5E5E]">
										<span>{label}</span>
										<span>{formatUsd(Number(value))}</span>
									</div>
									<div className="mt-1 h-2 w-full bg-[#E5E5E5]">
										<div className="h-2" style={{ width: `${Math.max(2, (Number(value) / maxCost) * 100)}%`, backgroundColor: String(color) }} />
									</div>
								</div>
							))}
						</div>
					</div>

					<VerdictBlock
						headline={out.recommendation}
						tone={buyWins ? 'accent' : 'mid'}
						body={
							<>
								At <strong className="text-[#1A1A1A]">{inputs.hoursPerMonth} h/month</strong> the owned box costs{' '}
								{formatUsd(out.ownedCostPerHour, { decimals: 2 })}/hr against {formatUsd(out.cloudCostPerHour, { decimals: 2 })}/hr
								on-demand. The flip point is {Number.isFinite(out.breakevenHoursPerMonth) ? `${out.breakevenHoursPerMonth.toFixed(0)} h/month` : 'unreachable'}.
							</>
						}
					/>
				</aside>
			</div>

			<AssumptionNote>
				Owned cost includes purchase minus residual value, electricity at the load wattage you enter, and
				maintenance; it excludes your own setup and debugging time, which is real but personal. Cloud cost excludes
				egress, storage and the premium for reserved vs spot capacity. Hardware is assumed replaced at end of life
				at the residual value stated.
			</AssumptionNote>
		</div>
	);
}
