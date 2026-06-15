# Total Compensation Visualizer (TCV) — Executive Guide

Evaluating modern compensation offers goes far beyond comparing base salaries. Executive compensation is a complex puzzle of base cash, target performance bonuses, long-term incentive plans (LTIP), equity vesting schedules, tax drag, and corporate perks.

The **Total Compensation Visualizer (TCV)** is a premium dashboard designed to model, simulate, and compare the true 4-year cash flow footprint of two competing offers.

---

## 1. Universal Terminology System

To make this tool highly marketable and relatable to directors, partners, officers, and executives in and out of the tech sector, TCV uses universal corporate terminology:

| Tech-Specific Jargon | Universal Executive Term | Scope & Definition |
| :--- | :--- | :--- |
| **RSUs / Equity** | **Long-Term Incentives (LTIP) / Stock Units** | Represents any deferred compensation, including time-based restricted stock, performance stock (PSUs), and phantom equity. |
| **Strike Price** | **Grant Price** | The pre-determined purchase price per stock unit or option share at the time of the grant. |
| **FMV (Fair Market Value)** | **Current Value** | The current market valuation per share or unit (publicly traded price or private valuation). |
| **Sign-on Bonus** | **Upfront Cash Incentives** | Transition assistance, signing bonuses, and relocation allowances paid in Year 1. |
| **Exercise Cost** | **Purchase Cost** | The out-of-pocket capital required to buy option shares or convert illiquid units at the grant price. |

---

## 2. Core Calculation Mechanics

The mathematical engine projects cash flow over a standard **4-year horizon**, computing outcomes across five layers:

### A. Cash Income Layer
For each year $t \in \{1, 2, 3, 4\}$, Cash Income consists of:
* **Base Salary**: Gross annual cash salary.
* **Target Bonus**: Calculated as a percentage of Base Salary.
* **Upfront Cash Incentives**: Added strictly in Year 1.

$$\text{Cash Income}_t = \text{Base Salary} + \left(\text{Base Salary} \times \frac{\text{Target Bonus \%}}{100}\right) + \begin{cases} \text{Upfront Cash Incentive}, & t = 1 \\ 0, & t > 1 \end{cases}$$

> [!WARNING]
> **Clawback Risk**: If an offer includes an Upfront Cash Incentive with a clawback window (e.g., 12 months), leaving the firm early triggers an obligation to repay this amount. The tool flags this Year 1 risk with visual alerts.

---

### B. Long-Term Incentives (LTIP) Layer
LTIP vests linearly over the vesting horizon (defaulting to 4 years), with an optional 1-year cliff (25% vesting at the end of Year 1, and the remaining 75% divided equally across Years 2–4). 

#### 1. Growth Engine
If an annual stock growth assumption ($g$) is selected (0%, 10%, or 20%), the value compounds annually:

$$\text{Growth Multiplier}_t = (1 + g)^{t-1}$$

#### 2. Liquidity Classification
The engine segregates Stock Units into two distinct classes:
* **Liquid (Public Stock Units)**: Treated as immediate cash flow. Once vested, their value is taxed and added directly to **Net Spendable Cash Flow**.
* **Illiquid (Private Stock Units / Options)**: Tracked as **Paper Wealth**. They represent asset value but do not contribute to your spendable bank balance.

#### 3. Options Purchase Drag
For Options (ISOs/NSOs), vesting shares do not automatically convert to cash. Exercising them requires purchasing them at the **Grant Price**:

$$\text{Purchase Cost}_t = \text{Vesting Shares}_t \times \text{Grant Price}$$

---

### C. Perks Layer
TCV models three primary wealth-boosting perks:
1. **401(k) Matching**: Calculated using the match rate and match cap:
   $$\text{401(k) Match} = \text{Base Salary} \times \frac{\text{Match \%}}{100} \times \frac{\text{Cap \%}}{100}$$
2. **ESPP Yield Boost**: For firms offering Employee Stock Purchase Plans with quick-sale programs, the discount creates a cash flow yield:
   $$\text{ESPP Yield} = \left(\text{Base Salary} \times \text{Contribution \%}\right) \times \frac{\text{Discount \%}}{1 - \text{Discount \%}}$$
3. **PTO Valuation**: Monetization of accrued unused paid leave:
   $$\text{Daily Wage} = \frac{\text{Base Salary}}{\text{Annual Working Days}}$$
   $$\text{PTO Value} = \text{Daily Wage} \times \text{Unused PTO Days}$$

$$\text{Perks Value}_t = \text{401(k) Match} + \text{ESPP Yield} + \text{PTO Value}$$

---

### D. Tax Drag Layer
Taxes are subtracted from taxable income (Base Salary + Bonus + Liquid Stock Units):
* **Automatic progressive estimator**: Applies standard 2025/2026 Federal tax brackets (Single or Married filing jointly) plus a representative flat state income tax rate (CA: 9.3%, NY: 6.5%, MD: 4.75%, TX/WA: 0.0%, other: 5.0%).
* **Manual override**: Bypasses progressive estimators and applies a flat effective rate (e.g., 30%) directly to taxable income.
* **RSU Tax Underwithholding Estimations**: Supplemental wages (RSUs) are typically withheld at a flat 22% rate. If the user's marginal federal tax rate ($MTR_{fed}$) is higher, a tax season shortfall is generated:
  $$\text{Tax Shortfall} = \text{Liquid Vested RSUs} \times (MTR_{fed} - 0.22)$$
  The tool calculates this shortfall and displays a warning tooltip in the interface to highlight the out-of-pocket tax liability.

---

### E. Net Spendable Cash Flow
The bottom-line line chart overlays Net Spendable Cash Flow:

$$\text{Net Spendable Cash}_t = \text{Base Cash}_t + \text{Bonus Cash}_t + \text{Liquid Stock Units}_t + \text{ESPP Yield}_t - \text{Tax Drag}_t - \text{Subtracted Purchase Cost}_t - \text{Health Premiums}_t$$

*If the **Auto-Exercise Options** parameter is disabled, the `Purchase Cost` is deferred as an unrealized paper liability and is NOT subtracted from cash flow.*

---

## 3. Step-by-Step Guide: How to Compare Offers

1. **Establish Global Parameters**: Set your tax state, filing status, and global growth expectations (e.g., 10% annual growth).
2. **Model Offer A (typically the liquid, public corporation offer)**:
   * Input base salary, performance bonus percentage, and any upfront cash sign-on.
   * Under the **LTIP** tab, choose **Public Stock Unit**. Input the total grant value.
   * Under **Perks**, add the 401(k) match details and ESPP contribution rate.
3. **Model Offer B (typically the private, partnership, or growth stage offer)**:
   * Input base salary, bonus, and upfront cash.
   * Under **LTIP**, choose **ISO Options** or **Private Stock Unit**. Input the share count, the **Grant Price**, and the **Current Value**.
4. **Compare Visual Charts**:
   * Observe the positive stacked columns (income) vs. negative columns (tax drag, health premiums, out-of-pocket purchase costs).
   * Evaluate the **Net Spendable Cash Flow** trend lines.
5. **Review Outcome Metrics**:
   * **4-Yr Spendable Cash**: Your total post-tax liquid money.
   * **Total Paper Wealth**: Illiquid value locked in stock options or private units.
   * **Out-of-Pocket Drag**: Total cash required to exercise options and pay premiums.
   * **Exit Readiness Number (ERN)**: Cumulative cost to purchase all vested options if you leave: $ERN = \sum (\text{Vested Shares} \times \text{Grant Price})$. Note: AMT tax calculations are excluded from this metric.

---

## 4. Practical Comparison Scenarios

### Scenario 1: Established Corporation vs. Private Partnership

#### Offer A (Publicly Listed Corp)
* **Base Salary**: $190,000
* **Target Bonus**: 15%
* **Upfront Cash Incentive**: $25,000
* **LTIP**: Public Stock Units ($240,000 total value, 4-year vesting, 1-year cliff)
* **Perks**: 50% 401(k) match up to 6%, ESPP 10% contribution at 15% discount
* **Health Premium**: $200/month

#### Offer B (Private Partnership Track)
* **Base Salary**: $160,000
* **Target Bonus**: 10%
* **Upfront Cash Incentive**: $10,000
* **LTIP**: NSO Options (60,000 units, $1.50 grant price, $6.00 current value, 4-year vesting)
* **Perks**: 50% 401(k) match up to 4%, no ESPP
* **Health Premium**: $100/month

#### Analysis (The Trade-Offs)
* **Spendable Cash**: Offer A will have a massive lead in net spendable cash flow. Because its stock units are public, they vest directly into liquid cash. Combined with the ESPP yield, Offer A delivers over **$600,000** in liquid cash over 4 years.
* **Paper Asset Wealth**: Offer B generates **$360,000** in paper value (60,000 units $\times$ $6.00 current value), but it remains illiquid.
* **Capital Out-of-Pocket Drag**: To capture that paper wealth, the professional must pay **$90,000** (60,000 units $\times$ $1.50 grant price) out-of-pocket to purchase the shares. TCV shows that if "Auto-Exercise" is enabled, this purchase cost will drag Offer B's cash flow line significantly downward.

---

### Scenario 2: Startup Employee (ISO Options) vs. Growth Partnership (Private Stock Units)

#### Offer A (Early Stage Startup)
* **Base Salary**: $140,000
* **LTIP**: ISO Options (40,000 shares, $0.50 grant price, $3.00 current value)
* **Auto-Exercise**: Enabled (exercising options as they vest)

#### Offer B (Established Private Firm)
* **Base Salary**: $150,000
* **LTIP**: Private Stock Units ($100,000 grant value, no purchase cost required)

#### Analysis (The Trade-Offs)
* **Exercise Cost**: Offer A requires **$20,000** out-of-pocket cash to buy the vested options (40,000 $\times$ $0.50). 
* **Acquisition Type**: Offer B's Private Stock Units are granted without any purchase cost. Thus, Offer B provides both a higher base salary and zero out-of-pocket drag, making it the safer cash flow decision while still building $100,000 in private equity assets.
