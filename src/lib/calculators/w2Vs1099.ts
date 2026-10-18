// ==========================================
// 2026 STATUTORY IRS CONSTANTS
// ==========================================
export const TAX_CONSTANTS_2026 = {
  SS_WAGE_BASE: 184500, // 2026 OASDI Limit ($184,500)
  SS_RATE_EMP: 0.062, // 6.2% Employee / Employer
  MED_RATE_EMP: 0.0145, // 1.45% Medicare Employee / Employer
  ADD_MED_THRESHOLD: 200000, // $200k Single threshold for 0.9% Additional Medicare surtax
  ADD_MED_RATE: 0.009, // 0.9% Additional Medicare surtax
  ELECTIVE_401K_LIMIT: 24500, // 2026 402(g) Elective Deferral Cap ($24,500)
  SOLO_401K_MAX: 72000, // 2026 415(c) Combined Employer + Employee Cap ($72,000)
  FUTA_SUTA_ESTIMATE: 420, // Federal / State unemployment insurance overhead ($420/yr)
} as const;

export interface W2Vs1099Inputs {
  // W-2 Inputs
  w2Base: number;
  w2Bonus: number;
  w2Equity: number;
  w2MatchPct: number;
  w2PtoDays: number;
  w2WorkHours: number;
  w2CommuteHours: number;

  // 1099 / S-Corp Inputs
  hourlyRate: number;
  billableHoursPerWeek: number;
  adminHoursPerWeek: number;
  vacationWeeks: number;
  benchWeeks: number;
  opsExpenses: number;
  healthInsuranceAnnual: number;

  // S-Corp Specific
  sCorpSalaryRatio: number; // e.g. 45 (%)
  sCorpComplianceCost: number; // e.g. 3000 ($/yr)

  // Tax & Optimization
  effectiveTaxRate: number; // e.g. 28 (%)
  maxOutRetirement: boolean;
  qbiEligible: boolean;
}

export interface W2Result {
  gross: number;
  match: number;
  fica: number;
  taxableIncome: number;
  incomeTax: number;
  retirementShelter: number;
  net: number;
  totalHours: number;
  hourlyYield: number;
}

export interface SolePropResult {
  grossRev: number;
  schCProfit: number;
  seTaxableBase: number;
  seTax: number;
  deductibleHalfSe: number;
  retirementShelter: number;
  qbiBase: number;
  qbiDed: number;
  incomeTax: number;
  net: number;
  totalHours: number;
  hourlyYield: number;
}

export interface SCorpResult {
  grossRev: number;
  preSalaryProfit: number;
  w2Salary: number;
  employerFica: number;
  employeeFica: number;
  totalFica: number;
  employee401k: number;
  employer401k: number;
  retirementShelter: number;
  k1Distribution: number;
  qbiDed: number;
  taxableIncome: number;
  incomeTax: number;
  net: number;
  totalHours: number;
  hourlyYield: number;
}

export interface W2Vs1099ComparisonResult {
  w2: W2Result;
  soleProp: SolePropResult;
  sCorp: SCorpResult;
  verdict: {
    bestIndependentModel: 'S-Corp' | '1099 Sole Prop';
    bestIndependentNet: number;
    annualNetDelta: number;
    threeYearDelta: number;
    breakevenHourlyRate: number;
    hiddenFrictionPct: number;
    sCorpVsSolePropDelta: number;
  };
}

export function computeW2(inputs: W2Vs1099Inputs): W2Result {
  const {
    SS_WAGE_BASE,
    SS_RATE_EMP,
    MED_RATE_EMP,
    ADD_MED_THRESHOLD,
    ADD_MED_RATE,
    ELECTIVE_401K_LIMIT,
  } = TAX_CONSTANTS_2026;

  const taxRate = inputs.effectiveTaxRate / 100;
  const gross = inputs.w2Base + inputs.w2Bonus + inputs.w2Equity;
  const match = inputs.w2Base * (inputs.w2MatchPct / 100);
  const employee401k = inputs.maxOutRetirement
    ? Math.min(gross, ELECTIVE_401K_LIMIT)
    : Math.min(gross, inputs.w2Base * (inputs.w2MatchPct / 100));

  const fica =
    Math.min(gross, SS_WAGE_BASE) * SS_RATE_EMP +
    gross * MED_RATE_EMP +
    Math.max(0, gross - ADD_MED_THRESHOLD) * ADD_MED_RATE;

  const taxableIncome = Math.max(0, gross - employee401k);
  const incomeTax = taxableIncome * taxRate;
  const net = gross + match - fica - incomeTax;

  const activeWeeks = Math.max(1, 52 - inputs.w2PtoDays / 5);
  const totalHours = activeWeeks * (inputs.w2WorkHours + inputs.w2CommuteHours);
  const hourlyYield = totalHours > 0 ? net / totalHours : 0;

  return {
    gross,
    match,
    fica,
    taxableIncome,
    incomeTax,
    retirementShelter: employee401k + match,
    net,
    totalHours,
    hourlyYield,
  };
}

export function computeSoleProp(inputs: W2Vs1099Inputs, overrideRate?: number): SolePropResult {
  const {
    SS_WAGE_BASE,
    SS_RATE_EMP,
    MED_RATE_EMP,
    ADD_MED_THRESHOLD,
    ADD_MED_RATE,
    ELECTIVE_401K_LIMIT,
    SOLO_401K_MAX,
  } = TAX_CONSTANTS_2026;

  const rate = overrideRate ?? inputs.hourlyRate;
  const activeWeeks = Math.max(1, 52 - inputs.vacationWeeks - inputs.benchWeeks);
  const grossRev = rate * inputs.billableHoursPerWeek * activeWeeks;
  const totalHours = activeWeeks * (inputs.billableHoursPerWeek + inputs.adminHoursPerWeek);
  const taxRate = inputs.effectiveTaxRate / 100;

  const schCProfit = Math.max(0, grossRev - inputs.opsExpenses);
  const seTaxableBase = schCProfit * 0.9235;

  const seTax =
    Math.min(seTaxableBase, SS_WAGE_BASE) * (SS_RATE_EMP * 2) +
    seTaxableBase * (MED_RATE_EMP * 2) +
    Math.max(0, seTaxableBase - ADD_MED_THRESHOLD) * ADD_MED_RATE;

  const deductibleHalfSe = seTax * 0.5;

  const retirementShelter = inputs.maxOutRetirement
    ? Math.min(
        SOLO_401K_MAX,
        Math.min(schCProfit, ELECTIVE_401K_LIMIT) +
          0.2 * Math.max(0, schCProfit - deductibleHalfSe - ELECTIVE_401K_LIMIT)
      )
    : 0;

  const qbiBase = Math.max(
    0,
    schCProfit - deductibleHalfSe - retirementShelter - inputs.healthInsuranceAnnual
  );
  const qbiDed = inputs.qbiEligible ? qbiBase * 0.2 : 0;
  const incomeTax = Math.max(0, qbiBase - qbiDed) * taxRate;

  const net = schCProfit - inputs.healthInsuranceAnnual - seTax - incomeTax;
  const hourlyYield = totalHours > 0 ? net / totalHours : 0;

  return {
    grossRev,
    schCProfit,
    seTaxableBase,
    seTax,
    deductibleHalfSe,
    retirementShelter,
    qbiBase,
    qbiDed,
    incomeTax,
    net,
    totalHours,
    hourlyYield,
  };
}

export function computeSCorp(inputs: W2Vs1099Inputs, overrideRate?: number): SCorpResult {
  const {
    SS_WAGE_BASE,
    SS_RATE_EMP,
    MED_RATE_EMP,
    ADD_MED_THRESHOLD,
    ADD_MED_RATE,
    ELECTIVE_401K_LIMIT,
    SOLO_401K_MAX,
    FUTA_SUTA_ESTIMATE,
  } = TAX_CONSTANTS_2026;

  const rate = overrideRate ?? inputs.hourlyRate;
  const activeWeeks = Math.max(1, 52 - inputs.vacationWeeks - inputs.benchWeeks);
  const grossRev = rate * inputs.billableHoursPerWeek * activeWeeks;
  const totalHours = activeWeeks * (inputs.billableHoursPerWeek + inputs.adminHoursPerWeek);
  const taxRate = inputs.effectiveTaxRate / 100;

  const preSalaryProfit = Math.max(
    0,
    grossRev - inputs.opsExpenses - inputs.sCorpComplianceCost
  );
  const w2Salary = preSalaryProfit * (inputs.sCorpSalaryRatio / 100);

  const employerFica =
    Math.min(w2Salary, SS_WAGE_BASE) * SS_RATE_EMP +
    w2Salary * MED_RATE_EMP +
    FUTA_SUTA_ESTIMATE;

  const employeeFica =
    Math.min(w2Salary, SS_WAGE_BASE) * SS_RATE_EMP +
    w2Salary * MED_RATE_EMP +
    Math.max(0, w2Salary - ADD_MED_THRESHOLD) * ADD_MED_RATE;

  const totalFica = employerFica + employeeFica;

  const employee401k = inputs.maxOutRetirement
    ? Math.min(w2Salary, ELECTIVE_401K_LIMIT)
    : 0;

  const employer401k = inputs.maxOutRetirement
    ? Math.min(0.25 * w2Salary, SOLO_401K_MAX - employee401k)
    : 0;

  const retirementShelter = employee401k + employer401k;

  const k1Distribution = Math.max(
    0,
    preSalaryProfit -
      inputs.healthInsuranceAnnual -
      w2Salary -
      employerFica -
      employer401k
  );

  const qbiDed = inputs.qbiEligible ? k1Distribution * 0.2 : 0;
  const taxableIncome = Math.max(
    0,
    w2Salary - employee401k + (k1Distribution - qbiDed)
  );
  const incomeTax = taxableIncome * taxRate;

  const net = preSalaryProfit - inputs.healthInsuranceAnnual - totalFica - incomeTax;
  const hourlyYield = totalHours > 0 ? net / totalHours : 0;

  return {
    grossRev,
    preSalaryProfit,
    w2Salary,
    employerFica,
    employeeFica,
    totalFica,
    employee401k,
    employer401k,
    retirementShelter,
    k1Distribution,
    qbiDed,
    taxableIncome,
    incomeTax,
    net,
    totalHours,
    hourlyYield,
  };
}

export function computeW2Vs1099(inputs: W2Vs1099Inputs): W2Vs1099ComparisonResult {
  const w2 = computeW2(inputs);
  const soleProp = computeSoleProp(inputs);
  const sCorp = computeSCorp(inputs);

  // Exact binary search for Breakeven Hourly Rate where Max(SoleProp.net, SCorp.net) >= W2.net
  let low = 10;
  let high = 1500;
  for (let i = 0; i < 30; i++) {
    const mid = (low + high) / 2;
    const testSoleProp = computeSoleProp(inputs, mid);
    const testSCorp = computeSCorp(inputs, mid);
    const bestNet = Math.max(testSoleProp.net, testSCorp.net);
    if (bestNet < w2.net) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const breakevenHourlyRate = Math.ceil((low + high) / 2);

  const bestIndependentModel: 'S-Corp' | '1099 Sole Prop' =
    sCorp.net >= soleProp.net ? 'S-Corp' : '1099 Sole Prop';
  const bestIndependentNet = Math.max(sCorp.net, soleProp.net);
  const annualNetDelta = bestIndependentNet - w2.net;
  const threeYearDelta = annualNetDelta * 3;

  const bestIndTaxes =
    bestIndependentModel === 'S-Corp'
      ? sCorp.totalFica +
        sCorp.incomeTax +
        inputs.sCorpComplianceCost +
        inputs.healthInsuranceAnnual +
        inputs.opsExpenses
      : soleProp.seTax +
        soleProp.incomeTax +
        inputs.healthInsuranceAnnual +
        inputs.opsExpenses;

  const grossRev = soleProp.grossRev;
  const hiddenFrictionPct = grossRev > 0 ? (bestIndTaxes / grossRev) * 100 : 0;

  return {
    w2,
    soleProp,
    sCorp,
    verdict: {
      bestIndependentModel,
      bestIndependentNet,
      annualNetDelta,
      threeYearDelta,
      breakevenHourlyRate,
      hiddenFrictionPct,
      sCorpVsSolePropDelta: sCorp.net - soleProp.net,
    },
  };
}
