import type { Frequency } from '@finance-app/shared-types'
import type { MonthlyExpenses, OnboardingState } from './types'
import type { IncomeItem, AssetItem, LiabilityItem } from './schemas'

// ============================================
// Currency Conversion
// ============================================

/**
 * Convert dollars to cents (integer)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100
}

/**
 * Format cents as currency string
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(centsToDollars(cents))
}

/**
 * Format dollars as currency string
 */
export function formatDollars(dollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)
}

// ============================================
// ID Generation
// ============================================

/**
 * Generate a unique ID for local items
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================
// Frequency Calculations
// ============================================

const MONTHS_PER_FREQUENCY: Record<Frequency, number> = {
  one_time: 0,
  weekly: 1 / 4.33,
  biweekly: 1 / 2.17,
  monthly: 1,
  quarterly: 3,
  annually: 12,
}

/**
 * Convert any frequency amount to monthly amount
 */
export function toMonthlyAmount(amount: number, frequency: Frequency): number {
  if (frequency === 'one_time') return 0
  const monthsPerPeriod = MONTHS_PER_FREQUENCY[frequency]
  return amount / monthsPerPeriod
}

/**
 * Calculate total monthly income from income items
 */
export function calculateMonthlyIncome(items: IncomeItem[]): number {
  return items.reduce((total, item) => {
    return total + toMonthlyAmount(item.amount, item.frequency)
  }, 0)
}

/**
 * Calculate total monthly expenses
 */
export function calculateMonthlyExpenses(expenses: MonthlyExpenses): number {
  return (
    expenses.housing + expenses.utilities + expenses.transportation + expenses.food + expenses.other
  )
}

// ============================================
// Net Worth Calculations
// ============================================

/**
 * Calculate total assets value
 */
export function calculateTotalAssets(assets: AssetItem[]): number {
  return assets.reduce((total, asset) => total + asset.value, 0)
}

/**
 * Calculate total liabilities balance
 */
export function calculateTotalLiabilities(liabilities: LiabilityItem[]): number {
  return liabilities.reduce((total, liability) => total + liability.currentBalance, 0)
}

/**
 * Calculate net worth
 */
export function calculateNetWorth(assets: AssetItem[], liabilities: LiabilityItem[]): number {
  return calculateTotalAssets(assets) - calculateTotalLiabilities(liabilities)
}

// ============================================
// Dashboard Preview Calculations
// ============================================

export interface DashboardPreview {
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

/**
 * Calculate dashboard preview data from onboarding state
 */
export function calculateDashboardPreview(state: OnboardingState): DashboardPreview {
  const monthlyIncome = calculateMonthlyIncome(state.incomeItems)
  const monthlyExpenses = calculateMonthlyExpenses(state.expenses)
  const monthlySavings = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0
  const totalAssets = calculateTotalAssets(state.assets)
  const totalLiabilities = calculateTotalLiabilities(state.liabilities)
  const netWorth = totalAssets - totalLiabilities

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,
    savingsRate,
    totalAssets,
    totalLiabilities,
    netWorth,
  }
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Check if step 1 is complete (user registered)
 */
export function isStep1Complete(state: OnboardingState): boolean {
  return state.user !== null && state.tokens !== null
}

/**
 * Check if step 2 is complete (has at least one income)
 */
export function isStep2Complete(state: OnboardingState): boolean {
  return state.incomeItems.length > 0
}

/**
 * Check if step 3 is complete (has at least one expense)
 */
export function isStep3Complete(state: OnboardingState): boolean {
  const total = calculateMonthlyExpenses(state.expenses)
  return total > 0
}

/**
 * Check if user can proceed to target step
 */
export function canProceedToStep(state: OnboardingState, targetStep: number): boolean {
  if (targetStep <= 1) return true
  if (targetStep === 2) return isStep1Complete(state)
  if (targetStep === 3) return isStep1Complete(state) && isStep2Complete(state)
  if (targetStep === 4)
    return isStep1Complete(state) && isStep2Complete(state) && isStep3Complete(state)
  if (targetStep === 5)
    return isStep1Complete(state) && isStep2Complete(state) && isStep3Complete(state)
  return false
}

// ============================================
// Expense Category Labels
// ============================================

export const EXPENSE_CATEGORIES = [
  { key: 'housing', label: 'Housing', description: 'Rent or mortgage payment' },
  { key: 'utilities', label: 'Utilities', description: 'Electric, gas, water, internet' },
  { key: 'transportation', label: 'Transportation', description: 'Car payment, gas, transit' },
  { key: 'food', label: 'Food', description: 'Groceries and dining out' },
  { key: 'other', label: 'Other', description: 'Entertainment, subscriptions' },
] as const
