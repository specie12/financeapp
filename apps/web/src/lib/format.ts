/**
 * Formatting utilities for currency, percentages, and numbers
 */

/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted dollar string (e.g., "$1,234.56")
 */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

/**
 * Format percentage
 * @param percent - Percentage value (e.g., 12.34 for 12.34%)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export function formatPercent(percent: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percent / 100)
}

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted number string (e.g., "1,234.56")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format compact number (e.g., 1.2K, 1.2M, 1.2B)
 * @param num - Number to format
 * @returns Compact formatted number string
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}
