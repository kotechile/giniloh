
The Career Velocity Calculator solves the complex problem of determining whether it is more financially advantageous for a professional to stay at their current company or strategically switch to a new employer.
Specifically, it addresses the following key challenges:
Combating the "Loyalty Tax": Organizations typically cap internal salary raises but pay dynamic, higher market rates for external hires. This creates an environment that penalizes long-term tenure, where staying with one employer can result in earning up to 50% less in lifetime wages compared to a peer who switches strategically.
Calculating Hidden "Transition Friction" (Job-Hopping Taxes): While switching jobs often yields a higher base salary, it introduces costly short-term financial penalties. The calculator accounts for these losses, which include forfeiting unvested 401(k) employer matches, paying expensive out-of-pocket premiums for health insurance gaps (COBRA), and navigating signing bonus clawbacks or tax withholding mismatches.
Evaluating Complex Trade-offs: The core problem users face is not knowing if an immediate salary increase is actually worth the forfeited matching assets and short-term cash-flow deficits. The calculator models these exact trade-offs over a 10-year compounding horizon.
Normalizing Total Compensation: To ensure accurate comparisons, the calculator factors in the local cost of living and calculates the "effective hourly rate" by analyzing paid time off (PTO) and expected weekly working hours.
By quantifying the long-term wealth divergence between these two paths, the calculator challenges the generic advice of "always switch" or "always stay". Ultimately, it provides professionals with the mathematical clarity needed to optimally time job transitions and negotiate signing structures that offset any forfeited assets.

Architectural Design of a High-Fidelity Career Velocity Calculator: Compounding Trajectories, Frictional Costs, and Portfolio IntegrationThe structural architecture of modern labor compensation is characterized by a fundamental asymmetry: corporate budgets allocated for employee acquisition are significantly larger than those allocated for employee retention. While organizations typically cap internal annual salary adjustments to narrow merit pools, external hires are priced dynamically based on real-time market scarcity and demand. This systemic design frequently penalizes long-term tenure, giving rise to an economic phenomenon known as the "loyalty tax".Comprehensive wage trackers demonstrate that strategic job-switching yields an annualized wage growth rate of 5.5%, whereas maintaining tenure with a single employer results in a lower rate of 4.1%, creating an immediate 1.4% annual growth differential. Over an extended career, this variance compounds exponentially; staying with a single employer for more than two years can result in an individual earning up to 50% less in lifetime wages than a peer who transitions strategically.To model these dynamics with high mathematical fidelity, a calculation engine must look beyond raw base-salary figures. It must integrate total compensation components—such as equity vesting schedules, performance bonuses, and employer fringe benefits—while subtracting the localized cost of living and the transitional "frictional taxes" associated with changing employers. This report details the economic principles, mathematical formulations, and system architecture required to construct a practical, professional-grade Career Velocity Calculator.Macro-Economic Dynamics of Compensation and Career StageThe financial viability of strategic job-hopping depends on several variables, including current macroeconomic cycles, specific industry sectors, and the candidate's compensation bracket.Pay Band Sensitivity and Diminishing ReturnsThe percentage increase achievable through external transitions decreases as an individual moves up through different salary bands.Sub-$50,000 Band: In this bracket, compensation is highly elastic. External transitions regularly yield wage increases exceeding 50%.$50,000 to $100,000 Band: Professionals in this mid-tier bracket can reliably secure 20% to 40% salary increases upon changing employers.$100,000+ Band: Once a professional crosses the six-figure threshold, securing increases greater than 20% through external moves becomes more difficult, unless they possess highly specialized skills in high demand. High demands can push compensation requests past the top end of standard organizational salary bands.Sector-Specific Mobility PremiumsMacroeconomic factors influence whether switching or staying is more lucrative in a given industry. During periods of economic expansion, the switcher premium spikes. During periods of economic consolidation or labor surpluses, the premium shrinks. This compression is visible in high-frequency payroll data collected during market corrections.Industry ClassificationJob Switcher Growth (YoY)Job Stayer Growth (YoY)Net Switcher Premium / (Discount)Construction & Natural Resources6.6%4.1%+2.5%Financial Activities5.2%4.4%+0.8%Education & Healthcare4.3%4.1%+0.2%Information Technology (IT)3.8%4.4%(0.6%)Leisure & Hospitality4.6%7.1%(2.5%)These trends show that when certain sectors (such as IT) consolidate, organizations prioritize retaining core talent. This can result in a negative switcher premium, where external hires are offered below-market rates relative to established, internal employees.Tenure and Skill Acquisition DynamicsLong-term career datasets in corporate finance illustrate a strong correlation between strategic mobility, skill development, and executive progression.Career Metric Profile1 to 2 Companies Worked3 to 5 Companies Worked6+ Companies WorkedAverage Annual Compensation$79,615$112,939$206,241Internal Mobility Frequency24.0% (IC Rate)50.0% (Manager Rate)N/ASkill Mastery Income Delta$40,081 (Developing)$110,188 (Intermediate)$147,549 (Mastered)This data shows that strategic career transitions accelerate skill acquisition by exposing professionals to a wider range of technical environments and management structures. This accelerates progression into leadership roles, which often command higher compensation packages.Quantifying Transition Friction and the Job-Hopping TaxWhile external transitions can quickly increase base compensation, they also incur transitional costs that can erode these financial gains. An accurate calculator must model these "job-hopping taxes" across retirement accounts, healthcare plans, and contractual clawback clauses.Retirement Savings Volatility and 401(k) Match ForfeitureEmployer-sponsored retirement match programs are designed to incentivize long-term tenure through vesting schedules. Any contributions made directly by an employee from their pre-tax wages are immediately 100% vested. However, matching funds contributed by the employer are subject to tenure-based ownership rules:Cliff Vesting: The employee owns 0% of the employer's contributions until reaching a specific milestone (such as three years), at which point ownership instantly transitions to 100%.Graded Vesting: The employee gains incremental ownership over a defined timeline (typically 20% per year starting in Year 2, reaching 100% in Year 6).Quantitative analysis indicates that an employee who earns a starting salary of $60,000 and works for nine different employers over a career can lose up to $300,000 in retirement wealth potential. This loss stems from five distinct factors:Direct Match Forfeiture: The immediate loss of unvested employer balances at departure.Savings Interruptions: Mandatory eligibility waiting periods (often 3 to 12 months) before new hires can participate in a new employer's retirement plan.Rollover Management Errors: Transactional errors during account transfers that can trigger taxes and early withdrawal penalties.Early Cash-Out Penalty Drag: The temptation to liquidate small retirement accounts during transitions, triggering ordinary income taxes and a 10% IRS penalty.Match True-Up Forfeiture: Employees who maximize their 401(k) contributions early in a calendar year can lose matching funds if their employer calculates matches per pay period and lacks a year-end "true-up" mechanism.Health Insurance Transition Gaps and COBRA OverheadsWhen transitioning between employers, professionals often face health insurance coverage gaps before their new group benefits commence. Under COBRA, the departing employee can temporarily continue their previous coverage, but must assume 100% of the plan's gross premium plus a 2% administrative fee (totaling 102% of the premium cost).$$\text{Monthly COBRA Premium} = 1.02 \times \left(\text{Monthly Employee Contribution} + \text{Monthly Employer Subsidy}\right)$$[cite: 15, 35]An accurate calculator can estimate the gross premium by referencing Box 12, Code DD on the employee's previous year-end W-2 form, which lists the total annual cost of employer-sponsored coverage. Dividing this figure by 12 yields a reliable monthly baseline.$$\text{Estimated Monthly COBRA Premium} = 1.02 \times \left( \frac{\text{W-2 Box 12, Code DD}}{12} \right)$$[cite: 15, 37]Departing employees can manage this cost using the "retroactive COBRA strategy". Federal law grants qualified beneficiaries a 60-day window to elect COBRA coverage. Once elected and paid, coverage is retroactive to the date active coverage ended. For transition gaps shorter than 60 days, professionals can avoid paying upfront premiums by retroactively electing coverage only if an unexpected medical event occurs.Bonus Clawbacks and Supplemental Wage Tax MismatchesTo secure talent, organizations often offer lump-sum signing bonuses, relocation assistance, or tuition reimbursement. These payments are typically structured as loans that are forgiven over a 12- to 24-month period. If an employee resigns before the end of this term, they must repay the unforgiven portion of the bonus.Repaying these bonuses can create short-term cash flow issues due to tax withholding mismatches. The IRS classifies signing bonuses as "supplemental wages," which are subject to a flat federal withholding rate of 22% (plus applicable state, local, and FICA taxes).Transaction PhaseGross Bonus AmountNet Deposited (Est. 30% Tax)Repayment Obligation (Month 10)Net Cash Flow PositionCliff Vesting Clawback$30,000$21,000$30,000 (100% Repayment)-$9,000Pro-Rata monthly Clawback$30,000$21,000$5,000 (2/12ths Repayment)+$16,000Under a full repayment cliff clause, if an employee leaves before the specified milestone, they must repay the gross amount ($30,000), even though they only received the net amount ($21,000). While the employee can recover the over-withheld taxes on their next annual tax return, they must still cover the $9,000 cash flow deficit in the short term.Architectural Framework of Career Velocity CalculatorsTo construct a practical and highly usable Career Velocity Calculator, developers must design an interface that balances deep analytical capabilities with intuitive inputs.Cost of Living and Location NormalizationAn accurate comparison must normalize compensation packages based on the local cost of living (CoL). This adjustment helps convert raw nominal salaries into comparable purchasing power.$$\text{Total Compensation}_{\text{Adjusted}} = \frac{\text{Total Compensation}_{\text{Nominal}}}{M_{\text{CoL}}}$$[cite: 42]The calculation engine can reference baseline indices (using a baseline such as San Francisco at 1.0) to normalize offers across different geographic areas:LocationIndex Multiplier (M_CoL)Base Salary (Nominal)Normalized Purchasing PowerSan Francisco1.00$150,000$150,000New York City0.95$150,000$157,894Seattle0.85$150,000$176,470Austin0.70$150,000$214,285Effective Hourly Rate CalculationAn effective calculation must also factor in non-monetary variables like Paid Time Off (PTO) and expected weekly working hours. For example, a high-paying startup role requiring 55-hour weeks and offering minimal PTO may pay less on an hourly basis than a slightly lower-paying corporate role with a standard 40-hour workweek and generous leave.The calculator uses the following formula to determine the effective hourly rate:$$\text{Effective Hourly Rate} = \frac{\text{Normalized Total Compensation}}{\left(52 - \frac{\text{PTO Days}}{5}\right) \times \text{Expected Weekly Hours}}$$[cite: 42]Boolean Matching Formulas for Spreadsheet ModelingFor developers prototyping their calculation logic in spreadsheets (such as Excel or Google Sheets), nesting multiple IF statements to model tiered matching formulas can be error-prone. Instead, developers can use Boolean logic expressions to simplify matching calculations. In spreadsheet software, a logical expression evaluates to 1 if TRUE and 0 if FALSE.To calculate a standard matching formula (e.g., 100% match on the first 3% of salary deferred, plus 50% match on the next 2% deferred), developers can write:Excel=(MIN(0.03, DeferralRate) * BaseSalary) + ((DeferralRate > 0.03) * MIN(0.02, DeferralRate - 0.03) * 0.5 * BaseSalary)
In this formula, if the DeferralRate is less than or equal to 3%, the second term's logical condition (DeferralRate > 0.03) evaluates to FALSE (0), which zeroes out the tiered calculation and prevents errors.The 10-Year Trajectory and Portfolio IntegrationTo evaluate the wealth-generating potential of career hopping, the calculation engine must model how salary differences can accumulate over time. The "Raise Delta" is the net annual income difference between a strategic switcher and a stayer, after accounting for taxes, bonuses, and transition friction. When this capital is directed into an investment account and compounded at standard market rates, it can significantly accelerate net worth.Trajectory Progression LogicLet $N_{\text{stayer}, t}$ and $N_{\text{switcher}, t}$ represent the net after-tax income (inclusive of bonuses and vested matches) in year $t$ for the stayer and switcher, respectively. The annual Raise Delta ($\Delta N_t$) is defined as:$$\Delta N_t = N_{\text{switcher}, t} - N_{\text{stayer}, t}$$The compounding value of this accumulated raise portfolio ($P_t$) at a specified annual market return rate ($R_p$) is calculated recursively:$$P_t = P_{t-1} \times (1 + R_p) + \Delta N_t$$where $P_0 = 0$.Compounding Trajectory Simulation ModelThe following table simulates a 10-year career horizon starting with a base salary of $100,000.Common Inputs: 30% combined tax rate, 8% annual portfolio return, 10% annual performance bonus, 3% employer matching contribution.Stayer Parameters: 4.1% annual raise rate and immediate 100% 401(k) vesting.Switcher Parameters: 15% salary raise on hop years (Years 3, 6, 9), 3% salary raises on non-hop years, and 401(k) matching subject to a 3-year cliff vesting schedule (causing matching forfeitures on hop years).Switcher Transition Friction (Applied in Years 3, 6, 9):Forfeiture of accumulated 401(k) match contributions from the preceding tenure cycle.Forfeiture of 50% of the annual performance bonus due to transition timing.COBRA health transition gap coverage cost of $1,200.New employer signing bonus offset of $5,000 gross ($3,500 after-tax).YearStayer SalaryStayer Net IncomeSwitcher SalarySwitcher Net IncomeAnnual Delta (Delta N_t)Compounded Portfolio (P_t)Year 1$100,000$80,000$100,000$80,000$0$0Year 2$104,100$83,280$103,000$82,400-$880-$880Year 3$108,368$86,694$118,450$79,717-$6,977-$7,928Year 4$112,811$90,249$122,003$97,603$7,354-$1,208Year 5$117,436$93,949$125,664$100,531$6,582$5,277Year 6$122,251$97,801$144,513$96,752-$1,049$4,650Year 7$127,264$101,811$148,849$119,079$17,268$22,290Year 8$132,481$105,985$153,314$122,651$16,666$40,739Year 9$137,913$110,331$176,311$117,534$7,204$51,202Year 10$143,568$114,854$181,600$145,280$30,426$85,724[cite: 6]Note: In the short term, transition friction (such as Match Forfeitures and health insurance gap coverage costs) can result in a temporary net worth deficit for the switcher. However, by Year 10, the switcher's increased base compensation offsets this friction, yielding an additional $85,724 in invested wealth.Technical Architecture and Engine ImplementationTo build a robust and highly performant Career Velocity Calculator, developers can implement the calculation engine as a modular service using TypeScript. This ensures type safety across calculation layers.Engine Module ImplementationTypeScriptexport interface PerformanceInputs {
  startingSalary: number;
  combinedTaxRate: number; // Combined state and federal tax rate
  marketReturnRate: number; // Compounding rate of brokerage portfolio
  bonusPercentage: number; // Annual performance bonus percentage
  employerMatchLimit: number; // Maximum matched percentage of salary
}

export interface StayerProfileConfig {
  annualRaiseRate: number; // Baseline internal merit raise rate
}

export interface SwitcherProfileConfig {
  nonHopRaiseRate: number; // Internal raise in non-transition years
  hopRaiseRate: number; // Average base salary bump when switching
  hopIntervalYears: number; // Number of years between switches
  unvestedMatchLossRate: number; // Vesting schedule forfeiture percentage
  unvestedBonusLossRate: number; // Forfeited bonus due to mid-year switch timing
  cobraTransitionCost: number; // Cost of health gap coverage
  newHireSigningBonusGross: number; // Average gross signing bonus secured
}

export interface GeographicProfile {
  costOfLivingIndex: number; // 1.0 = baseline (e.g., San Francisco)
  expectedWeeklyHours: number; // Expected working hours per week
  paidTimeOffDays: number; // Total annual vacation and sick days
}

export interface TrajectoryProjectionPoint {
  year: number;
  stayerSalary: number;
  stayerTotalCompNominal: number;
  stayerEffectiveHourlyRate: number;
  stayerNetAnnualCashFlow: number;
  switcherSalary: number;
  switcherTotalCompNominal: number;
  switcherEffectiveHourlyRate: number;
  switcherNetAnnualCashFlow: number;
  annualNetDelta: number;
  compoundedPortfolioDelta: number;
}

export class CareerVelocityEngine {
  public static calculateProjections(
    inputs: PerformanceInputs,
    stayerConfig: StayerProfileConfig,
    switcherConfig: SwitcherProfileConfig,
    geoStayer: GeographicProfile,
    geoSwitcher: GeographicProfile,
    horizonYears: number = 10
  ): TrajectoryProjectionPoint[] {
    const projections: TrajectoryProjectionPoint[] = [];
    
    let stayerSalary = inputs.startingSalary;
    let switcherSalary = inputs.startingSalary;
    let compoundedDelta = 0;
    
    // Tracks accumulated employer matches for vesting calculation
    const switcherMatchHistory: number[] = [];

    for (let year = 1; year <= horizonYears; year++) {
      // Apply annual salary updates (compounded from year-end of preceding period)
      if (year > 1) {
        stayerSalary *= (1 + stayerConfig.annualRaiseRate);
        
        const isHopYear = (year - 1) % switcherConfig.hopIntervalYears === 0;
        if (isHopYear) {
          switcherSalary *= (1 + switcherConfig.hopRaiseRate);
        } else {
          switcherSalary *= (1 + switcherConfig.nonHopRaiseRate);
        }
      }

      // Compute Stayer total compensation and effective hourly rate
      const stayerBonus = stayerSalary * inputs.bonusPercentage;
      const stayerMatch = stayerSalary * inputs.employerMatchLimit;
      const stayerTotalComp = stayerSalary + stayerBonus + stayerMatch;
      
      const stayerTotalCompCoL = stayerTotalComp / geoStayer.costOfLivingIndex;
      const stayerHourly = stayerTotalCompCoL / ((52 - (geoStayer.paidTimeOffDays / 5)) * geoStayer.expectedWeeklyHours);
      const stayerNetCashFlow = (stayerSalary + stayerBonus) * (1 - inputs.combinedTaxRate) + stayerMatch;

      // Compute Switcher total compensation and match accumulation
      const switcherBonus = switcherSalary * inputs.bonusPercentage;
      const switcherMatch = switcherSalary * inputs.employerMatchLimit;
      switcherMatchHistory.push(switcherMatch);
      
      const switcherTotalComp = switcherSalary + switcherBonus + switcherMatch;
      const switcherTotalCompCoL = switcherTotalComp / geoSwitcher.costOfLivingIndex;
      const switcherHourly = switcherTotalCompCoL / ((52 - (geoSwitcher.paidTimeOffDays / 5)) * geoSwitcher.expectedWeeklyHours);
      
      let switcherNetCashFlow = (switcherSalary + switcherBonus) * (1 - inputs.combinedTaxRate) + switcherMatch;

      // Apply transition friction on hop years
      const isHopYear = year > 1 && (year - 1) % switcherConfig.hopIntervalYears === 0;
      if (isHopYear) {
        // Calculate matching funds lost based on the transition interval
        const historicalMatchRange = Math.min(switcherConfig.hopIntervalYears, switcherMatchHistory.length - 1);
        let unvestedMatchSum = 0;
        for (let i = 0; i < historicalMatchRange; i++) {
          unvestedMatchSum += switcherMatchHistory[switcherMatchHistory.length - 2 - i] || 0;
        }
        const matchingLossFriction = unvestedMatchSum * switcherConfig.unvestedMatchLossRate;

        // Calculate bonus lost due to transition timing
        const bonusLossFriction = switcherBonus * (1 - inputs.combinedTaxRate) * switcherConfig.unvestedBonusLossRate;

        // Net signing bonus benefit (taxed at supplemental rate)
        const netSigningBonus = switcherConfig.newHireSigningBonusGross * (1 - 0.22);

        // Adjust switcher net cash flow
        switcherNetCashFlow = 
          ((switcherSalary + switcherBonus) * (1 - inputs.combinedTaxRate)) +
          netSigningBonus -
          (matchingLossFriction + bonusLossFriction + switcherConfig.cobraTransitionCost);
          
        // Reset match history for the next vesting cycle
        switcherMatchHistory.length = 0;
        switcherMatchHistory.push(switcherMatch);
      }

      // Compute annual and compounded deltas
      const netDelta = switcherNetCashFlow - stayerNetCashFlow;
      compoundedDelta = compoundedDelta * (1 + inputs.marketReturnRate) + netDelta;

      projections.push({
        year,
        stayerSalary: Math.round(stayerSalary),
        stayerTotalCompNominal: Math.round(stayerTotalComp),
        stayerEffectiveHourlyRate: Math.round(stayerHourly * 100) / 100,
        stayerNetAnnualCashFlow: Math.round(stayerNetCashFlow),
        switcherSalary: Math.round(switcherSalary),
        switcherTotalCompNominal: Math.round(switcherTotalComp),
        switcherEffectiveHourlyRate: Math.round(switcherHourly * 100) / 100,
        switcherNetAnnualCashFlow: Math.round(switcherNetCashFlow),
        annualNetDelta: Math.round(netDelta),
        compoundedPortfolioDelta: Math.round(compoundedDelta)
      });
    }

    return projections;
  }
}
Architectural Implementation PlanTo build a practical, secure, and production-ready tool, developers should implement a client-side architecture that runs entirely in the user's browser.┌────────────────────────────────────────────────────────┐
│                   React User Interface                  │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   Inputs Form Panel   │   │   Interactive Charts │  │
│  │ (Custom Configuration)│   │ (Annual & Cumulative)│  │
│  └───────────┬───────────┘   └──────────▲───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          │
┌──────────────┴──────────────────────────┴──────────────┐
│                  State Orchestration                   │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │     Validation Schema │   │   Calculations       │  │
│  │         (Zod)         │   │   Engine             │  │
│  └───────────┬───────────┘   └──────────▲───────────┘  │
└──────────────┼──────────────────────────┼──────────────┘
               │                          │
               ▼                          │
┌──────────────┴──────────────────────────┴──────────────┐
│                    Persistence Layer                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Browser Storage (Safe LocalStorage)       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
Client-Side Privacy and Safe StorageBecause the calculator processes highly sensitive financial data, the system should avoid transmitting inputs to external servers. Developers can use the browser's localStorage to save scenarios locally, helping protect user privacy. To prevent potential security vulnerabilities, input forms should be validated using schema-validation libraries like Zod. This helps sanitize inputs before they are parsed by the calculation engine or written to local storage.Interactive Visualization LayerDevelopers can use graphing libraries like Recharts or Chart.js to build interactive, multi-series dashboards. The interface should display:A Dual-Line Chart: Showing the divergence in base salaries between the switcher and stayer over the 10-year projection.A Stacked Waterfall Chart: Displaying how annual transition friction offsets gross wage increases during transition years.An Accumulated Wealth Area Chart: Renders the growth of the compounded Raise Delta portfolio over time.Dynamic Advanced Modeling FeaturesTo make the calculator a versatile planning tool, developers can integrate several advanced features:Lifestyle Cost Adjustments: Allow users to input recurring monthly expenses, state-specific tax rates, and filing statuses to calculate realistic take-home pay.On-Call and Overtime Pay Tracking: For fields like healthcare or engineering, include modeling options for expected overtime hours, on-call pay rates, and post-call scheduling adjustments.Alternative Compensation Paths: Include variables to track stock options, restricted stock units (RSUs), and specialized benefits packages. This helps users run comprehensive scenarios, such as comparing a startup offer with high equity against a corporate offer with a stable salary and robust 401(k) matching.Product Requirements Document (PRD): Career Velocity Calculator1. Product Overview1.1 PurposeThe Career Velocity Calculator is an interactive, high-fidelity financial modeling interface designed to challenge the generic advice of "always switch" or "always stay". By modeling compensation at a systemic level, it quantifies the long-term wealth divergence between standard internal raises ("Stayer") and strategic external employment hops ("Switcher"). It provides professionals with the mathematical clarity required to time their job transitions and directly negotiate signing structures that offset unvested asset forfeiture.1.2 Target AudienceEarly-Career Professionals (0-5 Years): Optimizing for peak learning velocity and aggressive baseline compensation jumps.Mid-Career & Senior ICs (5-15+ Years): Balancing high base salaries, complex equity packages, and significant transition friction.Financial Independence, Retire Early (FIRE) Enthusiasts: Seeking to maximize their savings rate by directly routing the "Raise Delta" of career transitions into tax-advantaged portfolios.2. User Persona: The Strategic SwitcherProfile: A software engineer or corporate finance analyst earning $100,000 with 4 years of experience.Core Problem: They receive a recruiter outreach offering a 15% increase, but are currently sitting 2.5 years into a 3-year 401(k) cliff-vesting cycle. They do not know if the immediate raise compensates for the forfeited matching assets and the short-term cash-flow deficit caused by transition tax withholding.Key Goal: Evaluate the exact 10-year financial impact of taking the offer versus remaining in place for another 6 months to secure full vesting ownership.3. Functional RequirementsThe core software must support five key modules: User Input Panels, a Financial Logic Engine, a Geographic & Hourly Normalizer, a Visual Analytics Suite, and a Local Persistence Layer.┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  User Configurations ──► normalizer ──► LOGIC ENGINE ──► Visualizations │
│     (Pre-tax, Match,     (CoL Index,      (TypeScript     (Recharts UI, │
│     Vesting schedules)    PTO, Hours)      10-Yr Sim)      KPI panels)  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
3.1 Module 1: Form Inputs & ValidationsThe UI must provide input groups with real-time Zod schema validation:Core Financial Inputs:Starting Base Salary: Minimum $10,000, default $100,000.Combined Marginal Income Tax Rate: Range 0% to 60%, default 30%.Target Annual Portfolio Growth Rate: Range 0% to 15%, default 8%.Annual Performance Bonus: Range 0% to 50% of base salary, default 10%.Retirement Match Rules (Boolean Logic Switch):Employer Match Limit: Range 0% to 10%, default 3%.Deferral Contribution: Range 0% to 100%, default 6%.Stayer Profile Defaults:Merit Raise Percentage: Range 0% to 10%, default 4.1%.Switcher Transition Metrics:Hop Transition Period: Default every 3 years.Average Hop Raise Percentage: Range 0% to 100%, default 15%.Normal Annual Raise (Non-Hop Year): Range 0% to 10%, default 3.0%.3.2 Module 2: The Transition Friction (Job-Hopping Tax) EngineThe engine must subtract specific frictional variables in transition years to accurately determine real take-home pay:Unvested 401(k) Match Forfeiture:Model standard schedules (Cliff vs. Graded).Loss calculation is triggered dynamically if tenure with an employer at transition is less than the vesting cliff period.Supplemental Bonus Clawbacks:Model both full cliff payback and monthly pro-rata payback schedules.Signing bonuses are calculated net of standard supplemental tax withholding rates (22% flat federal tax).Healthcare Gap Costs:Default transition health premium gap cost is $1,200.Include a customizable monthly COBRA calculator using last year's Box 12, Code DD value from the user's W-2 form.3.3 Module 3: Cost of Living & Time NormalizerCoL Normalization: Uses customizable relative indices (defaulting to San Francisco at 1.0) to normalize base compensation across geographical boundaries.Effective Hourly Rate Assessment: Evaluates expected weekly work commitments against PTO allocations. It computes whether an increase in nominal salary is offset by a higher volume of working hours or fewer vacation days.3.4 Module 4: 10-Year Compounding EngineThe engine executes the TypeScript CareerVelocityEngine class, generating 10 distinct, year-by-year nodes. The engine accumulates annual cash differentials and compounds them recursively based on the user's specified market portfolio return rate ($R_p$).4. Non-Functional Requirements4.1 Client-Side Privacy & Offline CapabilityData Security Policy: User financial data is strictly processed client-side. No input parameters, cash flows, or net worth values are transmitted to external endpoints.Offline Execution: The application is built using a Progressive Web App (PWA) manifest to allow complete execution without an active internet connection.Local Persistence: Scenarios are saved directly to the browser's localStorage. All inputs are fully validated via Zod before writing to disk to prevent scripting vulnerabilities.4.2 Accessibility & User ExperienceContrast Requirements: Dark/Light styling compliance meeting WCAG AA contrast ratios (minimum 4.5:1).Typing Speed and Reflow Controls: Inputs use persistent focus states to prevent layout shifts or input lag during high-frequency recalculations.Keyboard Navigation: Forms support intuitive sequential navigation (Tab, Shift-Tab) and screen reader labels on interactive graphics.5. Wireframe UI Architecture┌────────────────────────────────────────────────────────────────────────┐
│  CAREER VELOCITY CALCULATOR                      [Light / Dark Mode]   │
├──────────────────────────────────────┬─────────────────────────────────┤
│ INPUTS PANEL                         │ KPI SUMMARY PANEL               │
│                                      │ ┌──────────────┐ ┌────────────┐ │
│ Base Salary:      [$100,000 ]        │ │ Yr 10 Stayer │ │ Yr 10 Hop  │ │
│ Tax Rate:         [30%      ]        │ │ $148,399     │ │ $224,134   │ │
│ Portfolio Return: [8%       ]        │ └──────────────┘ └────────────┘ │
│                                      │ ┌─────────────────────────────┐ │
│ [Stayer Settings]                    │ │ Compounded Raise Delta      │ │
│ Merit Raise:      [4.1%     ]        │ │ $85,724                     │ │
│                                      │ └─────────────────────────────┘ │
│ [Switcher Settings]                  │ VISUALIZATION SUITE             │
│ Hop Interval:     [3 Years  ]        │ ┌─────────────────────────────┐ │
│ Hop Base Increase:[15%      ]        │ │ (Recharts Graph Container)  │ │
│ Vesting Schedule: [3-Yr Cliff]       │ │                             │ │
│ W2 Box 12 DD CoL: [$14,117  ]        │ │ [Salary Gap] [Net Worth]    │ │
│                                      │ └─────────────────────────────┘ │
└──────────────────────────────────────┴─────────────────────────────────┘
5.1 Interactive Interface SectionsLeft Input Panel: Contains form fields grouped by configuration type (Core Finance, Stayer Settings, Switcher Settings, Geographic Profiles).Top Right KPI Cards: Instantly render Year 10 Salary results for both paths alongside the total compounded value of the Raise Delta portfolio.Primary Content Viewport: Toggleable visual analyzer showing either the compounded growth curve or the waterfall transition-friction analysis.6. Verification and Test Suites6.1 Mathematical Engine ValidationTo verify the engine's logical and calculation consistency, developers must run automated test assertions matching the 10-year model:TypeScriptdescribe('CareerVelocityEngine', () => {
  it('correctly models Year 10 trajectory gap and compounded delta', () => {
    const inputs: PerformanceInputs = {
      startingSalary: 100000,
      combinedTaxRate: 0.30,
      marketReturnRate: 0.08,
      bonusPercentage: 0.10,
      employerMatchLimit: 0.03
    };

    const stayer: StayerProfileConfig = {
      annualRaiseRate: 0.041
    };

    const switcher: SwitcherProfileConfig = {
      nonHopRaiseRate: 0.03,
      hopRaiseRate: 0.15,
      hopIntervalYears: 3,
      unvestedMatchLossRate: 1.0, // Represents forfeiting matches
      unvestedBonusLossRate: 0.5, // 50% loss of bonus in hop years
      cobraTransitionCost: 1200,
      newHireSigningBonusGross: 5000
    };

    const geo: GeographicProfile = {
      costOfLivingIndex: 1.0,
      expectedWeeklyHours: 40,
      paidTimeOffDays: 15
    };

    const results = CareerVelocityEngine.calculateProjections(inputs, stayer, switcher, geo, geo, 10);
    
    // Assert stayer salary matches compounding 4.1%
    expect(results[9].stayerSalary).toBeCloseTo(143568, 0); // 100000 * (1.041)^9
    
    // Assert switcher salary matches compounding hops
    expect(results[9].switcherSalary).toBeCloseTo(181600, 0);

    // Verify final year 10 raise delta portfolio compound total
    expect(results[9].compoundedPortfolioDelta).toBeCloseTo(85724, -1);
  });
});
7. Core Execution and Release Roadmap7.1 Phase 1: MVP Core (Weeks 1-2)Implement modular calculation engine classes in TypeScript.Write unit verification suites ensuring calculation accuracy.Build a basic React interface layout utilizing schema form inputs via React Hook Form and Zod.7.2 Phase 2: High-Fidelity Data Dashboards (Weeks 3-4)Integrate Recharts/Chart.js to display interactive compounding curves.Incorporate interactive slider controls for immediate scenario manipulation.Implement the local persistence layer using React Hook variables mapped to local storage scenarios.7.3 Phase 3: Friction Modeling Upgrades (Weeks 5-6)Launch granular retirement plan parameters (e.g., graded vesting schedule modeling).Integrate local geographic multipliers to adjust calculation outputs based on cost of living.Implement a PDF report exporter allowing users to download a summary of their career progression scenario.