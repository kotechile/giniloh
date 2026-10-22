import React from 'react';
import { VibeAssetCard, type VibeAssetProps } from './VibeAssetCard';
import { formatCurrency, formatNumber } from '../../../lib/calculators/format';

/**
 * The numbers on these cards ARE the product. Every constant below is either a published figure or
 * an assumption the subtext says out loud, and no headline may assert something the slider does not
 * actually change. Three of these used to: a fixed "pays for itself in under 8 months" that was
 * false at the top of the slider, an unlabelled 24% "downside buffer", and a build-cost figure
 * dressed up as the answer to a build-vs-buy question.
 */
const DEFAULT_VIBE_ASSETS: VibeAssetProps[] = [
  {
    title: 'W-2 vs. 1099 vs. S-Corp Net Yield Engine',
    category: 'Career Capital',
    assetSlug: 'w2-vs-1099-yield-engine',
    domainCategory: 'career-capital',
    calculatorUrl: '/calculators/w2-vs-1099-scorp-calculator/',
    description:
      'Gross rate parity is an illusion. Compare your true take-home after self-employment tax, the 20% Section 199A QBI deduction, and $69k Solo 401(k) tax-sheltering.',
    quickParamLabel: 'Contract Hourly Rate',
    defaultParamValue: 150,
    paramUnit: '$/hr',
    paramMin: 75,
    paramMax: 350,
    paramStep: 5,
    computeYield: (rate: number) => {
      const billedHours = 1900;
      const gross = rate * billedHours;
      // Reasonable-comp assumption: 40% of gross stays on payroll as W-2 wages, the rest is
      // distributed and pays no FICA. The Social Security portion stops at the wage base, so the
      // distribution is capped there rather than at gross.
      const distribution = Math.min(gross * 0.4, 168_600);
      const ficaAvoided = distribution * 0.153; // 12.4% Social Security + 2.9% Medicare
      // A 1099 filer deducts half of self-employment tax, so part of this saving is already priced
      // in at the margin. 32% is the stated marginal rate, not a hidden constant.
      const afterSeDeduction = ficaAvoided * (1 - 0.5 * 0.32);
      // Payroll, registered agent, franchise tax: the old copy claimed to include this and did not.
      const compliance = 1_800;
      const advantage = Math.max(0, Math.round(afterSeDeduction - compliance));
      return {
        headline: `+${formatCurrency(advantage)}/yr`,
        delta: 'S-Corp Structure Advantage',
        subtext: `At ${formatCurrency(rate)}/hr over ${formatNumber(billedHours)} billed hours, ${formatCurrency(Math.round(distribution))} of distributions avoids FICA. Net of the half-SE-tax deduction at a 32% marginal rate and ${formatCurrency(compliance)}/yr of payroll and compliance cost.`
      };
    }
  },
  {
    title: 'Workstation vs. Cloud GPU Breakeven Engine',
    category: 'Compute Capital',
    assetSlug: 'gpu-utilization-breakeven',
    domainCategory: 'compute-capital',
    calculatorUrl: '/calculators/gpu-breakeven/',
    description:
      'Local silicon vs. cloud clusters is an hourly utilization question. Identify the exact tipping point where an on-prem workstation outperforms on-demand cloud.',
    quickParamLabel: 'Monthly Active GPU Hours',
    defaultParamValue: 120,
    paramUnit: 'hrs/mo',
    paramMin: 20,
    paramMax: 400,
    paramStep: 10,
    computeYield: (hours: number) => {
      const cloudHourly = 2.6;
      const depreciationMonthly = 350; // ~$8,400 workstation over 24 months
      const capital = depreciationMonthly * 24;
      const electricityPerHour = 0.45 * 0.22; // 450 W at $0.22/kWh
      const cloudCost = hours * cloudHourly;
      const ownedCost = depreciationMonthly + hours * electricityPerHour;
      const delta = Math.round(cloudCost - ownedCost);
      const isOwnedCheaper = delta > 0;
      // Payback is a function of utilization, so it is computed instead of asserted.
      const paybackMonths = isOwnedCheaper ? Math.max(1, Math.ceil(capital / delta)) : 0;
      return {
        headline: isOwnedCheaper ? `+${formatCurrency(delta)}/mo` : `-${formatCurrency(Math.abs(delta))}/mo`,
        delta: isOwnedCheaper ? 'Owned Silicon Savings' : 'Cloud Rental Advantage',
        subtext: isOwnedCheaper
          ? `At ${formatNumber(hours)} hrs/mo the workstation repays its ${formatCurrency(capital)} cost in about ${paybackMonths} month${paybackMonths === 1 ? '' : 's'}. Payback is driven by utilization, so move the slider.`
          : `At ${formatNumber(hours)} hrs/mo, ${formatCurrency(depreciationMonthly)}/mo of depreciation plus electricity costs more than on-demand rental.`
      };
    }
  },
  {
    title: 'In-House Build vs. SaaS Vendor TCO Engine',
    category: 'Stack Economics',
    assetSlug: 'build-vs-buy-tco',
    domainCategory: 'stack-economics',
    calculatorUrl: '/calculators/build-vs-buy/',
    description:
      'Vendor prices escalate; custom builds demand a permanent maintenance tax. Factor fully loaded engineer hours ($210/hr) to evaluate the true 3-year TCO.',
    quickParamLabel: 'Estimated Dev Effort',
    defaultParamValue: 3,
    paramUnit: 'Eng Months',
    paramMin: 1,
    paramMax: 12,
    paramStep: 1,
    computeYield: (months: number) => {
      const loadedMonthly = 210 * 160; // $210/hr fully loaded, 160 productive hours a month
      const buildCost = months * loadedMonthly;
      const annualMaintenance = Math.round(buildCost * 0.22);
      // The card's premise is a three-year comparison, so the headline is a three-year number.
      const threeYear = buildCost + annualMaintenance * 3;
      return {
        headline: `${formatCurrency(threeYear)} / 3yr`,
        delta: 'Three-Year Build TCO',
        subtext: `${formatCurrency(Math.round(buildCost))} of loaded engineering (${formatNumber(months)} month${months === 1 ? '' : 's'} at ${formatCurrency(loadedMonthly)}/mo) plus ${formatCurrency(annualMaintenance)}/yr of maintenance. That total is what the vendor quote has to beat.`
      };
    }
  },
  {
    title: 'RSU Hold vs. Auto-Sell Diversification Engine',
    category: 'Portfolio Capital',
    assetSlug: 'rsu-concentration-diversifier',
    domainCategory: 'portfolio-capital',
    calculatorUrl: '/calculators/rsu-hold-vs-sell/',
    description:
      'Holding vested RSUs is economically identical to using cash compensation to purchase company stock today. Quantify the concentration risk penalty.',
    quickParamLabel: 'Vested Company Stock Held',
    defaultParamValue: 180000,
    paramUnit: '$',
    paramMin: 40000,
    paramMax: 600000,
    paramStep: 10000,
    computeYield: (equityHeld: number) => {
      // Holding one name is a bet you cannot hedge with the salary that paid for it. 30% is the
      // stated single-stock drawdown assumption, not a market forecast.
      const drawdown = 0.3;
      const atRisk = Math.round(equityHeld * drawdown);
      return {
        headline: `${formatCurrency(atRisk)} at risk`,
        delta: 'Single-Name Drawdown Exposure',
        subtext: `A 30% single-stock drawdown on ${formatCurrency(equityHeld)} is ${formatCurrency(atRisk)} of your own compensation you would have to earn again. Auto-selling into a total-market index removes the single-name bet, not the market one.`
      };
    }
  }
];

export const VibeAssetGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {DEFAULT_VIBE_ASSETS.map((asset) => (
        <VibeAssetCard key={asset.assetSlug} {...asset} />
      ))}
    </div>
  );
};
