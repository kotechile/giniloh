/**
 * Portfolio Capital & Concentrated Wealth Engineering:
 * RSU Hold vs. Sell & Diversification Engine (2026 IRS Statutory Model).
 *
 * Deterministic core evaluating single-stock employer concentration risk,
 * tax drag on post-vest capital gains, Mega Backdoor Roth asset allocation,
 * and double-jeopardy income/equity correlation.
 */

// The factory's CalculationEngine contract, restated locally: this site has no shared engine
// registry, and importing a type from a file that does not exist here broke `astro check`.
interface CalculationEngine<I, O> {
	metadata: { id: string; name: string; version: string; description: string };
	validate(input: I): { valid: boolean; errors: string[] };
	calculate(input: I): O;
}

// ==========================================
// 2026 STATUTORY IRS & PORTFOLIO CONSTANTS
// ==========================================
export const PORTFOLIO_CONSTANTS_2026 = {
  ELECTIVE_401K_LIMIT: 24500, // 2026 402(g) Elective Deferral Cap ($24,500)
  SECTION_415C_MAX: 72000,    // 2026 415(c) Combined Employer + Employee Cap ($72,000)
  NIIT_THRESHOLD_SINGLE: 200000, // Net Investment Income Tax (3.8%) threshold single
  NIIT_THRESHOLD_MFJ: 250000,    // NIIT threshold MFJ
  NIIT_RATE: 0.038,              // 3.8% Surtax on investment gains
  LTCG_MAX_FEDERAL: 0.20,        // 20% top federal long-term capital gains bracket
  LTCG_BASE_FEDERAL: 0.15,       // 15% middle federal long-term capital gains bracket
} as const;

export interface RsuHoldVsSellInputs {
  // Annual RSU Grant & Vesting Data
  annualVestValue: number;       // e.g. $100,000 vested per year
  currentStockPrice: number;     // e.g. $150/share
  vestPrice: number;             // Price at vest date (cost basis for capital gains)

  // Holding Period & Return Assumptions
  holdingYears: number;          // e.g. 5 years
  expectedCompanyReturnPct: number; // e.g. 10% annualized company return
  expectedIndexReturnPct: number;   // e.g. 8.5% annualized diversified broad market (VTI/SPY)

  // Household Balance Sheet & Concentration
  householdLiquidNetWorth: number;  // e.g. $400,000 current liquid investments
  baseSalary: number;               // e.g. $180,000 (measures double-jeopardy exposure)

  // Tax Profile
  effectiveIncomeTaxRatePct: number; // e.g. 35% ordinary income tax (fed + state)
  longTermCapitalGainsRatePct: number; // e.g. 20% federal + state LTCG + NIIT (e.g. 23.8%)

  // Mega Backdoor Roth Option
  enableMegaBackdoor: boolean;   // Model routing portion of liquidated RSUs through after-tax 401(k)
  employer401kMatch: number;     // e.g. $7,200 match from employer
  employee401kElective: number;  // e.g. $24,500 max elective deferral
}

export interface StrategyResult {
  endGrossValue: number;
  totalTaxesPaid: number;
  endNetWealth: number;
  annualizedNetReturn: number;
  concentrationRatioPct: number;
  doubleJeopardyRiskLevel: "Low" | "Moderate" | "Severe" | "Critical";
}

export interface MegaBackdoorShelterResult {
  availableAfterTaxCapacity: number; // Space between 402(g) + match and $72,000
  annualTaxSavingsProjected: number;
  thirtyYearRothWealthDelta: number;
}

export interface RsuHoldVsSellOutputs {
  vestSummary: {
    grossVestValue: number;
    ordinaryIncomeTaxOnVest: number;
    netVestedCashAvailable: number;
    costBasisPerShare: number;
  };
  strategySellAndDiversify: StrategyResult;
  strategyHoldConcentrated: StrategyResult;
  strategyOptimizedRothWaterfall: StrategyResult;
  megaBackdoor: MegaBackdoorShelterResult;
  verdict: {
    recommendedStrategy: "Auto-Sell & Diversify" | "Hold Concentrated" | "Mega Backdoor Roth Waterfall";
    fiveYearWealthDelta: number; // Dollar advantage of recommended strategy over holding
    breakevenCompanyGrowthRatePct: number; // Company return required to justify single-stock holding
    concentrationRiskPct: number; // Single company equity / total liquid net worth
    doubleJeopardyScore: number; // Scale of 0-100 indicating earned income + asset risk
  };
}

export function calculateRsuHoldVsSell(inputs: RsuHoldVsSellInputs): RsuHoldVsSellOutputs {
  const { SECTION_415C_MAX, ELECTIVE_401K_LIMIT } = PORTFOLIO_CONSTANTS_2026;

  const years = Math.max(1, inputs.holdingYears);
  const ordinaryTaxRate = inputs.effectiveIncomeTaxRatePct / 100;
  const ltcgTaxRate = inputs.longTermCapitalGainsRatePct / 100;

  // 1. Vesting Math: Ordinary income applies REGARDLESS of holding strategy
  const grossVestValue = inputs.annualVestValue;
  const ordinaryIncomeTaxOnVest = grossVestValue * ordinaryTaxRate;
  const netVestedCashAvailable = grossVestValue - ordinaryIncomeTaxOnVest;
  const costBasisPerShare = inputs.vestPrice > 0 ? inputs.vestPrice : inputs.currentStockPrice;

  // 2. Strategy A: Auto-Sell on Vest Date & Reinvest in Diversified Index
  // All ordinary taxes paid at vest. Diversified index compounds at expectedIndexReturnPct.
  // Standard index has annual turnover tax drag (~0.3% drag on dividends/rebalancing in taxable).
  const indexReturn = inputs.expectedIndexReturnPct / 100;
  const indexAnnualDrag = 0.003; // 30 bps tax friction in taxable account
  const netIndexReturn = Math.max(0, indexReturn - indexAnnualDrag);

  let sellEndingValue = 0;
  for (let yr = 1; yr <= years; yr++) {
    // Each annual vest tranche compounds for (years - yr + 1) periods
    const compoundingPeriods = years - yr + 1;
    sellEndingValue += netVestedCashAvailable * Math.pow(1 + netIndexReturn, compoundingPeriods);
  }

  // Capital gains tax upon exit of index (cost basis is total net cash invested)
  const totalPrincipalInvested = netVestedCashAvailable * years;
  const indexGains = Math.max(0, sellEndingValue - totalPrincipalInvested);
  const indexExitTax = indexGains * ltcgTaxRate;
  const sellNetWealth = sellEndingValue - indexExitTax;

  // 3. Strategy B: Hold Concentrated Company Stock
  // Starts with shares held after tax withholding on vest date.
  // Company stock compounds at expectedCompanyReturnPct.
  const companyReturn = inputs.expectedCompanyReturnPct / 100;
  let holdEndingGross = 0;
  for (let yr = 1; yr <= years; yr++) {
    const compoundingPeriods = years - yr + 1;
    holdEndingGross += netVestedCashAvailable * Math.pow(1 + companyReturn, compoundingPeriods);
  }

  const companyGains = Math.max(0, holdEndingGross - totalPrincipalInvested);
  const holdExitTax = companyGains * ltcgTaxRate;
  const holdNetWealth = holdEndingGross - holdExitTax;

  // 4. Strategy C: Mega Backdoor Roth Waterfall Optimization
  // Excess vested cash is routed to after-tax 401(k) up to $72,000 limit, converted immediately to Roth (0% tax drag forever).
  const existing401kContributions = Math.min(
    inputs.employee401kElective,
    ELECTIVE_401K_LIMIT
  ) + inputs.employer401kMatch;
  const availableMegaBackdoorSpace = Math.max(
    0,
    SECTION_415C_MAX - existing401kContributions
  );

  let rothEndingValue = 0;
  const annualToRoth = Math.min(netVestedCashAvailable, availableMegaBackdoorSpace);
  const annualToTaxable = Math.max(0, netVestedCashAvailable - annualToRoth);

  for (let yr = 1; yr <= years; yr++) {
    const compoundingPeriods = years - yr + 1;
    // Roth portion compounds with ZERO tax drag and ZERO exit tax
    rothEndingValue += annualToRoth * Math.pow(1 + indexReturn, compoundingPeriods);
    // Remaining taxable portion compounds at net index rate
    rothEndingValue += annualToTaxable * Math.pow(1 + netIndexReturn, compoundingPeriods);
  }

  // Taxable portion exit tax
  const totalTaxableInvested = annualToTaxable * years;
  const taxablePortionGains = Math.max(0, (rothEndingValue - (annualToRoth * years * Math.pow(1 + indexReturn, years / 2))) - totalTaxableInvested);
  const rothExitTax = taxablePortionGains * ltcgTaxRate;
  const rothNetWealth = rothEndingValue - rothExitTax;

  // 30-year compounding delta of sheltering the Mega Backdoor space ($72k cap)
  const annualTaxSavings = availableMegaBackdoorSpace * (indexReturn * ltcgTaxRate);
  const thirtyYearRothWealthDelta =
    availableMegaBackdoorSpace * (Math.pow(1 + indexReturn, 30) - Math.pow(1 + netIndexReturn, 30));

  // 5. Risk Scoring: Concentration & Double-Jeopardy
  const totalLiquidAssets = inputs.householdLiquidNetWorth + holdEndingGross;
  const concentrationRatioPct = totalLiquidAssets > 0 ? (holdEndingGross / totalLiquidAssets) * 100 : 0;

  // Double jeopardy calculation: high base salary dependent on employer + high single-stock wealth
  let doubleJeopardyScore = 0;
  if (concentrationRatioPct > 50) doubleJeopardyScore += 50;
  else if (concentrationRatioPct > 25) doubleJeopardyScore += 30;
  else if (concentrationRatioPct > 10) doubleJeopardyScore += 15;

  const earnedIncomeRatio = inputs.baseSalary / Math.max(1, inputs.householdLiquidNetWorth);
  if (earnedIncomeRatio > 0.5) doubleJeopardyScore += 30;
  else if (earnedIncomeRatio > 0.25) doubleJeopardyScore += 20;

  if (inputs.holdingYears >= 4) doubleJeopardyScore += 20;

  doubleJeopardyScore = Math.min(100, doubleJeopardyScore);

  let doubleJeopardyRiskLevel: "Low" | "Moderate" | "Severe" | "Critical" = "Low";
  if (doubleJeopardyScore >= 75) doubleJeopardyRiskLevel = "Critical";
  else if (doubleJeopardyScore >= 50) doubleJeopardyRiskLevel = "Severe";
  else if (doubleJeopardyScore >= 30) doubleJeopardyRiskLevel = "Moderate";

  // 6. Binary search for Breakeven Company Return Rate
  // Find what company return rate makes holding equal to index auto-sell
  let low = -0.10;
  let high = 0.50;
  for (let i = 0; i < 25; i++) {
    const mid = (low + high) / 2;
    let testHoldGross = 0;
    for (let yr = 1; yr <= years; yr++) {
      testHoldGross += netVestedCashAvailable * Math.pow(1 + mid, years - yr + 1);
    }
    const testHoldGains = Math.max(0, testHoldGross - totalPrincipalInvested);
    const testHoldNet = testHoldGross - testHoldGains * ltcgTaxRate;
    if (testHoldNet < sellNetWealth) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const breakevenCompanyGrowthRatePct = Number(((low + high) / 2 * 100).toFixed(2));

  const recommendedStrategy = inputs.enableMegaBackdoor && availableMegaBackdoorSpace > 0
    ? "Mega Backdoor Roth Waterfall"
    : (sellNetWealth >= holdNetWealth ? "Auto-Sell & Diversify" : "Hold Concentrated");

  const bestNet = recommendedStrategy === "Mega Backdoor Roth Waterfall"
    ? rothNetWealth
    : (recommendedStrategy === "Auto-Sell & Diversify" ? sellNetWealth : holdNetWealth);

  const fiveYearWealthDelta = bestNet - holdNetWealth;

  return {
    vestSummary: {
      grossVestValue,
      ordinaryIncomeTaxOnVest,
      netVestedCashAvailable,
      costBasisPerShare,
    },
    strategySellAndDiversify: {
      endGrossValue: sellEndingValue,
      totalTaxesPaid: ordinaryIncomeTaxOnVest * years + indexExitTax,
      endNetWealth: sellNetWealth,
      annualizedNetReturn: netIndexReturn * 100,
      concentrationRatioPct: 0,
      doubleJeopardyRiskLevel: "Low",
    },
    strategyHoldConcentrated: {
      endGrossValue: holdEndingGross,
      totalTaxesPaid: ordinaryIncomeTaxOnVest * years + holdExitTax,
      endNetWealth: holdNetWealth,
      annualizedNetReturn: companyReturn * 100,
      concentrationRatioPct,
      doubleJeopardyRiskLevel,
    },
    strategyOptimizedRothWaterfall: {
      endGrossValue: rothEndingValue,
      totalTaxesPaid: ordinaryIncomeTaxOnVest * years + rothExitTax,
      endNetWealth: rothNetWealth,
      annualizedNetReturn: indexReturn * 100,
      concentrationRatioPct: 0,
      doubleJeopardyRiskLevel: "Low",
    },
    megaBackdoor: {
      availableAfterTaxCapacity: availableMegaBackdoorSpace,
      annualTaxSavingsProjected: annualTaxSavings,
      thirtyYearRothWealthDelta,
    },
    verdict: {
      recommendedStrategy,
      fiveYearWealthDelta,
      breakevenCompanyGrowthRatePct,
      concentrationRiskPct: concentrationRatioPct,
      doubleJeopardyScore,
    },
  };
}

export const rsuHoldVsSellEngine: CalculationEngine<RsuHoldVsSellInputs, RsuHoldVsSellOutputs> = {
  metadata: {
    id: "rsu_hold_vs_sell_engine",
    name: "RSU Hold vs. Sell & Mega Backdoor Roth Engine",
    version: "2026.1.0",
    description:
      "Deterministic 2026 IRS statutory wealth optimization modeling single-stock concentration risk, post-vest capital gains drag, and $72k Section 415(c) Mega Backdoor Roth asset location.",
  },
  validate(input: RsuHoldVsSellInputs) {
    const errors: string[] = [];
    if (input.annualVestValue <= 0) errors.push("annualVestValue must be greater than 0.");
    if (input.holdingYears <= 0 || input.holdingYears > 40) errors.push("holdingYears must be between 1 and 40.");
    if (input.effectiveIncomeTaxRatePct < 0 || input.effectiveIncomeTaxRatePct > 70) {
      errors.push("effectiveIncomeTaxRatePct must be between 0 and 70%.");
    }
    return { valid: errors.length === 0, errors };
  },
  calculate(input: RsuHoldVsSellInputs) {
    return calculateRsuHoldVsSell(input);
  },
};
