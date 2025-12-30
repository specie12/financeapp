/**
 * Format cents as currency string
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Format cents as compact currency (e.g., $1.2M, $450K)
 */
export function formatCentsCompact(cents: number): string {
  const dollars = cents / 100
  if (Math.abs(dollars) >= 1000000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(dollars)
  }
  if (Math.abs(dollars) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(dollars)
  }
  return formatCents(cents)
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/**
 * Format percentage without sign
 */
export function formatPercentPlain(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format date as short string (e.g., Jan 2025)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Format date as medium string (e.g., Jan 15, 2025)
 */
export function formatDateMedium(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Get asset type label
 */
export function getAssetTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    real_estate: 'Real Estate',
    vehicle: 'Vehicle',
    investment: 'Investment',
    retirement_account: 'Retirement',
    bank_account: 'Bank Account',
    crypto: 'Cryptocurrency',
    other: 'Other',
  }
  return labels[type] || type
}

/**
 * Get liability type label
 */
export function getLiabilityTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mortgage: 'Mortgage',
    auto_loan: 'Auto Loan',
    student_loan: 'Student Loan',
    credit_card: 'Credit Card',
    personal_loan: 'Personal Loan',
    other: 'Other',
  }
  return labels[type] || type
}
