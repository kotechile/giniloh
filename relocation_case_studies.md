# Relocation Modeler Case Studies & Article Content

This document outlines two high-fidelity scenarios designed to walk readers through the multi-jurisdictional tax implications, lease break calculations, and corporate tax gross-up models of a geographic relocation under OBBBA rules.

---

## Case Study 1: The High-Friction Inter-State Leap (Tax Drag & Lease Penalty)

* **Scenario**: A Software Engineer relocates from a progressive state with county local taxes (Maryland) to a high-cost coastal tech hub with strict compliance rules (California) for a salary bump.

### 1. Baseline Profiles
* **Filing Status**: Single
* **Origin State**: Maryland (MD) — *Taxable at state level; includes standard county local tax rates.*
* **Origin Base Salary**: $95,000
* **Origin Local Tax Rate**: 3.20%
* **Destination State**: California (CA) — *Excludes qualified moving expenses from state tax calculations; enforces AB 692.*
* **Destination Proposed Salary**: $120,000
* **Destination Local Tax Rate**: 0.00%

### 2. Relocation & Lease Break Friction
* **Lease Break Penalty**: $3,500 flat contract penalty + $1,500 lost security deposit.
* **Employer Lease Allowance**: $2,000 mitigation offset.
* **Qualified Transit Expenses**: $1,800 packing/loading + $1,200 truck rental + $800 flights (all employer-reimbursed).
* **Tax Status**: Physical transit reimbursements ($3,800) are fully taxable federally under OBBBA rules, creating a state-level tax liability difference (tax drag) since California excludes qualified expenses.

### 3. Step-by-Step Execution
1. **Filing Status & Origin Inputs**: Select `Single`. Set Origin State to `Maryland`. Set Origin Local Rate to `3.2%`. Enter Origin Base Salary as `95000`.
2. **Destination Inputs**: Set Destination State to `California`. Input Destination Base Salary as `120000`. Note that the state exceptions indicator lights up green because California excludes qualified moving costs from state taxable income.
3. **Lease Break Setup**: Navigate to the **Lease Break** tab. Enter rent details: Monthly Rent `2200`, Days Occupied `12`. Enter Penalties `3500`, Lost Deposit `1500`, and Employer Allowance `2000`. 
   * *Formula*: $\text{Net Lease Friction} = (\text{Rent} \times 12/30) + \$3,500 + \$1,500 - \$2,000 = \$3,880$.
4. **Dashboard Analysis**: Go to the **Overview & Payback** tab.
   * **Net Upfront Cost**: $3,880 (Net Lease Break) + $2,185 (Tax liability drag on non-grossed-up benefits) = **$6,065**.
   * **Monthly Net Gain**: Pre-move monthly net take-home is $6,009. Post-move monthly net is $7,212. This yields a net monthly take-home gain of **$1,203**.
   * **Payback / Break-Even**: $\text{Upfront Costs} \div \text{Monthly Gain} = \$6,065 \div \$1,203 = \mathbf{5.0\text{ Months}}$.

---

## Case Study 2: The Tax Haven Optimization (Zero-Tax Transition with Gross-Up)

* **Scenario**: A Product Manager transitions from a high-tax jurisdiction (New York City) to a state with no wage tax (Texas) to maximize cash flow velocity.

### 1. Baseline Profiles
* **Filing Status**: Married (Filing Jointly)
* **Origin State**: New York (NY)
* **Origin Base Salary**: $140,000
* **Origin Local Tax Rate**: 3.876% (NYC Resident Local Tax)
* **Destination State**: Texas (TX) — *No state individual income tax; no local wage tax.*
* **Destination Proposed Salary**: $160,000
* **Destination Local Tax Rate**: 0.00%

### 2. Corporate Assistance & Gross-Up Optimization
* **Reimbursed Transit Costs**: $4,500 total logistics costs.
* **Gross-Up Status**: Reimbursed expenses are flagged as `Grossed-Up` in the system, requiring the employer to pay the supplemental tax-on-tax.

### 3. Step-by-Step Execution
1. **Demographics**: Set Filing Status to `Married (Filing Jointly)`.
2. **Locations**: Select Origin State `New York` (local rate defaults to NYC's `3.876%`). Select Destination State `Texas` (local rate drops to `0.0%`).
3. **Expense Ledger**: Open the **Expense Ledger** tab. Under custom rows, flag the $4,500 transit costs as both `Reimbursed` and `Grossed-Up`.
4. **Gross-Up Tab**: Review the **Gross-Up** options to compare corporate methodologies:
   * **Flat Method**: Multiplies benefits by combined tax rates. Total Employer Cost: $5,490.
   * **Supplemental Inverse (Tax-on-Tax)**: $\text{Benefit} \div (1 - \text{Combined Rate}) = \$4,500 \div (1 - 0.2345) = \$5,878$.
   * **Marginal True-Up (Recommended)**: Runs iterative, full-scenario multi-page simulated tax returns to verify exact tax liabilities. Total true assistance needed is **$1,560**, making the final employer cost **$6,060**.
5. **Dashboard Analysis**: Go to the **Overview & Payback** tab.
   * **Net Upfront Cost**: **$0** (since the employer fully grossed up the tax burden and offset lease break fees).
   * **Monthly Net Gain**: Pre-move monthly take-home is $8,120. Post-move monthly take-home is $10,890. Net monthly salary bump is **$2,770**.
   * **Payback / Break-Even**: Since net upfront costs are $0, payback is **Immediate (0.0 Months)**.
