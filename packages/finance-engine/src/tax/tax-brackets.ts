import type { TaxBracket, FilingStatus } from './tax.types'

// US Federal Tax Brackets for 2025/2026 (in cents)
const BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 1162500, rate: 10 },
    { min: 1162500, max: 4727500, rate: 12 },
    { min: 4727500, max: 10060000, rate: 22 },
    { min: 10060000, max: 19125000, rate: 24 },
    { min: 19125000, max: 24350000, rate: 32 },
    { min: 24350000, max: 60962500, rate: 35 },
    { min: 60962500, max: null, rate: 37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 2325000, rate: 10 },
    { min: 2325000, max: 9455000, rate: 12 },
    { min: 9455000, max: 20120000, rate: 22 },
    { min: 20120000, max: 38350000, rate: 24 },
    { min: 38350000, max: 48700000, rate: 32 },
    { min: 48700000, max: 73125000, rate: 35 },
    { min: 73125000, max: null, rate: 37 },
  ],
  married_filing_separately: [
    { min: 0, max: 1162500, rate: 10 },
    { min: 1162500, max: 4727500, rate: 12 },
    { min: 4727500, max: 10060000, rate: 22 },
    { min: 10060000, max: 19175000, rate: 24 },
    { min: 19175000, max: 24350000, rate: 32 },
    { min: 24350000, max: 36562500, rate: 35 },
    { min: 36562500, max: null, rate: 37 },
  ],
  head_of_household: [
    { min: 0, max: 1650000, rate: 10 },
    { min: 1650000, max: 6350000, rate: 12 },
    { min: 6350000, max: 10060000, rate: 22 },
    { min: 10060000, max: 19125000, rate: 24 },
    { min: 19125000, max: 24350000, rate: 32 },
    { min: 24350000, max: 60962500, rate: 35 },
    { min: 60962500, max: null, rate: 37 },
  ],
}

// Standard deductions in cents
const STANDARD_DEDUCTIONS_2025: Record<FilingStatus, number> = {
  single: 1550000,
  married_filing_jointly: 3100000,
  married_filing_separately: 1550000,
  head_of_household: 2300000,
}

// 2026 brackets (using same as 2025 as placeholder — can be updated when IRS publishes)
const BRACKETS_2026 = BRACKETS_2025
const STANDARD_DEDUCTIONS_2026 = STANDARD_DEDUCTIONS_2025

const BRACKETS_BY_YEAR: Record<number, Record<FilingStatus, TaxBracket[]>> = {
  2025: BRACKETS_2025,
  2026: BRACKETS_2026,
}

const STANDARD_DEDUCTIONS_BY_YEAR: Record<number, Record<FilingStatus, number>> = {
  2025: STANDARD_DEDUCTIONS_2025,
  2026: STANDARD_DEDUCTIONS_2026,
}

export function getTaxBrackets(taxYear: number, filingStatus: FilingStatus): TaxBracket[] {
  const yearBrackets = BRACKETS_BY_YEAR[taxYear] || BRACKETS_BY_YEAR[2025]
  return yearBrackets[filingStatus]
}

export function getStandardDeduction(taxYear: number, filingStatus: FilingStatus): number {
  const yearDeductions = STANDARD_DEDUCTIONS_BY_YEAR[taxYear] || STANDARD_DEDUCTIONS_BY_YEAR[2025]
  return yearDeductions[filingStatus]
}

// Capital gains tax rates (simplified)
export const LONG_TERM_CAPITAL_GAINS_RATES = {
  single: [
    { min: 0, max: 4787500, rate: 0 },
    { min: 4787500, max: 52790000, rate: 15 },
    { min: 52790000, max: null, rate: 20 },
  ],
  married_filing_jointly: [
    { min: 0, max: 9612500, rate: 0 },
    { min: 9612500, max: 59325000, rate: 15 },
    { min: 59325000, max: null, rate: 20 },
  ],
  married_filing_separately: [
    { min: 0, max: 4806250, rate: 0 },
    { min: 4806250, max: 29662500, rate: 15 },
    { min: 29662500, max: null, rate: 20 },
  ],
  head_of_household: [
    { min: 0, max: 5100000, rate: 0 },
    { min: 5100000, max: 56100000, rate: 15 },
    { min: 56100000, max: null, rate: 20 },
  ],
}
