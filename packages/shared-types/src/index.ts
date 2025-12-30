// ============================================
// Core Entity Types
// ============================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  userId: string
  name: string
  type: AccountType
  currency: Currency
  balance: number
  createdAt: Date
  updatedAt: Date
}

export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'cash'

export interface Transaction {
  id: string
  accountId: string
  categoryId: string | null
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  date: Date
  createdAt: Date
  updatedAt: Date
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Category {
  id: string
  userId: string
  name: string
  type: TransactionType
  icon: string | null
  color: string | null
  parentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  userId: string
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: Date
  endDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export type BudgetPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

// ============================================
// Asset Types
// ============================================

export interface Asset {
  id: string
  householdId: string
  name: string
  type: AssetType
  currentValueCents: number
  annualGrowthRatePercent: number | null
  createdAt: Date
  updatedAt: Date
}

export type AssetType =
  | 'real_estate'
  | 'vehicle'
  | 'investment'
  | 'retirement_account'
  | 'bank_account'
  | 'crypto'
  | 'other'

// ============================================
// Liability Types
// ============================================

export interface Liability {
  id: string
  householdId: string
  name: string
  type: LiabilityType
  principalCents: number
  currentBalanceCents: number
  interestRatePercent: number
  minimumPaymentCents: number
  paymentFrequency: Frequency
  termMonths: number | null
  startDate: Date
  createdAt: Date
  updatedAt: Date
}

export type LiabilityType =
  | 'mortgage'
  | 'auto_loan'
  | 'student_loan'
  | 'credit_card'
  | 'personal_loan'
  | 'other'

// ============================================
// CashFlowItem Types
// ============================================

export interface CashFlowItem {
  id: string
  householdId: string
  name: string
  type: CashFlowType
  amountCents: number
  frequency: Frequency
  startDate: Date | null
  endDate: Date | null
  annualGrowthRatePercent: number | null
  createdAt: Date
  updatedAt: Date
}

export type CashFlowType = 'income' | 'expense'

export type Frequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'

// ============================================
// Currency Types
// ============================================

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'INR' | 'NGN'

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// DTO Types (Data Transfer Objects)
// ============================================

export interface CreateUserDto {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface CreateAccountDto {
  name: string
  type: AccountType
  currency: Currency
  initialBalance?: number
}

export interface CreateTransactionDto {
  accountId: string
  categoryId?: string
  type: TransactionType
  amount: number
  description: string
  date: Date
}

export interface CreateCategoryDto {
  name: string
  type: TransactionType
  icon?: string
  color?: string
  parentId?: string
}

export interface CreateBudgetDto {
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: Date
  endDate?: Date
}

export interface CreateAssetDto {
  name: string
  type: AssetType
  currentValueCents: number
  annualGrowthRatePercent?: number | null
}

export interface CreateLiabilityDto {
  name: string
  type: LiabilityType
  principalCents: number
  currentBalanceCents: number
  interestRatePercent: number
  minimumPaymentCents: number
  paymentFrequency?: Frequency
  termMonths?: number | null
  startDate: Date
}

export interface CreateCashFlowItemDto {
  name: string
  type: CashFlowType
  amountCents: number
  frequency: Frequency
  startDate?: Date | null
  endDate?: Date | null
  annualGrowthRatePercent?: number | null
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

// ============================================
// Dashboard Types
// ============================================

// Net Worth Dashboard
export interface AssetBreakdown {
  id: string
  name: string
  type: string
  valueCents: number
  growthRatePercent: number | null
}

export interface LiabilityBreakdown {
  id: string
  name: string
  type: string
  balanceCents: number
  interestRatePercent: number
}

export interface AssetsByType {
  type: string
  totalValueCents: number
  count: number
  items: AssetBreakdown[]
}

export interface LiabilitiesByType {
  type: string
  totalBalanceCents: number
  count: number
  items: LiabilityBreakdown[]
}

export interface NetWorthProjection {
  year: number
  date: Date
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
}

export interface NetWorthResponse {
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
  assetsByType: AssetsByType[]
  liabilitiesByType: LiabilitiesByType[]
  projection: NetWorthProjection[]
}

// Loans Dashboard
export interface LoanSummary {
  totalOutstandingCents: number
  totalMonthlyPaymentCents: number
  averageInterestRatePercent: number
  loanCount: number
}

export interface LoanDetail {
  id: string
  name: string
  type: string
  principalCents: number
  currentBalanceCents: number
  interestRatePercent: number
  minimumPaymentCents: number
  termMonths: number | null
  startDate: Date
  estimatedPayoffDate: Date | null
}

export interface LoansResponse {
  summary: LoanSummary
  loans: LoanDetail[]
}

export interface AmortizationEntry {
  paymentNumber: number
  paymentDate: Date
  beginningBalanceCents: number
  scheduledPaymentCents: number
  principalCents: number
  interestCents: number
  endingBalanceCents: number
  cumulativePrincipalCents: number
  cumulativeInterestCents: number
}

export interface LoanAmortizationResponse {
  loan: LoanDetail
  monthlyPaymentCents: number
  totalPaymentsCents: number
  totalInterestCents: number
  originalTermMonths: number
  actualPayoffMonth: number
  payoffDate: Date
  schedule: AmortizationEntry[]
}

// Investments Dashboard
export interface InvestmentHoldingSummary {
  id: string
  name: string
  type: string
  valueCents: number
  costBasisCents: number
  gainLossCents: number
  gainLossPercent: number
  allocationPercent: number
}

export interface InvestmentPortfolioSummary {
  totalValueCents: number
  totalCostBasisCents: number
  unrealizedGainCents: number
  unrealizedGainPercent: number
  totalReturnCents: number
  totalReturnPercent: number
}

export interface InvestmentsResponse {
  summary: InvestmentPortfolioSummary
  holdings: InvestmentHoldingSummary[]
}

// ============================================
// Scenario Types
// ============================================

export type OverrideTargetType = 'asset' | 'liability' | 'cash_flow_item'

export interface ScenarioOverride {
  id: string
  targetType: OverrideTargetType
  entityId: string
  fieldName: string
  value: string
}

export interface Scenario {
  id: string
  householdId: string
  name: string
  description: string | null
  isBaseline: boolean
  createdAt: Date
  updatedAt: Date
  overrides: ScenarioOverride[]
}

export interface CreateScenarioOverrideDto {
  targetType: OverrideTargetType
  entityId: string
  fieldName: string
  value: string
}

export interface CreateScenarioDto {
  name: string
  description?: string
  isBaseline?: boolean
  overrides?: CreateScenarioOverrideDto[]
}

export interface UpdateScenarioDto {
  name?: string
  description?: string
  isBaseline?: boolean
  overrides?: CreateScenarioOverrideDto[]
}

export interface CompareScenariosDto {
  scenarioIds: string[]
  horizonYears?: number
}

// Scenario Projection Types
export interface YearlyProjectionSnapshot {
  year: number
  date: Date
  totalAssetsCents: number
  totalLiabilitiesCents: number
  netWorthCents: number
  totalIncomeCents: number
  totalExpensesCents: number
  debtPaymentsCents: number
  netCashFlowCents: number
}

export interface ProjectionSummary {
  startingNetWorthCents: number
  endingNetWorthCents: number
  netWorthChangeCents: number
  netWorthChangePercent: number
  totalIncomeOverPeriodCents: number
  totalExpensesOverPeriodCents: number
  totalDebtPaidCents: number
  totalInterestPaidCents: number
}

export interface ScenarioProjectionResponse {
  scenario: Scenario
  startDate: Date
  horizonYears: number
  yearlySnapshots: YearlyProjectionSnapshot[]
  summary: ProjectionSummary
}

export interface ScenarioComparisonItem {
  scenario: Scenario
  projection: {
    startDate: Date
    horizonYears: number
    yearlySnapshots: YearlyProjectionSnapshot[]
    summary: ProjectionSummary
  }
}

export interface ScenarioComparisonResponse {
  comparisons: ScenarioComparisonItem[]
}
