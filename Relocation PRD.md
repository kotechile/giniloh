Product Requirements Document (PRD)
Relocation Payback and Tax Adjustment Modeler Application (v1.0)
1. Document Control & Overview
1.1 Document Metadata
Status: Ready for Review
Date: June 17, 2026
Author: Principal Systems Architect & Lead Mobility Product Owner
Target Audience: Engineering, Quality Assurance, UX/UI Design, and Corporate Mobility Operations Teams
1.2 Product Vision
The Relocation Payback and Tax Adjustment Modeler is an enterprise-grade financial analytics application designed to calculate the precise net-of-tax break-even period for employees undergoing career-induced geographic relocation. Following the permanent extension of the Tax Cuts and Jobs Act (TCJA) individual provisions under the One Big Beautiful Bill Act (OBBBA) of July 4, 2025, civilian relocation expenses are treated as fully taxable supplemental wages. This application addresses the resulting financial complexity by integrating a dynamic, multi-jurisdictional tax engine, prorated rental termination calculations, and localized cost-of-living metrics.
2. User Personas
2.1 Corporate Recruiter / Global Mobility Manager (HR Admin)
Goal: Model competitive relocation packages, calculate compliant tax gross-ups, and structure legally enforceable relocation payback (stay-or-pay) agreements.
Pain Points: Manually tracking complex multi-jurisdictional tax changes, applying inaccurate flat-rate gross-ups that leave candidates with surprise tax bills, and ensuring clawback agreements comply with strict state laws like California's Assembly Bill 692 (AB 692).
2.2 Relocating Employee (End User)
Goal: Determine the true net-of-tax financial return of a proposed career transition and estimate out-of-pocket friction costs before signing an offer.
Pain Points: Failing to understand how standard cost-of-living differences, localized tax brackets, and lease break penalties impact a gross salary increase.
3. Functional Specifications & Feature Scope
3.1 Epic 1: Relocation Logistics Expense Ledger
The core interface must feature a digital checklist-ledger to categorize and record all physical, transit, and administrative relocation costs.
FR-1.1: Pre-populated Categorization: The system must automatically split expenses into origin services, physical transit logistics, and destination setup overhead.
FR-1.2: Civilian Tax Mapping: Under the federal OBBBA rules, the ledger must automatically designate civilian moving expenses as taxable supplemental compensation.
FR-1.3: Military & Intelligence Exemption Rules: The system must provide a profile toggle for "Active-Duty Military" or "Intelligence Community Member." When selected, the application must map qualified logistics costs as non-taxable under IRC Section 132(g) and Code Section 217.
FR-1.4: State-Specific Exceptions Engine: If the destination state is California, New York, New Jersey, Massachusetts, Pennsylvania, Arkansas, or Hawaii, the system must calculate state-level deductions for qualifying physical moving costs following pre-TCJA guidelines.
3.2 Epic 2: Housing Transition & Lease-Break Engine
This module calculates lease-termination liabilities, overlapping rental obligations, and deposit recovery offsets.
FR-2.1: Multi-Method Rental Proration: The application must calculate the prorated rent for partial-month occupancies using three selectable formulas:
Daily Rate Method (Calendar Standard):
R 
p
​	
 =( 
D 
m
​	
 
R 
m
​	
 
​	
 )×D 
o
​	
 
Annual Rate Method:
R 
p
​	
 =( 
365
R 
m
​	
 ×12
​	
 )×D 
o
​	
 
Banker’s Month Method:
R 
p
​	
 =( 
30
R 
m
​	
 
​	
 )×D 
o
​	
 
FR-2.2: Net Lease Break Cost Calculation: The system must aggregate the prorated final rent (R 
p
​	
 ), flat contract penalties (F 
c
​	
 ), and estimated lost security deposits (D 
loss
​	
 ), offset by employer mitigation allowances (A 
m
​	
 ), to find the net financial friction (F 
net
​	
 ):
F 
net
​	
 =R 
p
​	
 +F 
c
​	
 +D 
loss
​	
 −A 
m
​	
 
3.3 Epic 3: Multi-Jurisdictional Tax and Salary Engine
A background microservice must calculate net take-home pay before and after relocation, incorporating federal, state, and local taxes.
FR-3.1: Federal Tax Standard Alignment: The tax calculator must apply OBBBA rules for the 2026 tax year, utilizing the permanent seven-bracket structure (10%, 12%, 22%, 24%, 32%, 35%, 37%) and standard deductions ($16,100 for single, $32,200 for married filing jointly).
FR-3.2: Local Income Tax Resolution: The tax calculations must resolve down to municipal and school district income tax levels by mapping addresses to regional rates (such as Baltimore City's 3.20% local rate).
FR-3.3: Dynamic Exemption Phase-Outs: The engine must dynamically calculate personal exemption phase-outs based on Adjusted Gross Income (AGI) (such as Maryland's exemption step-down from $3,200 to $800 for high earners).
3.4 Epic 4: Net-of-Tax Salary Break-Even Engine
This module calculates the exact number of months required to recover upfront relocation expenses using the post-move net salary increase.
FR-4.1: Break-Even Calculation: The system must compute the payback period (T 
break−even
​	
 ) by dividing net out-of-pocket relocation costs (C 
net_out_of_pocket
​	
 ) by the monthly net take-home salary differential (I 
net_monthly
​	
 ):
T 
break−even
​	
 = 
I 
net_monthly
​	
 
C 
net_out_of_pocket
​	
 
​	
 
FR-4.2: Visual Amortization Schedule: The user interface must display an interactive monthly payback chart showing cumulative cash flow, the initial debt valley, and the precise month where the curves cross (the break-even point).
3.5 Epic 5: Tax Gross-Up Optimization Engine
For corporate users, the application must compute the necessary tax assistance required to deliver a guaranteed net relocation benefit.
FR-5.1: Calculation Formulas: The gross-up engine must support three standard formulas:
Flat/Simple Method:
G 
flat
​	
 =E 
net
​	
 ×(1+R 
combined
​	
 )
Supplemental Inverse (Tax-on-Tax Method):
Gross= 
1−R 
combined
​	
 
E 
net
​	
 
​	
 
Marginal True-Up Method: An iterative algorithm that simulates the candidate's total projected annual tax returns before and after relocation to calculate the exact tax variance.
FR-5.2: Composite Rate Assembly: The combined tax rate (R 
combined
​	
 ) must incorporate federal supplemental rates (typically 22%), FICA (7.65% up to the $184,500 Social Security wage base; 1.45% plus potential additional Medicare above), and marginal state and local income tax rates.
3.6 Epic 6: Clawback Amortization and Regional Compliance Module
This module designs stay-or-pay agreements and monitors regional compliance with local labor laws.
FR-6.1: Amortization Model Generation: The system must generate repayment schedules for 12-to-24-month retention horizons using either Cliff or Graduated Linear models.
FR-6.2: California AB 692 Compliance Guardrails: If the employee's post-relocation work location is in California, the system must enforce strict statutory compliance rules:
Reject any cliff-repayment model; enforce a graduated linear decay schedule.
Limit the maximum retention period to two years (T 
s
​	
 ≤24 months).
Enforce a 0.00% interest rate limit on outstanding clawback liabilities.
Generate a standalone contract PDF separate from the primary employment offer, incorporating a mandatory five-business-day legal review disclosure.
Include a mandatory field for the employee to choose a payment deferral option.
4. Technical Architecture & System Data Flow
4.1 System Components
Geocoding Service: Resolves physical addresses into precise state, county, and school district FIPS codes.
Tax Database: A read-optimized, heavily cached relational database updated annually with federal OBBBA tables, state-specific rules, and county withholding rates.
Compliance Service: A business rules engine that validates contract variables against regional labor laws.
4.2 Data Schema (Key Database Entities)
Table 4.1: Relocation Scenario Schema
Field Name	Data Type	Required	Description
scenario_id	UUID	Yes	
Unique identifier for the user's calculation.
origin_address	String	Yes	Original physical address of the user.
destination_address	String	Yes	Prospective physical address of the user.
filing_status	Enum	Yes	
Single, MFJ, MFS, HOH, or Qualifying Surviving Spouse.
base_salary_origin	Decimal	Yes	
Current gross annual salary.
base_salary_dest	Decimal	Yes	
Proposed gross annual salary.
gross_up_method	Enum	No	
Flat, Supplemental Inverse, or Marginal True-Up.
Table 4.2: Expense Checklist Schema
Field Name	Data Type	Required	Description
expense_id	UUID	Yes	
Unique identifier for the checklist item.
scenario_id	UUID	Yes	Foreign key reference to the relocation scenario.
category	Enum	Yes	
Origin Services, Logistics, or Destination Setup.
cost_amount	Decimal	Yes	
Estimated or actual out-of-pocket cost.
reimbursed_flag	Boolean	Yes	
Indicates if the expense is covered by the employer.
grossed_up	Boolean	Yes	
Indicates if tax gross-up is applied to this reimbursement.
5. Multi-Jurisdictional Tax Rules Engine Specifications
The application's tax calculations must align with standard federal and state rules, as detailed in the following specifications:
5.1 Federal Level (Tax Year 2026 under OBBBA)
Standard Deductions: $16,100 (Single), $32,200 (Married Filing Jointly), $24,150 (Head of Household).
Tax Bracket Step-Ups: Implement sequential tax brackets: 10%, 12%, 22%, 24%, 32%, 35%, and 37%.
Civilian Relocation Treatment: All employer-paid relocation costs must be added to gross taxable wages in Boxes 1, 3, and 5 of the W-2.
5.2 State and Local Exceptions (Conformity Engine)
Standard Exclusions: The system must identify and exclude qualified relocation expenses from state-level income calculations in California, New York, New Jersey, Massachusetts, Pennsylvania, Arkansas, and Hawaii.
Standard Deductions Modifications: The application must utilize state-specific standard deductions, including Virginia's $8,750 (Single) / $17,500 (Joint) standard deductions, and Maryland's updated standard deduction of $4,100 (Single) / $8,200 (Joint) under HB 0411.
Personal Exemptions Engine: Maintain progressive exemption phase-outs, applying Virginia’s standard $930 exemption alongside Maryland’s dynamic step-down scale (phasing down from $3,200 to $800 based on AGI).
6. Non-Functional, Security & Compliance Requirements
6.1 Performance and Latency
Target Calculation Speed: Full multi-scenario calculations must complete in less than 500ms under standard network conditions.
Database Query Performance: Read operations on geocoding maps and tax tables must be completed within 15ms by utilizing Redis cache layers.
6.2 Security & Data Privacy
Encryption Standards: All personally identifiable financial information, salary values, and physical addresses must be encrypted in transit using TLS 1.3 and at rest using AES-256.
Access Controls: Implement role-based access control (RBAC) to ensure corporate users can view aggregate reporting statistics but cannot access individual employee salary profiles without express system authorization.
6.3 Compliance Update Lifecycle
Annual Tax Updates: Global tax rules, inflation-adjusted standard deductions, and county income tax rates must be updated in the system by December 15 of each year, ensuring total calculation accuracy ahead of the upcoming tax year.