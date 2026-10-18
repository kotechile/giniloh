import { useMemo, useState } from 'react';
import { AssumptionNote, Metric, NumberField, SectionTitle, VerdictBlock, formatUsd } from '../ui/CalcPrimitives';
import { calculateRentVsBuy, type RentVsBuyInputs } from '../../../lib/calculators/rentVsBuy';

const DEFAULTS: RentVsBuyInputs = {
	homePrice: 800000,
	downPaymentPct: 20,
	mortgageRatePct: 6.5,
	termYears: 30,
	propertyTaxPct: 1.2,
	insuranceAnnual: 2400,
	hoaMonthly: 0,
	maintenancePct: 1,
	appreciationPct: 3,
	rentMonthly: 3500,
	rentGrowthPct: 3,
	horizonYears: 7,
	investmentReturnPct: 7,
	sellingCostPct: 6,
	closingCostPct: 2
};

export default function RentVsBuyCalculator() {
	const [inputs, setInputs] = useState<RentVsBuyInputs>(DEFAULTS);
	const out = useMemo(() => calculateRentVsBuy(inputs), [inputs]);
	const update = <K extends keyof RentVsBuyInputs>(key: K, value: RentVsBuyInputs[K]) =>
		setInputs((prev) => ({ ...prev, [key]: value }));
	const buyWins = out.comparison.recommendation === 'Buy';
	const maxWorth = Math.max(out.owner.netProceeds, out.renter.investedPortfolio, 1);

	return (
		<div className="mx-auto max-w-6xl">
			<header className="max-w-3xl">
				<p className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.26em] text-[#8C8C8C]">
					Personal capital · housing
				</p>
				<h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] sm:text-5xl">
					Rent vs. Buy with Opportunity Cost
				</h1>
				<p className="mt-4 text-lg leading-relaxed text-[#5E5E5E]">
					Both households to the same horizon: the owner sells and nets the proceeds, the renter invests the down
					payment and the monthly difference. The comparison is net worth, not monthly payment.
				</p>
			</header>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.85fr]">
				<section className="grid gap-7">
					<div>
						<SectionTitle index="01" title="The purchase" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Home price" value={inputs.homePrice} onChange={(v) => update('homePrice', v)} step={10000} suffix="$" />
							<NumberField label="Down payment" value={inputs.downPaymentPct} onChange={(v) => update('downPaymentPct', v)} step={1} max={100} suffix="%" />
							<NumberField label="Mortgage rate" value={inputs.mortgageRatePct} onChange={(v) => update('mortgageRatePct', v)} step={0.125} suffix="% / yr" />
							<NumberField label="Term" value={inputs.termYears} onChange={(v) => update('termYears', v)} step={5} suffix="years" />
							<NumberField label="Closing costs" value={inputs.closingCostPct} onChange={(v) => update('closingCostPct', v)} step={0.5} suffix="% of price" />
							<NumberField label="Selling costs" value={inputs.sellingCostPct} onChange={(v) => update('sellingCostPct', v)} step={0.5} suffix="% of sale" />
						</div>
					</div>

					<div>
						<SectionTitle index="02" title="Cost of owning" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Property tax" value={inputs.propertyTaxPct} onChange={(v) => update('propertyTaxPct', v)} step={0.1} suffix="% / yr" />
							<NumberField label="Insurance" value={inputs.insuranceAnnual} onChange={(v) => update('insuranceAnnual', v)} step={100} suffix="$ / yr" />
							<NumberField label="HOA" value={inputs.hoaMonthly} onChange={(v) => update('hoaMonthly', v)} step={25} suffix="$ / month" />
							<NumberField label="Maintenance" value={inputs.maintenancePct} onChange={(v) => update('maintenancePct', v)} step={0.25} suffix="% / yr" />
							<NumberField label="Appreciation" value={inputs.appreciationPct} onChange={(v) => update('appreciationPct', v)} step={0.5} min={-10} suffix="% / yr" />
						</div>
					</div>

					<div>
						<SectionTitle index="03" title="The alternative" />
						<div className="mt-4 grid gap-5 sm:grid-cols-2">
							<NumberField label="Rent" value={inputs.rentMonthly} onChange={(v) => update('rentMonthly', v)} step={50} suffix="$ / month" />
							<NumberField label="Rent growth" value={inputs.rentGrowthPct} onChange={(v) => update('rentGrowthPct', v)} step={0.5} suffix="% / yr" />
							<NumberField label="Portfolio return" value={inputs.investmentReturnPct} onChange={(v) => update('investmentReturnPct', v)} step={0.5} suffix="% / yr" help="What the invested down payment earns." />
							<NumberField label="Horizon" value={inputs.horizonYears} onChange={(v) => update('horizonYears', v)} min={1} max={30} suffix="years" />
						</div>
					</div>
				</section>

				<aside className="lg:sticky lg:top-24 lg:self-start">
					<div className="border-t-2 border-[#1A1A1A] pt-5">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">
							Net worth at year {inputs.horizonYears}
						</p>
						<div className="mt-3 grid grid-cols-2 gap-4">
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Owner</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buyWins ? '#1A1A1A' : '#B85C5C' }}>
									{formatUsd(out.owner.netProceeds)}
								</p>
							</div>
							<div>
								<p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#8C8C8C]">Renter</p>
								<p className="font-mono text-2xl font-extrabold tabular-nums" style={{ color: buyWins ? '#B85C5C' : '#1A1A1A' }}>
									{formatUsd(out.renter.investedPortfolio)}
								</p>
							</div>
						</div>
					</div>

					<div className="mt-6 grid gap-4">
						<Metric
							label="Monthly cost of owning"
							value={formatUsd(out.purchase.firstYearMonthlyCost)}
							hint={`${formatUsd(out.purchase.monthlyPrincipalInterest)} P&I + tax + insurance + HOA + maintenance, vs ${formatUsd(inputs.rentMonthly)} rent.`}
							tone="accent"
						/>
						<Metric label="Cash needed to close" value={formatUsd(out.purchase.downPayment + out.purchase.closingCosts)} hint="Down payment + closing costs — the capital the renter invests instead." />
						<Metric
							label="Break-even year"
							value={out.comparison.breakevenYear ? `Year ${out.comparison.breakevenYear.toFixed(0)}` : 'Beyond horizon'}
							hint="First year owner equity (after selling costs) overtakes the renter portfolio."
						/>
						<Metric label="Price-to-rent ratio" value={`${out.comparison.priceToRentRatio.toFixed(1)}×`} hint="Annual rent into price. Above ~20 favours renting on pure math." />
						<Metric label="Total interest paid" value={formatUsd(out.owner.totalInterestPaid)} hint={`Loan balance at sale: ${formatUsd(out.owner.loanBalanceAtHorizon)}.`} tone="mid" />
					</div>

					<div className="mt-8">
						<p className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#8C8C8C]">Net worth at horizon</p>
						<div className="mt-3 grid gap-3">
							{[['Owner (after selling costs)', out.owner.netProceeds, '#5A7A8F'], ['Renter (invested)', out.renter.investedPortfolio, '#C88D4E']].map(([label, value, color]) => (
								<div key={String(label)}>
									<div className="flex justify-between font-mono text-[0.66rem] text-[#5E5E5E]">
										<span>{label}</span>
										<span>{formatUsd(Number(value))}</span>
									</div>
									<div className="mt-1 h-2 w-full bg-[#E5E5E5]">
										<div className="h-2" style={{ width: `${Math.max(2, (Number(value) / maxWorth) * 100)}%`, backgroundColor: String(color) }} />
									</div>
								</div>
							))}
						</div>
					</div>

					<VerdictBlock
						headline={out.comparison.recommendation}
						tone={buyWins ? 'accent' : 'mid'}
						body={
							<>
								The owner is {buyWins ? 'ahead' : 'behind'} by{' '}
								<strong className="text-[#1A1A1A]">{formatUsd(Math.abs(out.comparison.ownerAdvantage))}</strong> at year{' '}
								{inputs.horizonYears}, after {formatUsd(out.owner.sellingCosts)} of selling costs. Rent totals{' '}
								{formatUsd(out.renter.totalRentPaid)} over the same period.
							</>
						}
					/>
				</aside>
			</div>

			<AssumptionNote>
				Excluded: mortgage-interest tax deductibility (standard-deduction phase-outs make it personal), renter's
				insurance, and any reinvestment of home equity before sale. The renter invests the down payment, closing
				costs and the monthly difference, and draws down when owning is cheaper in a given month. Property tax and
				maintenance are held at today's price level; appreciation compounds annually on the purchase price.
			</AssumptionNote>
		</div>
	);
}
