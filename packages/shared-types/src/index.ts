// ============================================
// Core Entity Types
// ============================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  country: Country
  createdAt: Date
  updatedAt: Date
}

// ============================================
// Country Types
// ============================================

export type Country = 'US' | 'UK' | 'CA'

export const SUPPORTED_COUNTRIES: Country[] = ['US']
export const COMING_SOON_COUNTRIES: Country[] = ['UK', 'CA']

export const COUNTRY_NAMES: Record<Country, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  CA: 'Canada',
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
  dividendYieldPercent: number | null
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
  dividendYieldPercent?: number | null
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

// ============================================
// Plan Tier Types
// ============================================

export type PlanTier = 'free' | 'pro' | 'premium'

export interface PlanLimits {
  maxScenarios: number
  maxHorizonYears: number
}

export interface PlanLimitError {
  statusCode: 403
  errorCode: 'SCENARIO_LIMIT_EXCEEDED' | 'HORIZON_LIMIT_EXCEEDED'
  message: string
  currentCount?: number
  requested?: number
  limit: number
}

// ============================================
// Goal Types
// ============================================

export type GoalType = 'net_worth_target' | 'savings_target' | 'debt_freedom'

export type GoalStatus = 'active' | 'achieved' | 'paused'

export interface Goal {
  id: string
  householdId: string
  type: GoalType
  name: string
  targetAmountCents: number
  currentAmountCents: number
  targetDate: Date | null
  status: GoalStatus
  linkedLiabilityId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateGoalDto {
  type: GoalType
  name: string
  targetAmountCents: number
  targetDate?: Date | null
  linkedLiabilityId?: string | null
}

export interface UpdateGoalDto {
  type?: GoalType
  name?: string
  targetAmountCents?: number
  currentAmountCents?: number
  targetDate?: Date | null
  status?: GoalStatus
  linkedLiabilityId?: string | null
}

export interface GoalProgressResponse {
  goal: Goal
  progressPercent: number
  remainingAmountCents: number
  onTrack: boolean
  projectedCompletionDate: Date | null
  daysRemaining: number | null
}

// ============================================
// Rent vs Buy Calculator Types
// ============================================

export interface RentVsBuyRequest {
  startDate: Date
  projectionYears: number
  buy: {
    homePriceCents: number
    downPaymentPercent: number
    mortgageInterestRatePercent: number
    mortgageTermYears: number
    closingCostPercent: number
    homeownersInsuranceAnnualCents: number
    hoaMonthlyDuesCents: number
    propertyTaxRateOverride?: number
    maintenanceRateOverride?: number
  }
  rent: {
    monthlyRentCents: number
    securityDepositMonths: number
    rentersInsuranceAnnualCents: number
    rentIncreaseRateOverride?: number
  }
  assumptions?: {
    homeAppreciationRatePercent?: number
    investmentReturnRatePercent?: number
    inflationRatePercent?: number
    propertyTaxRatePercent?: number
    maintenanceRatePercent?: number
    rentIncreaseRatePercent?: number
    marginalTaxRatePercent?: number
    sellingCostPercent?: number
  }
}

// ============================================
// Affordability Analysis Types
// ============================================

export interface AffordabilityThresholds {
  /** Maximum housing cost as percentage of gross income (default 28%) */
  housingCostMaxPercent: number
  /** Maximum total debt as percentage of gross income (default 36%) */
  totalDebtMaxPercent: number
  /** Maximum rent as percentage of gross income (default 30%) */
  rentMaxPercent: number
}

export interface AffordabilityAnalysis {
  /** Whether user has income data available */
  hasIncomeData: boolean
  /** Gross monthly income in cents */
  grossMonthlyIncomeCents: number
  /** Existing monthly debt payments in cents (excluding new mortgage) */
  existingDebtPaymentsCents: number

  // Buy scenario affordability
  buy: {
    /** Monthly housing cost (PITI + HOA) in cents */
    monthlyHousingCostCents: number
    /** Housing cost as percentage of income */
    housingCostPercent: number
    /** Is housing cost within 28% threshold */
    isHousingAffordable: boolean
    /** Total monthly debt (housing + existing) as percentage of income */
    totalDebtPercent: number
    /** Is total debt within 36% threshold */
    isTotalDebtAffordable: boolean
    /** Maximum affordable home price based on income */
    maxAffordableHomePriceCents: number
  }

  // Rent scenario affordability
  rent: {
    /** Monthly rent cost in cents */
    monthlyRentCents: number
    /** Rent as percentage of income */
    rentPercent: number
    /** Is rent within 30% threshold */
    isAffordable: boolean
    /** Maximum affordable monthly rent based on income */
    maxAffordableRentCents: number
  }

  /** Thresholds used for analysis */
  thresholds: AffordabilityThresholds
}

export interface RentVsBuyResultWithAffordability {
  /** Core rent vs buy calculation result */
  calculation: {
    input: RentVsBuyRequest
    effectiveAssumptions: {
      propertyAppreciationRatePercent: number
      maintenanceRatePercent: number
      propertyTaxRatePercent: number
      marginalTaxRatePercent: number
      investmentReturnRatePercent: number
      rentIncreaseRatePercent: number
      inflationRatePercent: number
      sellingCostPercent: number
    }
    yearlyComparisons: Array<{
      year: number
      date: string
      buyNetWorthCents: number
      rentNetWorthCents: number
      netWorthDifferenceCents: number
      buyAnnualCostCents: number
      rentAnnualCostCents: number
      buyIsBetterThisYear: boolean
    }>
    summary: {
      initialBuyCostsCents: number
      initialRentCostsCents: number
      totalBuyCostsCents: number
      totalRentCostsCents: number
      finalHomeEquityCents: number
      finalInvestmentBalanceCents: number
      finalBuyNetWorthCents: number
      finalRentNetWorthCents: number
      netWorthAdvantageCents: number
      breakEvenYear: number | null
      recommendation: 'buy' | 'rent' | 'neutral'
      yearsBuyingIsBetter: number
      yearsRentingIsBetter: number
      totalMortgageInterestPaidCents: number
      totalPropertyTaxesPaidCents: number
      totalMaintenancePaidCents: number
      totalTaxSavingsCents: number
      totalRentPaidCents: number
      totalInvestmentGainsCents: number
    }
  }
  /** Affordability analysis based on user income */
  affordability: AffordabilityAnalysis | null
}

// ============================================
// Loan Optimization Types
// ============================================

export interface ExtraPayment {
  paymentNumber: number
  amountCents: number
}

export interface ExtraPaymentSimulationRequest {
  extraPayments: ExtraPayment[]
}

export interface RecurringExtraPaymentRequest {
  extraAmountCents: number
  startPaymentNumber?: number
}

export interface LoanPayoffComparison {
  originalPayoffDate: Date
  newPayoffDate: Date
  monthsSaved: number
  interestSavedCents: number
  totalPaymentsCents: number
}

export interface ExtraPaymentSimulationResponse {
  loanId: string
  comparison: LoanPayoffComparison
  schedule: AmortizationEntry[]
}

export interface LoanSimulationRequest {
  extraMonthlyPaymentCents: number
  oneTimePaymentCents: number
  oneTimePaymentMonth: number
  useBiweekly: boolean
}

export interface LoanSimulationSummary {
  monthlyPaymentCents: number
  totalPaymentsCents: number
  totalInterestCents: number
  payoffMonth: number
  payoffDate: Date
}

export interface LoanSimulationSavings {
  interestSavedCents: number
  monthsSaved: number
  totalSavedCents: number
}

export interface LoanSimulationResponse {
  loan: LoanDetail
  original: LoanSimulationSummary
  modified: LoanSimulationSummary
  savings: LoanSimulationSavings
  originalSchedule: AmortizationEntry[]
  modifiedSchedule: AmortizationEntry[]
}

// ============================================
// Dividend & Investment Enhancement Types
// ============================================

export const DEFAULT_DIVIDEND_YIELDS: Record<AssetType, number> = {
  investment: 2,
  retirement_account: 2,
  real_estate: 4,
  bank_account: 4,
  crypto: 0,
  vehicle: 0,
  other: 0,
}

export interface DividendProjection {
  assetId: string
  assetName: string
  assetType: AssetType
  valueCents: number
  yieldPercent: number
  annualDividendCents: number
  monthlyDividendCents: number
  isCustomYield: boolean
}

export interface GoalProgressSummary {
  goalId: string
  goalName: string
  goalType: GoalType
  targetAmountCents: number
  currentAmountCents: number
  progressPercent: number
  remainingCents: number
  onTrack: boolean
  projectedCompletionDate: Date | null
}

export interface EnhancedInvestmentsResponse extends InvestmentsResponse {
  dividendProjections: DividendProjection[]
  totalAnnualDividendsCents: number
  totalMonthlyDividendsCents: number
  goalProgress: GoalProgressSummary[]
}
