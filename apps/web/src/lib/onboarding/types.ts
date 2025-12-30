import type { AuthUser, AuthTokens, Frequency } from '@finance-app/shared-types'
import type { IncomeItem, AssetItem, LiabilityItem } from './schemas'

// ============================================
// Onboarding State Types
// ============================================

export type OnboardingStep = 1 | 2 | 3 | 4 | 5

export interface MonthlyExpenses {
  housing: number
  utilities: number
  transportation: number
  food: number
  other: number
}

export interface OnboardingState {
  currentStep: OnboardingStep
  isLoading: boolean
  error: string | null

  // Auth (Step 1)
  user: AuthUser | null
  tokens: AuthTokens | null

  // Financial data (Steps 2-4)
  incomeItems: IncomeItem[]
  expenses: MonthlyExpenses
  assets: AssetItem[]
  liabilities: LiabilityItem[]
}

// ============================================
// Onboarding Actions
// ============================================

export type OnboardingAction =
  | { type: 'SET_STEP'; step: OnboardingStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_USER'; user: AuthUser; tokens: AuthTokens }
  | { type: 'ADD_INCOME'; income: IncomeItem }
  | { type: 'UPDATE_INCOME'; index: number; income: IncomeItem }
  | { type: 'REMOVE_INCOME'; index: number }
  | { type: 'SET_INCOME_ITEMS'; items: IncomeItem[] }
  | { type: 'SET_EXPENSES'; expenses: Partial<MonthlyExpenses> }
  | { type: 'ADD_ASSET'; asset: AssetItem }
  | { type: 'UPDATE_ASSET'; index: number; asset: AssetItem }
  | { type: 'REMOVE_ASSET'; index: number }
  | { type: 'ADD_LIABILITY'; liability: LiabilityItem }
  | { type: 'UPDATE_LIABILITY'; index: number; liability: LiabilityItem }
  | { type: 'REMOVE_LIABILITY'; index: number }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'RESET' }

// ============================================
// Step Component Props
// ============================================

export interface StepProps {
  onNext: () => void
  onBack?: () => void
  isLoading?: boolean
}

// ============================================
// Quick Add Options
// ============================================

export interface QuickAddOption {
  label: string
  name: string
  type?: string
}

export const INCOME_QUICK_ADD: QuickAddOption[] = [
  { label: 'Salary', name: 'Salary' },
  { label: 'Freelance', name: 'Freelance Income' },
  { label: 'Investments', name: 'Investment Income' },
  { label: 'Other', name: 'Other Income' },
]

export const ASSET_QUICK_ADD: QuickAddOption[] = [
  { label: 'Home', name: 'Primary Residence', type: 'real_estate' },
  { label: 'Car', name: 'Vehicle', type: 'vehicle' },
  { label: 'Investments', name: 'Investment Account', type: 'investment' },
  { label: 'Savings', name: 'Savings Account', type: 'bank_account' },
]

export const LIABILITY_QUICK_ADD: QuickAddOption[] = [
  { label: 'Mortgage', name: 'Mortgage', type: 'mortgage' },
  { label: 'Car Loan', name: 'Auto Loan', type: 'auto_loan' },
  { label: 'Student Loan', name: 'Student Loan', type: 'student_loan' },
  { label: 'Credit Card', name: 'Credit Card', type: 'credit_card' },
]

// ============================================
// Frequency Display Labels
// ============================================

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  one_time: 'One Time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
}
