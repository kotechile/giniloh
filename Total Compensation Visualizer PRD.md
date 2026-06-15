Product Requirement Document (PRD)
Project: Net-Value Total Compensation Visualizer
1. Document Control
Author: Jorge Fernandez-Ilufi
Status: Ready for Development
Target Stack: Frontend-heavy SPA (React, Vue, or Noodl/Low-Code environments)
2. Product Overview & Core Value Proposition
Most TC calculators display generic, gross numbers that look great on paper but fail to represent reality. This tool calculates Estimated Net Spendable Cash Flow by applying localization taxes, separating liquid cash from illiquid paper, modeling option purchase costs, and factoring in hidden wealth engines like 401(k) matches and ESPPs.
3. Core Features & Scope
3.1 Side-by-Side Offer Profile Input
The system must support comparing two independent offers (Offer A vs. Offer B) using a modular, tabbed, or multi-column data architecture.
+-----------------------------------------------------------------------+
| GLOBAL CONTROLS: Tax State [ MD ] | Growth Assumption [ 10% Annual ]   |
+-----------------------------------+-----------------------------------+
|             OFFER A               |              OFFER B              |
| Base: [ 180,000 ]                 | Base: [ 160,000 ]                 |
| Bonus: [ 15% ]                    | Bonus: [ 10% ]                    |
| LTIP Type: (o) Stock Unit ( ) ISO | LTIP Type: ( ) Stock Unit (o) ISO |
| Total Value: [ 200,000 ]          | Grant Shares: [ 50,000 ]          |
| ...                               | Grant Price: [ $2.00 ]  Value: [$5]|
+-----------------------------------+-----------------------------------+
3.2 Feature Modules
Module 1: The Cash Layer
Inputs: Base Salary, Target Bonus (%), Upfront Cash Incentive, Upfront Cash Clawback Period (Months).
Logic: Upfront cash incentives must be treated as Year 1 cash spikes but flagged in cash flow tooltips as "At-Risk/Clawback" if the user departs before the specified month threshold.
Module 2: The LTIP & Stock Units Architecture Engine
Inputs: Long-Term Incentive (LTIP) Type Selector (Public_Stock_Unit, Private_Stock_Unit, ISO, NSO).
For Stock Units: Total Value ($), Vesting Schedule (Default: 4-year, 1-year cliff, quarterly thereafter).
For Options (ISO/NSO): Number of Options, Grant Price ($), Current Value ($).
Logic:
Public Stock Unit (LTIP): Immediate liquidity. Added directly to net cash flow projections post-tax.
Private/Illiquid (Options/Private Stock Units): Marked as Illiquid Paper Asset Value. It does not add to the "Spendable Cash Flow" timeline. Instead, the engine must calculate the Out-of-Pocket Cost to Purchase (Shares Vesting × Grant Price) and subtract it from cash flow if an "Auto-Exercise" toggle is enabled.
Module 3: Localization & Tax Estimator
Inputs: State of Residence (Dropdown, e.g., MD, CA, NY, TX), Tax Filing Status (Single, Married).
Logic: Run a baseline heuristic tax calculation.
Simplification for V1: Apply standard federal brackets + selected state income tax rate to Cash (Base + Bonus) and Liquid Vested Stock Units.
RSU Tax Underwithholding Estimations: Supplemental wages (like RSUs) are withheld at a flat 22% rate. Calculate the ordinary income on vesting public stock units (OI_rsu = Shares_vest × Current Value) and estimate the tax shortfall: TS_fed = OI_rsu × (MTR_fed - 0.22), where MTR_fed is the user's marginal federal tax rate based on total taxable income. Flag any TS_fed > 0 as a shortfall warning tooltip on the Liquid Stock Units stack.
Module 4: Perks & Wealth Subsidies
Inputs: 401(k) Match % (e.g., 50% match up to 6%), Health Insurance Premium Employee Cost (Monthly), ESPP Contribution % (Max 15%) & Discount (Default 15%), Unused PTO Days, Annual Working Days (default 260).
Logic: ESPP creates an immediate cash flow yield boost calculated as:
ESPP Yield = (Base × Contribution %) × (Discount % / (1 - Discount %))
PTO Valuation: Monetize accrued unused leave: PTO Value = (Base Salary / Annual Working Days) × Unused PTO Days. Add this to the Perks Value positive stack.
4. Technical Architecture & Data Models
To ensure clean code development, the data state should explicitly separate inputs from compiled analytical outputs.
4.1 Input Schema (TypeScript Interface Example)
TypeScript
interface OfferInput {
  id: string;
  name: string;
  cash: {
    baseSalary: number;
    targetBonusPercent: number;
    upfrontCashIncentive: number;
    clawbackMonths: number;
  };
  equity: {
    type: 'PUBLIC_STOCK_UNIT' | 'PRIVATE_STOCK_UNIT' | 'ISO' | 'NSO';
    totalGrantValue?: number; // For Stock Units
    shareCount?: number;      // For Options
    grantPrice?: number;      // For Options (Grant/Strike Price)
    currentValue?: number;    // For Options (Current Value/FMV)
    vestingYears: number;     // Default 4
    hasOneYearCliff: boolean; // Default true
  };
  perks: {
    kMatchPercent: number;
    kMatchCapPercent: number;
    monthlyHealthPremium: number;
    esppContributionPercent: number;
    unusedPtoDays: number;
    annualWorkingDays: number;
  };
}
4.2 Core Calculation Engine Rules
The engine must process an array of 4 distinct timeline blocks: Year 1, Year 2, Year 3, and Year 4.
Vesting Calculations (4-Year Horizon):
Year 1: If hasOneYearCliff is true, exactly 25% of the total grant vests at the end of Month 12.
Years 2-4: Remaining 75% distributed evenly across the next 36 months (calculated as 25% annualized chunks).
Growth Assumptions Engine:
Apply compounding annual growth factor (g∈{0,0.1,0.2}) to LTIP values.
Value at Year t = Unadjusted Vesting Value × (1 + g)^(t-1)
5. UI/UX & Visualization Requirements
The UI must emphasize scannability and high clarity at a glance. Avoid wall-of-text tables.
Primary Visualization: A side-by-side Stacked Bar Chart tracking Year 1 through Year 4.
Stacks: Base Cash, Bonus Cash, Liquid Stock Units (LTIP), Perks Value.
Negative Stack (Line Overlay or Negative Bar): Tax Drag and Option Purchase Costs.
Metric Callout Cards: Highlighting the big-picture outcomes:
Total 4-Year Liquidity Value: Real money you can spend.
Total Paper Value: Unrealized LTIP / Stock Unit wealth.
Out-of-Pocket Drag: Total cost to purchase options + health premiums.
Exit Readiness Number: Cumulative option purchase costs: ERN = ∑(Shares_vested × Grant Price). Must include warning tooltip that Alternative Minimum Tax (AMT) liabilities are excluded.
6. Out of Scope for V1 (Future Iterations)
Alternative Minimum Tax (AMT) complex calculations (provide a generic warning tooltip instead).
Refresher grant modeling logic.
401(k) vesting schedules (assume 100% immediate vesting for initial launch).
7. Success Criteria & Verification
Verification Scenario: Entering a public company offer (high liquidity, high tax) vs. a private startup offer (low liquidity, high option value, high out-of-pocket purchase costs) should clearly demonstrate a massive delta in the Spendable Cash Flow Line Chart, even if their gross paper Total Compensation numbers match exactly.