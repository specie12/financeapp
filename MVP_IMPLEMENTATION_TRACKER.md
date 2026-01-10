# MVP Implementation Tracker

> **Purpose**: This document tracks implementation progress. If Claude gets stuck or context is lost, refer to this document to resume.

---

## Table of Contents

1. [Implementation Status Overview](#implementation-status-overview)
2. [Flow 1: Financial Data Management](#flow-1-financial-data-management) ← COMPLETE
3. [Flow 2: Bank Connection (Plaid Integration)](#flow-2-bank-connection-plaid-integration) ← Later
4. [Flow 3: Goals Feature Fixes](#flow-3-goals-feature-fixes) ← COMPLETE
5. [Database Schema Changes](#database-schema-changes)
6. [File Locations Reference](#file-locations-reference)
7. [How to Resume](#how-to-resume)
8. [Completed Features (Archive)](#completed-features-archive)

---

## Implementation Status Overview

| Flow                      | Status      | Progress | Priority |
| ------------------------- | ----------- | -------- | -------- |
| Financial Data Management | ✅ COMPLETE | 100%     | DONE     |
| Bank Connection (Plaid)   | ⏸️ DEFERRED | 0%       | Later    |
| Goals Feature Fixes       | ✅ COMPLETE | 100%     | DONE     |

**Note**: Bank Connection (Plaid) is deferred until Plaid API credentials are set up.

---

## Flow 1: Financial Data Management

### Status: ✅ COMPLETE

### Goal

Allow users to edit, add, and delete assets, debts, income, and expenses after initial onboarding setup.

### Flow Description

```
User goes to Settings → Manages Finances tab →
Sees list of assets/liabilities/income/expenses →
Can edit (modal), add new, or delete existing items
```

### Implementation Phases

#### Phase 1A: Settings Page Structure ✅

- [x] Create `apps/web/src/app/dashboard/settings/page.tsx`
- [x] Create `apps/web/src/app/dashboard/settings/layout.tsx`
- [x] Add Settings link to dashboard navigation
- [x] Create settings tabs navigation

#### Phase 1B: UI Components ✅

- [x] Add `dialog.tsx` component (Radix UI Dialog)
- [x] Add `alert-dialog.tsx` component (confirmation dialogs)
- [x] Add `badge.tsx` component (status badges)

#### Phase 1C: Asset Management ✅

- [x] Create `AssetList.tsx` - List all assets with edit/delete buttons
- [x] Create `AssetModal.tsx` - Modal form for adding/editing
- [x] Implement delete with confirmation via `DeleteConfirmDialog`

#### Phase 1D: Liability Management ✅

- [x] Create `LiabilityList.tsx` - List all liabilities with edit/delete
- [x] Create `LiabilityModal.tsx` - Modal form for adding/editing
- [x] Implement delete with confirmation
- [x] Include loan calculation helpers (auto-calculate payment)

#### Phase 1E: Cash Flow Management ✅

- [x] Create `CashFlowList.tsx` - List income and expenses
- [x] Create `CashFlowModal.tsx` - Modal for adding/editing
- [x] Implement delete with confirmation
- [x] Group by type (income vs expense)

#### Phase 1F: Integration & Polish ✅

- [x] Add refetch after create/update/delete
- [x] Add loading states
- [x] Handle empty states
- [x] TypeScript compilation verified

### Key Files

```
NEW FILES:
apps/web/src/app/dashboard/settings/
├── page.tsx
├── layout.tsx
└── finances/
    └── page.tsx

apps/web/src/components/settings/
├── SettingsNav.tsx
└── finances/
    ├── FinanceDataManager.tsx
    ├── AssetList.tsx
    ├── LiabilityList.tsx
    ├── CashFlowList.tsx
    ├── EditAssetModal.tsx
    ├── EditLiabilityModal.tsx
    ├── EditCashFlowModal.tsx
    ├── AddItemModal.tsx
    ├── DeleteConfirmDialog.tsx
    └── LinkedBadge.tsx

apps/web/src/components/ui/
├── dialog.tsx
├── alert-dialog.tsx
└── badge.tsx

apps/web/src/hooks/useFinanceManagement.ts

MODIFIED FILES:
apps/web/src/app/dashboard/layout.tsx (add Settings nav link)
```

### Form Reuse Strategy

Extract form logic from `AssetsDebtsStep.tsx` for reuse:

- Asset form fields: name, type, value, growth rate, dividend yield
- Liability form fields: name, type, original balance, current balance, interest rate, minimum payment, term
- Cash flow form fields: name, type, amount, frequency, start/end date

---

## Database Schema Changes

### New Models (For Future Plaid Integration)

```prisma
enum PlaidConnectionStatus {
  pending
  connected
  error
  disconnected
}

enum DataSource {
  manual
  plaid
}

model BankConnection {
  id                 String                 @id @default(uuid()) @db.Uuid
  householdId        String                 @map("household_id") @db.Uuid
  household          Household              @relation(fields: [householdId], references: [id], onDelete: Cascade)
  institutionId      String                 @map("institution_id")
  institutionName    String                 @map("institution_name")
  accessTokenHash    String                 @map("access_token_hash")
  itemId             String                 @unique @map("item_id")
  status             PlaidConnectionStatus  @default(connected)
  lastSyncAt         DateTime?              @map("last_sync_at")
  errorCode          String?                @map("error_code")
  errorMessage       String?                @map("error_message")
  createdAt          DateTime               @default(now()) @map("created_at")
  updatedAt          DateTime               @updatedAt @map("updated_at")
  linkedAccounts     LinkedAccount[]

  @@index([householdId])
  @@map("bank_connections")
}

model LinkedAccount {
  id                    String           @id @default(uuid()) @db.Uuid
  bankConnectionId      String           @map("bank_connection_id") @db.Uuid
  bankConnection        BankConnection   @relation(fields: [bankConnectionId], references: [id], onDelete: Cascade)
  plaidAccountId        String           @map("plaid_account_id")
  accountName           String           @map("account_name")
  accountMask           String?          @map("account_mask")
  accountType           String           @map("account_type")
  accountSubtype        String?          @map("account_subtype")
  assetId               String?          @unique @map("asset_id") @db.Uuid
  asset                 Asset?           @relation(fields: [assetId], references: [id], onDelete: SetNull)
  liabilityId           String?          @unique @map("liability_id") @db.Uuid
  liability             Liability?       @relation(fields: [liabilityId], references: [id], onDelete: SetNull)
  currentBalanceCents   Int              @map("current_balance_cents")
  availableBalanceCents Int?             @map("available_balance_cents")
  lastBalanceUpdateAt   DateTime         @map("last_balance_update_at")
  isManualOverride      Boolean          @default(false) @map("is_manual_override")
  createdAt             DateTime         @default(now()) @map("created_at")
  updatedAt             DateTime         @updatedAt @map("updated_at")

  @@unique([bankConnectionId, plaidAccountId])
  @@map("linked_accounts")
}
```

### Modifications to Existing Models (When Adding Plaid)

Add to `Asset`:

```prisma
dataSource    DataSource    @default(manual) @map("data_source")
linkedAccount LinkedAccount?
```

Add to `Liability`:

```prisma
dataSource    DataSource    @default(manual) @map("data_source")
linkedAccount LinkedAccount?
```

Add to `Household`:

```prisma
bankConnections BankConnection[]
```

---

## File Locations Reference

### API (Backend)

```
apps/api/src/
├── app.module.ts                    # Register PlaidModule (later)
├── plaid/                           # NEW - Plaid integration (later)
│   ├── plaid.module.ts
│   ├── plaid.controller.ts
│   ├── plaid.service.ts
│   └── plaid-encryption.service.ts
├── assets/                          # Existing - no changes needed
├── liabilities/                     # Existing - no changes needed
└── prisma/schema.prisma             # Add new models (later)
```

### Web (Frontend)

```
apps/web/src/
├── app/dashboard/
│   ├── layout.tsx                   # Add Settings nav link
│   └── settings/                    # NEW - Settings pages
│       ├── page.tsx
│       ├── layout.tsx
│       └── finances/page.tsx
├── components/
│   ├── plaid/                       # NEW - Plaid components (later)
│   │   ├── PlaidLinkButton.tsx
│   │   └── BankConnectionCard.tsx
│   ├── settings/                    # NEW - Settings components
│   │   └── finances/
│   │       ├── AssetList.tsx
│   │       ├── EditAssetModal.tsx
│   │       └── ...
│   ├── ui/                          # Add dialog, alert-dialog, badge
│   └── onboarding/steps/
│       └── AccountConnectionStep.tsx # Modify - add Plaid Link (later)
└── hooks/
    ├── usePlaidLink.ts              # NEW (later)
    └── useFinanceManagement.ts      # NEW
```

### Shared Packages

```
packages/
├── api-client/src/index.ts          # Add plaid endpoints (later)
├── shared-types/src/index.ts        # Add Plaid types (later)
└── validation/src/index.ts          # Add validation schemas
```

---

## How to Resume

If Claude gets stuck or loses context, provide this prompt:

```
Please read the file MVP_IMPLEMENTATION_TRACKER.md in the project root.
This file tracks implementation progress for the Finance App MVP.

Current status:
- Flow 1 (Data Management): ✅ COMPLETE
- Flow 2 (Bank Connection): ⏸️ DEFERRED (needs Plaid API keys)
- Flow 3 (Goals Feature Fixes): ✅ COMPLETE

Next action: Flow 2 (Plaid Integration) when API credentials are available
```

---

## Dependencies to Install

### Frontend (for Flow 1)

```bash
cd apps/web && pnpm add @radix-ui/react-dialog @radix-ui/react-alert-dialog
```

### Backend (for Flow 2 - Later)

```bash
cd apps/api && pnpm add plaid
```

### Frontend (for Flow 2 - Later)

```bash
cd apps/web && pnpm add react-plaid-link
```

---

## Flow 2: Bank Connection (Plaid Integration)

### Status: ⏸️ DEFERRED | **PRIORITY: LATER**

> **Prerequisite**: Set up Plaid developer account and obtain API credentials before starting this flow.

### Goal

Allow users to connect bank accounts, investment accounts, and mortgage accounts to auto-extract balances via Plaid.

### Flow Description

```
User clicks "Connect Bank" → Plaid Link opens → User authenticates →
Plaid returns token → Backend exchanges token → Accounts synced →
Assets/Liabilities created automatically
```

### Implementation Phases

#### Phase 2A: Database Schema ⬜

- [ ] Add `BankConnection` model to schema
- [ ] Add `LinkedAccount` model to schema
- [ ] Add `DataSource` enum (manual | plaid)
- [ ] Add `dataSource` field to Asset model
- [ ] Add `dataSource` field to Liability model
- [ ] Run migration

#### Phase 2B: Backend Plaid Module ⬜

- [ ] Install `plaid` npm package
- [ ] Create `apps/api/src/plaid/plaid.module.ts`
- [ ] Create `apps/api/src/plaid/plaid.controller.ts`
- [ ] Create `apps/api/src/plaid/plaid.service.ts`
- [ ] Create `apps/api/src/plaid/plaid-encryption.service.ts`
- [ ] Add DTOs for link token and exchange token
- [ ] Register module in `app.module.ts`

#### Phase 2C: Plaid Endpoints ⬜

- [ ] `POST /plaid/link-token` - Create Plaid Link token
- [ ] `POST /plaid/exchange-token` - Exchange public token for access token
- [ ] `GET /plaid/connections` - List bank connections
- [ ] `DELETE /plaid/connections/:id` - Remove connection
- [ ] `POST /plaid/connections/:id/sync` - Manual sync trigger

#### Phase 2D: Account Mapping Logic ⬜

- [ ] Map Plaid checking/savings → Asset (bank_account)
- [ ] Map Plaid credit_card → Liability (credit_card)
- [ ] Map Plaid mortgage → Liability (mortgage)
- [ ] Map Plaid auto loan → Liability (auto_loan)
- [ ] Map Plaid investment → Asset (investment)
- [ ] Auto-create entities on sync

#### Phase 2E: Frontend Plaid Integration ⬜

- [ ] Install `react-plaid-link` package
- [ ] Create `PlaidLinkButton.tsx` component
- [ ] Create `usePlaidLink.ts` hook
- [ ] Update `AccountConnectionStep.tsx` (replace "Coming Soon")
- [ ] Add plaid endpoints to API client

#### Phase 2F: Bank Connections UI ⬜

- [ ] Create `BankConnectionCard.tsx` component
- [ ] Create `LinkedAccountsList.tsx` component
- [ ] Show connection status (connected/error)
- [ ] Show last sync time

### Key Files (Plaid)

```
NEW FILES:
apps/api/src/plaid/
├── plaid.module.ts
├── plaid.controller.ts
├── plaid.service.ts
├── plaid-encryption.service.ts
└── dto/
    ├── create-link-token.dto.ts
    └── exchange-token.dto.ts

apps/web/src/components/plaid/
├── PlaidLinkButton.tsx
├── BankConnectionCard.tsx
└── LinkedAccountsList.tsx

apps/web/src/hooks/usePlaidLink.ts

MODIFIED FILES:
apps/api/prisma/schema.prisma
apps/api/src/app.module.ts
apps/web/src/components/onboarding/steps/AccountConnectionStep.tsx
packages/api-client/src/index.ts
packages/shared-types/src/index.ts
```

### Environment Variables Required

```
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox
PLAID_TOKEN_ENCRYPTION_KEY=32-byte-hex-string
```

### Account Type Mapping Reference

| Plaid Account Type  | Our Entity | Our Type      |
| ------------------- | ---------- | ------------- |
| depository:checking | Asset      | bank_account  |
| depository:savings  | Asset      | bank_account  |
| investment:\*       | Asset      | investment    |
| credit:credit card  | Liability  | credit_card   |
| loan:mortgage       | Liability  | mortgage      |
| loan:auto           | Liability  | auto_loan     |
| loan:student        | Liability  | student_loan  |
| loan:personal       | Liability  | personal_loan |

---

## Completed Features (Archive)

> These features were completed in the initial MVP. Kept for historical reference.

### Onboarding ✅ COMPLETE

```
Sign up → Select country → Connect accounts OR manual setup → Set goals → Land on Net Worth Dashboard
```

- Account Registration, Country Selection, Manual Setup, Goals, Income, Expenses, Assets & Debts

### Rent vs Buy Calculator ✅ COMPLETE

- Buy/Rent scenario inputs, Advanced assumptions, 5-30 year projections, Break-even calculation

### Loan Optimization ✅ COMPLETE

- Extra payment simulation, Payoff comparison charts, Interest savings visualization

### Investment Overview ✅ COMPLETE

- Portfolio summary, Dividend projections, Goals progress tracking

---

---

## Flow 3: Goals Feature Fixes

### Status: ✅ COMPLETE

### Issues Identified (All Resolved)

| Issue                                     | Description                                                                                  | Resolution                                                                               |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1. Asset linking for savings goals        | Users can't select which account to track for savings goals (emergency fund, vacation, etc.) | ✅ `linkedAssetIds` field exists in schema, DTOs, validation, service, and GoalModal     |
| 2. Goals not visible in Settings          | After creating goals in Settings, they don't appear in the list                              | ✅ Settings page uses `getAllProgress()` and passes `GoalProgressResponse[]` to GoalList |
| 3. Edit/Delete not working properly       | Goals should be editable/deletable                                                           | ✅ Edit/Delete correctly call API and refresh data                                       |
| 4. Investment goals progress not updating | Progress bars in Investment page don't reflect goal changes                                  | ✅ Investment page uses `useGoals` hook + `GoalsSummaryCard` with real-time data         |

### Implementation Phases

#### Phase 3A: Add Asset Linking to Goals ✅

**Goal**: Allow savings_target goals to link to a specific asset/account

**Database Changes**:

- [x] `linkedAssetIds` field exists in Goal model (`schema.prisma:392`)
- [x] No migration needed - field already present

**Backend Changes**:

- [x] `CreateGoalDto` includes `linkedAssetIds` (`create-goal.dto.ts:9`)
- [x] `UpdateGoalDto` includes `linkedAssetIds` (`update-goal.dto.ts:11`)
- [x] Validation schema includes `linkedAssetIds` (`packages/validation/src/index.ts:208,223`)
- [x] `goals.service.ts` calculates progress from linked assets (`lines 138-160`)

**Frontend Changes**:

- [x] `GoalModal.tsx` shows asset selector for `savings_target` goals (`lines 224-255`)
- [x] Assets list fetched and displayed as checkboxes
- [x] `CreateGoalDto` type in shared-types includes `linkedAssetIds` (`line 563`)

#### Phase 3B: Fix Goals Display in Settings ✅

**Goal**: Goals should appear in Settings list after creation

- [x] Settings page uses `apiClient.goals.getAllProgress()` (`page.tsx:32`)
- [x] State type is `GoalProgressResponse[]` (`page.tsx:16`)
- [x] `GoalList.tsx` accepts `GoalProgressResponse[]` props (`line 13`)
- [x] Uses calculated `progressPercent` from API response

#### Phase 3C: Verify Edit/Delete Functionality ✅

**Goal**: Ensure goals can be edited and deleted properly

- [x] `GoalModal.tsx` correctly populates form when editing (`lines 88-105`)
- [x] `apiClient.goals.update()` is called on edit (`line 140`)
- [x] `apiClient.goals.delete()` is called on delete (`GoalList.tsx:62`)
- [x] `onRefresh()` is called after both operations
- [x] Refresh properly updates the list

#### Phase 3D: Fix Investment Goals Panel ✅

**Goal**: Investment page goal cards should reflect real-time progress

**Implementation (Option A - Use Goals API)**:

- [x] Investment page uses `useGoals` hook directly (`page.tsx:25`)
- [x] `useGoals` calls `getAllInsights()` for real-time data (`useGoals.ts:31`)
- [x] `GoalsSummaryCard` component displays goals with `filterType` support (`page.tsx:86`)
- [x] Old `InvestmentGoalsPanel` replaced with `GoalsSummaryCard`

### Key Files (All Complete)

```
IMPLEMENTED FILES:
apps/api/prisma/schema.prisma                          # linkedAssetIds field exists
apps/api/src/goals/dto/create-goal.dto.ts              # linkedAssetIds included
apps/api/src/goals/dto/update-goal.dto.ts              # linkedAssetIds included
apps/api/src/goals/goals.service.ts                    # Progress calc from linked assets
apps/web/src/app/dashboard/settings/page.tsx           # Uses getAllProgress()
apps/web/src/app/dashboard/investments/page.tsx        # Uses useGoals + GoalsSummaryCard
apps/web/src/components/settings/finances/GoalList.tsx # Accepts GoalProgressResponse[]
apps/web/src/components/settings/finances/GoalModal.tsx # Asset selector for savings goals
apps/web/src/components/dashboard/goals/GoalsSummaryCard.tsx # New goals display component
apps/web/src/hooks/useGoals.ts                         # Uses getAllInsights()
packages/shared-types/src/index.ts                     # Goal type with linkedAssetIds
packages/validation/src/index.ts                       # linkedAssetIds in schema
```

---

## Last Updated

- **Date**: January 5, 2026
- **Status**: Flow 3 (Goals Feature Fixes) COMPLETE
- **Next Action**: Flow 2 (Plaid Integration) when API credentials are available
