# GiniLoh Decision-Intelligence Real-Life Examples

This document outlines four consumer (personal) and four enterprise (business) real-life decision scenarios. Each example models how the GiniLoh decision-intelligence framework resolves choices using cost-per-use, repair-vs-replace index scores, and tinkering tax time valuations.

---

## Part 1: Consumer & Personal Life Decisions

### Example 1.1: Espresso Machine vs. Local Café Coffee
* **dilemma:** Buying a $3,000 premium home espresso setup versus outsourcing to a café for $6.00 daily lattes.
* **Input Parameters:**
  * **Sticker Price ($):** $3,000
  * **Secondary Cost per drink ($):** $1.50 (coffee beans, milk, water filters, descaling chemical)
  * **Outsource Price per drink ($):** $6.00
  * **Weekly usage:** 5 drinks / week
  * **Lifespan Horizon:** 5 years
* **TCO Calculations:**
  * **Total Uses:** 5 drinks/week × 52 weeks × 5 years = 1,300 drinks
  * **Outsource TCO:** 1,300 drinks × $6.00 = $7,800
  * **Depreciation (35% loss):** $1,050
  * **Maintenance & Descaling (5% of sticker/year):** $3,000 × 0.05 × 5 years = $750
  * **Home TCO:** $3,000 (sticker) + (1,300 × $1.50) (operating) + $750 (maintenance) = $5,700
  * **Home Cost-Per-Use (CPU):** $5,700 / 1,300 = $4.38 per use
* **Break-Even Point:** 834 drinks (~38.4 months)
* **Verdict:** **BUY**
* **Rationale:** Home ownership saves $2,100 over 5 years. Home unit cost drops to $4.38 per use compared to the $6.00 outsourcing rate.

---

### Example 1.2: Local Deep Learning Rig vs. Cloud GPU Renting
* **dilemma:** Building a local PC deep learning computer for $3,500 versus renting cloud GPU compute at $1.80/hour.
* **Input Parameters:**
  * **Sticker Price ($):** $3,500
  * **Secondary Cost per use ($):** $0.45 / hour (electricity draw at 750W load under local utility rate)
  * **Outsource Price per use ($):** $1.80 / hour
  * **Weekly usage:** 12 active compute hours / week
  * **Lifespan Horizon:** 3 years
* **TCO Calculations:**
  * **Total Uses:** 12 hours/week × 52 weeks × 3 years = 1,872 run hours
  * **Outsource TCO (Cloud GPU):** 1,872 hours × $1.80 = $3,370
  * **Maintenance & Parts (5% of sticker/year):** $3,500 × 0.05 × 3 = $525
  * **Home TCO (Local GPU Rig):** $3,500 (sticker) + (1,872 × $0.45) (electricity) + $525 (maintenance) = $4,867
  * **Home Cost-Per-Use (CPU):** $4,867 / 1,872 = $2.60 per hour
* **Verdict:** **SKIP / OUTSOURCE**
* **Rationale:** Cloud GPU renting is financially superior. Your local rig cost is $2.60/hr compared to the $1.80/hr renting rate because your weekly compute density (12 hours) is not high enough to amortize the hardware CapEx.

---

### Example 1.3: Laptop Screen Repair vs. Buying New Laptop
* **dilemma:** Your 4-year-old laptop has a cracked display. The manufacturer quotes $450 for a screen replacement.
* **Input Parameters:**
  * **Asset Category:** Personal Electronics (Phone / Laptop)
  * **Asset Age:** 4 Years
  * **Immediate Repair Quote:** $450
* **Calculations:**
  * **Asset Debt Index ($I_{\text{asset}}$):** 4 years × $450 repair = 1,800
  * **Threshold:** 1,500
* **Verdict:** **REPLACE**
* **Rationale:** The asset tech debt index of 1,800 exceeds the electronics threshold of 1,500. Buying a new laptop is mathematically superior to patching outdated, depreciated hardware.

---

### Example 1.4: Spreadsheet Task Tracker vs. Paid Integrated App
* **dilemma:** Manually copy-pasting notes and tasks across 5 free spreadsheets versus paying $15/month for a unified task tracker app.
* **Input Parameters:**
  * **Tinkering/Troubleshooting time:** 4 hours / month
  * **Opportunity Value of Time:** $50 / hour
  * **Subscription Cost:** $15 / month
* **TCO Calculations:**
  * **Monthly Time Tax Cost:** 4 hours × $50 = $200 / month
  * **3-Year time drag cost:** $200/mo × 36 = $7,200
  * **3-Year App Subscription:** $15/mo × 36 = $540
  * **Net Reclaimed Value:** $7,200 - $540 = $6,660
* **Verdict:** **BUY / UPGRADE**
* **Rationale:** Upgrading to the paid app saves $6,660 in personal time value over 3 years by reclaiming 4 hours of manual copy-paste frustration per month.

---

## Part 2: Enterprise & Business decisions

### Example 2.1: CTO Custom User Authentication vs. Clerk
* **dilemma:** Building custom user logins, session tokens, and admin dashboards versus paying a managed CIAM platform (Clerk).
* **Input Parameters:**
  * **Monthly Active Users (MAUs):** 25,000
  * **Developer Loaded Hourly Rate:** $85 / hour
  * **Initial Custom Build Time:** 3 months
  * **Maintenance Overhead FTE:** 50% FTE
  * **Compliance Target Level:** SOC 2 Type II
* **TCO Calculations:**
  * **Custom Build Cost:** 3 months × 160 hrs × 1.5 devs × $85/hr = $61,200
  * **Custom Maintenance Cost:** 0.50 FTE × 160 hrs/mo × $85/hr = $6,800/mo ($244,800 over 3 years)
  * **Compliance Audit Cost:** $75,000 / year ($225,000 over 3 years)
  * **Developer Opportunity Cost:** $150,000
  * **Custom 3-Yr TCO:** $61,200 + $244,800 + $225,000 + $150,000 = $681,000
  * **SaaS Integration Cost:** 8 hours × $85 = $680
  * **SaaS Subscription Cost:** 25,000 MAUs = $25 base + (15,000 × $0.02 overages) = $325/mo ($11,700 over 3 years)
  * **SaaS 3-Yr TCO:** $680 + $11,700 = $12,380
* **Verdict:** **BUY**
* **Rationale:** Managed SaaS saves $668,620 by eliminating compliance audit preparation, middleware patch labor, and opportunity costs.

---

### Example 2.2: Startup MVP Authentication vs. Supabase Free Tier
* **dilemma:** Custom coding auth for a tiny validation MVP versus integrating a free open-source authentication tier.
* **Input Parameters:**
  * **Monthly Active Users (MAUs):** 500
  * **Developer Loaded Hourly Rate:** $60 / hour
  * **Initial Custom Build Time:** 1 month
  * **Maintenance Overhead FTE:** 10% FTE
  * **Compliance Target Level:** None
* **TCO Calculations:**
  * **Custom Build Cost:** 1 month × 160 hrs × 1.5 devs × $60 = $14,400
  * **Custom Maintenance Cost:** 0.10 FTE × 160 hrs/mo × $60 = $960/mo ($34,560 over 3 years)
  * **Developer Opportunity Cost:** $150,000
  * **Custom 3-Yr TCO:** $14,400 + $34,560 + $150,000 = $198,960
  * **SaaS TCO:** 8 hours × $60 (integration) + $0/mo subscription = $480
* **Verdict:** **BUY**
* **Rationale:** Even at MVP scale, SaaS saves $198,480 in developer opportunity costs and initial coding labor.

---

### Example 2.3: Security Audit Prep vs. Auth0 B2B Essentials
* **dilemma:** Upgrading a custom auth database to meet enterprise SOC 2 compliance standards versus buying Auth0.
* **Input Parameters:**
  * **Monthly Active Users (MAUs):** 15,000
  * **Developer Loaded Hourly Rate:** $110 / hour
  * **Initial Custom Build Time:** 4 months
  * **Maintenance Overhead FTE:** 60% FTE
  * **Compliance Target Level:** SOC 2 Type II
* **TCO Calculations:**
  * **Custom Build Cost:** 4 months × 160 hrs × 1.5 devs × $110 = $105,600
  * **Custom Maintenance Cost:** 0.60 FTE × 160 hrs/mo × $110 = $10,560/mo ($380,160 over 3 years)
  * **Compliance Audit Cost:** $75,000 / year ($225,000 over 3 years)
  * **Developer Opportunity Cost:** $150,000
  * **Custom 3-Yr TCO:** $105,600 + $380,160 + $225,000 + $150,000 = $860,760
  * **SaaS TCO:** 8 hours × $110 (integration) + $125/mo subscription = $880 + $4,500 = $5,380
* **Verdict:** **BUY**
* **Rationale:** SaaS saves $855,380 by resolving the compliance audit burden and access control configuration labor.

---

### Example 2.4: Legacy custom Auth refactoring
* **dilemma:** Refactoring a 5-year-old custom user session codebase to fix critical access control vulnerabilities versus migrating to SaaS.
* **Input Parameters:**
  * **Codebase Age:** 5 Years
  * **Remediation Hours Required:** 80 Hours (to patch access bypass middleware)
  * **Developer Loaded Hourly Rate:** $90 / hour
* **Calculations:**
  * **Remediation Labor Cost:** 80 hours × $90 = $7,200
  * **Software Index ($I_{\text{software}}$):** 5 years × $7,200 = 36,000
  * **Threshold:** 5,000
* **Verdict:** **REPLACE (BUY SaaS)**
* **Rationale:** Codebase tech debt index of 36,000 exceeds the 5,000 threshold. Refactoring a custom security pipeline is a high liability; migrating to standard SaaS is mathematically superior.
