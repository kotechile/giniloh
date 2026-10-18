import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Percent,
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  Lock,
  Wallet,
  CheckCircle2,
  HelpCircle,
} from '../ui/icons';
import {
  calculateRsuHoldVsSell,
  PORTFOLIO_CONSTANTS_2026,
  type RsuHoldVsSellInputs,
} from '../../../lib/calculators/rsuHoldVsSell';

export const RsuHoldVsSellCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<RsuHoldVsSellInputs>({
    annualVestValue: 120000,
    currentStockPrice: 180,
    vestPrice: 180,
    holdingYears: 5,
    expectedCompanyReturnPct: 11,
    expectedIndexReturnPct: 8.5,
    householdLiquidNetWorth: 450000,
    baseSalary: 195000,
    effectiveIncomeTaxRatePct: 37,
    longTermCapitalGainsRatePct: 23.8, // 20% federal + 3.8% NIIT
    enableMegaBackdoor: true,
    employer401kMatch: 8000,
    employee401kElective: 24500, // 2026 limit
  });

  const updateInput = <K extends keyof RsuHoldVsSellInputs>(
    key: K,
    value: RsuHoldVsSellInputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => calculateRsuHoldVsSell(inputs), [inputs]);

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 bg-white text-[#1A1A1A] rounded-2xl border border-[#E5E5E5]  font-sans">
      {/* HEADER & PRESETS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E5E5] text-[#5A7A8F] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Concentrated Equity & Portfolio Architecture
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
            RSU Hold vs. Sell & Mega Backdoor Roth Simulator
          </h1>
          <p className="text-sm text-[#5E5E5E] mt-1">
            2026 IRS statutory model quantifying employer concentration risk, double-jeopardy exposure, and $72,000 Section 415(c) shelter.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setInputs((p) => ({
                ...p,
                annualVestValue: 120000,
                baseSalary: 195000,
                householdLiquidNetWorth: 450000,
                expectedCompanyReturnPct: 10,
              }))
            }
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#5E5E5E] transition"
          >
            Staff SWE ($120k RSU/yr)
          </button>
          <button
            onClick={() =>
              setInputs((p) => ({
                ...p,
                annualVestValue: 280000,
                baseSalary: 240000,
                householdLiquidNetWorth: 950000,
                expectedCompanyReturnPct: 14,
              }))
            }
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#5E5E5E] transition"
          >
            Director / VP ($280k RSU/yr)
          </button>
        </div>
      </div>

      {/* GINILOH VERDICT BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            {inputs.holdingYears}-Year Wealth Advantage
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              results.verdict.fiveYearWealthDelta >= 0
                ? 'text-[#5A7A8F]'
                : 'text-[#B85C5C]'
            }`}
          >
            {results.verdict.fiveYearWealthDelta >= 0 ? '+' : ''}
            {fmtCurrency(results.verdict.fiveYearWealthDelta)}
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            {results.verdict.recommendedStrategy} vs. Holding
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            Concentration Exposure
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              results.verdict.concentrationRiskPct > 40
                ? 'text-[#B85C5C]'
                : results.verdict.concentrationRiskPct > 20
                ? 'text-[#C88D4E]'
                : 'text-[#5A7A8F]'
            }`}
          >
            {results.verdict.concentrationRiskPct.toFixed(1)}%
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            Of household liquid net worth in 1 stock
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            Double-Jeopardy Score
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              results.verdict.doubleJeopardyScore >= 70
                ? 'text-[#B85C5C]'
                : results.verdict.doubleJeopardyScore >= 40
                ? 'text-[#C88D4E]'
                : 'text-[#5A7A8F]'
            }`}
          >
            {results.verdict.doubleJeopardyScore} / 100
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            Income + equity correlation penalty
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            Breakeven Company Return
          </span>
          <div className="text-2xl font-bold text-[#C88D4E] mt-1">
            {results.verdict.breakevenCompanyGrowthRatePct}% / yr
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            Min growth needed to justify concentration
          </p>
        </div>
      </div>

      {/* MAIN MATRIX: INPUTS & STRATEGY COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* LEFT COLUMN: CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6 bg-white/50 p-5 rounded-xl border border-[#E5E5E5]">
          {/* RSU VESTING PARAMS */}
          <div>
            <h3 className="text-sm font-semibold text-[#5A7A8F] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4" /> 1. RSU Vesting & Horizon
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">Annual Vest Value ($)</label>
                <input
                  type="number"
                  value={inputs.annualVestValue}
                  onChange={(e) =>
                    updateInput('annualVestValue', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Holding Horizon (Yrs)</label>
                <input
                  type="number"
                  value={inputs.holdingYears}
                  onChange={(e) =>
                    updateInput('holdingYears', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Company Return (%/yr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.expectedCompanyReturnPct}
                  onChange={(e) =>
                    updateInput('expectedCompanyReturnPct', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Broad Index (%/yr)</label>
                <input
                  type="number"
                  step="0.5"
                  value={inputs.expectedIndexReturnPct}
                  onChange={(e) =>
                    updateInput('expectedIndexReturnPct', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* BALANCE SHEET & DOUBLE JEOPARDY */}
          <div className="pt-4 border-t border-[#E5E5E5]">
            <h3 className="text-sm font-semibold text-[#C88D4E] uppercase tracking-wider flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4" /> 2. Concentration & Double Jeopardy
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">Liquid Net Worth ($)</label>
                <input
                  type="number"
                  value={inputs.householdLiquidNetWorth}
                  onChange={(e) =>
                    updateInput('householdLiquidNetWorth', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Annual Base Salary ($)</label>
                <input
                  type="number"
                  value={inputs.baseSalary}
                  onChange={(e) =>
                    updateInput('baseSalary', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* TAX BRACKETS & 2026 MEGA BACKDOOR */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
            <h3 className="text-sm font-semibold text-[#5A7A8F] uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4" /> 3. 2026 Tax & Mega Backdoor Roth
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">Ordinary Tax Rate (%)</label>
                <input
                  type="number"
                  value={inputs.effectiveIncomeTaxRatePct}
                  onChange={(e) =>
                    updateInput('effectiveIncomeTaxRatePct', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Cap Gains + NIIT (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={inputs.longTermCapitalGainsRatePct}
                  onChange={(e) =>
                    updateInput('longTermCapitalGainsRatePct', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E5E5E5] space-y-2">
              <label className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.enableMegaBackdoor}
                  onChange={(e) =>
                    updateInput('enableMegaBackdoor', e.target.checked)
                  }
                  className="rounded bg-white border-[#E5E5E5] text-[#5A7A8F]"
                />
                Model Mega Backdoor Roth Pipeline ($72k 415c limit)
              </label>

              {inputs.enableMegaBackdoor && (
                <div className="text-[11px] text-[#5E5E5E] pt-1 border-t border-[#E5E5E5] flex justify-between">
                  <span>Available After-Tax 401(k) Room:</span>
                  <span className="font-semibold text-[#5A7A8F]">
                    {fmtCurrency(results.megaBackdoor.availableAfterTaxCapacity)}/yr
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3-STRATEGY SIDE-BY-SIDE MATRIX (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-xs uppercase text-[#5E5E5E] bg-white">
                  <th className="py-3.5 px-4">Metric ({inputs.holdingYears} Yrs)</th>
                  <th className="py-3.5 px-4 text-[#5A7A8F]">Auto-Sell & Index</th>
                  <th className="py-3.5 px-4 text-[#B85C5C]">Hold Company RSU</th>
                  <th className="py-3.5 px-4 text-[#5A7A8F]">Mega Backdoor Roth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                <tr>
                  <td className="py-3 px-4 font-medium text-[#5E5E5E]">
                    Vested Gross Inflow
                  </td>
                  <td className="py-3 px-4">
                    {fmtCurrency(results.vestSummary.grossVestValue * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4">
                    {fmtCurrency(results.vestSummary.grossVestValue * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4">
                    {fmtCurrency(results.vestSummary.grossVestValue * inputs.holdingYears)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Vest Ordinary Income Tax
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    -{fmtCurrency(results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    -{fmtCurrency(results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    -{fmtCurrency(results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Net Invested Principal
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {fmtCurrency(results.vestSummary.netVestedCashAvailable * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {fmtCurrency(results.vestSummary.netVestedCashAvailable * inputs.holdingYears)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-[#5E5E5E]">
                    {fmtCurrency(results.vestSummary.netVestedCashAvailable * inputs.holdingYears)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Exit Capital Gains Tax
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -
                    {fmtCurrency(
                      results.strategySellAndDiversify.totalTaxesPaid -
                        results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -
                    {fmtCurrency(
                      results.strategyHoldConcentrated.totalTaxesPaid -
                        results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#5A7A8F] font-semibold">
                    -
                    {fmtCurrency(
                      results.strategyOptimizedRothWaterfall.totalTaxesPaid -
                        results.vestSummary.ordinaryIncomeTaxOnVest * inputs.holdingYears
                    )}
                  </td>
                </tr>
                <tr className="bg-white font-bold text-base">
                  <td className="py-4 px-4 text-[#1A1A1A]">
                    Net Take-Home Wealth
                  </td>
                  <td className="py-4 px-4 text-[#5A7A8F]">
                    {fmtCurrency(results.strategySellAndDiversify.endNetWealth)}
                  </td>
                  <td className="py-4 px-4 text-[#1A1A1A]">
                    {fmtCurrency(results.strategyHoldConcentrated.endNetWealth)}
                  </td>
                  <td className="py-4 px-4 text-[#5A7A8F] font-extrabold">
                    {fmtCurrency(results.strategyOptimizedRothWaterfall.endNetWealth)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#5E5E5E]">
                    Double-Jeopardy Risk Level
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-[#5A7A8F] border border-[#E5E5E5]">
                      Zero Risk
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-[#B85C5C] border border-[#B85C5C]">
                      {results.strategyHoldConcentrated.doubleJeopardyRiskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white text-[#5A7A8F] border border-[#E5E5E5]">
                      Zero Risk + Sheltered
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CRITICAL STRATEGIC TAKEAWAY */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#5A7A8F] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5E5E5E] leading-relaxed space-y-1">
              <p className="font-semibold text-[#1A1A1A]">
                The RSU Vesting Fallacy
              </p>
              <p>
                Because RSUs are taxed as ordinary earned income on vest date, holding company stock after vesting is <strong>mathematically identical to receiving a cash bonus and buying company shares on the open market at today's peak price</strong>. If you wouldn't take cash out of your checking account to buy your company's stock today, auto-selling and routing the proceeds into a broad index or Mega Backdoor Roth is mathematically dominant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RsuHoldVsSellCalculator;
