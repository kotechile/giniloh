import React from 'react';
import { VibeAssetCard, type VibeAssetProps } from './VibeAssetCard';

const DEFAULT_VIBE_ASSETS: VibeAssetProps[] = [
  {
    title: 'W-2 vs. 1099 vs. S-Corp Net Yield Engine',
    category: 'Career Capital',
    assetSlug: 'w2-vs-1099-yield-engine',
    verticalSlug: 'career-capital',
    calculatorUrl: '/calculators/w2-vs-1099-scorp-calculator/',
    description:
      'Gross rate parity is an illusion. Compare your true take-home after self-employment tax, the 20% Section 199A QBI deduction, and $69k Solo 401(k) tax-sheltering.',
    quickParamLabel: 'Contract Hourly Rate',
    defaultParamValue: 150,
    paramUnit: '/hr',
    paramMin: 75,
    paramMax: 350,
    paramStep: 5,
    computeYield: (rate: number) => {
      const gross = rate * 1900; // 1,900 billed hours
      // S-Corp savings over pure 1099 on SE tax
      const scorpAdvantage = Math.round(Math.min(gross * 0.4, 168600) * 0.153 * 0.5);
      return {
        headline: `+$${scorpAdvantage.toLocaleString()}/yr`,
        delta: 'S-Corp Structure Advantage',
        subtext: `At $${rate}/hr, distributions bypass FICA taxes while preserving full Solo 401(k) capacity.`
      };
    }
  },
  {
    title: 'Workstation vs. Cloud GPU Breakeven Engine',
    category: 'Compute Capital',
    assetSlug: 'gpu-utilization-breakeven',
    verticalSlug: 'compute-capital',
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
      // Cloud cost at $2.60/hr vs owned workstation depreciated at $350/mo + electricity
      const cloudCost = hours * 2.60;
      const ownedCost = 350 + (hours * 0.45 * 0.22); // 450W * $0.22/kWh
      const delta = Math.round(cloudCost - ownedCost);
      const isOwnedCheaper = delta > 0;
      return {
        headline: isOwnedCheaper ? `+$${delta.toLocaleString()}/mo` : `-$${Math.abs(delta).toLocaleString()}/mo`,
        delta: isOwnedCheaper ? 'Owned Silicon Savings' : 'Cloud Rental Advantage',
        subtext: isOwnedCheaper
          ? `At ${hours} hrs/mo, owned hardware pays for itself in under 8 months.`
          : `At ${hours} hrs/mo, idle hardware penalty exceeds cloud on-demand elasticity.`
      };
    }
  },
  {
    title: 'In-House Build vs. SaaS Vendor TCO Engine',
    category: 'Stack Economics',
    assetSlug: 'build-vs-buy-tco',
    verticalSlug: 'stack-economics',
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
      // Loaded engineering rate $33,600 / month ($210/hr * 160)
      const buildCost = months * 33600;
      const annualMaintenance = Math.round(buildCost * 0.22);
      return {
        headline: `$${Math.round(buildCost / 1000)}k initial`,
        delta: 'Loaded Development Cost',
        subtext: `Demands ~$${Math.round(annualMaintenance / 1000)}k/yr ongoing maintenance to prevent workflow rot.`
      };
    }
  },
  {
    title: 'RSU Hold vs. Auto-Sell Diversification Engine',
    category: 'Portfolio Capital',
    assetSlug: 'rsu-concentration-diversifier',
    verticalSlug: 'portfolio-capital',
    calculatorUrl: '/calculators/rsu-hold-vs-sell/',
    description:
      'Holding vested RSUs is economically identical to using cash compensation to purchase company stock today. Quantify the concentration risk penalty.',
    quickParamLabel: 'Annual Unvested Equity',
    defaultParamValue: 180000,
    paramUnit: '$',
    paramMin: 40000,
    paramMax: 600000,
    paramStep: 10000,
    computeYield: (annualRsu: number) => {
      // Benchmark index volatility difference
      const downsideProtection = Math.round(annualRsu * 0.24);
      return {
        headline: `$${downsideProtection.toLocaleString()}`,
        delta: 'Downside Volatility Buffer',
        subtext: 'Auto-selling into total market index eliminates single-stock earnings shock.'
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
