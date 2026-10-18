import React, { useState, useMemo, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Calculator,
  Clock,
  DollarSign,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  computeW2Vs1099,
  type W2Vs1099Inputs,
} from '../../../lib/calculators/w2Vs1099';

export const W2Vs1099Calculator: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [inputs, setInputs] = useState<W2Vs1099Inputs>({
    w2Base: 180000,
    w2Bonus: 20000,
    w2Equity: 30000,
    w2MatchPct: 4,
    w2PtoDays: 20,
    w2WorkHours: 40,
    w2CommuteHours: 5,

    hourlyRate: 150,
    billableHoursPerWeek: 35,
    adminHoursPerWeek: 5,
    vacationWeeks: 4,
    benchWeeks: 4,
    opsExpenses: 6000,
    healthInsuranceAnnual: 9600,

    sCorpSalaryRatio: 45,
    sCorpComplianceCost: 3000,

    effectiveTaxRate: 28,
    maxOutRetirement: true,
    qbiEligible: true,
  });

  // Cross-linking URL parameter synchronization on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const base = params.get('base');
      const bonus = params.get('bonus');
      const equity = params.get('equity');
      const rate = params.get('rate');
      const bench = params.get('bench');
      const ratio = params.get('ratio');

      if (base || bonus || equity || rate || bench || ratio) {
        setInputs((prev) => ({
          ...prev,
          w2Base: base ? Number(base) : prev.w2Base,
          w2Bonus: bonus ? Number(bonus) : prev.w2Bonus,
          w2Equity: equity ? Number(equity) : prev.w2Equity,
          hourlyRate: rate ? Number(rate) : prev.hourlyRate,
          benchWeeks: bench ? Number(bench) : prev.benchWeeks,
          sCorpSalaryRatio: ratio ? Number(ratio) : prev.sCorpSalaryRatio,
        }));
      }
    }
  }, []);

  const updateInput = <K extends keyof W2Vs1099Inputs>(
    key: K,
    value: W2Vs1099Inputs[K]
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const results = useMemo(() => {
    return computeW2Vs1099(inputs);
  }, [inputs]);

  const copyPermalink = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams({
      base: inputs.w2Base.toString(),
      bonus: inputs.w2Bonus.toString(),
      equity: inputs.w2Equity.toString(),
      rate: inputs.hourlyRate.toString(),
      bench: inputs.benchWeeks.toString(),
      ratio: inputs.sCorpSalaryRatio.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A]/10 border border-[#E5E5E5] text-[#5A7A8F] text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Career Capital & Comp Engineering
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
            W-2 Salary vs. 1099 / S-Corp Net Yield Engine
          </h1>
          <p className="text-sm text-[#5E5E5E] mt-1">
            2026 IRS statutory model factoring SE tax arbitrage, Solo 401(k) circular caps, QBI pass-through, and bench drag.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setInputs((p) => ({
                ...p,
                w2Base: 180000,
                w2Bonus: 20000,
                w2Equity: 30000,
                hourlyRate: 150,
                benchWeeks: 4,
                sCorpSalaryRatio: 45,
              }))
            }
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#5E5E5E] transition"
          >
            Sr. SWE ($230k vs $150/hr)
          </button>
          <button
            onClick={() =>
              setInputs((p) => ({
                ...p,
                w2Base: 220000,
                w2Bonus: 40000,
                w2Equity: 80000,
                hourlyRate: 225,
                benchWeeks: 6,
                sCorpSalaryRatio: 40,
              }))
            }
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#5E5E5E] transition"
          >
            Staff / Architect ($340k vs $225/hr)
          </button>
          <button
            onClick={copyPermalink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/50 border border-[#5A7A8F] text-[#5E5E5E] transition"
            title="Copy shareable link with inputs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#5A7A8F]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Link Copied!' : 'Share Link'}
          </button>
        </div>
      </div>

      {/* GINILOH SIGNATURE VERDICT BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            3-Year Net Wealth Delta
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              results.verdict.threeYearDelta >= 0
                ? 'text-[#5A7A8F]'
                : 'text-[#B85C5C]'
            }`}
          >
            {results.verdict.threeYearDelta >= 0 ? '+' : ''}
            {fmtCurrency(results.verdict.threeYearDelta)}
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            {results.verdict.bestIndependentModel} vs. W-2 over 36 mos
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            1099 Breakeven Rate
          </span>
          <div className="text-2xl font-bold text-[#C88D4E] mt-1">
            ${results.verdict.breakevenHourlyRate}/hr
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            Min rate to equal {fmtCurrency(results.w2.net)} net W-2
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            S-Corp vs. Sole Prop Arbitrage
          </span>
          <div
            className={`text-2xl font-bold mt-1 ${
              results.verdict.sCorpVsSolePropDelta >= 0
                ? 'text-[#5A7A8F]'
                : 'text-[#C88D4E]'
            }`}
          >
            {results.verdict.sCorpVsSolePropDelta >= 0 ? '+' : ''}
            {fmtCurrency(results.verdict.sCorpVsSolePropDelta)}/yr
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            {results.verdict.sCorpVsSolePropDelta >= 0
              ? 'S-Corp FICA savings beat CPA drag'
              : 'Sole Prop 401(k) + QBI beats S-Corp'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E5E5E5]">
          <span className="text-xs font-medium text-[#5E5E5E] uppercase tracking-wider">
            Hidden Friction Share
          </span>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-1">
            {results.verdict.hiddenFrictionPct.toFixed(1)}%
          </div>
          <p className="text-xs text-[#5E5E5E] mt-1">
            Of gross 1099 lost to taxes, health & ops
          </p>
        </div>
      </div>

      {/* MAIN GRID: INPUTS LEFT, COMPARISON MATRIX RIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        {/* LEFT COLUMN: CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6 bg-white/50 p-5 rounded-xl border border-[#E5E5E5]">
          {/* W2 SECTION */}
          <div>
            <h3 className="text-sm font-semibold text-[#5A7A8F] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4" /> 1. W-2 Baseline Package
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">Base Salary ($)</label>
                <input
                  type="number"
                  value={inputs.w2Base}
                  onChange={(e) => updateInput('w2Base', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Annual Bonus ($)</label>
                <input
                  type="number"
                  value={inputs.w2Bonus}
                  onChange={(e) => updateInput('w2Bonus', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Annualized RSU/Equity ($)</label>
                <input
                  type="number"
                  value={inputs.w2Equity}
                  onChange={(e) => updateInput('w2Equity', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">401(k) Match (%)</label>
                <input
                  type="number"
                  value={inputs.w2MatchPct}
                  onChange={(e) => updateInput('w2MatchPct', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Paid Time Off (Days)</label>
                <input
                  type="number"
                  value={inputs.w2PtoDays}
                  onChange={(e) => updateInput('w2PtoDays', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Weekly Commute (Hrs)</label>
                <input
                  type="number"
                  value={inputs.w2CommuteHours}
                  onChange={(e) =>
                    updateInput('w2CommuteHours', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* 1099 SECTION */}
          <div className="pt-4 border-t border-[#E5E5E5]">
            <h3 className="text-sm font-semibold text-[#5A7A8F] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4" /> 2. Independent Consulting & Friction
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">Billable Rate ($/hr)</label>
                <input
                  type="number"
                  value={inputs.hourlyRate}
                  onChange={(e) =>
                    updateInput('hourlyRate', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#5A7A8F] rounded-lg text-sm font-semibold text-[#5A7A8F]"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Billable Hrs / Week</label>
                <input
                  type="number"
                  value={inputs.billableHoursPerWeek}
                  onChange={(e) =>
                    updateInput('billableHoursPerWeek', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Unbilled Admin Hrs/Wk</label>
                <input
                  type="number"
                  value={inputs.adminHoursPerWeek}
                  onChange={(e) =>
                    updateInput('adminHoursPerWeek', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Bench / Unbilled Weeks</label>
                <input
                  type="number"
                  value={inputs.benchWeeks}
                  onChange={(e) =>
                    updateInput('benchWeeks', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Health Ins. ($/yr)</label>
                <input
                  type="number"
                  value={inputs.healthInsuranceAnnual}
                  onChange={(e) =>
                    updateInput('healthInsuranceAnnual', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">Software/Ops ($/yr)</label>
                <input
                  type="number"
                  value={inputs.opsExpenses}
                  onChange={(e) =>
                    updateInput('opsExpenses', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* S-CORP & TAX OPTIMIZATION */}
          <div className="pt-4 border-t border-[#E5E5E5] space-y-3">
            <h3 className="text-sm font-semibold text-[#C88D4E] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" /> 3. S-Corp & Tax Shelter Tuning
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#5E5E5E]">
                  S-Corp Reasonable Salary Split ({inputs.sCorpSalaryRatio}%)
                </span>
                <span className="text-[#1A1A1A] font-medium">
                  {fmtCurrency(results.sCorp.w2Salary)} W-2 /{' '}
                  {fmtCurrency(results.sCorp.k1Distribution)} K-1
                </span>
              </div>
              <input
                type="range"
                min={30}
                max={75}
                value={inputs.sCorpSalaryRatio}
                onChange={(e) =>
                  updateInput('sCorpSalaryRatio', Number(e.target.value))
                }
                className="w-full accent-[#5A7A8F] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#5E5E5E]">
                  S-Corp CPA & Payroll ($/yr)
                </label>
                <input
                  type="number"
                  value={inputs.sCorpComplianceCost}
                  onChange={(e) =>
                    updateInput('sCorpComplianceCost', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#5E5E5E]">
                  Blended Eff. Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={inputs.effectiveTaxRate}
                  onChange={(e) =>
                    updateInput('effectiveTaxRate', Number(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-[#5E5E5E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.maxOutRetirement}
                  onChange={(e) =>
                    updateInput('maxOutRetirement', e.target.checked)
                  }
                  className="rounded bg-white border-[#E5E5E5] text-[#5A7A8F]"
                />
                Max Solo 401(k) ($72k Cap)
              </label>

              <label className="flex items-center gap-2 text-xs text-[#5E5E5E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inputs.qbiEligible}
                  onChange={(e) => updateInput('qbiEligible', e.target.checked)}
                  className="rounded bg-white border-[#E5E5E5] text-[#5A7A8F]"
                />
                Apply 20% QBI Deduction
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDE-BY-SIDE MATRIX (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="overflow-x-auto rounded-xl border border-[#E5E5E5] bg-white/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] text-xs uppercase text-[#5E5E5E] bg-white">
                  <th className="py-3.5 px-4">Line Item (Annual)</th>
                  <th className="py-3.5 px-4">W-2 Employee</th>
                  <th className="py-3.5 px-4">1099 Sole Prop</th>
                  <th className="py-3.5 px-4 text-[#5A7A8F]">1099 S-Corp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                <tr>
                  <td className="py-3 px-4 font-medium text-[#5E5E5E]">
                    Gross Inflow + Match
                  </td>
                  <td className="py-3 px-4">
                    {fmtCurrency(results.w2.gross + results.w2.match)}
                  </td>
                  <td className="py-3 px-4">{fmtCurrency(results.soleProp.grossRev)}</td>
                  <td className="py-3 px-4">{fmtCurrency(results.sCorp.grossRev)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Health Ins, Ops & CPA Overhead
                  </td>
                  <td className="py-3 px-4 text-[#8C8C8C]">$0 (Employer Paid)</td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(inputs.opsExpenses + inputs.healthInsuranceAnnual)}
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -
                    {fmtCurrency(
                      inputs.opsExpenses +
                        inputs.healthInsuranceAnnual +
                        inputs.sCorpComplianceCost
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    FICA / Self-Employment Tax
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(results.w2.fica)}
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(results.soleProp.seTax)}
                  </td>
                  <td className="py-3 px-4 text-[#5A7A8F] font-medium">
                    -{fmtCurrency(results.sCorp.totalFica)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Pre-Tax 401(k) Sheltered
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    {fmtCurrency(results.w2.retirementShelter)}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    {fmtCurrency(results.soleProp.retirementShelter)}
                  </td>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    {fmtCurrency(results.sCorp.retirementShelter)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Sec. 199A QBI Tax Deduction
                  </td>
                  <td className="py-3 px-4 text-[#8C8C8C]">$0</td>
                  <td className="py-3 px-4 text-[#5A7A8F]">
                    {fmtCurrency(results.soleProp.qbiDed)}
                  </td>
                  <td className="py-3 px-4 text-[#5A7A8F]">
                    {fmtCurrency(results.sCorp.qbiDed)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#5E5E5E]">
                    Income Tax ({inputs.effectiveTaxRate}% Eff.)
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(results.w2.incomeTax)}
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(results.soleProp.incomeTax)}
                  </td>
                  <td className="py-3 px-4 text-[#B85C5C]">
                    -{fmtCurrency(results.sCorp.incomeTax)}
                  </td>
                </tr>
                <tr className="bg-white font-bold text-base">
                  <td className="py-4 px-4 text-[#1A1A1A]">
                    Total Net Economic Yield
                  </td>
                  <td className="py-4 px-4 text-[#1A1A1A]">
                    {fmtCurrency(results.w2.net)}
                  </td>
                  <td className="py-4 px-4 text-[#5A7A8F]">
                    {fmtCurrency(results.soleProp.net)}
                  </td>
                  <td className="py-4 px-4 text-[#5A7A8F]">
                    {fmtCurrency(results.sCorp.net)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#5E5E5E]">
                    True Net Hourly Yield (incl. Commute/Admin)
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#1A1A1A]">
                    ${results.w2.hourlyYield.toFixed(2)}/hr
                    <span className="block text-[11px] font-normal text-[#5E5E5E]">
                      ({Math.round(results.w2.totalHours)} hrs/yr)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#5A7A8F]">
                    ${results.soleProp.hourlyYield.toFixed(2)}/hr
                    <span className="block text-[11px] font-normal text-[#5E5E5E]">
                      ({Math.round(results.soleProp.totalHours)} hrs/yr)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#5E5E5E]">
                    ${results.sCorp.hourlyYield.toFixed(2)}/hr
                    <span className="block text-[11px] font-normal text-[#5E5E5E]">
                      ({Math.round(results.sCorp.totalHours)} hrs/yr)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SENSITIVITY CALLOUT */}
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E5] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#5A7A8F] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5E5E5E] leading-relaxed space-y-1">
              <p className="font-semibold text-[#1A1A1A]">
                Sensitivity Driver: Why S-Corp vs. Sole Prop Flips
              </p>
              <p>
                Lowering your S-Corp W-2 salary saves <strong>15.3% FICA</strong> below the $184,500 Social Security cap (and <strong>2.9%–3.8% Medicare</strong> above it), but simultaneously shrinks your <strong>25% Employer Solo 401(k) ceiling</strong> and <strong>QBI base</strong>. Use the S-Corp Reasonable Salary slider on the left to find the exact inflection point for your billing rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default W2Vs1099Calculator;
