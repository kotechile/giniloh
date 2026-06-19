# Product Requirements Document (PRD)

**Project Title:** GiniLoh Decision-Intelligence Widget (CIAM Build vs. Buy Engine)  
**Status:** Approved for Implementation Planning  
**Author:** Antigravity Pair Programmer  

---

## 1. Document Overview

### 1.1 Purpose
This document specifies the functional, technical, operational, and design requirements for the launch vertical of the **GiniLoh Decision-Intelligence Framework**. The launch module is a reactive, single-page interactive widget designed to help technical decision-makers (CTOs, VPs of Engineering, Tech Leads, and Founders) make mathematically sound, objective decisions when evaluating the trade-offs of building custom in-house user authentication versus integrating a managed Customer Identity & Access Management (CIAM) platform (such as Clerk, Auth0, or Supabase).

### 1.2 Product Vision
The GiniLoh Decision-Intelligence Framework transitions users from subjective, unstructured assessments to empirically validated, math-backed, and highly scannable logical verdicts. Rather than hosting static advisory articles, giniloh.com operates as an interactive decision engine modeled on advanced Go-To-Market (GTM) ontology architectures. 

The engine ingests complex data signals, maps semantic variables, and simulates financial trajectories to provide precise, real-time choices. The core philosophy is encapsulated in the platform's nominal promise: *"Gini loh"* ("Here's how it is").

### 1.3 Core Framework Architecture
The framework is structured as a three-layer database architecture inspired by cognitive graph frameworks:
1. **The Content Layer:** Serves as the immutable evidence repository, archiving developer salary data, SaaS licensing terms, compliance penalty benchmarks, and hardware specifications.
2. **The Entity Layer:** Resolves identity across disparate domains, mapping variables such as geographic location to software engineer loaded rates, or specific deep learning tasks to required computational capacities.
3. **The Fact Layer:** Asserts temporal, structural assertions about the market (for example, documenting SaaS pricing thresholds or specific runtime deprecation schedules).

This systemic architecture enables giniloh.com to run real-time simulations, allowing users to stress-test their operational strategies before committing capital.

### 1.4 Target Audience
* **Primary:** Chief Technology Officers (CTOs), VPs of Engineering, and Tech Leads.
* **Secondary:** Startup Founders, Operations Directors, and Solopreneurs.

---

## 2. User Epics & Core Workflows

### 2.1 Epic 1: Dynamic Input Configuration
* **User Story:** As a technical decision-maker, I want to adjust my application scale (MAUs), loaded developer rates, compliance targets, custom build times, and maintenance overheads using responsive controls, so that the mathematical modeling matches my company's unique operational profile.
* **Details:** Changes in inputs must immediately recalculate all outputs without page reloads or layout shifts.

### 2.2 Epic 2: The Fast-Track Verdict
* **User Story:** As a busy executive, I want to see an immediate, high-contrast visual recommendation (e.g., **BUY/UPGRADE**, **REPAIR/PATCH**, **SKIP/WAIT**) along with a concise strategic rationale, so that I can understand the logical path for our product in seconds.
* **Details:** The verdict is dynamically styled using status colors (Emerald for Buy, Indigo for Patch/Repair, Muted Slate for Skip/Wait) and updates in real-time.

### 2.3 Epic 3: Visualizing Hidden "Iceberg" Costs
* **User Story:** As an engineering manager, I want to compare visible upfront subscription fees against the hidden "iceberg" costs of in-house development (security patch labor, compliance audits, onboarding drag, developer opportunity cost), so that I can justify software budgets to finance stakeholders.
* **Details:** Split layout comparing the visible elements of both choices, with hover overlays expanding the hidden line-item cost details.

### 2.4 Epic 4: Behavioral Checklists & Bias Warnings
* **User Story:** As an operations director, I want to check specific organizational risk factors (e.g., key-person dependency, sunk cost bias, custom integrations) and receive automated risk alerts, so that my team does not lock itself into brittle or expensive custom systems.
* **Details:** Custom checkboxes trigger dynamic warning banners (Sunk Cost Fallacy, Knowledge Loss Liability, Tinkering Tax Warning) based on mathematical and organizational thresholds.

### 2.5 Epic 5: Future Verticals Roadmap
* **User Story:** As a product lead, I want the core widget layout and styles to be modular and reusable, so that we can easily roll out Option 2 (Professional Hardware Upgrade: Workstations vs. Cloud GPU) and Option 3 (Operations Tooling: Custom Agency ERP vs. Enterprise CRM) under the same design tokens.

---

## 3. The Three Core Evaluative Rules

The framework applies three mathematical and logical filters to convert unstructured challenges into structured verdicts:

### 3.1 The Cost-Per-Use (CPU) Reality Check
Normalizes all capital allocations into a granular, active utilization metric. It corrects upfront cost bias (CapEx) by dividing the Total Cost of Ownership ($TCO$) by the actual active volume (Monthly Active Users $MAU$ for software, or active compute hours $H_{\text{compute}}$ for hardware).
* **Formula:** $\text{CPU} = \frac{\text{TCO}}{\text{Usage Volume} \times \text{Time}}$
* **Rationale:** Custom builds have high early-stage CPUs due to fixed development labor. Managed solutions optimize CPU by aligning cost directly with utility.

### 3.2 The Adapted "5,000 Rule" for Digital Assets
Adapts the traditional HVAC repair-vs-replace rule for digital systems:
* **Formula:** $I_{\text{software}} = A_{\text{codebase}} \times C_{\text{remediation}}$
* **Variables:** $A_{\text{codebase}}$ is the age of the custom software code in years. $C_{\text{remediation}}$ is the fully loaded cost of engineering hours required to resolve immediate security patches, deprecations, or required integrations (e.g., MFA, Passkeys).
* **Threshold Rule:** If $I_{\text{software}} \ge \$5,000$, the engine recommends a total replacement (`BUY/UPGRADE` verdict) rather than continuing to patch legacy assets.

### 3.3 The "Frankenstein" Upgrade Test
Evaluates the systematic fragility and hidden "tinkering tax" associated with integrating multiple disparate systems to form an ad-hoc operational tool. It scores integrations across four variables:
* **Format Preservation:** Rate of data degradation/flattening when transferred.
* **Idempotency & Duplicate Control:** Rate of redundant logs or transactions.
* **Schema Sensitivity:** Probability of system failure when database schemas are renamed.
* **Vendor API Stability:** Frequency and labor cost of resolving broken endpoints.

---

## 4. Functional Requirements & Input/Output Mapping

### 4.1 Input Parameters (User Controls)

| Parameter | Type | Range / Options | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Active Users (MAUs)** | Slider | 1,000 to 500,000 | 25,000 | Scale of active identities in the database. |
| **Loaded Developer Rate ($R_{\text{dev}}$)** | Slider | $40 to $250 / hour | $85 / hour | Loaded hourly wage of senior engineers. |
| **Initial Custom Build Time ($M_{\text{build}}$)** | Stepper | 1 to 12 months | 3 months | Months required to build custom auth + admin console. |
| **Maintenance Overhead FTE ($F_{\text{maint}}$)** | Stepper | 10% to 100% FTE | 50% FTE | Percentage of a full-time engineer's time spent on patch/updates. |
| **Compliance Target Level ($L_{\text{comp}}$)** | Tabs | None, SOC 2 Type II, HIPAA BAA | SOC 2 Type II | Level of security audit readiness required. |

### 4.2 Output Indicators (Live Metrics Panel)

| Output Field | Format | Visual State Rule | Description |
| :--- | :--- | :--- | :--- |
| **Fast-Track Verdict** | Text Banner | Emerald for `BUY SaaS`, Indigo for `REPAIR/PATCH`, Slate for `SKIP/WAIT` | Dynamic recommendation with high-energy strategic subtitle. |
| **3-Year Custom TCO** | Currency | Text styled in Slate/Gray, turns Red if high maintenance drag is triggered. | Sum of build, maintenance, compliance, and opportunity costs. |
| **3-Year SaaS TCO** | Currency | Emerald/Green if significantly cheaper than custom, Gray if neutral. | Sum of integration labor and volume-tiered subscription overages. |
| **Break-Even Horizon** | Months | High-visibility numeric display. | Months until SaaS cost matches custom cost. Displays "Immediate ROI" or "Never". |
| **Cost-Per-Use (CPU)** | USD/MAU/Mo | Small inline tag. | Granular monthly active utilization cost. |

---

## 5. Mathematical Engine & Formulas

### 5.1 Custom In-House TCO ($\text{TCO}_{\text{custom}}$)
The 3-Year TCO for custom user authentication is modeled as:
$$\text{TCO}_{\text{custom}} = C_{\text{build}} + (3 \times C_{\text{compliance}}) + (36 \times C_{\text{maintenance}}) + C_{\text{opportunity}}$$

Where:
* **Initial Build Cost ($C_{\text{build}}$):** Modeled based on build time, developer rate, and a baseline team size of $1.5$ engineers:
  $$C_{\text{build}} = M_{\text{build}} \times 160 \times 1.5 \times R_{\text{dev}}$$
  *(For a default $M_{\text{build}} = 3$ and $R_{\text{dev}} = \$85$: $3 \times 160 \times 1.5 \times 85 = \$61,200$. We allow users to adjust this dynamically).*
* **Ongoing Monthly Maintenance ($C_{\text{maintenance}}$):** Derived from the FTE allocation:
  $$C_{\text{maintenance}} = F_{\text{maint}} \times 160 \times R_{\text{dev}}$$
  *(For a default $F_{\text{maint}} = 50\%$ and $R_{\text{dev}} = \$85$: $0.5 \times 160 \times 85 = \$6,800/\text{month}$, or $\$81,600/\text{year}$).*
* **Annual Compliance Cost ($C_{\text{compliance}}$):** Modeled as:
  $$C_{\text{compliance}} = \begin{cases} \$0 & \text{if } L_{\text{comp}} = \text{None} \\ \$75,000 & \text{if } L_{\text{comp}} = \text{SOC 2 Type II} \\ \$150,000 & \text{if } L_{\text{comp}} = \text{HIPAA BAA} \end{cases}$$
* **Developer Opportunity Cost ($C_{\text{opportunity}}$):** Represents the revenue lost by diverting engineering resources from core business features. Standardized as a fixed coefficient of 3-year value:
  $$C_{\text{opportunity}} = \$150,000$$

*For the standard target benchmark (SOC 2, $R_{\text{dev}} = \$85$, $M_{\text{build}} = 3$, $F_{\text{maint}} = 50\%$):*
$$\text{TCO}_{\text{custom}} = \$61,200 + (3 \times \$75,000) + (36 \times \$6,800) + \$150,000 = \$61,200 + \$225,000 + \$244,800 + \$150,000 = \$681,000$$

### 5.2 Managed SaaS TCO ($\text{TCO}_{\text{SaaS}}$)
The 3-Year TCO for a managed CIAM platform (Clerk/Auth0 average overage model) is modeled as:
$$\text{TCO}_{\text{SaaS}} = C_{\text{integrate}} + \sum_{m=1}^{36} M_{\text{SaaS\_subscription}}(MAU_m)$$

Where:
* **Integration Cost ($C_{\text{integrate}}$):** Represents 8 hours of senior engineering integration and configuration labor:
  $$C_{\text{integrate}} = 8 \times R_{\text{dev}}$$
  *(For $R_{\text{dev}} = \$85$: $8 \times 85 = \$680$).*
* **Monthly SaaS Subscription ($M_{\text{SaaS\_subscription}}$):** Follows a volume-tiered overage scale:
  $$M_{\text{SaaS\_subscription}}(MAU) = \begin{cases} 
  \$0 & \text{if } MAU \le 10,000 \\ 
  \$25 + (MAU - 10,000) \times \$0.02 & \text{if } 10,000 < MAU \le 50,000 \\
  \$825 + (MAU - 50,000) \times \$0.015 & \text{if } 50,000 < MAU \le 100,000 \\
  \$1,575 + (MAU - 100,000) \times \$0.01 & \text{if } MAU > 100,000
  \end{cases}$$
  *(For a default $MAU = 25,000$: Monthly cost = $\$25 + (15,000 \times 0.02) = \$325/\text{month}$. Year 1 base sub = $\$300$. Cumulative 3-year subscription = $\$325 \times 36 = \$11,700$. SaaS TCO = $\$680 + \$11,700 = \$12,380$.)*

### 5.3 The Adapted Software Index ($I_{\text{software}}$)
Calculated to evaluate legacy codebase health:
$$I_{\text{software}} = A_{\text{codebase}} \times (H_{\text{remediation}} \times R_{\text{dev}})$$
* **Threshold Rule:** If $I_{\text{software}} \ge 5,000$, display the replace/buy alert in the checklist.

---

## 6. UI/UX & Component Architecture

The interface is structured as a single-page interactive widget following Gini Loh's design language: a high-contrast slate background, borders with subtle highlights, and distinct accent colors.

### 6.1 Step-by-Step UI Layout

#### Step 1: The Fast-Track Verdict Banner
Positioned at the top of the interface, this card updates in real-time based on calculations:
* **State A: BUY SaaS (Emerald Highlight):** Triggered when $\text{TCO}_{\text{custom}} > \text{TCO}_{\text{SaaS}}$ or when $L_{\text{comp}}$ is `SOC 2` or `HIPAA`.
* **State B: REPAIR/PATCH (Indigo Highlight):** Triggered when $MAU < 5,000$, $L_{\text{comp}}$ is `None`, and $F_{\text{maint}} < 20\%$.
* **State C: SKIP/WAIT (Muted Slate Highlight):** Triggered when $MAU < 1,000$ and no compliance target is set.

#### Step 2: ROI Sliders & Parameters
Interactive controls in a grid layout:
* **Sliders:** MAUs and Developer Rate.
* **Steppers:** Build Time (months) and Maintenance FTE (%).
* **Toggle Tabs:** Compliance level (`None`, `SOC 2 Type II`, `HIPAA BAA`).

#### Step 3: Iceberg Cost Matrix
A split-screen panel showing CapEx vs OpEx:
* **Left Card (Visible SaaS Subscription Cost):** Displays base monthly SaaS fee and integration labor. Hovering displays data transfer and storage notes.
* **Right Card (Hidden Custom Cost):** Displays the visible initial build cost. Hovering reveals the "iceberg" lines: annual security patches, compliance audit preparation, knowledge turnover, and opportunity cost.

#### Step 4: Psychological Vibe Killers Checklist
A vertical stack of checkboxes representing operational risks:
1. **Sunk Cost Fallacy:** *"We have already invested over $100k in our custom auth codebase."*
   * *Trigger:* If checked and $I_{\text{software}} \ge 5,000$, show warning: *"Sunk Cost Fallacy: Prior investments do not justify ongoing developer drag."*
2. **Key-Person Risk:** *"Our auth system was built and is maintained by a single engineer."*
   * *Trigger:* If checked, show alert: *"Knowledge Loss Liability: Turnover will leave your core security pipeline unmaintained."*
3. **Tinkering Tax:** *"We use multiple no-code apps (Notion + Zapier) to sync customer sessions."*
   * *Trigger:* If checked, show warning: *"Fragile integrations introduce severe data latency and schema sensitivity."*

---

## 7. Technical Specifications & Constraints

### 7.1 Tech Stack
* **Skeleton & Page Routing:** Astro (static-rendered page container).
* **Styling:** Tailwind CSS.
* **Logic & Interactivity:** React Island (`client:load`) using React Hook states to guarantee instant reactivity.

### 7.2 State Management & Reactivity
* Use local React state for sliders, inputs, and checklist.
* Cache state in `localStorage` to preserve user configuration on page reloads.

### 7.3 Operational Safeguards
The mathematical engine must run calculation safeguards to prevent runtime errors:
```typescript
// Safe CPU calculation
export function calculateSafeCPU(tco3Year: number, mau: number, lifespanYears: number = 3): number {
	const safeMAU = Math.max(mau, 1);
	const safeMonths = Math.max(lifespanYears * 12, 1);
	return parseFloat((tco3Year / (safeMAU * safeMonths)).toFixed(4));
}

// Break-even horizon calculation
export function calculateTrueBreakEven(
	customBuild: number,
	customMaintAnnual: number,
	saasIntegrate: number,
	saasMaintAnnual: number
): { months: number; verdict: string } {
	const annualSavings = customMaintAnnual - saasMaintAnnual;
	const upfrontPremium = customBuild - saasIntegrate;

	if (annualSavings <= 0) {
		return { months: Infinity, verdict: 'Never: Custom maintenance is cheaper than SaaS volume overage.' };
	}

	const breakEvenMonths = (upfrontPremium / annualSavings) * 12;
	return {
		months: Math.max(0, parseFloat(breakEvenMonths.toFixed(1))),
		verdict: breakEvenMonths <= 0 ? 'Immediate ROI' : `${breakEvenMonths.toFixed(1)} Months`
	};
}
```

---

## 8. Verification Plan & Testing Profiles

The engine must be validated against these boundary profiles before release:
* **Profile A: The Early-Stage Project:** $MAU = 0$, $M_{\text{build}} = 1$, $R_{\text{dev}} = \$150/hr$. Clamps $MAU$ to 1, showing SaaS has immediate ROI and a 0-month break-even.
* **Profile B: The Large Legacy System:** $A_{\text{codebase}} = 5$ years, remediation cost = $60$ hours. Index computes as $5 \times 60 \times 85 = 25,500 \ge 5,000$. Triggers immediate high-priority `BUY/UPGRADE` recommendation.
* **Profile C: The High-Growth Application:** $MAU = 500,000$, developer rate = \$90. Applies volume discounts in subscription overages to prevent unrealistic numbers.

---

## 9. Implementation Milestones

* **Milestone 1:** Create `src/lib/calculators/decisionIntelligence.ts` containing the mathematical engine and type definitions.
* **Milestone 2:** Implement the React widget in `src/components/calculators/react/DecisionIntelligenceCalculator.tsx`.
* **Milestone 3:** Create the Astro page container at `src/pages/calculators/decision-intelligence.astro`.
* **Milestone 4:** Add metadata entry to `src/lib/calculators/metadata.ts` to expose the calculator on the index directory.
* **Milestone 5:** Build and run tests to verify zero division safety, responsive layout alignment, and browser navigation.
