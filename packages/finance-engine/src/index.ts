import type { Transaction, Budget, BudgetPeriod, Currency } from '@finance-app/shared-types'

// ============================================
// Money Utilities (Decimal.js-based)
// ============================================
export * from './money'

// ============================================
// Loan Amortization Engine
// ============================================
export * from './amortization'

// ============================================
// Investment Aggregation Engine
// ============================================
export * from './investment'

// ============================================
// Scenario Engine
// ============================================
export * from './scenario'

// ============================================
// Projection Engine
// ============================================
export * from './projection'

// ============================================
// Rent vs Buy Calculator
// ============================================
export * from './rent-vs-buy'

// ============================================
// Financial Insights Engine
// ============================================
export * from './insights'

// ============================================
// Mortgage vs Invest Calculator
// ============================================
export * from './mortgage-vs-invest'

// ============================================
// Tax Calculator
// ============================================
export * from './tax'

// ============================================
// Interest Calculations
// ============================================

export interface CompoundInterestParams {
  principal: number
  annualRate: number
  compoundsPerYear: number
  years: number
}

export function calculateCompoundInterest(params: CompoundInterestParams): number {
  const { principal, annualRate, compoundsPerYear, years } = params
  const rate = annualRate / 100
  return principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * years)
}

export interface SimpleInterestParams {
  principal: number
  annualRate: number
  years: number
}

export function calculateSimpleInterest(params: SimpleInterestParams): number {
  const { principal, annualRate, years } = params
  const rate = annualRate / 100
  return principal * (1 + rate * years)
}

// ============================================
// Budget Calculations
// ============================================

export interface BudgetAnalysis {
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  percentageUsed: number
  isOverBudget: boolean
}

export function analyzeBudget(budget: Budget, transactions: Transaction[]): BudgetAnalysis {
  const spentAmount = transactions
    .filter((t) => t.categoryId === budget.categoryId && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const remainingAmount = budget.amount - spentAmount
  const percentageUsed = (spentAmount / budget.amount) * 100

  return {
    budgetAmount: budget.amount,
    spentAmount,
    remainingAmount,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    isOverBudget: spentAmount > budget.amount,
  }
}

export function getDaysInBudgetPeriod(period: BudgetPeriod): number {
  switch (period) {
    case 'weekly':
      return 7
    case 'monthly':
      return 30
    case 'quarterly':
      return 90
    case 'yearly':
      return 365
  }
}

// ============================================
// Transaction Analysis
// ============================================

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  transactionCount: number
  averageTransaction: number
}

export function summarizeTransactions(transactions: Transaction[]): TransactionSummary {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const transactionCount = transactions.length
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  return {
    totalIncome,
    totalExpenses,
    netAmount: totalIncome - totalExpenses,
    transactionCount,
    averageTransaction: transactionCount > 0 ? totalAmount / transactionCount : 0,
  }
}

export interface CategoryBreakdown {
  categoryId: string | null
  totalAmount: number
  transactionCount: number
  percentage: number
}

export function getExpensesByCategory(transactions: Transaction[]): CategoryBreakdown[] {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)

  const categoryMap = new Map<string | null, { amount: number; count: number }>()

  for (const transaction of expenses) {
    const existing = categoryMap.get(transaction.categoryId) ?? { amount: 0, count: 0 }
    categoryMap.set(transaction.categoryId, {
      amount: existing.amount + transaction.amount,
      count: existing.count + 1,
    })
  }

  return Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
    categoryId,
    totalAmount: data.amount,
    transactionCount: data.count,
    percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 10000) / 100 : 0,
  }))
}

// ============================================
// Savings & Goals
// ============================================

export interface SavingsGoalProjection {
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  monthsToGoal: number
  projectedDate: Date
}

export function projectSavingsGoal(
  targetAmount: number,
  currentAmount: number,
  monthlyContribution: number,
): SavingsGoalProjection {
  const remaining = targetAmount - currentAmount
  const monthsToGoal =
    monthlyContribution > 0 ? Math.ceil(remaining / monthlyContribution) : Infinity

  const projectedDate = new Date()
  if (Number.isFinite(monthsToGoal)) {
    projectedDate.setMonth(projectedDate.getMonth() + monthsToGoal)
  }

  return {
    targetAmount,
    currentAmount,
    monthlyContribution,
    monthsToGoal,
    projectedDate,
  }
}

// ============================================
// Currency Utilities
// ============================================

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  INR: '₹',
  NGN: '₦',
}

export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency]
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`
}

// ============================================
// Date Utilities
// ============================================

export function getDateRange(
  period: BudgetPeriod,
  referenceDate: Date = new Date(),
): {
  startDate: Date
  endDate: Date
} {
  const startDate = new Date(referenceDate)
  const endDate = new Date(referenceDate)

  switch (period) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - startDate.getDay())
      endDate.setDate(startDate.getDate() + 6)
      break
    case 'monthly':
      startDate.setDate(1)
      endDate.setMonth(endDate.getMonth() + 1)
      endDate.setDate(0)
      break
    case 'quarterly': {
      const quarter = Math.floor(startDate.getMonth() / 3)
      startDate.setMonth(quarter * 3, 1)
      endDate.setMonth(quarter * 3 + 3, 0)
      break
    }
    case 'yearly':
      startDate.setMonth(0, 1)
      endDate.setMonth(11, 31)
      break
  }

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}
