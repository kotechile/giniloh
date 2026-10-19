/**
 * Career-capital calculator regression check.
 *
 * These two engines are the ONLY copy of the W-2 vs 1099 / S-Corp and RSU hold-vs-sell maths.
 * They used to exist twice — here (live) and in software-factory-core/src/lib/calc (unused,
 * uncommitted) — where the two copies could drift apart on the next statutory update. The
 * duplicate is deleted and this script is the seat belt: every number below is a known answer
 * from the 2026 spec vector, so a changed constant, formula or rounding rule fails here instead
 * of quietly changing what the public pages tell someone about their own pay.
 *
 * Run: npm run check:calculators   (Node ≥22.6 strips the TypeScript types natively — no deps)
 */
import { computeW2Vs1099, TAX_CONSTANTS_2026 } from '../src/lib/calculators/w2Vs1099.ts';
import {
  calculateRsuHoldVsSell,
  PORTFOLIO_CONSTANTS_2026,
} from '../src/lib/calculators/rsuHoldVsSell.ts';

let failures = 0;
const check = (label, actual, expected, tol = 0) => {
  const ok = typeof expected === 'number' && tol > 0
    ? Math.abs(actual - expected) <= tol
    : actual === expected;
  if (!ok) {
    failures++;
    console.log(`FAIL ${label}: expected ${expected}${tol ? ` ±${tol}` : ''}, got ${actual}`);
  }
};

// ── 2026 statutory constants ────────────────────────────────────────────────────────────────
check('SS wage base 2026', TAX_CONSTANTS_2026.SS_WAGE_BASE, 184500);
check('401(k) elective deferral 2026', TAX_CONSTANTS_2026.ELECTIVE_401K_LIMIT, 24500);
check('415(c) combined limit 2026', TAX_CONSTANTS_2026.SOLO_401K_MAX, 72000);
check('415(c) portfolio constant', PORTFOLIO_CONSTANTS_2026.SECTION_415C_MAX, 72000);
check('NIIT rate', PORTFOLIO_CONSTANTS_2026.NIIT_RATE, 0.038);

// ── W-2 vs 1099 / S-Corp spec vector ───────────────────────────────────────────────────────
// W-2: $180k base + $20k bonus + $30k RSU = $230k gross, 4% match, 20 PTO days, 40h + 5h commute.
// 1099: $150/hr, 35 billable + 5 admin, 4 wks vacation, 4 wks bench (44 active), $6k ops,
// $9.6k health; S-Corp salary ratio 45%, $3k compliance, 28% tax, QBI + max retirement.
const w2Inputs = {
  w2Base: 180000, w2Bonus: 20000, w2Equity: 30000, w2MatchPct: 4, w2PtoDays: 20,
  w2WorkHours: 40, w2CommuteHours: 5,
  hourlyRate: 150, billableHoursPerWeek: 35, adminHoursPerWeek: 5, vacationWeeks: 4,
  benchWeeks: 4, opsExpenses: 6000, healthInsuranceAnnual: 9600,
  sCorpSalaryRatio: 45, sCorpComplianceCost: 3000,
  effectiveTaxRate: 28, maxOutRetirement: true, qbiEligible: true,
};
const w2 = computeW2Vs1099(w2Inputs);

check('W-2 gross', w2.w2.gross, 230000);
check('W-2 match', w2.w2.match, 7200);
check('W-2 FICA', w2.w2.fica, 15044);           // 6.2% ≤$184.5k + 1.45% all + 0.9% >$200k
check('W-2 retirement shelter', w2.w2.retirementShelter, 31700);
check('W-2 taxable income', w2.w2.taxableIncome, 205500);
check('W-2 income tax', w2.w2.incomeTax, 57540, 0.01);
check('W-2 net', w2.w2.net, 164616, 0.01);
check('W-2 hours', w2.w2.totalHours, 2160);      // (52−4) × (40+5)
check('W-2 hourly yield', w2.w2.hourlyYield, 76.21, 0.01);

check('1099 gross revenue', w2.soleProp.grossRev, 231000);       // 44 × 35 × $150
check('1099 Schedule C profit', w2.soleProp.schCProfit, 225000);
check('1099 SE taxable base', w2.soleProp.seTaxableBase, 207787.5, 0.1);  // ×0.9235
check('1099 SE tax', w2.soleProp.seTax, 28973.93, 0.02);
check('1099 deductible half SE', w2.soleProp.deductibleHalfSe, 14486.96, 0.02);
check('1099 solo 401(k) shelter', w2.soleProp.retirementShelter, 61702.61, 0.02);
check('1099 hours', w2.soleProp.totalHours, 1760);

check('S-Corp gross revenue', w2.sCorp.grossRev, 231000);
check('S-Corp pre-salary profit', w2.sCorp.preSalaryProfit, 222000);
check('S-Corp reasonable salary', w2.sCorp.w2Salary, 99900);     // 45%
check('S-Corp employer 401(k)', w2.sCorp.employer401k, 24975);
check('S-Corp employee 401(k)', w2.sCorp.employee401k, 24500);
check('S-Corp retirement shelter', w2.sCorp.retirementShelter, 49475);
check('S-Corp employer FICA + FUTA', w2.sCorp.employerFica, 8062.35, 0.02);
check('S-Corp employee FICA', w2.sCorp.employeeFica, 7642.35, 0.02);
check('S-Corp total FICA', w2.sCorp.totalFica, 15704.7, 0.02);
check('S-Corp K-1 distribution', w2.sCorp.k1Distribution, 79462.65, 0.02);
check('S-Corp QBI deduction', w2.sCorp.qbiDed, 15892.53, 0.02);
check('S-Corp net', w2.sCorp.net, 157783.67, 0.02);
check('S-Corp hourly yield', w2.sCorp.hourlyYield, 89.65, 0.02);
check('W-2 vs S-Corp breakeven $/hr', w2.verdict.breakevenHourlyRate, 157, 7); // 150 < x < 165

// ── RSU hold vs sell spec vector ──────────────────────────────────────────────────────────
// $100k vests/yr at $150, 5-yr horizon, 10% company / 8.5% index, $400k liquid, $180k salary,
// 35% ordinary / 23.8% LTCG, mega backdoor on, $7.2k match + $24.5k elective.
const rsu = calculateRsuHoldVsSell({
  annualVestValue: 100000, currentStockPrice: 150, vestPrice: 150, holdingYears: 5,
  expectedCompanyReturnPct: 10, expectedIndexReturnPct: 8.5,
  householdLiquidNetWorth: 400000, baseSalary: 180000,
  effectiveIncomeTaxRatePct: 35, longTermCapitalGainsRatePct: 23.8,
  enableMegaBackdoor: true, employer401kMatch: 7200, employee401kElective: 24500,
});

check('RSU gross vest value', rsu.vestSummary.grossVestValue, 100000);
check('RSU ordinary tax at vest', rsu.vestSummary.ordinaryIncomeTaxOnVest, 35000);
check('RSU net cash at vest', rsu.vestSummary.netVestedCashAvailable, 65000);
check('Mega backdoor capacity', rsu.megaBackdoor.availableAfterTaxCapacity, 40300); // 72k − 24.5k − 7.2k
check('Mega backdoor 30-yr delta > 0', rsu.megaBackdoor.thirtyYearRothWealthDelta > 30000, true);
check('Hold concentration > 30%', rsu.strategyHoldConcentrated.concentrationRatioPct > 30, true);
check('Hold double-jeopardy flagged', ['Severe', 'Critical'].includes(
  rsu.strategyHoldConcentrated.doubleJeopardyRiskLevel), true);
check('Sell concentration', rsu.strategySellAndDiversify.concentrationRatioPct, 0);
check('Sell double-jeopardy low', rsu.strategySellAndDiversify.doubleJeopardyRiskLevel, 'Low');
check('RSU breakeven growth rate', rsu.verdict.breakevenCompanyGrowthRatePct, 9.5, 2.5); // 7 < x < 12

if (failures) {
  console.log(`\n${failures} calculator regression(s) — DO NOT ship.`);
  process.exit(1);
}
console.log('Career-capital calculators: all known answers match the 2026 spec vector.');
