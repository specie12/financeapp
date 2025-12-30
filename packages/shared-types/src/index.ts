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
