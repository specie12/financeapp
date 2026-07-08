# Competitive Analysis: Finance App vs Empower (Personal Capital)

**Date:** February 16, 2026
**Version:** 1.0
**Classification:** Internal Use Only — Confidential
**Prepared by:** Product & Engineering Team

---

## Executive Summary

Empower (formerly Personal Capital) is the dominant free financial aggregation platform in the US market, with 3.3 million registered dashboard users and $100B+ in assets under administration across its advisory business. Its free tier serves primarily as a lead-generation funnel for paid wealth management services starting at $100K minimum. Our Finance App competes directly with Empower's free dashboard while offering substantially deeper budgeting, AI-powered insights, scenario modeling, and financial calculators — all without aggressive upselling. Our key strategic advantages are feature depth in budgeting and planning, a modern AI-native architecture, and a user-first business model that doesn't treat free users as sales leads. Where Empower leads — brand trust, bank connectivity maturity, Monte Carlo simulations, and human advisory access — we have clear paths to close each gap.

---

## Company Profiles

### Empower (formerly Personal Capital)

| Attribute          | Detail                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Founded**        | 2009 (as Personal Capital, by Bill Harris — former CEO of PayPal and Intuit)                               |
| **Acquisition**    | Acquired by Empower Retirement in August 2020 for up to $1B ($825M at close + $175M earnout)               |
| **Rebrand**        | Transitioned from Personal Capital to Empower Personal Dashboard in February 2023                          |
| **Parent Company** | Great-West Lifeco (Canadian financial services conglomerate)                                               |
| **Business Model** | Freemium funnel — free dashboard generates leads for paid advisory services (0.89% AUM fee, $100K minimum) |
| **Free Users**     | 3.3 million registered dashboard users                                                                     |
| **Advisory AUM**   | $28.5B direct AUM across 31,800+ advisory clients                                                          |
| **Total AUA**      | $100B+ across Personal Wealth division; ~$2T across all Empower business units                             |
| **Employees**      | 1,500+ advisors, planners, and specialists in the Personal Wealth division                                 |
| **Headquarters**   | Denver, Colorado                                                                                           |

### Our Finance App

| Attribute               | Detail                                                                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Architecture**        | TypeScript monorepo — NestJS API, Next.js web app, Expo React Native mobile app                                                                                              |
| **Tech Stack**          | PostgreSQL/Prisma, React 19, Tailwind CSS, Radix UI, Recharts                                                                                                                |
| **AI Engine**           | Anthropic Claude (Sonnet 4.5) for financial advice, chat, anomaly detection, and natural language queries                                                                    |
| **Bank Connectivity**   | Plaid integration for account linking and transaction sync                                                                                                                   |
| **Target Audience**     | Financially engaged individuals and households who want deep control over budgeting, investments, tax planning, and scenario modeling — without being sold advisory services |
| **Business Model**      | Three-tier SaaS (Free, Pro, Premium) with transparent feature gating                                                                                                         |
| **Key Differentiators** | AI-native financial insights, comprehensive budgeting, scenario modeling engine, financial decision calculators, multi-user household support, rental property management    |

---

## Feature Comparison Matrix

| Feature                    | Empower                                                 | Our App                                                                                                             | Advantage   |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Net Worth Tracking**     | Automated via linked accounts                           | Automated + manual entry with multi-year projections                                                                | Ours        |
| **Account Aggregation**    | Plaid + Yodlee (broadest coverage)                      | Plaid integration                                                                                                   | Empower     |
| **Budgeting**              | Single monthly spending goal only                       | Category-level budgets with weekly/monthly/quarterly/yearly periods, spending suggestions, templates                | **Ours**    |
| **Transaction Management** | Auto-import with basic categorization                   | Auto-import + hierarchical categories with icons/colors, income/expense/transfer types                              | Ours        |
| **Investment Tracking**    | Portfolio view with benchmark comparison                | Portfolio with ticker data, sector allocation, dividend projections, performance metrics                            | Comparable  |
| **Fee Analyzer**           | Best-in-class expense ratio analysis                    | Not yet implemented                                                                                                 | **Empower** |
| **Retirement Planner**     | Monte Carlo simulations with scenario modeling          | Scenario-based projections (deterministic, up to 30 years)                                                          | Empower     |
| **Scenario Modeling**      | Limited to retirement planner context                   | Full scenario engine with entity-level overrides, side-by-side comparison, up to 30-year horizons                   | **Ours**    |
| **AI Financial Insights**  | None (human advisors only, paid)                        | 5 AI features: advice, chat, anomaly detection, NL queries, forecasting                                             | **Ours**    |
| **Financial Calculators**  | Basic retirement calculator                             | Rent vs Buy, Mortgage vs Invest (with affordability analysis, break-even calculations)                              | **Ours**    |
| **Tax Planning**           | Free: none; Paid: $100K+ minimum, full planning at $1M+ | Tax profile, bracket visualization, deduction analysis, estimated liability — included in Premium                   | **Ours**    |
| **Goal Tracking**          | Basic retirement goal                                   | Multi-type goals (net worth, savings, debt freedom) with linked entities, milestones, progress insights             | **Ours**    |
| **Loan Management**        | Basic liability view                                    | Full amortization schedules, extra payment simulations, payoff optimization                                         | **Ours**    |
| **Rental Properties**      | Not supported                                           | Dedicated module: NOI, cap rate, cash-on-cash, DSCR, portfolio metrics                                              | **Ours**    |
| **Household Support**      | Single user                                             | Multi-user households with role-based permissions (owner/editor/viewer)                                             | **Ours**    |
| **Mobile App**             | iOS + Android (native)                                  | Expo React Native (iOS + Android)                                                                                   | Comparable  |
| **Cash Account**           | High-yield savings (~4.70% APY, FDIC insured)           | Not offered                                                                                                         | Empower     |
| **Human Advisors**         | Fiduciary advisors at $100K+                            | Not offered                                                                                                         | Empower     |
| **Live Market Data**       | Real-time portfolio tracking                            | Mock data (development); designed for real API integration                                                          | Empower     |
| **Notifications**          | Basic alerts                                            | 6 notification types: budget exceeded, goal milestone, bill due, large transaction, net worth milestone, AI insight | Ours        |
| **Data Export**            | Limited                                                 | API-driven architecture (extensible)                                                                                | Comparable  |

---

## Our Competitive Advantages

### 1. Budgeting Depth

Empower's budgeting is its most widely criticized limitation. Users can only set a single monthly spending goal — no category-level budgets, no envelope method, no period flexibility. Our app offers:

- **Category-scoped budgets** with specific dollar amounts per category
- **Four budget periods**: weekly, monthly, quarterly, yearly
- **Spending suggestions** based on historical spending patterns
- **Budget templates** for quick setup
- **Automatic alerts** when spending reaches 80%+ of a budget limit
- **Visual spending breakdowns** with category bar charts and allocation views

This is a direct competitive wedge against former Mint users who found Empower's budgeting inadequate after Mint's shutdown.

### 2. AI-Powered Financial Insights (5 Distinct Features)

Empower offers no AI features to free users. Our app integrates Anthropic Claude across five capabilities:

| AI Feature                   | What It Does                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Financial Advice**         | Analyzes full financial context and returns 3-6 categorized insights with severity levels (info/warning/success/critical)                      |
| **AI Chat**                  | Multi-turn conversational interface with full financial context — users can ask questions about their finances in natural language             |
| **Natural Language Queries** | Ask free-form questions about financial data (e.g., "How much did I spend on dining last month?") and get structured answers with data sources |
| **AI Forecasting**           | Predicts month-end balances using current balances, cash flow items, and actual spending rate with confidence levels                           |
| **Anomaly Detection**        | Flags categories with 50%+ spending increases vs. prior period with severity grading                                                           |

Additionally, the system generates **AI-powered weekly digest notifications** summarizing financial activity.

### 3. Scenario Modeling Engine

Empower's scenario capabilities are limited to its retirement planner context. Our scenario engine is a general-purpose financial modeling tool:

- **Entity-level overrides**: Modify any field on any asset, liability, or cash flow item per scenario
- **Multi-scenario comparison**: Run scenarios side-by-side with visual projection charts
- **Configurable horizons**: Up to 30 years (Premium tier)
- **Baseline designation**: Mark any scenario as the reference point
- **Year-by-year projections**: Net worth, income, expenses, cash flow, and debt payments projected independently

Use cases: "What if I pay off the mortgage early?", "What if I change jobs and take a 20% pay cut?", "What if I buy a rental property?"

### 4. Financial Decision Calculators

Our app includes purpose-built calculators that Empower doesn't offer:

**Rent vs Buy Calculator**

- Year-by-year cost comparison over 1-30 years
- Full cost modeling: mortgage P+I, property tax, HOA, insurance, maintenance, closing/selling costs vs. rent, deposit, renters insurance
- 10 configurable assumptions (appreciation, investment returns, inflation, tax rates, etc.)
- Integrated affordability analysis using the user's actual income data (28% housing rule, 36% debt rule)
- Clear recommendation output: buy, rent, or neutral with break-even year

**Mortgage vs Invest Calculator**

- Compares paying extra on a mortgage vs. investing that amount
- Accounts for capital gains tax and mortgage interest deductibility
- Break-even return rate calculation
- Clear recommendation with year-by-year comparison

### 5. No Aggressive Upselling

Empower's most common user complaint is persistent sales outreach. Free dashboard users report unwanted phone calls and emails from advisors. The free tool exists explicitly as a sales funnel.

Our business model is transparent SaaS with three tiers:

| Tier        | What You Get                                                                      |
| ----------- | --------------------------------------------------------------------------------- |
| **Free**    | 3 scenarios, 10-year horizon, 5 AI calls/day, core features                       |
| **Pro**     | 10 scenarios, 20-year horizon, 50 AI calls/day, 3 Plaid connections               |
| **Premium** | Unlimited scenarios, 30-year horizon, unlimited AI, tax features, unlimited Plaid |

No sales calls. No advisory funnel. No treating users as leads.

### 6. Tax Planning (Free vs Empower's $100K+ Paywall)

Empower offers zero tax features to free users. Tax-loss harvesting requires $100K+ in managed assets. Full tax planning requires $1M+.

Our app includes (at the Premium tier):

- Tax profile management (filing status, state, dependents)
- Federal tax bracket breakdown (2024 brackets)
- Estimated tax liability calculation
- Effective and marginal tax rate display
- Deduction analysis (mortgage interest, property tax, standard deduction)
- Filing status optimization (single, married filing jointly/separately, head of household)

### 7. Goal Tracking with Linked Entities

Empower's goal tracking is limited to basic retirement readiness. Our goal system is comprehensive:

- **Three goal types**: Net worth target, savings target, debt freedom
- **Linked entities**: Goals can be linked to specific assets and/or liabilities for automatic progress tracking
- **Progress analytics**: Percent complete, on-track indicator, projected completion date, days remaining
- **Milestone insights**: Monthly savings needed, current savings rate, 25/50/75/100% milestones, ahead-of-schedule detection
- **Bulk views**: All-goals progress dashboard and insights panel

### 8. Rental Property Management

Empower has no rental property features. Our dedicated module provides:

- Full property CRUD with purchase price, current value, rent, vacancy, expenses, mortgage details
- **Five key metrics per property**: NOI, Cap Rate, Cash-on-Cash Return, Gross Rent Multiplier, DSCR
- Portfolio-level summary: Total properties, total value, total equity, total monthly rent, total NOI, average cap rate, average cash-on-cash
- Linkable to assets and liabilities for integrated net worth tracking

This is a significant differentiator for the growing population of individual real estate investors.

### 9. Multi-User Household Support

Empower is a single-user platform. Our app supports multi-user households with role-based access:

| Role       | Permissions                        |
| ---------- | ---------------------------------- |
| **Owner**  | Full CRUD on all resources         |
| **Editor** | Create and update resources        |
| **Viewer** | Read-only access to household data |

This enables couples and families to collaboratively manage finances with appropriate access controls — a feature Empower simply doesn't offer.

### 10. Mobile-First Architecture

While Empower has native iOS and Android apps, their Android experience is notably worse (4.1 vs 4.6 rating) and the mobile app lacks feature parity with the web interface.

Our Expo React Native architecture provides:

- Single codebase for iOS and Android
- Shared API client, types, and validation with the web app
- Feature parity by design (same API, same business logic)
- Secure JWT authentication with SecureStore

---

## Where Empower Leads

### 1. Brand Recognition and Trust

**The Gap:** Empower has 15+ years of brand equity, backing from a $2T financial institution, and 3.3 million users. Our app is new and unproven in the market.

**Gap-Closing Strategy:** Focus on community-driven growth in personal finance communities (Reddit r/personalfinance, Bogleheads, ChooseFI). Position as the "post-Mint, post-Personal Capital" tool for users frustrated with Empower's direction. Leverage the significant negative sentiment from the rebrand.

### 2. Bank Connectivity Maturity

**The Gap:** Empower uses both Plaid and Yodlee, giving access to the broadest range of financial institutions. Their connections have been refined over 15 years. We use Plaid only.

**Gap-Closing Strategy:** Plaid covers the majority of US financial institutions. Consider adding a secondary aggregator (MX, Finicity) for edge cases. Prioritize connection reliability and clear error messaging over breadth initially.

### 3. Fee Analyzer

**The Gap:** Empower's fee analyzer is widely regarded as best-in-class — it calculates weighted average expense ratios and projects long-term fee drag in dollar terms. We don't have this feature.

**Gap-Closing Strategy:** Implement a fee analyzer module that reads expense ratio data from linked investment accounts. This is a bounded, well-defined feature that can be built using existing investment data infrastructure. **Priority: High — this is a frequently cited reason users choose Empower.**

### 4. Monte Carlo Retirement Planner

**The Gap:** Empower runs probabilistic Monte Carlo simulations using historical return distributions. Our scenario engine uses deterministic projections.

**Gap-Closing Strategy:** Add a Monte Carlo simulation layer to the existing scenario engine in `packages/finance-engine`. This requires: historical return distribution data, a simulation runner (1,000-10,000 iterations), and probability-of-success output. The scenario infrastructure already exists — this is an enhancement, not a new system.

### 5. High-Yield Cash Account

**The Gap:** Empower offers a competitive FDIC-insured high-yield savings account (~4.70% APY). This is a banking product we cannot easily replicate.

**Gap-Closing Strategy:** This is not a priority to replicate directly. Instead, integrate with existing high-yield savings providers via referral partnerships. Focus engineering resources on features that are harder for Empower to replicate (AI, scenario modeling).

### 6. Human Advisory Access

**The Gap:** Empower provides access to fiduciary financial advisors (at $100K+ minimum). Our app has no human advisory component.

**Gap-Closing Strategy:** Our AI capabilities (advice, chat, queries, forecasting, anomaly detection) serve as a scalable alternative to human advisory for the vast majority of users. Long-term, consider partnerships with fee-only financial planners for users who want human guidance, offered at transparent hourly rates rather than AUM-based fees.

### 7. Live Market Data

**The Gap:** Empower provides real-time portfolio tracking with live market prices. Our market data module currently uses mock data.

**Gap-Closing Strategy:** Integrate a market data API (Alpha Vantage, Polygon.io, or IEX Cloud) to replace mock data. The infrastructure is already built — `MarketDataService`, ticker data types, portfolio performance calculations, and frontend components are all in place. This is a configuration change, not an architecture change. **Priority: High — this is table stakes for investment tracking.**

---

## Empower's Vulnerabilities

### 1. Sales Funnel Complaints — A Structural Weakness

Empower's business model creates a fundamental conflict: the free product exists to generate advisory leads, not to serve free users. This means:

- Every free user is a potential sales target
- Product decisions optimize for conversion, not user satisfaction
- Users with $100K+ assets receive the most aggressive outreach — precisely the power users who would benefit most from the free tools

**Our Opportunity:** Position explicitly as "the financial dashboard that doesn't try to sell you anything." This resonates strongly in communities like Bogleheads, FIRE, and r/personalfinance where self-directed investing is the norm.

### 2. Post-Rebrand Technical Disaster

The February 2023 migration from Personal Capital to Empower Personal Dashboard was poorly executed:

- App Store ratings declined from 4.7 to as low as 3.1 during the transition period
- Transaction history disappeared for some users
- Account connections broke and required re-authentication
- The budgeting tab failed to load entirely for some users
- Known issues remain documented in Empower's own support portal years later

**Our Opportunity:** Displaced Personal Capital loyalists are actively seeking alternatives. Target these users with migration-friendly onboarding and content marketing addressing specific Empower pain points.

### 3. Poor Customer Support (1.7/5 on Trustpilot)

Empower's Trustpilot rating of approximately 1.7 out of 5 reflects systematic support failures:

- 45+ minute hold times
- Unreturned callbacks
- Slow resolution of account connectivity issues
- Support quality decline correlating with the post-acquisition period

**Our Opportunity:** Responsive support as a competitive differentiator. Even basic SaaS-standard support (email response within 24 hours, documented troubleshooting) would represent a significant improvement over what Empower users experience.

### 4. Shallow Budgeting — The Mint Migration Gap

When Mint shut down in early 2024, millions of users needed a new budgeting tool. Empower was the most prominent alternative — but its single-spending-goal budgeting disappointed former Mint users who relied on category-level budgets.

**Our Opportunity:** Our category-scoped budgets with multiple periods, templates, and spending suggestions directly address what Empower cannot offer. Target "Mint refugees" and "Empower budgeting alternative" search traffic.

### 5. Limited Investment Flexibility for Advisory Clients

Empower's advisory service has meaningful limitations:

- Cannot manage employer-sponsored 401(k) plans
- ETF-only portfolios below $200K; individual stocks only at $200K+
- Bonds only available at $1M+ (Private Client tier)
- Tax-loss harvesting restricted to advisory clients

**Our Opportunity:** Our investment tracking, scenario modeling, and tax planning tools give users sophisticated analysis capabilities without requiring them to hand over portfolio management. This appeals to the self-directed investor segment.

---

## Market Positioning

### Target Audience Comparison

| Dimension              | Empower                                                                            | Our App                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Primary Audience**   | High-net-worth individuals ($100K+ investable) who may convert to advisory clients | Financially engaged individuals and households who want deep control without advisory upselling |
| **Secondary Audience** | Passive investors who want automated tracking                                      | Active planners, real estate investors, FIRE community, couples managing joint finances         |
| **User Relationship**  | Free users are leads; paying users are advisory clients                            | All users are customers with transparent tier-based access                                      |
| **Retention Model**    | Dashboard engagement drives advisory conversion                                    | Feature depth and AI insights drive tier upgrades                                               |

### Pricing Model Comparison

|                  | Empower Free    | Empower Advisory                 | Our Free       | Our Pro        | Our Premium    |
| ---------------- | --------------- | -------------------------------- | -------------- | -------------- | -------------- |
| **Cost**         | $0              | 0.89% of AUM ($890/yr per $100K) | $0             | TBD            | TBD            |
| **Minimum**      | None            | $100,000                         | None           | None           | None           |
| **Budgeting**    | Single goal     | Single goal                      | Category-level | Category-level | Category-level |
| **AI Features**  | None            | None                             | 5 calls/day    | 50 calls/day   | Unlimited      |
| **Scenarios**    | Retirement only | Retirement only                  | 3 scenarios    | 10 scenarios   | Unlimited      |
| **Tax Features** | None            | Tax-loss harvesting              | None           | None           | Full suite     |
| **Bank Links**   | Unlimited       | Unlimited                        | None           | 3              | Unlimited      |
| **Hidden Cost**  | Sales calls     | AUM fee                          | None           | None           | None           |

### Business Model Contrast

**Empower:** Revenue comes from AUM-based advisory fees. The free dashboard is a cost center justified by advisory client acquisition. This creates inherent tension — product decisions for the free tier are subordinate to conversion metrics.

**Our App:** Revenue comes from SaaS subscriptions. Every tier is a revenue opportunity. Product decisions optimize for user satisfaction and upgrade conversion, not sales funnel metrics. This alignment between user interests and business interests is a structural advantage.

---

## Development Priority Recommendations

### Priority Matrix

| Priority          | Feature                                    | Impact | Effort | Rationale                                                                                  |
| ----------------- | ------------------------------------------ | ------ | ------ | ------------------------------------------------------------------------------------------ |
| **P0 — Critical** | Live Market Data API Integration           | High   | Low    | Infrastructure exists; just needs real API. Table stakes for investment credibility.       |
| **P0 — Critical** | Fee Analyzer                               | High   | Medium | Top cited reason users choose Empower. Directly addressable with existing investment data. |
| **P1 — High**     | Monte Carlo Simulation Layer               | High   | Medium | Enhances existing scenario engine. Key differentiator for retirement planning.             |
| **P1 — High**     | Empower Migration Onboarding               | High   | Low    | Landing page + data import flow targeting displaced Empower/Personal Capital users.        |
| **P2 — Medium**   | Secondary Bank Aggregator                  | Medium | Medium | Add MX or Finicity alongside Plaid for broader institution coverage.                       |
| **P2 — Medium**   | Social Security Optimization Calculator    | Medium | Medium | Natural extension of calculators module; high value for retirement planners.               |
| **P2 — Medium**   | 401(k) Optimization Analysis               | Medium | Medium | Analyze employer plan options; Empower explicitly cannot do this.                          |
| **P3 — Future**   | Referral Partnerships (High-Yield Savings) | Low    | Low    | Partner with Wealthfront/Marcus for savings account referrals.                             |
| **P3 — Future**   | Fee-Only Advisor Marketplace               | Medium | High   | Connect users with fee-only planners at hourly rates (anti-AUM model).                     |
| **P3 — Future**   | Community Features                         | Medium | High   | Discussion forums, shared scenario templates, anonymized benchmarking.                     |

### Recommended Execution Order

1. **Immediate (Sprint 1-2):** Live market data API integration — replace mock data with Alpha Vantage or Polygon.io. All frontend infrastructure is already built.

2. **Near-term (Sprint 3-5):** Fee analyzer module — calculate expense ratios from linked investment accounts, project long-term fee drag, and display actionable recommendations.

3. **Medium-term (Sprint 6-8):** Monte Carlo simulation layer — add probabilistic analysis to the existing scenario/projection engine in `packages/finance-engine`.

4. **Ongoing:** Content marketing targeting Empower pain points — "budgeting alternative," "Personal Capital replacement," "no sales calls financial dashboard."

---

## Appendix: Research Sources

### Empower Company & Product

- [Empower Completes Personal Capital Acquisition](https://www.empower.com/press-center/empower-retirement-completes-personal-capital-acquisition)
- [Empower Personal Wealth Surpasses $100B AUA](https://www.empower.com/press-center/empower-personal-wealth-surpasses-100-billion-aua)
- [Empower Q2 2025 Earnings](https://www.empower.com/press-center/empower-reports-second-quarter-2025-base-earnings-247-million)
- [Empower Personal Strategy](https://www.empower.com/products-solutions/personal-strategy)
- [Empower Private Client](https://www.empower.com/products-solutions/private-client)
- [Empower Personal Cash](https://www.empower.com/cash)
- [Empower Management Fees (PDF)](https://docs.empower.com/PDF/p/misc/management_fee.pdf)
- [Empower Retirement Planner](https://www.empower.com/tools/retirement-planner)

### Reviews & Analysis

- [NerdWallet — Empower Review 2026](https://www.nerdwallet.com/financial-advisors/reviews/empower)
- [NerdWallet — Empower Budget App Review](https://www.nerdwallet.com/finance/learn/empower-personal-dashboard-budget-app-review)
- [Financial Samurai — Empower Review](https://www.financialsamurai.com/personal-capital-review-new-features-ceo-meeting/)
- [ChooseFI — Empower Review 2026](https://choosefi.com/review/empower-review-the-ultimate-net-worth-tracker)
- [The College Investor — Empower Review](https://thecollegeinvestor.com/4757/empower-review/)
- [Rob Berger — Empower Review](https://robberger.com/empower-review/)
- [Clark.com — Empower Review](https://clark.com/personal-finance-credit/investing-retirement/empower-review/)
- [SmartAsset — Empower Review](https://smartasset.com/financial-advisor/personalcapital-review)
- [CNBC Select — Empower Review 2026](https://www.cnbc.com/select/empower-review/)
- [Get Rich Slowly — Empower Pros & Cons](https://www.getrichslowly.org/empower-review/)
- [Go Curry Cracker — Empower Review](https://www.gocurrycracker.com/personal-capital-review/)
- [Millennial Money — Empower Review 2026](https://millennialmoney.com/personal-capital-review/)
- [WalletHacks — What Happened to Personal Capital?](https://wallethacks.com/what-happened-to-personal-capital/)

### User Sentiment & Complaints

- [Trustpilot — Empower Reviews](https://www.trustpilot.com/review/empower.me)
- [Bogleheads — Empower Update Broke Things](https://www.bogleheads.org/forum/viewtopic.php?t=462761)
- [Bogleheads — Empower Sync Issues](https://www.bogleheads.org/forum/viewtopic.php?t=424800)
- [White Coat Investor — Empower User Beware](https://forum.whitecoatinvestor.com/personal-finance-and-budgeting/398995-personal-capital-empower-user-beware/)
- [Fired to Freedom — The Fall of Personal Capital](https://firedtofreedom.com/2023/03/22/the-fall-of-personal-capital/)
- [Empower Support — Current Known Issues](https://support-personalwealth.empower.com/hc/en-us/sections/200564554-Current-Known-Issues)

### App Store Listings

- [Apple App Store — Empower Personal Dashboard](https://apps.apple.com/us/app/empower-personal-dashboard/id504672168)
- [Google Play — Empower Personal Dashboard](https://play.google.com/store/apps/details/Empower_Personal_Dashboard?id=com.personalcapital.pcapandroid)

---

_This document is based on publicly available information and internal codebase analysis as of February 2026. Market data, ratings, and feature availability are subject to change._
