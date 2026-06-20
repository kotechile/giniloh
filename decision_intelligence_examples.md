# GiniLoh Decision-Intelligence Real-Life Examples

This document outlines twelve real-life decision scenarios. Each example models how the GiniLoh decision-intelligence framework resolves choices using cost-per-use, repair-vs-replace index scores, and tinkering tax time valuations.

---

## Part 1: Consumer & Personal Life Decisions

### Use Case 1: Premium Espresso Machine vs. Café Lattes
* **Dilemma:** Investing in a $3,000 premium dual-boiler espresso setup versus spending $6.00 daily at local coffee shops.
* **Decision-Intelligence Tool Rule:** **Cost-Per-Use (CPU) Reality Check**
* **How to Enter in the App:**
  1. Select the **Cost-Per-Use** tab at the top.
  2. In the **Sticker Price (Upfront Cost)** field, type `3000` (or adjust the slider).
  3. In **Weekly Usage Frequency**, type `5` (or adjust the slider).
  4. In **Outsourced / Alternative Cost**, type `6.00` (or adjust the slider).
  5. In **Upkeep / Internal Cost (Per Use)**, type `1.50` (or adjust the slider).
  6. Set the **Target Lifespan Horizon (Years)** stepper to `3 years`.
* **Input Parameters:**
  * **Sticker Price ($):** $3,000
  * **Secondary Cost per use ($):** $1.50 (coffee beans, milk, water filters, descaling chemical)
  * **Outsource Price per drink ($):** $6.00
  * **Weekly usage:** 5 drinks / week
  * **Lifespan Horizon:** 3 years
* **TCO Calculations:**
  * **Total Uses ($U_{\text{lifetime}}$):**
    $$U_{\text{lifetime}} = 5 \text{ drinks/week} \times 52 \text{ weeks/year} \times 3 \text{ years} = 780 \text{ uses}$$
  * **Outsource TCO:** 
    $$\text{TCO}_{\text{outsource}} = 780 \text{ uses} \times \$6.00 = \$4,680$$
  * **Home Maintenance & Descaling Upkeep:**
    $$C_{\text{maintenance}} = \$3,000 \times 0.05 \times 3 \text{ years} = \$450$$
  * **Home TCO:** 
    $$\text{TCO}_{\text{home}} = \$3,000 \text{ (sticker)} + (780 \text{ uses} \times \$1.50) + \$450 = \$4,620$$
  * **Home Cost-Per-Use (CPU):** 
    $$\text{CPU}_{\text{personal}} = \frac{\text{TCO}_{\text{home}}}{U_{\text{lifetime}}} = \frac{\$4,620}{780} \approx \$5.92 / \text{use}$$
* **Verdict:** **BUY**
* **Rationale:** Home ownership saves $60 over 3 years. The home unit cost is $5.92 per use compared to the $6.00 café rate. However, due to minimal savings and descaling labor, the engine flags this as a borderline decision unless weekly usage increases.

---

### Use Case 2: Local Deep Learning Rig vs. Cloud GPU Compute
* **Dilemma:** Building a local PC deep learning computer for $3,500 versus renting cloud GPU compute at $1.80/hour.
* **Decision-Intelligence Tool Rule:** **True Break-Even Horizon**
* **How to Enter in the App:**
  1. Select the **Cost-Per-Use** tab at the top.
  2. In the **Sticker Price (Upfront Cost)** field, type `3500` (or adjust the slider).
  3. In **Weekly Usage Frequency** (weekly active compute hours), type `12` (or adjust the slider).
  4. In **Outsourced / Alternative Cost** (cloud GPU hourly fee), type `1.80` (or adjust the slider).
  5. In **Upkeep / Internal Cost (Per Use)** (electricity cost per hour), type `0.45` (or adjust the slider).
  6. Set the **Target Lifespan Horizon (Years)** stepper to `3 years`.
* **Input Parameters:**
  * **Sticker Price ($):** $3,500
  * **Secondary Cost per use ($):** $0.45 / hour (electricity draw at 750W load under local utility rate)
  * **Outsource Price per use ($):** $1.80 / hour
  * **Weekly usage:** 12 active compute hours / week
  * **Lifespan Horizon:** 3 years
* **TCO Calculations:**
  * **Total Uses:** 
    $$U_{\text{lifetime}} = 12 \text{ hours/week} \times 52 \text{ weeks/year} \times 3 \text{ years} = 1,872 \text{ run hours}$$
  * **Outsource TCO (Cloud GPU):** 
    $$\text{TCO}_{\text{outsource}} = 1,872 \text{ hours} \times \$1.80 = \$3,370$$
  * **Local Maintenance & Parts (5% of sticker/year):** 
    $$C_{\text{maintenance}} = \$3,500 \times 0.05 \times 3 = \$525$$
  * **Home TCO (Local GPU Rig):** 
    $$\text{TCO}_{\text{home}} = \$3,500 \text{ (sticker)} + (1,872 \times \$0.45) + \$525 = \$4,867$$
  * **Home Cost-Per-Use (CPU):** 
    $$\text{CPU}_{\text{personal}} = \frac{\text{TCO}_{\text{home}}}{U_{\text{lifetime}}} = \frac{\$4,867}{1,872} \approx \$2.60 / \text{hour}$$
* **Verdict:** **SKIP / OUTSOURCE**
* **Rationale:** Cloud GPU renting remains financially superior. Your local rig cost is $2.60/hr compared to the $1.80/hr renting rate because your weekly compute density (12 hours) is not high enough to amortize the hardware CapEx.

---

### Use Case 3: Cracked Laptop Screen Repair vs. Replacement
* **Dilemma:** Your 4-year-old laptop has a cracked display. The manufacturer quotes $450 for a screen replacement.
* **Decision-Intelligence Tool Rule:** **Consumer 1,500 Rule**
* **How to Enter in the App:**
  1. Select the **Repair vs Replace** tab at the top.
  2. Under **Asset Classification**, select the **Consumer Electronics (Phones, Laptops)** tab.
  3. Adjust the **Asset Age (Years)** slider (or type) to `4`.
  4. Adjust the **Immediate Repair Quote** slider (or type) to `450`.
* **Input Parameters:**
  * **Asset Category:** Personal Electronics (Phone / Laptop)
  * **Asset Age ($A_{\text{asset}}$):** 4 Years
  * **Immediate Repair Quote ($C_{\text{repair}}$):** $450
* **Calculations:**
  * **Asset Debt Index ($I_{\text{asset}}$):** 
    $$I_{\text{asset}} = A_{\text{asset}} \times C_{\text{repair}}$$
    $$I_{\text{asset}} = 4 \text{ years} \times \$450 = 1,800$$
  * **Replacement Threshold:** 
    $$\text{Threshold} = 1,500$$
* **Verdict:** **REPLACE**
* **Rationale:** The asset tech debt index of 1,800 exceeds the electronics threshold of 1,500. Buying a new laptop is mathematically superior to patching outdated, depreciated hardware.

---

### Use Case 4: Task Tracker Spreadsheet vs. Paid Integrated App
* **Dilemma:** Manually copy-pasting notes and tasks across 5 free spreadsheets versus paying $15/month for a unified task tracker app.
* **Decision-Intelligence Tool Rule:** **Personal Tinkering Tax Test**
* **How to Enter in the App:**
  1. Select the **Tinkering Tax** tab at the top.
  2. In the **Monthly Troubleshooting Time** field, type `4` hours (or adjust the slider).
  3. In **Opportunity Value of Time**, type `50` (or adjust the slider).
  4. In **Subscription Cost of Paid App**, type `15` (or adjust the slider).
* **Input Parameters:**
  * **Tinkering/Troubleshooting time:** 4 hours / month
  * **Opportunity Value of Time ($R_{\text{time}}$):** $50 / hour
  * **Subscription Cost:** $15 / month
* **TCO Calculations:**
  * **Monthly Time Tax Cost:** 
    $$C_{\text{tinker\_monthly}} = 4 \text{ hours} \times \$50/\text{hour} = \$200 / \text{month}$$
  * **3-Year Time Drag Cost:** 
    $$\text{TCO}_{\text{time}} = \$200/\text{mo} \times 36 \text{ months} = \$7,200$$
  * **3-Year App Subscription:** 
    $$\text{TCO}_{\text{sub}} = \$15/\text{mo} \times 36 \text{ months} = \$540$$
  * **Net Reclaimed Value:** 
    $$\Delta C = \text{TCO}_{\text{time}} - \text{TCO}_{\text{sub}} = \$7,200 - \$540 = \$6,660$$
* **Verdict:** **BUY / UPGRADE**
* **Rationale:** Upgrading to the paid app saves $6,660 in personal time value over 3 years by reclaiming 4 hours of manual copy-paste frustration per month.

---

### Use Case 5: Smart Home Ecosystem (Generic Smart Plugs vs. Certified Devices)
* **Dilemma:** Purchase $10 generic smart plugs or $35 Matter/HomeKit-certified devices.
* **Decision-Intelligence Tool Rule:** **Personal Tinkering Tax Test**
* **How to Enter in the App:**
  1. Select the **Tinkering Tax** tab at the top.
  2. In the **Monthly Troubleshooting Time** field (spent fixing disconnects), type `3` hours (or adjust the slider).
  3. In **Opportunity Value of Time**, type `45` (or adjust the slider).
  4. In **Subscription Cost of Paid App**, type the monthly CapEx offset difference `6.94` (calculated as `($350 premium - $100 generic) / 36 months`).
* **Input Parameters:**
  * **Tinkering/Troubleshooting time:** 3 hours / month (troubleshooting disconnects)
  * **Opportunity Value of Time ($R_{\text{time}}$):** $45 / hour
  * **Premium Plugs setup cost:** $350 (for 10 plugs)
  * **Generic Plugs setup cost:** $100 (for 10 plugs)
* **TCO Calculations:**
  * **Monthly Tinkering Tax:**
    $$C_{\text{tinker\_monthly}} = 3 \text{ hours} \times \$45/\text{hour} = \$135 / \text{month}$$
  * **3-Year Time Drag Cost:**
    $$\text{TCO}_{\text{time}} = \$135/\text{mo} \times 36 \text{ months} = \$4,860$$
  * **TCO Generic Plugs:**
    $$\text{TCO}_{\text{generic}} = \$100 \text{ (CapEx)} + \$4,860 \text{ (Time Tax)} = \$4,960$$
  * **TCO Premium Plugs:**
    $$\text{TCO}_{\text{premium}} = \$350 \text{ (CapEx)} + \$0 \text{ (Time Tax)} = \$350$$
* **Verdict:** **BUY / UPGRADE** (to Matter-certified plugs)
* **Rationale:** A recurring $135 monthly productivity drain ($4,860 over 3 years) far exceeds the one-time premium hardware upgrade cost ($350 for 10 plugs).

---

### Use Case 6: The Daily Commute (Premium E-Bike vs. Rideshares & Parking)
* **Dilemma:** Purchasing a $2,500 electric commuter bike versus relying on a combination of city parking fees, fuel, and rideshares.
* **Decision-Intelligence Tool Rule:** **Cost-Per-Use (CPU) Reality Check**
* **How to Enter in the App:**
  1. Select the **Cost-Per-Use** tab at the top.
  2. In the **Sticker Price (Upfront Cost)** field, type `2500` (or adjust the slider).
  3. In **Weekly Usage Frequency** (hybrid commute trips per week), type `3` (or adjust the slider).
  4. In **Outsourced / Alternative Cost** (daily parking fee), type `15.00` (or adjust the slider).
  5. In **Upkeep / Internal Cost (Per Use)** (electricity, gear, tune-ups amortized per trip), type `1.73` (or adjust the slider).
  6. Set the **Target Lifespan Horizon (Years)** stepper to `3 years`.
* **Input Parameters:**
  * **Sticker Price ($):** $2,500
  * **Secondary Cost per roundtrip ($):** $1.73 (commuter gear, lock, tune-ups, battery reserve divided by 405 roundtrips)
  * **Outsource Price per roundtrip ($):** $15.00 (parking alone, excluding fuel or rideshare costs)
  * **Weekly usage:** 3 roundtrips / week (hybrid work schedule of 3 days/week)
  * **Lifespan Horizon:** 3 years (assuming 45 weeks of commuting per year = 405 roundtrips)
* **TCO Calculations:**
  * **Total Uses ($U_{\text{lifetime}}$):**
    $$U_{\text{lifetime}} = 3 \text{ roundtrips/week} \times 45 \text{ weeks/year} \times 3 \text{ years} = 405 \text{ roundtrips}$$
  * **Outsource TCO:** 
    $$\text{TCO}_{\text{outsource}} = 405 \text{ roundtrips} \times \$15.00 = \$6,075 \text{ (parking fees only)}$$
  * **Home TCO (E-Bike):** 
    $$\text{TCO}_{\text{home}} = \$2,500 \text{ (sticker)} + \$700 \text{ (lock, gear, tuneups, battery reserve)} = \$3,200$$
  * **Home Cost-Per-Use (CPU):** 
    $$\text{CPU}_{\text{personal}} = \frac{\text{TCO}_{\text{home}}}{U_{\text{lifetime}}} = \frac{\$3,200}{405} \approx \$7.90 / \text{roundtrip}$$
* **Verdict:** **BUY**
* **Rationale:** Buying the e-bike saves $2,875 over 3 years compared to parking fees alone. The commute unit cost is reduced to $7.90 per roundtrip compared to the $15.00 outsourcing rate.

---

## Part 2: Enterprise & Business Decisions

### Use Case 7: Developer User Authentication (Custom vs. Clerk/Auth0)
* **Dilemma:** Building custom user logins, session tokens, and admin dashboards versus paying a managed CIAM platform (Clerk).
* **Decision-Intelligence Tool Rule:** **Multi-Year TCO Projection**
* **How to Enter in the App:**
  1. Select the **CIAM Auth** tab at the top.
  2. In **Monthly Active Users (MAUs)**, type `25000` (or adjust the slider).
  3. In **Developer Loaded Rate ($/hr)**, type `85` (or adjust the slider).
  4. In **Custom Build Time (Months)**, set the stepper to `3`.
  5. In **Maintenance Overhead (FTE %)**, set the stepper to `50`.
  6. Under **Compliance Target Target**, select the **SOC 2 Type II** badge.
* **Input Parameters:**
  * **Monthly Active Users (MAUs):** 25,000
  * **Developer Loaded Hourly Rate ($R_{\text{dev}}$):** $85 / hour
  * **Initial Custom Build Time ($M_{\text{build}}$):** 3 months
  * **Maintenance Overhead FTE ($F_{\text{maint}}$):** 50% FTE
  * **Compliance Target Level ($L_{\text{comp}}$):** SOC 2 Type II
* **TCO Calculations:**
  * **Custom Build Cost:** 
    $$C_{\text{build}} = 3 \text{ months} \times 160 \text{ hrs} \times 1.5 \text{ devs} \times \$85/\text{hr} = \$61,200$$
  * **Custom Maintenance Cost:** 
    $$C_{\text{maintenance}} = 0.50 \text{ FTE} \times 160 \text{ hrs/mo} \times \$85/\text{hr} = \$6,800/\text{mo}$$
    $$\text{Maintenance}_{3\text{yr}} = \$6,800/\text{mo} \times 36 \text{ months} = \$244,800$$
  * **Compliance Audit Cost:** 
    $$C_{\text{compliance}} = \$75,000 / \text{year} \times 3 \text{ years} = \$225,000$$
  * **Developer Opportunity Cost:** 
    $$C_{\text{opportunity}} = \$150,000$$
  * **Custom 3-Yr TCO:** 
    $$\text{TCO}_{\text{custom}} = \$61,200 + \$244,800 + \$225,000 + \$150,000 = \$681,000$$
  * **SaaS Integration Cost:** 
    $$C_{\text{integrate}} = 8 \text{ hours} \times \$85 = \$680$$
  * **SaaS Subscription Cost:** 
    $$\text{Subscription}_{\text{monthly}} = \$25 \text{ (base)} + (15,000 \times \$0.02) = \$325/\text{mo}$$
    $$\text{Subscription}_{3\text{yr}} = \$325/\text{mo} \times 36 \text{ months} = \$11,700$$
  * **SaaS 3-Yr TCO:** 
    $$\text{TCO}_{\text{SaaS}} = \$680 + \$11,700 = \$12,380$$
* **Verdict:** **BUY**
* **Rationale:** Managed SaaS saves $668,620 by eliminating compliance audit preparation, middleware patch labor, and opportunity costs.

---

### Use Case 8: Startup MVP Authentication vs. Supabase Free Tier
* **Dilemma:** Custom coding auth for a tiny validation MVP versus integrating a free open-source authentication tier.
* **Decision-Intelligence Tool Rule:** **Multi-Year TCO Projection**
* **How to Enter in the App:**
  1. Select the **CIAM Auth** tab at the top.
  2. In **Monthly Active Users (MAUs)**, type `500` (or adjust the slider).
  3. In **Developer Loaded Rate ($/hr)**, type `60` (or adjust the slider).
  4. In **Custom Build Time (Months)**, set the stepper to `1`.
  5. In **Maintenance Overhead (FTE %)**, set the stepper to `10`.
  6. Under **Compliance Target Target**, select the **None** badge.
* **Input Parameters:**
  * **Monthly Active Users (MAUs):** 500
  * **Developer Loaded Hourly Rate ($R_{\text{dev}}$):** $60 / hour
  * **Initial Custom Build Time ($M_{\text{build}}$):** 1 month
  * **Maintenance Overhead FTE ($F_{\text{maint}}$):** 10% FTE
  * **Compliance Target Level:** None
* **TCO Calculations:**
  * **Custom Build Cost:** 
    $$C_{\text{build}} = 1 \text{ month} \times 160 \text{ hrs} \times 1.5 \text{ devs} \times \$60 = \$14,400$$
  * **Custom Maintenance Cost:** 
    $$C_{\text{maintenance}} = 0.10 \text{ FTE} \times 160 \text{ hrs/mo} \times \$60 = \$960/\text{mo}$$
    $$\text{Maintenance}_{3\text{yr}} = \$960/\text{mo} \times 36 \text{ months} = \$34,560$$
  * **Developer Opportunity Cost:** 
    $$C_{\text{opportunity}} = \$150,000$$
  * **Custom 3-Yr TCO:** 
    $$\text{TCO}_{\text{custom}} = \$14,400 + \$34,560 + \$150,000 = \$198,960$$
  * **SaaS TCO:** 
    $$\text{TCO}_{\text{SaaS}} = (8 \text{ hours} \times \$60) + \$0/\text{mo subscription} = \$480$$
* **Verdict:** **BUY**
* **Rationale:** Even at MVP scale, SaaS saves $198,480 in developer opportunity costs and initial coding labor.

---

### Use Case 9: Legacy Database Refactoring vs. Cloud Migration
* **Dilemma:** Refactoring a 6-year-old custom database system to fix performance vulnerabilities versus migrating to a managed cloud database.
* **Decision-Intelligence Tool Rule:** **Software 5,000 Rule**
* **How to Enter in the App:**
  1. Select the **Repair vs Replace** tab at the top.
  2. Under **Asset Classification**, select the **Major Infrastructure (HVAC, Roof, Cars, Software)** tab.
  3. Adjust the **Asset Age (Years)** slider (or type) to `6`.
  4. Adjust the **Immediate Repair Quote** slider (or type senior refactoring cost) to `9960`.
* **Input Parameters:**
  * **Codebase Age ($A_{\text{codebase}}$):** 6 years
  * **Remediation Hours Required:** 120 hours of senior developer refactoring
  * **Developer Loaded Hourly Rate ($R_{\text{dev}}$):** $83 / hour
* **Calculations:**
  * **Remediation Labor Cost ($C_{\text{remediation}}$):** 
    $$C_{\text{remediation}} = 120 \text{ hours} \times \$83/\text{hour} = \$9,960$$
  * **Software Tech Debt Index ($I_{\text{software}}$):** 
    $$I_{\text{software}} = A_{\text{codebase}} \times C_{\text{remediation}}$$
    $$I_{\text{software}} = 6 \text{ years} \times \$9,960 = 59,760$$
  * **Software Threshold:** 
    $$\text{Threshold} = 5,000$$
* **Verdict:** **REPLACE / MIGRATE**
* **Rationale:** The legacy codebase tech debt index of 59,760 far exceeds the 5,000 threshold. Patching this outdated system is a financial liability; migrating to a managed cloud database is mathematically superior.

---

### Use Case 10: Embedded Customer Dashboards (Build vs. BI Platform)
* **Dilemma:** Building custom dashboard analytics in-house versus licensing an embedded BI platform.
* **Decision-Intelligence Tool Rule:** **Opportunity Cost & Time-to-Market Analysis**
* **Calculations:**
  * **In-House Build TCO (3 Years):** 
    $$\text{TCO}_{\text{custom}} = \$371,000 - \$630,000$$
  * **Vendor TCO (3 Years):** 
    $$\text{TCO}_{\text{vendor}} = \$150,000 - \$360,000$$
* **Verdict:** **BUY BI PLATFORM**
* **Rationale:** Embedded BI platforms save up to $270,000 over 3 years. Unless customer analytics is your primary product differentiator, building in-house is financially inefficient.

---

### Use Case 11: Agency Operations Stack (Notion + Zapier vs. HubSpot Enterprise)
* **Dilemma:** Continuing to sync customer contacts and billing sheets via Zapier workarounds versus upgrading to HubSpot.
* **Decision-Intelligence Tool Rule:** **The Frankenstein Upgrade Test**
* **Evaluation Criteria:**
  * Data format degradation rate
  * API breakage frequency
  * Monthly manual troubleshooting effort
  * Workflow scaling fees
* **Trigger Threshold:** If manual troubleshooting exceeds 8 hours/month or data synchronization failures between Zapier modules become regular.
* **Verdict:** **MIGRATE TO HUBSPOT**
* **Rationale:** Fragile workarounds introduce a high tinkering tax. If the team wastes 8+ hours monthly fixing broken integrations, upgrading to a centralized CRM is mathematically superior.

---

### Use Case 12: AI Model Hosting (Local GPU Workstation vs. AWS Cloud Compute)
* **Dilemma:** Deploying an in-house 4-GPU workstation workstation versus renting AWS Cloud instances.
* **Decision-Intelligence Tool Rule:** **True Break-Even Horizon**
* **Input Parameters:**
  * **Workstation Hardware Cost ($C_{\text{workstation}}$):** $12,000
  * **System Administration overhead:** 5 hours / month
* **Calculations:**
  * Factor in electricity draw, air conditioning, hardware depreciation, and admin hourly rates against AWS compute, storage, and networking data egress tariffs.
* **Verdict:** **BUILD WORKSTATION**
* **Rationale:** For continuous inference workloads (high compute duty cycles), local hardware offsets cloud hourly bills. The break-even horizon is reached within approximately **10 months**.