# Finance App — Implementation Roadmap

**Created:** February 7, 2026
**Based on:** [AUDIT_FINDINGS.md](./AUDIT_FINDINGS.md) — Product Alignment Score: 50%
**Target:** Raise alignment score to 85%+ across all 11 feature pillars

---

## Phased Plan Overview

| Phase       | Focus                 | Target Score Lift | Features                                                          |
| ----------- | --------------------- | ----------------- | ----------------------------------------------------------------- |
| **Phase 1** | Critical Foundations  | 50% → 68%         | Budgeting, cash flow dashboard, transaction controllers, charting |
| **Phase 2** | Core Differentiation  | 68% → 80%         | AI advice engine, mortgage vs invest, rental property analytics   |
| **Phase 3** | Advanced Intelligence | 80% → 88%         | Plaid integration, notifications, tax planning, advanced AI       |

---

## Phase 1: Critical Foundations

**Goal:** Close the critical gaps in budgeting/expense tracking and activate the orphaned data models. This phase requires no new external dependencies beyond a charting library.

---

### 1.1 Account, Transaction, Category & Budget Controllers

**Problem:** Four Prisma models (`Account`, `Transaction`, `Category`, `Budget`) have full schema definitions and API client methods but zero backend controllers, meaning API requests 404.

**Scope:** Create 4 new NestJS modules following the existing pattern (see `apps/api/src/assets/` for reference).

#### Backend — New Modules

```
apps/api/src/accounts/
  ├── accounts.module.ts
  ├── accounts.controller.ts      # CRUD + list with pagination
  ├── accounts.service.ts         # Business logic, balance aggregation
  └── dto/
      ├── create-account.dto.ts
      └── update-account.dto.ts

apps/api/src/transactions/
  ├── transactions.module.ts
  ├── transactions.controller.ts  # CRUD + filtered list (by account, category, date range, type)
  ├── transactions.service.ts     # Transaction recording, category assignment
  └── dto/
      ├── create-transaction.dto.ts
      ├── update-transaction.dto.ts
      └── transaction-query.dto.ts

apps/api/src/categories/
  ├── categories.module.ts
  ├── categories.controller.ts    # CRUD + hierarchical listing
  ├── categories.service.ts       # Hierarchy management, default categories seeding
  └── dto/
      ├── create-category.dto.ts
      └── update-category.dto.ts

apps/api/src/budgets/
  ├── budgets.module.ts
  ├── budgets.controller.ts       # CRUD + budget-vs-actual endpoint
  ├── budgets.service.ts          # Period calculation, spending aggregation
  └── dto/
      ├── create-budget.dto.ts
      ├── update-budget.dto.ts
      └── budget-query.dto.ts
```

**Implementation Notes:**

- Follow the `@UseGuards(JwtAuthGuard, RolesGuard)` pattern from `apps/api/src/assets/assets.controller.ts`
- Use `HouseholdId` decorator or extract household from JWT user object (existing pattern in `apps/api/src/auth/`)
- Accounts belong to User (not Household) per the schema — use `userId` from JWT
- Register all 4 modules in `apps/api/src/app.module.ts` (currently imports 10 modules)
- Seed default categories (Housing, Transportation, Food, Utilities, Entertainment, etc.) in `prisma/seed.ts`

#### Budget-vs-Actual Endpoint

Add a dedicated endpoint to the budgets controller:

```
GET /budgets/status?period=monthly&date=2026-02-01
```

Response should aggregate transactions by category and compare against budget amounts, leveraging the existing `analyzeBudget()` function from `packages/finance-engine/src/index.ts:79-94`.

---

### 1.2 Budgeting & Expense Tracking Dashboard

**Problem:** Zero frontend UI for the most fundamental personal finance feature.

#### Frontend — New Pages

```
apps/web/src/app/dashboard/budget/page.tsx          # Budget overview with category cards
apps/web/src/app/dashboard/transactions/page.tsx     # Transaction list with filters
```

#### Frontend — New Components

```
apps/web/src/components/dashboard/budget/
  ├── BudgetOverview.tsx          # Monthly budget summary with progress bars
  ├── BudgetCategoryCard.tsx      # Per-category spent vs budgeted
  ├── SpendingChart.tsx           # Category breakdown pie/donut chart
  ├── SpendingTrend.tsx           # Month-over-month line chart
  └── BudgetSetupCard.tsx         # Empty state for new users

apps/web/src/components/dashboard/transactions/
  ├── TransactionList.tsx         # Filterable, sortable table
  ├── TransactionRow.tsx          # Single transaction display
  ├── TransactionFilters.tsx      # Date range, category, type filters
  └── AddTransactionModal.tsx     # Quick-add transaction form
```

#### Frontend — New Hooks

```
apps/web/src/hooks/
  ├── useAccounts.ts
  ├── useTransactions.ts
  ├── useCategories.ts
  ├── useBudgets.ts
  └── useBudgetStatus.ts          # Fetches budget-vs-actual data
```

#### Navigation Update

Update `apps/web/src/app/dashboard/layout.tsx:9-17` to add Budget and Transactions tabs:

```typescript
const navItems = [
  { href: '/dashboard/net-worth', label: 'Net Worth' },
  { href: '/dashboard/budget', label: 'Budget' }, // NEW
  { href: '/dashboard/transactions', label: 'Transactions' }, // NEW
  { href: '/dashboard/goals', label: 'Goals' },
  { href: '/dashboard/loans', label: 'Loans' },
  { href: '/dashboard/investments', label: 'Investments' },
  { href: '/dashboard/rent-vs-buy', label: 'Rent vs Buy' },
  { href: '/dashboard/scenarios', label: 'Scenarios' },
  { href: '/dashboard/settings', label: 'Settings' },
]
```

---

### 1.3 Cash Flow Dashboard

**Problem:** Cash flow items exist in the database and settings UI, but there's no visualization page showing income vs expenses over time.

#### Frontend — New Page

```
apps/web/src/app/dashboard/cash-flow/page.tsx
```

#### Frontend — New Components

```
apps/web/src/components/dashboard/cash-flow/
  ├── CashFlowSummary.tsx         # Monthly income, expenses, net cash flow
  ├── CashFlowChart.tsx           # Income vs expenses bar chart over time
  ├── CashFlowItemsList.tsx       # Grouped by income/expense with frequencies
  └── NetSavingsRate.tsx          # Savings rate percentage with gauge
```

**Implementation Notes:**

- Leverage existing `CashFlowItem` data already fetched by `useHouseholdEntities` hook
- Add a new backend endpoint `GET /dashboard/cash-flow` that calculates monthly aggregated cash flow
- Use the existing `MONTHLY_MULTIPLIERS` pattern from `apps/api/src/calculators/calculators.service.ts:26-32` for frequency normalization

---

### 1.4 Charting Library

**Problem:** No data visualization library is installed. Charts are currently static or CSS-only.

**Action:** Install `recharts` (React-based, composable, works with shadcn/ui aesthetic):

```bash
pnpm add recharts --filter @finance-app/web
```

**Rationale:** Recharts is the most commonly used with React/Next.js, has a small bundle size, and integrates cleanly with Tailwind for styling. It's needed for: budget category charts, cash flow trends, spending over time, scenario comparison visualizations, and the upcoming AI dashboard.

---

### 1.5 Unified Dashboard Landing Page

**Problem:** `/dashboard` redirects to `/dashboard/net-worth` instead of showing a unified overview.

**Action:** Replace the redirect in `apps/web/src/app/dashboard/page.tsx` with a dashboard overview page that shows:

1. **Net worth snapshot** — current number + trend arrow (reuse `NetWorthSummary` data)
2. **Budget pulse** — top 3 categories with progress bars (from new budget-status endpoint)
3. **Cash flow this month** — income vs expenses mini-bar
4. **Active goals** — progress badges (reuse `GoalProgressCard` data)
5. **Recent transactions** — last 5 transactions (from new transactions endpoint)
6. **Upcoming payments** — next 3 liability payments (from existing loans data)

Each section links to its full page. This creates the "command center" feel.

---

### Phase 1 — Estimated Scope

| Task                                | New Files | Modified Files     | Complexity |
| ----------------------------------- | --------- | ------------------ | ---------- |
| 1.1 Backend controllers (4 modules) | ~16       | 1 (app.module)     | Medium     |
| 1.2 Budget & transactions UI        | ~12       | 1 (layout.tsx nav) | Medium     |
| 1.3 Cash flow dashboard             | ~5        | 0                  | Low        |
| 1.4 Charting library                | 0         | 1 (package.json)   | Trivial    |
| 1.5 Unified dashboard               | ~1        | 1 (page.tsx)       | Medium     |
| **Total**                           | **~34**   | **4**              |            |

---

## Phase 2: Core Differentiation

**Goal:** Add the features that differentiate this app from basic budgeting tools — AI-powered advice, advanced calculators, and rental property analytics.

---

### 2.1 AI-Powered Advice Engine

**Problem:** Zero AI presence in the entire codebase. This is the second-highest-weighted feature at 12% and scores 0%.

#### Architecture Decision

Use the **Anthropic Claude API** (or OpenAI) as the LLM provider with a thin service layer:

```
apps/api/src/ai/
  ├── ai.module.ts
  ├── ai.controller.ts            # POST /ai/advice, POST /ai/chat
  ├── ai.service.ts               # LLM orchestration, context building
  ├── prompt-builder.service.ts   # Constructs prompts from financial data
  └── dto/
      ├── advice-request.dto.ts
      └── chat-request.dto.ts
```

#### Backend Dependencies

```bash
pnpm add @anthropic-ai/sdk --filter @finance-app/api
# or: pnpm add openai --filter @finance-app/api
```

Add `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`) to environment config via `@nestjs/config`.

#### How It Works

1. **Context Builder** — `prompt-builder.service.ts` aggregates the user's financial snapshot:
   - Net worth breakdown (from `DashboardService.getNetWorth()`)
   - Budget status (from new `BudgetsService`)
   - Cash flow summary (income vs expenses)
   - Goal progress (from `GoalsService.getAllProgress()`)
   - Loan details and interest rates
   - Investment allocation and dividend income
   - Existing insights from `generateInsights()` in `packages/finance-engine/src/insights/insights.ts`

2. **Advice Endpoint** — `POST /ai/advice` sends the context + a system prompt to the LLM and returns structured advice:

   ```json
   {
     "insights": [
       { "category": "budgeting", "severity": "warning", "message": "...", "action": "..." },
       { "category": "investing", "severity": "info", "message": "...", "action": "..." }
     ],
     "summary": "..."
   }
   ```

3. **Chat Endpoint** — `POST /ai/chat` enables conversational follow-up:
   ```json
   { "message": "Should I pay off my student loan or invest more?", "conversationId": "..." }
   ```

#### Frontend — New Components

```
apps/web/src/components/dashboard/ai/
  ├── AiAdvicePanel.tsx           # Card showing AI-generated insights
  ├── AiChatWidget.tsx            # Slide-out chat panel
  └── AiInsightCard.tsx           # Individual insight with action button
```

#### Integration Points

- Add an AI insights panel to the unified dashboard (Phase 1.5)
- Add an "Ask AI" button to each dashboard page for contextual advice
- Rate-limit AI calls per plan tier (free: 5/day, pro: 50/day, premium: unlimited)

---

### 2.2 Mortgage vs Invest Decision Engine

**Problem:** Users with low-rate mortgages need help deciding between extra mortgage payments and investing the difference.

#### Backend

```
apps/api/src/calculators/mortgage-vs-invest/
  ├── mortgage-vs-invest.service.ts
  └── dto/mortgage-vs-invest.dto.ts
```

Add a new endpoint to the existing `CalculatorsController`:

```
POST /calculators/mortgage-vs-invest
```

#### Finance Engine Addition

```
packages/finance-engine/src/mortgage-vs-invest/
  ├── index.ts
  ├── mortgage-vs-invest.ts       # Core calculation
  └── mortgage-vs-invest.types.ts
```

#### Calculation Logic

Input:

- Current loan details (auto-populated from user's liabilities)
- Extra monthly amount available
- Expected investment return rate
- Marginal tax rate (for mortgage interest deduction)
- Investment horizon

Output:

- **Pay Extra scenario:** Total interest saved, payoff date, total cost
- **Invest Instead scenario:** Investment growth over same period, after-tax value
- **Net difference** at each year
- **Breakeven interest rate** — the mortgage rate at which both strategies are equal
- **Recommendation** with reasoning

#### Frontend

```
apps/web/src/app/dashboard/mortgage-vs-invest/page.tsx
apps/web/src/components/dashboard/mortgage-vs-invest/
  ├── MortgageVsInvestForm.tsx
  ├── ComparisonResultCard.tsx
  └── BreakevenChart.tsx
```

**Implementation Note:** Reuse `generateAmortizationScheduleWithExtras()` from `packages/finance-engine/src/amortization/` for the payoff scenario, and `calculateCompoundInterest()` from `packages/finance-engine/src/index.ts:49-53` for the investment scenario.

---

### 2.3 Rental Property Portfolio Analytics

**Problem:** Only rent-vs-buy for primary residence exists. No rental income property tracking.

#### Schema Additions

Add a new model to `apps/api/prisma/schema.prisma`:

```prisma
model RentalProperty {
  id                      String    @id @default(uuid()) @db.Uuid
  householdId             String    @map("household_id") @db.Uuid
  household               Household @relation(fields: [householdId], references: [id], onDelete: Cascade)
  linkedAssetId           String?   @map("linked_asset_id") @db.Uuid
  linkedLiabilityId       String?   @map("linked_liability_id") @db.Uuid
  name                    String
  address                 String?
  purchasePriceCents      Int       @map("purchase_price_cents")
  currentValueCents       Int       @map("current_value_cents")
  monthlyRentCents        Int       @map("monthly_rent_cents")
  vacancyRatePercent      Decimal   @default(5) @map("vacancy_rate_percent") @db.Decimal(5,2)
  annualExpensesCents     Int       @map("annual_expenses_cents")  // insurance, maintenance, management
  propertyTaxAnnualCents  Int       @map("property_tax_annual_cents")
  mortgagePaymentCents    Int?      @map("mortgage_payment_cents")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([householdId])
  @@map("rental_properties")
}
```

Add `rentalProperties RentalProperty[]` to the `Household` model.

#### Backend

```
apps/api/src/rental-properties/
  ├── rental-properties.module.ts
  ├── rental-properties.controller.ts
  ├── rental-properties.service.ts    # CRUD + analytics calculations
  └── dto/
      ├── create-rental-property.dto.ts
      └── update-rental-property.dto.ts
```

#### Calculated Metrics

- **Net Operating Income (NOI):** Rental income - vacancy loss - operating expenses
- **Cap Rate:** NOI / Current Value
- **Cash-on-Cash Return:** Annual cash flow after mortgage / Total cash invested
- **Gross Rent Multiplier:** Property price / Annual rent
- **DSCR (Debt Service Coverage Ratio):** NOI / Annual mortgage payments
- **Total ROI:** (Equity gain + Cash flow + Tax benefits) / Investment

#### Frontend

```
apps/web/src/app/dashboard/rental-properties/page.tsx
apps/web/src/components/dashboard/rental-properties/
  ├── PropertyPortfolioSummary.tsx
  ├── PropertyCard.tsx
  ├── PropertyMetricsTable.tsx
  └── AddPropertyModal.tsx
```

---

### Phase 2 — Estimated Scope

| Task                          | New Files | Modified Files               | Complexity |
| ----------------------------- | --------- | ---------------------------- | ---------- |
| 2.1 AI advice engine          | ~10       | 2 (package.json, app.module) | High       |
| 2.2 Mortgage vs invest        | ~8        | 1 (calculators or new route) | Medium     |
| 2.3 Rental property analytics | ~10       | 2 (schema, app.module)       | Medium     |
| **Total**                     | **~28**   | **5**                        |            |

---

## Phase 3: Advanced Intelligence

**Goal:** Add external integrations, proactive user engagement, and tax optimization to create a truly comprehensive platform.

---

### 3.1 Plaid Bank Connection

**Problem:** Onboarding shows "Coming Soon" for bank connection. Manual entry is the only option.

#### Backend

```
apps/api/src/plaid/
  ├── plaid.module.ts
  ├── plaid.controller.ts         # Link token, exchange, webhooks
  ├── plaid.service.ts            # Plaid API wrapper
  └── dto/
```

#### Dependencies

```bash
pnpm add plaid --filter @finance-app/api
```

#### Implementation Approach

1. **Link Token:** `POST /plaid/link-token` — creates Plaid Link session
2. **Token Exchange:** `POST /plaid/exchange` — exchanges public token for access token, stores in encrypted field
3. **Account Sync:** `POST /plaid/sync` — fetches accounts and transactions, maps to existing `Account` and `Transaction` models
4. **Webhooks:** `POST /plaid/webhook` — handles transaction updates, account balance changes

#### Schema Addition

```prisma
model PlaidItem {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  accessToken     String   @map("access_token")   // encrypted
  institutionId   String   @map("institution_id")
  institutionName String   @map("institution_name")
  cursor          String?                           // for transaction sync
  lastSyncedAt    DateTime? @map("last_synced_at")
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@map("plaid_items")
}
```

#### Frontend

- Update `AccountConnectionStep.tsx` to use Plaid Link React SDK
- Add "Connected Accounts" section to Settings
- Show sync status and last-updated timestamps

---

### 3.2 Notifications & Alerts

**Problem:** No notification system exists — no models, no services, no UI.

#### Schema Addition

```prisma
enum NotificationType {
  budget_exceeded
  goal_milestone
  bill_due
  large_transaction
  net_worth_milestone
  ai_insight
}

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @map("user_id") @db.Uuid
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false) @map("is_read")
  metadata  Json?
  createdAt DateTime         @default(now()) @map("created_at")

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

#### Backend

```
apps/api/src/notifications/
  ├── notifications.module.ts
  ├── notifications.controller.ts   # GET /notifications, PATCH /notifications/:id/read
  ├── notifications.service.ts      # CRUD + notification creation triggers
  └── notification-triggers.service.ts  # Event-driven notification generation
```

#### Trigger Events

- Budget category exceeds 80% or 100% → alert
- Goal reaches 25%/50%/75%/100% milestone → celebration
- Transaction above user-set threshold → large transaction alert
- Net worth crosses round number milestones ($100k, $250k, etc.)
- AI generates high-severity insight → proactive notification

#### Frontend

- Notification bell icon in the dashboard header (`layout.tsx`)
- Notification dropdown panel with read/unread states
- Notification preferences page in Settings

---

### 3.3 Tax Planning Module

**Problem:** No tax-related calculations despite having marginal tax rate in rent-vs-buy assumptions.

#### Backend

```
apps/api/src/tax/
  ├── tax.module.ts
  ├── tax.controller.ts
  ├── tax.service.ts
  └── dto/
```

#### Features

- **Tax bracket calculator** — estimate effective vs marginal rates
- **Mortgage interest deduction estimator** — using existing loan data
- **Capital gains estimator** — when investment cost basis is tracked
- **Tax-loss harvesting suggestions** — identify underperforming investments
- **Retirement contribution optimizer** — traditional vs Roth IRA analysis
- **Estimated tax liability** — based on income, deductions, and filing status

#### Schema Addition

Add tax profile to User or Household:

```prisma
model TaxProfile {
  id                  String  @id @default(uuid()) @db.Uuid
  householdId         String  @unique @map("household_id") @db.Uuid
  filingStatus        String  @map("filing_status")  // single, married_joint, married_separate, head_of_household
  stateOfResidence    String? @map("state_of_residence")
  dependents          Int     @default(0)
  additionalIncome    Int?    @map("additional_income_cents")

  @@map("tax_profiles")
}
```

---

### 3.4 Advanced AI Features

Building on the Phase 2 AI foundation:

- **Anomaly Detection:** Flag unusual spending patterns ("You spent 3x your average on dining this week")
- **Predictive Cash Flow:** "Based on your patterns, you'll have $X available at month end"
- **Goal Coaching:** "To reach your $100k savings goal by December, increase your monthly savings by $200"
- **Scenario Suggestions:** "Based on your profile, have you considered these scenarios..." auto-generates scenario overrides
- **Natural Language Queries:** "How much did I spend on groceries last quarter?" → searches transactions and returns formatted answer
- **Weekly Digest:** AI-generated weekly financial summary delivered via notification

---

### Phase 3 — Estimated Scope

| Task                  | New Files | Modified Files                                | Complexity |
| --------------------- | --------- | --------------------------------------------- | ---------- |
| 3.1 Plaid integration | ~8        | 3 (schema, app.module, AccountConnectionStep) | High       |
| 3.2 Notifications     | ~8        | 2 (schema, layout.tsx)                        | Medium     |
| 3.3 Tax planning      | ~6        | 1 (schema)                                    | Medium     |
| 3.4 Advanced AI       | ~5        | 3 (existing AI service, prompts)              | High       |
| **Total**             | **~27**   | **9**                                         |            |

---

## Technical Architecture Plan

### New Data Models Summary

| Model                          | Phase   | Relations                                            |
| ------------------------------ | ------- | ---------------------------------------------------- |
| (Account — already exists)     | Phase 1 | User → Accounts → Transactions                       |
| (Transaction — already exists) | Phase 1 | Account → Transaction, Category → Transaction        |
| (Category — already exists)    | Phase 1 | User → Categories, parent-child hierarchy            |
| (Budget — already exists)      | Phase 1 | User → Budget, Category → Budget                     |
| RentalProperty                 | Phase 2 | Household → RentalProperty, links to Asset/Liability |
| PlaidItem                      | Phase 3 | User → PlaidItem                                     |
| Notification                   | Phase 3 | User → Notification                                  |
| TaxProfile                     | Phase 3 | Household → TaxProfile                               |

### New Backend Services Summary

| Service                     | Phase   | Dependencies                                                  |
| --------------------------- | ------- | ------------------------------------------------------------- |
| AccountsService             | Phase 1 | PrismaService                                                 |
| TransactionsService         | Phase 1 | PrismaService                                                 |
| CategoriesService           | Phase 1 | PrismaService                                                 |
| BudgetsService              | Phase 1 | PrismaService, TransactionsService                            |
| CashFlowDashboardService    | Phase 1 | PrismaService, existing CashFlowItemsService                  |
| AiService                   | Phase 2 | Anthropic SDK, DashboardService, GoalsService, BudgetsService |
| PromptBuilderService        | Phase 2 | All dashboard services                                        |
| MortgageVsInvestService     | Phase 2 | finance-engine (amortization + compound interest)             |
| RentalPropertiesService     | Phase 2 | PrismaService                                                 |
| PlaidService                | Phase 3 | Plaid SDK, AccountsService, TransactionsService               |
| NotificationsService        | Phase 3 | PrismaService                                                 |
| NotificationTriggersService | Phase 3 | BudgetsService, GoalsService, TransactionsService             |
| TaxService                  | Phase 3 | PrismaService, DashboardService                               |

### AI Integration Approach

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Frontend    │────▶│  AI Controller   │────▶│  AI Service  │
│  Chat/Panel  │◀────│  POST /ai/*      │◀────│              │
└─────────────┘     └──────────────────┘     └──────┬──────┘
                                                      │
                                              ┌───────▼───────┐
                                              │ Prompt Builder │
                                              │    Service     │
                                              └───────┬───────┘
                              ┌────────────────────────┼────────────────────────┐
                              │                        │                        │
                    ┌─────────▼─────┐      ┌──────────▼──────┐     ┌──────────▼──────┐
                    │ Dashboard     │      │  Goals          │     │  Budgets        │
                    │ Service       │      │  Service        │     │  Service        │
                    │ (net worth,   │      │ (progress,      │     │ (status,        │
                    │  investments, │      │  insights)      │     │  trends)        │
                    │  loans)       │      │                 │     │                 │
                    └───────────────┘      └─────────────────┘     └─────────────────┘
```

The Prompt Builder aggregates data from all services into a structured financial context document, which is then sent to the LLM along with a system prompt defining the advisor persona and output format. Responses are parsed into structured insight objects for the frontend.

### Existing Patterns to Follow

| Pattern                       | Example Location                                 | Apply To                           |
| ----------------------------- | ------------------------------------------------ | ---------------------------------- |
| NestJS Module structure       | `apps/api/src/assets/`                           | All new modules                    |
| JWT + RBAC Guards             | `apps/api/src/auth/`                             | All new controllers                |
| Pagination pattern            | `apps/api/src/goals/goals.service.ts:39-69`      | Transaction, notification lists    |
| Household scoping             | `apps/api/src/dashboard/dashboard.service.ts:47` | All new household-scoped queries   |
| API response wrapper          | `packages/shared-types/src/index.ts:169-173`     | All new endpoints                  |
| Custom React hooks            | `apps/web/src/hooks/useNetWorth.ts`              | All new data fetching              |
| Shared component patterns     | `apps/web/src/components/dashboard/shared/`      | All new UI cards                   |
| Finance engine pure functions | `packages/finance-engine/src/amortization/`      | Mortgage-vs-invest, rental metrics |
| Cents-based monetary values   | Throughout all services                          | All monetary fields                |
| Zod validation                | `packages/validation/src/index.ts`               | All new DTOs                       |

---

## Success Metrics

| Metric                  | Current   | Phase 1 Target | Phase 2 Target | Phase 3 Target |
| ----------------------- | --------- | -------------- | -------------- | -------------- |
| Product Alignment Score | 50%       | 68%            | 80%            | 88%            |
| Backend Controllers     | 9         | 13 (+4)        | 16 (+3)        | 19 (+3)        |
| Frontend Pages          | 17 unique | 22 (+5)        | 26 (+4)        | 29 (+3)        |
| Custom Hooks            | 13        | 18 (+5)        | 21 (+3)        | 24 (+3)        |
| Finance Engine Modules  | 7         | 7              | 8 (+1)         | 8              |
| Orphaned DB Models      | 4         | 0              | 0              | 0              |
| AI Endpoints            | 0         | 0              | 2              | 5              |
| External Integrations   | 0         | 0              | 1 (LLM)        | 2 (+Plaid)     |

---

## Dependency Graph

```
Phase 1.1 (Controllers) ──▶ Phase 1.2 (Budget UI) ──▶ Phase 1.5 (Unified Dashboard)
                          ├─▶ Phase 1.3 (Cash Flow)
                          └─▶ Phase 2.1 (AI Engine - needs budget data for context)

Phase 1.4 (Charting) ─────▶ Phase 1.2, 1.3, 1.5, 2.2, 2.3 (all need charts)

Phase 2.1 (AI Engine) ────▶ Phase 3.4 (Advanced AI)
Phase 1.1 (Controllers) ──▶ Phase 3.1 (Plaid - syncs to Account/Transaction models)
Phase 1.1 + 2.1 ──────────▶ Phase 3.2 (Notifications - triggers from budgets, goals, AI)
```

**Critical Path:** Phase 1.1 (controllers) unblocks nearly everything else and should be the first implementation priority.
