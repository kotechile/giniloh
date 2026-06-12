# Giniloh Money Flow Simulator: Real-Life Practice Scenarios

This reference document outlines real-world scenarios you can run in the **Frictionless Money Flow Simulator** to stress-test personal savings strategies and enterprise treasury distributions.

The simulator is implemented in [MoneyFlowSimulator.tsx](file:///Users/jorgefernandezilufi/Documents/_giniloh_front_end/src/components/calculators/react/MoneyFlowSimulator.tsx), renders at [money-flow.astro](file:///Users/jorgefernandezilufi/Documents/_giniloh_front_end/src/pages/calculators/money-flow.astro), and runs on the rule engine defined in [moneyFlowEngine.ts](file:///Users/jorgefernandezilufi/Documents/_giniloh_front_end/src/lib/calculators/moneyFlowEngine.ts).

---

## 👤 Part 1: Personal Wealth Practice Scenarios

These scenarios demonstrate the dual-threshold mechanics (Ceilings and Floors), priority saves cascades, and built-in regulatory compliance guardrails of the Loh-Friction philosophy.

### Scenario 1: Aggressive Debt Paydown vs. Earning Interest

*   **Objective**: A user takes home $2,800 every two weeks ($200/day). They currently have $3,000 in checking but want to cap it at $2,000 to prevent lifestyle inflation. They carry $4,000 in high-interest credit card debt and want to watch the system automate debt payoff.
*   **Execution**:
    *   **Method A: AI Chat Console**
        Type the following command in the chat bar and hit **Send**:
        ```txt
        Set my income to 200 a day. Set my checking balance to 3000 and limit it to 2000. Set my debt to 4000.
        ```
    *   **Method B: Manual UI Configuration**
        1.  Click the **Primary Checking** node on the canvas. In the parameter drawer, set **Balance** to `$3,000` and **Ceiling** to `$2,000`.
        2.  Click the **High-Interest Debt** node. Set the **Balance** to `$4,000` and confirm the APY is `18.0%`.
        3.  Go to the **Savings Waterfall Order** panel at the bottom right and make sure **High-Interest Debt** is prioritized near the top.
*   **Execution Trigger**: Select **2x (Normal)** speed and click **Start clock** (or use **Step 1 day** to advance manually).
*   **Observations**:
    *   **Canvas Visualization**: A glowing cyan flow path connects the **Primary Checking** node to the **High-Interest Debt** node. Since checking is $1,000 over its ceiling, this surplus immediately sweeps down the path.
    *   **Audit Trail Log**: Look at the console on the bottom right. You will see:
        `Day 1: Overbalance sweep: Routed $1000.00 surplus to High-Interest Debt.`
    *   **Interest Accrual**: Every 30 simulated days, look for interest postings:
        `Day 30: Debt charged $X.XX interest.`
    *   **Debt Elimination**: Watch the debt node balance decrease daily until it hits exactly `$0`, resolving the liability automatically.

---

### Scenario 2: The Emergency Expense (Floor Protection)

*   **Objective**: A user has built up a healthy $15,000 emergency reserve in their High-Yield Savings Account (HYSA). They want to enforce a checking account safety floor of $1,500. When an unexpected expense drops their checking balance to $500, they want to verify that the floor restoration sweeps execute correctly.
*   **Execution**:
    *   **Method A: AI Chat Console**
        Type the following command in the chat bar and hit **Send**:
        ```txt
        Set my checking floor to 1500. Set checking balance to 500. Set my HYSA to 15000.
        ```
    *   **Method B: Manual UI Configuration**
        1.  Click the **Primary Checking** node on the canvas. Set **Floor** to `$1,500` and **Balance** to `$500`.
        2.  Click the **HYSA (Emergency Fund)** node. Set **Balance** to `$15,000`.
*   **Execution Trigger**: Click the **Step 1 day** button once.
*   **Observations**:
    *   **Canvas Visualization**: The canvas draws a reverse sweep path from the **HYSA (Emergency Fund)** node to the **Primary Checking** node.
    *   **Balance Restoration**: The Checking balance instantly jumps from `$500` back up to the `$1,500` floor. The HYSA balance falls by `$1,000` to `$14,000`.
    *   **Audit Trail Log**:
        `Day 1: Underbalance sweep: Restored checking floor by pulling $1000.00 from HYSA.`

---

### Scenario 3: The Income Surge and Waterfall Overflow

*   **Objective**: Following a major career promotion, a user sees their income surge to $500/day. Their emergency reserve is fully capitalized ($15,000) and they carry zero high-interest debt. They want to witness how the system automatically overflows surplus funds downstream.
*   **Execution**:
    *   **Method A: AI Chat Console**
        Type the following command in the chat bar and hit **Send**:
        ```txt
        Set my income to 500 a day. Set my HYSA balance to 15000 and its ceiling to 15000. Set my debt to 0.
        ```
    *   **Method B: Manual UI Configuration**
        1.  Adjust the **Income/day** box in the top control bar to `500`.
        2.  Click the **HYSA (Emergency Fund)** node. Set **Balance** to `$15,000` and **Ceiling** to `$15,000`.
        3.  Click the **High-Interest Debt** node. Set **Balance** to `$0`.
*   **Execution Trigger**: Set the simulation speed to **5x (Fast)** and click **Start clock**.
*   **Observations**:
    *   **Canvas Visualization**: Glowing flows light up, bypassing both HYSA and Debt. You will see cash routing into the pre-tax employer **401k Match** node, followed by the **Pre-tax HSA** and **Roth IRA** nodes.
    *   **Overflow Cascade**: When annual contribution limits on the tax-advantaged accounts (e.g., $7,000 for Roth IRA) are hit, the glowing paths shift dynamically, pouring all remaining overflow capital into the **Taxable Brokerage** node.
    *   **Audit Trail Log**:
        `Day X: Overbalance sweep: Routed $Y surplus to Pre-tax HSA.`
        `Day Y: Overbalance sweep: Routed $Z surplus to Roth IRA.`

---

### Scenario 4: Testing the System Guardrails (Prohibited Transfers)

*   **Objective**: A user attempts to draw funds out of their Roth IRA back to their Primary Checking account to cover day-to-day spending, simulating an early withdrawal.
*   **Execution**:
    *   **Method A: AI Chat Console / CLI Command**
        Type the exact routing shortcut in the chat input and click **Send**:
        ```txt
        Route 1000 from my IRA to checking
        ```
        *(This translates to the CLI syntax: `ira [1000] checking`)*
*   **Observations**:
    *   **Canvas Visualization**: No visual path is created between the IRA and Checking nodes.
    *   **Audit Trail Log & Console**: The command fails. An error message appears in the chat output and the audit log logs the block:
        `ERROR: Automated sweep from IRA to Primary Checking blocked to prevent early distribution penalties.`

> [!WARNING]
> Early distributions from Roth IRAs and workplace 401(k) accounts trigger heavy tax penalties and lose the benefit of compounding. The simulator strictly blocks outbound routing rules on retirement nodes to mirror these real-world regulatory boundaries.

---

## 🏢 Part 2: Enterprise Treasury Flow Practice Scenarios

These scenarios showcase advanced corporate treasury allocations, invoice factoring, Days Sales Outstanding (DSO) latency holds, and credit line floor protections.

### Scenario 1: Active Treasury Management to Eliminate Cash Drag

*   **Objective**: A corporate treasury officer wants to optimize yield on corporate liquidity by establishing a `$1,000,000` operating cash buffer. Any revenue exceeding this threshold must automatically sweep into a High-Yield Money Market Fund (MMF) to eliminate cash drag.
*   **Execution**:
    *   **Method A: AI Chat Console**
        1. Switch the mode to **🏢 Enterprise CFO Simulation Room** in the top bar.
        2. Type the following command in the chat bar and click **Send**:
           ```txt
           Set operating account ceiling to 1000000. Route surplus to money market fund.
           ```
    *   **Method B: Manual UI Configuration**
        1. Click the **Net Cash Flow** node on the canvas.
        2. Set the **Ceiling** threshold slider to `$1,000,000`.
*   **Execution Trigger**: Click **Start clock**.
*   **Observations**:
    *   **Cash Drag Elimination**: Any daily operating cash accumulated in **Net Cash Flow** exceeding the `$1,000,000` ceiling is automatically transferred to the **Money Market Fund (MMF)**.
    *   **Audit Trail Log**:
        `Day X: [TREASURY SWEEP] Idle corporate surplus of $Y swept to MMF (reducing cash drag).`
    *   **Monthly Yield Accrual**: Every 30 days, watch the MMF accrue yield:
        `Day 30: MMF Treasury accrued interest yield of $Z.`

---

### Scenario 2: Funding Special Purpose Vehicles (SPVs)

*   **Objective**: A corporation wants to direct a fixed program of `$50,000` from daily revenues straight into a Special Purpose Vehicle (SPV) account to support a new subsidiary.
*   **Execution**:
    *   **Method A: AI Chat Console / CLI Command**
        Type the exact routing shortcut in the chat input and click **Send**:
        ```txt
        Create a programmatic waterfall routing 50000 from corporate revenue to the SPV account.
        ```
        *(This translates to the CLI syntax: `revenues [50000] receivables` or local custom SPV routing edge mappings)*
*   **Observations**:
    *   **Canvas Visualization**: A glowing cyan flow path connects the **Revenues Plan** node directly to the **Account Receivables** or localized SPV node.
    *   ** program allocation**: Cash is channeled continuously to the targeted account, automating corporate structural distributions.

---

### Scenario 3: Multi-Currency Account Distribution

*   **Objective**: A global company processes revenues across regional accounts and sweeps surpluses to central European treasuries to cover localized payroll cycles.
*   **Execution**:
    *   **Method A: AI Chat Console**
        Type the command in the chat bar and click **Send**:
        ```txt
        Route surplus from the multi-currency holding account to the European distribution account.
        ```
*   **Observations**:
    *   **Flow Routing**: The system maps the multi-currency operating surpluses to clear regional cash requirements.
    *   **Audit Trail Log**: Weekly and monthly logs confirm currency clearings and transfers, maintaining balance sheet equilibrium.

---

### Scenario 4: Preventing Delayed Asset Allocation (The Biometric FIDO Upgrade)

*   **Objective**: A systems administrator compares traditional passwords/OTP login friction to modern biometric FIDO passwordless authentication, measuring transaction speedups and the elimination of idle asset drag.
*   **Execution**:
    *   **Method A: AI Chat Console**
        Type the comparison command in the chat bar and click **Send**:
        ```txt
        Compare traditional OTP login costs to modern FIDO passwordless standards.
        ```
*   **Observations**:
    *   **Comparative Analysis Log**: The simulator outputs comparative performance logs detailing transaction speedups, decreased administrative costs, and the mitigation of settlement delays that cause cash drag on idle accounts.

---

## 🛡️ Simulator Safety & Compliance Rules Summary

The engine enforces the following strict safeguards during all simulation runs:

1.  **Circular Dependency Protection**: Blocked with `Circular dependency detected` error if rules create a infinite loop.
2.  **Realistic Latency Holds**: Funds are held in a pending state before settling:
    *   **1-day hold** (`T+1`) for standard transfers.
    *   **6-day hold** for ACH checking-to-brokerage transfers.
    *   **15-day hold** for ACAT brokerage-to-checking asset liquidations.
3.  **Pattern Day Trader (PDT) Limits**: Accounts with total equity under `$25,000` are blocked from executing more than **2 daily sweeps to equity accounts**.
4.  **Anti-Money Laundering (AML) Lookback**: Within a **60-day window** of receiving a transfer, an account can only route funds *back* to the originating account.
5.  **Ardal Loh-Gronager Behavioral Override**: Under the **Market Contraction (Crash)** scenario, the simulator pauses on **Day 18** (when the market drops >10%). The UI locks until the user completes the 6-question emotional centering checklist.
