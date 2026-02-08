# Finance App — Product Audit Findings

**Audit Date:** February 7, 2026
**Codebase:** `financeapp/` (monorepo — NestJS API, Next.js 15 frontend, shared packages)
**Methodology:** Static analysis of all source files, Prisma schema, API client, frontend routes, and package dependencies.

---

## 1. Executive Summary

The Finance App delivers strong depth in **wealth tracking, loan analytics, investment monitoring, goal tracking, and scenario planning**. These pillars are production-quality with full backend/frontend integration, a dedicated finance-engine package, and comprehensive type safety across the stack.

However, the product is **missing its entire budgeting/expense-tracking pillar** despite having the database models ready, has **zero AI integration**, and lacks several differentiating features (mortgage-vs-invest engine, rental property analytics, notifications, tax planning). The gap between "what the schema can support" and "what users can actually access" is the single biggest product risk.

**Overall Product Alignment Score: 48%**

---

## 2. Gap Analysis

### Feature 1: Unified Dashboard

| Attribute    | Detail        |
| ------------ | ------------- |
| **Status**   | Partial (65%) |
| **Severity** | High          |

**What Exists:**

- Net worth summary with asset/liability breakdown by type — `apps/api/src/dashboard/dashboard.service.ts:44-130`
- 5-year projection engine — `packages/finance-engine/src/projection/projection.ts`
- Dashboard layout with navigation to 7 sections — `apps/web/src/app/dashboard/layout.tsx:9-17`
- Landing page redirects to net-worth — `apps/web/src/app/dashboard/page.tsx:4`

**What's Missing:**

- No unified "at-a-glance" dashboard combining all financial metrics on one screen
- No budget status widgets (budgets exist in DB but no dashboard integration)
- No cash flow visualization (income vs expenses over time)
- No recent transactions feed
- No bills/upcoming payments section
- No AI-generated insights panel
- Nav items only cover: Net Worth, Goals, Loans, Investments, Rent vs Buy, Scenarios, Settings — no Budget or Cash Flow tabs

**Evidence:** The dashboard entry point (`apps/web/src/app/dashboard/page.tsx`) simply redirects to `/dashboard/net-worth` rather than presenting a unified overview.

---

### Feature 2: Budgeting & Expense Tracking

| Attribute    | Detail               |
| ------------ | -------------------- |
| **Status**   | Not Implemented (5%) |
| **Severity** | Critical             |

**What Exists (data layer only):**

- `Budget` model in Prisma schema — `apps/api/prisma/schema.prisma:245-262` — with category linking, period support (weekly/monthly/quarterly/yearly), and date ranges
- `Transaction` model — `schema.prisma:201-220` — with category, type (income/expense/transfer), amounts, dates, and proper indexes
- `Category` model — `schema.prisma:222-243` — with hierarchical parent-child relationships, icons, and colors
- `Account` model — `schema.prisma:182-199` — checking, savings, credit card, investment, loan, cash types
- API client methods fully defined — `packages/api-client/src/index.ts:229-354` — CRUD for accounts, transactions, categories, and budgets
- Finance engine has `analyzeBudget()`, `summarizeTransactions()`, and `getExpensesByCategory()` functions — `packages/finance-engine/src/index.ts:79-169`

**What's Missing:**

- **Zero backend controllers** for accounts, transactions, categories, or budgets — only 9 controllers exist (app, auth, assets, liabilities, cash-flow-items, scenarios, goals, dashboard, calculators)
- **Zero frontend pages** — no `/dashboard/budget`, `/dashboard/transactions`, or `/dashboard/expenses` routes
- **Zero frontend components** for budget creation, transaction lists, category management, or spending charts
- **Zero hooks** — no `useBudgets`, `useTransactions`, or `useCategories` hooks (compare to the 13 existing hooks in `apps/web/src/hooks/`)
- No spending trend analysis or month-over-month comparisons
- No category-based expense breakdown visualizations

**Evidence:** The API client defines `this.client.get('/accounts', ...)`, `this.client.get('/transactions', ...)`, `this.client.get('/budgets', ...)` at `packages/api-client/src/index.ts:231-354`, but no corresponding NestJS controllers handle these routes. Requests would return 404.

---

### Feature 3: Investment Tracking

| Attribute    | Detail         |
| ------------ | -------------- |
| **Status**   | Complete (95%) |
| **Severity** | Low            |

**What Exists:**

- Portfolio summary with total value, cost basis, gains — `apps/api/src/dashboard/dashboard.service.ts:251-322`
- Holdings list with per-asset allocation percentages — same service
- Allocation chart component — `apps/web/src/components/dashboard/investments/AllocationChart.tsx`
- Enhanced investments endpoint with dividend projections and goal progress — `dashboard.service.ts:324-445`
- Investment goals panel — `apps/web/src/components/dashboard/investments/InvestmentGoalsPanel.tsx`
- Dividend projection card — `apps/web/src/components/dashboard/investments/DividendProjectionCard.tsx`
- Custom hooks: `useInvestments.ts`, `useEnhancedInvestments.ts`

**What's Missing:**

- No ticker symbol or market data integration (assets are manual entry only)
- No purchase history or cost basis tracking (commented as "Placeholder" at `dashboard.service.ts:268`)
- No real-time price updates
- No asset class sub-categorization (e.g., stocks vs bonds vs ETFs within `investment` type)

---

### Feature 4: Dividend Forecasting

| Attribute    | Detail        |
| ------------ | ------------- |
| **Status**   | Partial (70%) |
| **Severity** | Medium        |

**What Exists:**

- Per-asset dividend yield calculation with default yields by asset type — `dashboard.service.ts:338-368`
- Custom yield override support via `dividendYieldPercent` field — `schema.prisma:272`
- Annual and monthly dividend projections — `dashboard.service.ts:349-367`
- Total portfolio dividend income aggregation — `dashboard.service.ts:370-377`
- Frontend dividend projection card — `DividendProjectionCard.tsx`
- Default yield constants — `packages/shared-types/src/index.ts:809-817`

**What's Missing:**

- No dividend reinvestment (DRIP) modeling
- No tax implications on dividend income
- No historical dividend tracking or growth rate analysis
- No dividend calendar or ex-date tracking
- No yield-on-cost calculations (requires purchase history)
- Projections are static snapshots, not multi-year compound growth

---

### Feature 5: Mortgage & Loan Analysis

| Attribute    | Detail         |
| ------------ | -------------- |
| **Status**   | Complete (95%) |
| **Severity** | Low            |

**What Exists:**

- Full amortization schedule generation — `packages/finance-engine/src/amortization/amortization.ts`
- Extra payment simulation with monthly, one-time, and biweekly options — `dashboard.service.ts:447-589`
- Interest savings calculation — `dashboard.service.ts:581-583`
- Loan summary with weighted avg interest rate — `dashboard.service.ts:132-191`
- Frontend: LoanCard, LoansSummary, AmortizationTable, InterestSavingsCard, LoanOptimizationPanel, PayoffComparisonChart
- Payoff comparison between original and modified schedules
- Custom hooks: `useLoans.ts`, `useLoanAmortization.ts`, `useLoanOptimization.ts`

**What's Missing:**

- No refinance comparison tool (compare current terms vs potential new terms)
- No debt consolidation analysis
- No snowball vs avalanche payoff strategy comparison across multiple loans

---

### Feature 6: Mortgage vs Invest Decision Engine

| Attribute    | Detail               |
| ------------ | -------------------- |
| **Status**   | Not Implemented (0%) |
| **Severity** | High                 |

**What's Missing (entirely):**

- No "should I pay extra on my mortgage or invest the difference" calculator
- No side-by-side comparison of accelerated payoff vs investment growth
- No breakeven analysis factoring in interest rate differential, tax benefits, and opportunity cost
- No integration with existing loan data and investment return assumptions

**Evidence:** The calculators module (`apps/api/src/calculators/`) contains only `RentVsBuy` logic. The finance-engine has `calculateCompoundInterest()` at `packages/finance-engine/src/index.ts:49-53` which could serve as a building block, but no mortgage-vs-invest orchestration exists.

**Why This Matters:** This is a key product differentiator. Users with mortgages at 3-4% face the question of extra payments vs investing in markets returning 7-10%. This calculator would tie together the existing loan and investment engines.

---

### Feature 7: Rental Property Portfolio Analytics

| Attribute    | Detail                |
| ------------ | --------------------- |
| **Status**   | Not Implemented (10%) |
| **Severity** | High                  |

**What Exists (tangential only):**

- Rent vs Buy calculator — `apps/api/src/calculators/calculators.service.ts` — comprehensive but only answers "should I rent or buy my primary residence"
- `real_estate` asset type supported — `schema.prisma:50` — but only tracks current value and growth rate
- Default dividend yield of 4% for real estate assets — `dashboard.service.ts:341`

**What's Missing:**

- No rental property model (rental income, vacancy rate, expenses, cap rate, cash-on-cash return)
- No property-level P&L tracking
- No multi-property portfolio dashboard
- No rental income vs mortgage payment analysis
- No 1031 exchange planning
- No property valuation tools (comparable sales, cap rate valuation)

---

### Feature 8: Scenario Planning & What-If Analysis

| Attribute    | Detail         |
| ------------ | -------------- |
| **Status**   | Complete (90%) |
| **Severity** | Low            |

**What Exists:**

- Full scenario CRUD with field-level overrides on assets, liabilities, and cash flow items — `apps/api/src/scenarios/scenarios.service.ts`
- Scenario projections with configurable horizon (5-30 years, plan-tier gated) — `apps/api/src/scenarios/scenarios.service.ts`
- Side-by-side scenario comparison — `apps/api/src/scenarios/scenarios.service.ts`
- Baseline scenario support — `schema.prisma:340`
- Frontend: ScenarioCard, ScenarioEditor, ComparisonSummary, ComparisonChart
- Pages: list, detail, edit, new, compare — `apps/web/src/app/dashboard/scenarios/`
- Custom hooks: `useScenarios.ts`, `useScenarioProjection.ts`, `useScenarioComparison.ts`
- Plan-tier limits (free: 3 scenarios/5yr, pro: 10/15yr, premium: unlimited/30yr) — `apps/api/src/plan-limits/plan-limits.service.ts`

**What's Missing:**

- No retirement timing analysis ("when can I retire" based on scenario)
- No asset selling/liquidation modeling within scenarios
- No "what if I get a raise" or "what if I lose my job" prebuilt templates
- No Monte Carlo simulation for probability-weighted outcomes

---

### Feature 9: AI-Powered Advice Engine

| Attribute    | Detail               |
| ------------ | -------------------- |
| **Status**   | Not Implemented (0%) |
| **Severity** | Critical             |

**What's Missing (entirely):**

- **Zero AI dependencies** — `package.json` has no OpenAI, Anthropic, LangChain, or any LLM SDK
- **Zero AI services** — no AI module, service, or controller in the backend
- **Zero AI UI** — no chat interface, advice panel, or AI-generated content anywhere
- No prompt engineering or RAG pipeline
- No financial advice generation based on user data
- No anomaly detection on spending patterns
- No natural language query interface ("How much did I spend on dining last month?")

**What Could Be Leveraged:**

- The `generateInsights()` function in `packages/finance-engine/src/insights/insights.ts` provides rule-based financial insights (housing cost ratio, debt-to-income, emergency fund, goal progress, interest savings) — this is a solid foundation for AI augmentation
- Rich financial data already exists to feed an LLM context window

**Evidence:** `grep -r "openai\|anthropic\|langchain\|llm\|ai\|gpt\|claude" apps/api/package.json apps/web/package.json` returns zero matches for AI-related dependencies.

---

### Feature 10: Data Architecture & Integration Readiness

| Attribute    | Detail        |
| ------------ | ------------- |
| **Status**   | Partial (70%) |
| **Severity** | Medium        |

**What Exists:**

- Well-structured Prisma schema with 12 models, proper relations, and comprehensive indexes — `schema.prisma`
- Monorepo with clean package separation — `packages/api-client`, `packages/finance-engine`, `packages/shared-types`, `packages/validation`
- Consistent cents-based monetary values avoiding floating-point issues
- JWT auth with refresh tokens, RBAC with household roles (owner/editor/viewer) — `apps/api/src/auth/`
- Authorization module with resource ownership service — `apps/api/src/authorization/`
- Plan tier system with gated feature limits — `apps/api/src/plan-limits/`
- Typed API client with interceptors, token refresh, and error handling — `packages/api-client/src/index.ts`

**What's Missing:**

- **Orphaned models** — `Account`, `Transaction`, `Category`, `Budget` have Prisma models and API client methods but no backend controllers. This creates a confusing "ghost API" that appears functional but 404s
- No event system or pub/sub for real-time updates
- No caching layer (Redis or in-memory)
- No Plaid/bank integration — `AccountConnectionStep.tsx` shows "Coming Soon" badge with no underlying implementation
- No WebSocket support for live data
- No audit log or change tracking
- No data export/import functionality
- No migration strategy for the 4 orphaned entity types

**Evidence:** The onboarding flow includes an `AccountConnectionStep` at `apps/web/src/components/onboarding/steps/AccountConnectionStep.tsx:22-52` with a "Coming Soon" badge and disabled bank connection button. The manual setup path is the only functional option.

---

### Feature 11: UX Quality & Product Cohesion

| Attribute    | Detail        |
| ------------ | ------------- |
| **Status**   | Partial (75%) |
| **Severity** | Medium        |

**What Exists:**

- Consistent shadcn/ui component library — 13 UI primitives in `apps/web/src/components/ui/`
- Shared components: DashboardCard, ErrorState, LoadingState, MoneyDisplay, StatCard — `apps/web/src/components/dashboard/shared/`
- 8-step onboarding wizard with progress tracking — `apps/web/src/components/onboarding/OnboardingWizard.tsx`
- Responsive layouts with Tailwind CSS
- Form handling with react-hook-form + zod validation
- 13 custom hooks providing clean data-fetching patterns — `apps/web/src/hooks/`
- Milestone celebration dialog for goals — `apps/web/src/components/dashboard/goals/MilestoneCelebration.tsx`
- Tab-based settings management for 5 entity types — `apps/web/src/app/dashboard/settings/page.tsx`

**What's Missing:**

- No budgeting, transactions, or cash flow pages — creating large dead zones in the product
- No data visualization library (no recharts, chart.js, d3, or visx in `apps/web/package.json`) — charts appear to be CSS-only or static
- No dark mode support
- No mobile-responsive navigation (current nav is a horizontal bar)
- No keyboard shortcuts or accessibility (a11y) patterns beyond Radix defaults
- No notification system or alerts
- No search functionality
- No help/documentation/tooltips for financial concepts
- Onboarding promises "Connect Bank Accounts" but delivers "Coming Soon"

---

## 3. Product Alignment Scorecard

| #   | Feature Category             | Weight   | Score | Weighted  |
| --- | ---------------------------- | -------- | ----- | --------- |
| 1   | Unified Dashboard            | 10%      | 65%   | 6.5%      |
| 2   | Budgeting & Expense Tracking | 15%      | 5%    | 0.75%     |
| 3   | Investment Tracking          | 10%      | 95%   | 9.5%      |
| 4   | Dividend Forecasting         | 5%       | 70%   | 3.5%      |
| 5   | Mortgage & Loan Analysis     | 10%      | 95%   | 9.5%      |
| 6   | Mortgage vs Invest Engine    | 8%       | 0%    | 0%        |
| 7   | Rental Property Analytics    | 5%       | 10%   | 0.5%      |
| 8   | Scenario Planning            | 10%      | 90%   | 9.0%      |
| 9   | AI-Powered Advice            | 12%      | 0%    | 0%        |
| 10  | Data Architecture            | 10%      | 70%   | 7.0%      |
| 11  | UX & Cohesion                | 5%       | 75%   | 3.75%     |
|     | **Total**                    | **100%** |       | **50.0%** |

### Score Interpretation

- **90-100%:** Production-ready, feature-complete
- **70-89%:** Strong foundation, minor gaps
- **50-69%:** Significant gaps requiring focused effort
- **30-49%:** Major features missing, incomplete product
- **0-29%:** Early stage, most features absent

**Current Score: 50%** — The app has deep, polished implementations in its core wealth-tracking pillars but is missing entire product categories (budgeting, AI, rental analytics) that prevent it from being a comprehensive personal finance platform.

---

## 4. Architecture Assessment

### 4.1 Data Model Completeness

| Model            | Schema | Controller      | Service         | Frontend             | Status       |
| ---------------- | ------ | --------------- | --------------- | -------------------- | ------------ |
| User             | Yes    | auth            | auth            | login/onboarding     | Complete     |
| Household        | Yes    | (via auth)      | (via auth)      | (implicit)           | Complete     |
| RefreshToken     | Yes    | auth            | auth            | (auto)               | Complete     |
| Asset            | Yes    | assets          | assets          | settings + dashboard | Complete     |
| Liability        | Yes    | liabilities     | liabilities     | settings + dashboard | Complete     |
| CashFlowItem     | Yes    | cash-flow-items | cash-flow-items | settings only        | Partial      |
| Scenario         | Yes    | scenarios       | scenarios       | full pages           | Complete     |
| ScenarioOverride | Yes    | (via scenarios) | (via scenarios) | (via scenarios)      | Complete     |
| Goal             | Yes    | goals           | goals           | full pages           | Complete     |
| **Account**      | Yes    | **NONE**        | **NONE**        | **NONE**             | **Orphaned** |
| **Transaction**  | Yes    | **NONE**        | **NONE**        | **NONE**             | **Orphaned** |
| **Category**     | Yes    | **NONE**        | **NONE**        | **NONE**             | **Orphaned** |
| **Budget**       | Yes    | **NONE**        | **NONE**        | **NONE**             | **Orphaned** |

### 4.2 Service Boundaries

The backend follows NestJS module conventions cleanly:

- Each domain has its own module, controller, service, and DTOs
- `PrismaService` is properly shared via `PrismaModule`
- `PlanLimitsService` provides cross-cutting tier enforcement
- `ResourceOwnershipService` handles authorization

**Gap:** No service-to-service communication pattern for cross-domain operations (e.g., "budget remaining" requires budget + transaction data).

### 4.3 Shared Package Quality

| Package          | Purpose                                                                                  | Quality                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `finance-engine` | Pure calculation functions (amortization, projection, rent-vs-buy, insights, investment) | Excellent — deterministic, well-tested (6 test suites), no side effects |
| `shared-types`   | TypeScript interfaces shared between API and frontend                                    | Excellent — comprehensive coverage of all entities and DTOs             |
| `api-client`     | Axios-based HTTP client with auth interceptors                                           | Good — but defines methods for non-existent endpoints                   |
| `validation`     | Zod schemas for input validation                                                         | Present but minimally used                                              |

### 4.4 Integration Quality

- **Auth flow:** Solid — JWT access tokens, refresh token rotation, Passport.js strategy, RBAC guards
- **Type safety:** End-to-end from Prisma schema → shared-types → api-client → React hooks
- **Error handling:** Consistent `ApiResponse<T>` wrapper, proper NestJS exception filters
- **State management:** No global state library (no Redux/Zustand) — uses hook-based fetching per page. This works for current scale but may need rethinking as features grow.

---

## 5. Risk Summary

| Risk                                          | Impact | Likelihood | Mitigation                                           |
| --------------------------------------------- | ------ | ---------- | ---------------------------------------------------- |
| Orphaned DB models confuse developers         | Medium | High       | Implement controllers or remove models               |
| No budgeting makes product feel incomplete    | High   | Certain    | Priority 1 implementation                            |
| AI competitors ship first                     | High   | High       | Begin AI integration in next sprint                  |
| Plaid "Coming Soon" erodes user trust         | Medium | Medium     | Either implement or remove from onboarding           |
| No charting library limits data visualization | Medium | High       | Add recharts or visx                                 |
| State management won't scale                  | Medium | Medium     | Consider Zustand or TanStack Query for complex pages |

---

## 6. Appendix: File Inventory

### Backend Controllers (9)

```
apps/api/src/app.controller.ts
apps/api/src/assets/assets.controller.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/calculators/calculators.controller.ts
apps/api/src/cash-flow-items/cash-flow-items.controller.ts
apps/api/src/dashboard/dashboard.controller.ts
apps/api/src/goals/goals.controller.ts
apps/api/src/liabilities/liabilities.controller.ts
apps/api/src/scenarios/scenarios.controller.ts
```

### Frontend Pages (21)

```
apps/web/src/app/page.tsx (landing)
apps/web/src/app/login/page.tsx
apps/web/src/app/onboarding/page.tsx
apps/web/src/app/dashboard/page.tsx (redirect)
apps/web/src/app/dashboard/net-worth/page.tsx
apps/web/src/app/dashboard/goals/page.tsx
apps/web/src/app/dashboard/loans/page.tsx
apps/web/src/app/dashboard/loans/[id]/page.tsx
apps/web/src/app/dashboard/investments/page.tsx
apps/web/src/app/dashboard/rent-vs-buy/page.tsx
apps/web/src/app/dashboard/scenarios/page.tsx
apps/web/src/app/dashboard/scenarios/new/page.tsx
apps/web/src/app/dashboard/scenarios/[id]/page.tsx
apps/web/src/app/dashboard/scenarios/[id]/edit/page.tsx
apps/web/src/app/dashboard/scenarios/compare/page.tsx
apps/web/src/app/dashboard/settings/page.tsx
apps/web/src/app/dashboard/settings/accounts/page.tsx
```

### Custom Hooks (13)

```
useNetWorth, useLoans, useLoanAmortization, useLoanOptimization,
useInvestments, useEnhancedInvestments, useGoals, useScenarios,
useScenarioProjection, useScenarioComparison, useRentVsBuy,
useHouseholdEntities, useOnboarding
```

### Finance Engine Modules (7)

```
money, amortization, investment, scenario, projection, rent-vs-buy, insights
```
