# Total Compensation Visualizer (TCV) — Real-Life Comparison Examples

This document provides five step-by-step career and financial scenarios designed to be dropped directly into editorial articles, strategy guides, or newsletters. Each scenario guides a reader through inputting specific offer details into the **Total Compensation Visualizer (TCV)**, highlighting what calculations occur under the hood and how to interpret the visual outputs.

---

## 1. Comparing Liquid Wealth vs. Illiquid "Paper" Wealth (Public vs. Private Offers)

**Target Article Topic**: *Deciding between Big Tech liquidity and High-Growth Startup equity.*

This example demonstrates how two offers with identical "gross paper total compensation" can result in vastly different spendable cash positions due to asset liquidity.

### Step-by-Step Inputs
1. **Global Inputs**:
   * **Tax Filing Status**: Single
   * **State of Residence**: CA
   * **Growth Assumption**: 10%
   * **Auto-Exercise Options**: Enabled
2. **Offer A (Established Public Corporation)**:
   * **Base Salary**: $190,000
   * **Target Bonus**: 15% ($28,500/year)
   * **Upfront Cash Incentive**: $25,000 (12-month clawback)
   * **LTIP/Stock Units**:
     * **Type**: Public Stock Unit (RSU)
     * **Total Grant Value**: $240,000 ($60,000 vesting/year before growth)
   * **Perks**:
     * **401(k) Match**: 50% up to 6%cap (Employer Match: $5,700/year)
     * **ESPP Contribution**: 10% ($19,000 base contribution)
     * **ESPP Discount**: 15%
     * **Health Premium**: $200/month
3. **Offer B (High-Growth Private Partnership)**:
   * **Base Salary**: $160,000
   * **Target Bonus**: 10% ($16,000/year)
   * **Upfront Cash Incentive**: $10,000 (12-month clawback)
   * **LTIP/Stock Units**:
     * **Type**: ISO Options
     * **Number of Options**: 60,000 units (15,000 vesting/year)
     * **Grant Price**: $1.50
     * **Current Value**: $6.00 (implied paper value of $90,000 vesting/year)
   * **Perks**:
     * **401(k) Match**: 50% up to 4% cap (Employer Match: $3,200/year)
     * **ESPP Contribution**: 0% (no ESPP)
     * **Health Premium**: $100/month

### What Happens Under the Hood
* **Offer A (Liquid)**: The $60,000 in vesting Public Stock Units is treated as taxable income and immediately converted to liquid cash. An ESPP yield boost of $3,353 is generated:
  $$\text{ESPP Yield} = \$19,000 \times \frac{0.15}{1 - 0.15} = \$3,352.94$$
  Over 4 years, Offer A generates over **$600,000** in spendable, post-tax liquidity.
* **Offer B (Illiquid)**: The $90,000 annual vesting options are categorized as **Paper Wealth**. If the user has "Auto-Exercise" enabled, they must pay $22,500 out-of-pocket each year to exercise these options. This creates a cash drag, reducing the spendable cash line, while building $360,000 in illiquid startup stock.

### TCV Visual Insights
* **The Stacked Bar Chart**: Offer A shows a tall positive green stack for "Liquid Stock Units" and a neon "Perks Value" block. Offer B's equity does not appear in the positive stack; instead, a negative red block for "Purchase Cost" pulls its yearly cash flow down.
* **Outcome Metrics Cards**:
  * Offer A: **4-Yr Spendable Cash** is very high. **Total Paper Wealth** is $0.
  * Offer B: **4-Yr Spendable Cash** is low, but **Total Paper Wealth** displays a substantial **$360,000** alongside an **Out-of-Pocket Drag** card showing **-$90,000** in purchase costs.

---

## 2. Evaluating Option Purchase Costs (Startup ISOs vs. Private Stock Units)

**Target Article Topic**: *Navigating option exercise drag vs. private stock units.*

This scenario shows how a private company offering stock units (which require no out-of-pocket exercise cash) compares to a startup offering traditional stock options.

### Step-by-Step Inputs
1. **Global Inputs**:
   * **Tax Filing Status**: Single
   * **State of Residence**: WA (0.0% state tax)
   * **Growth Assumption**: 0% (Flat)
   * **Auto-Exercise Options**: Enabled
2. **Offer A (Early-Stage Startup - Options)**:
   * **Base Salary**: $140,000
   * **LTIP/Stock Units**:
     * **Type**: ISO Options
     * **Number of Options**: 40,000 units (10,000 vesting/year)
     * **Grant Price**: $0.50
     * **Current Value**: $3.00 (implied paper value of $30,000 vesting/year)
   * **Perks**: All defaults set to zero.
3. **Offer B (Growth-Stage Firm - Private Stock Units)**:
   * **Base Salary**: $150,000
   * **LTIP/Stock Units**:
     * **Type**: Private Stock Unit
     * **Total Grant Value**: $100,000 ($25,000 vesting/year)
   * **Perks**: All defaults set to zero.

### What Happens Under the Hood
* **Offer A (Options Drag)**: Even though WA has no state tax, the professional must spend $5,000 cash out-of-pocket every year to exercise their 10,000 vesting options:
  $$\text{Purchase Cost} = 10,000 \text{ shares} \times \$0.50 = \$5,000/\text{year}$$
  This is deducted directly from their base cash flow.
* **Offer B (PSU)**: The Private Stock Units vest into paper wealth without requiring any purchase cash. The user's spendable cash flow is unaffected by equity purchases, and they enjoy a higher base salary.

### TCV Visual Insights
* **The Trend Line**: Toggle **Auto-Exercise Options** *ON*. Offer A's Net Spendable Cash Flow line drops by $5,000/year relative to its post-tax salary. Toggle it *OFF*, and the cash line rebounds, but the user is left with unexercised options that will expire if they leave.
* **The Outcome Cards**: Offer B wins on **4-Yr Spendable Cash** (due to higher base and no purchase cost) and carries $0 in **Out-of-Pocket Drag**, presenting a much safer cash-flow profile.

---

## 3. Uncovering the Value of "Hidden" Perks and Subsidies

**Target Article Topic**: *Negotiating beyond base salary: Monetizing perks and PTO.*

This scenario highlights how minor-looking benefit differences (401k match, ESPP, health premiums, and PTO policies) stack up to tens of thousands of dollars in real value.

### Step-by-Step Inputs
1. **Global Inputs**:
   * **Tax Filing Status**: Married
   * **State of Residence**: TX (0.0% state tax)
   * **Growth Assumption**: 0%
2. **Offer A (High Cash, Low Benefits)**:
   * **Base Salary**: $195,000
   * **Target Bonus**: 5% ($9,750/year)
   * **Perks**:
     * **401(k) Match**: 0%
     * **ESPP Contribution**: 0%
     * **Unused PTO Days**: 15 days
     * **Annual Working Days**: 260 (default)
     * **Health Premium**: $350/month ($4,200/year)
3. **Offer B (Slightly Lower Cash, Premium Benefits)**:
   * **Base Salary**: $180,000
   * **Target Bonus**: 10% ($18,000/year)
   * **Perks**:
     * **401(k) Match**: 50% match up to 6% cap (Employer Match: $5,400/year)
     * **ESPP Contribution**: 10% ($18,000 contribution)
     * **ESPP Discount**: 15%
     * **Unused PTO Days**: 25 days
     * **Annual Working Days**: 260
     * **Health Premium**: $50/month ($600/year)

### What Happens Under the Hood
* **PTO Monetization**:
  * Offer A: Daily wage is $\$195,000 / 260 = \$750$. 15 unused days = **$11,250** perks value.
  * Offer B: Daily wage is $\$180,000 / 260 = \$692.30$. 25 unused days = **$17,307** perks value.
* **ESPP Yield (Offer B)**:
  $$\text{ESPP Yield} = \$18,000 \times \frac{0.15}{1 - 0.15} = \$3,176.47/\text{year}$$
* **Net Perks Sum**:
  * Offer A: $11,250 (PTO value) - $4,200 (health cost drag) = **$7,050/year** net perks.
  * Offer B: $5,400 (401k) + $3,176 (ESPP) + $17,307 (PTO) - $600 (health cost drag) = **$25,283/year** net perks.

### TCV Visual Insights
* **The Stacked Bar Chart**: Offer B’s positive columns feature a thick purple **Perks Value** block representing the combined 401(k), ESPP yield, and PTO monetization.
* **Outcome Metrics Cards**: Despite having a lower base salary, Offer B's **4-Yr Spendable Cash** is highly competitive with Offer A due to the minimized out-of-pocket health drag and high value-adds in the perks layer.

---

## 4. Predicting Out-of-Pocket Tax Drags and RSU Shortfalls

**Target Article Topic**: *Tax planning for stock units: Avoiding the April tax bill shock.*

This scenario walks a high-earning employee through assessing the "underwithholding penalty" common when receiving public RSUs.

### Step-by-Step Inputs
1. **Global Inputs**:
   * **Tax Filing Status**: Single
   * **State of Residence**: MD
   * **Growth Assumption**: 0%
2. **Offer A (Equity-Heavy Compensation)**:
   * **Base Salary**: $180,000
   * **Target Bonus**: 10% ($18,000/year)
   * **LTIP/Stock Units**:
     * **Type**: Public Stock Unit (RSU)
     * **Total Grant Value**: $200,000 ($50,000 vesting/year)
   * **Perks**: All defaults set to zero.

### What Happens Under the Hood
* **Taxable Income Calculation**:
  $$\text{Taxable Income} = \text{Base} (\$180,000) + \text{Bonus} (\$18,000) + \text{Vested RSUs} (\$50,000) = \$248,000$$
* **Marginal Bracket Derivation**: A taxable income of $248,000 puts a single filer in the **35% marginal federal tax bracket**.
* **RSU Tax Underwithholding**: Brokerages typically sell-to-cover and withhold federal tax at a flat rate of **22%**.
* **Federal Shortfall**:
  $$\text{Shortfall} = \$50,000 \times (35\% - 22\%) = \$50,000 \times 13\% = \$6,500/\text{year}$$
  The engine calculates this $6,500/year shortfall and stores it in the Yearly Breakdown.

### TCV Visual Insights
* **Interactive Tooltip**: Hover over any year in the stacked bar chart for Offer A. Inside the hovered yearly details card, a warning box will highlight:
  * *“⚠️ RSU Underwithholding: Est. federal tax shortfall of $6,500.00 due to flat 22% sell-to-cover rate vs your estimated 35% marginal rate.”*
* **SVG Stacked Bar Segment**: Hover specifically over the green "Liquid Stock Units" bar segment. A tooltip will display the warning and shortfall calculation.

---

## 5. Assessing the Cost of Leaving a Job (Clawbacks and Exit Readiness)

**Target Article Topic**: *The financial trap of job hopping: Calculating your exit cost.*

This use case shows how to calculate the exact cost of leaving a firm early (due to clawback periods) and how much capital is required to walk away with vested stock options.

### Step-by-Step Inputs
1. **Global Inputs**:
   * **Tax Filing Status**: Single
   * **State of Residence**: TX
   * **Growth Assumption**: 10%
   * **Auto-Exercise Options**: Disabled (leaving options unexercised while active)
2. **Offer A (Upfront Incentive Heavy)**:
   * **Base Salary**: $170,000
   * **Upfront Cash Incentive**: $35,000
   * **Clawback Period**: 12 months
   * **LTIP/Stock Units**: None
   * **Perks**: All defaults set to zero.
3. **Offer B (Option Heavy)**:
   * **Base Salary**: $160,000
   * **LTIP/Stock Units**:
     * **Type**: NSO Options
     * **Number of Options**: 30,000 units (7,500 vesting/year)
     * **Grant Price**: $3.00
     * **Current Value**: $9.00
   * **Perks**: All defaults set to zero.

### What Happens Under the Hood
* **Offer A (Clawback Risk)**: The $35,000 upfront incentive cash flow spikes Year 1 cash. However, because the clawback window is 12 months, resigning before Month 12 triggers a full repayment requirement of $35,000.
* **Offer B (Exit Readiness Number)**: Over 4 years, the options vest. If the user decides to leave the company, they have a short post-termination exercise window (typically 90 days) to purchase their vested shares.
  $$\text{Exit Readiness Number (ERN)} = 30,000 \text{ shares} \times \$3.00 \text{ Grant Price} = \$90,000$$
  The engine totals this purchase obligation so the user knows they need $90,000 liquid capital to walk away with their shares.

### TCV Visual Insights
* **Year 1 Clawback Banner**: Hover over Year 1 in the chart. A prominent red warning text will display:
  * *“⚠️ Clawback risk: $35,000.00 clawed back if departing before Month 12.”*
* **Outcome Cards**: Look at the **Exit Readiness No.** metrics card for Offer B. It displays **$90,000** with the label *“⚠️ Excludes AMT”*, reminding the user that alternative minimum tax liabilities may apply on top of the $90,000 purchase price.
