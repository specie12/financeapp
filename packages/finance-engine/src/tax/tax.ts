import type {
  TaxCalculationInput,
  TaxCalculationResult,
  TaxBracketResult,
  FilingStatus,
} from './tax.types'
import { getTaxBrackets, getStandardDeduction, LONG_TERM_CAPITAL_GAINS_RATES } from './tax-brackets'

export function calculateTaxLiability(input: TaxCalculationInput): TaxCalculationResult {
  const standardDeductionCents = getStandardDeduction(input.taxYear, input.filingStatus)

  // Calculate itemized deductions
  const itemizedDeductionCents =
    (input.deductions?.mortgageInterestCents ?? 0) +
    (input.deductions?.propertyTaxCents ?? 0) +
    (input.deductions?.stateTaxCents ?? 0) +
    (input.deductions?.charitableCents ?? 0)

  // Use whichever deduction is larger
  const deductionUsed: 'standard' | 'itemized' =
    itemizedDeductionCents > standardDeductionCents ? 'itemized' : 'standard'
  const deductionAmount =
    deductionUsed === 'itemized' ? itemizedDeductionCents : standardDeductionCents

  const taxableIncomeCents = Math.max(0, input.grossIncomeCents - deductionAmount)

  const brackets = getTaxBrackets(input.taxYear, input.filingStatus)
  const bracketResults: TaxBracketResult[] = []
  let totalTax = 0
  let marginalRate = 0

  for (const bracket of brackets) {
    if (taxableIncomeCents <= bracket.min) {
      bracketResults.push({
        min: bracket.min,
        max: bracket.max,
        rate: bracket.rate,
        taxInBracket: 0,
      })
      continue
    }

    const bracketMax = bracket.max ?? Infinity
    const taxableInBracket = Math.min(taxableIncomeCents, bracketMax) - bracket.min
    const taxInBracket = Math.round((taxableInBracket * bracket.rate) / 100)

    bracketResults.push({
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      taxInBracket,
    })

    totalTax += taxInBracket
    if (taxableIncomeCents > bracket.min) {
      marginalRate = bracket.rate
    }
  }

  const effectiveTaxRate =
    input.grossIncomeCents > 0 ? Math.round((totalTax / input.grossIncomeCents) * 10000) / 100 : 0

  return {
    grossIncomeCents: input.grossIncomeCents,
    standardDeductionCents,
    itemizedDeductionCents,
    deductionUsed,
    taxableIncomeCents,
    estimatedTaxLiabilityCents: totalTax,
    effectiveTaxRatePercent: effectiveTaxRate,
    marginalTaxRatePercent: marginalRate,
    brackets: bracketResults,
  }
}

export function calculateEffectiveTaxRate(
  grossIncomeCents: number,
  filingStatus: FilingStatus,
  taxYear: number,
): number {
  const result = calculateTaxLiability({
    grossIncomeCents,
    filingStatus,
    taxYear,
  })
  return result.effectiveTaxRatePercent
}

export function calculateMarginalBracket(
  grossIncomeCents: number,
  filingStatus: FilingStatus,
  taxYear: number,
): number {
  const result = calculateTaxLiability({
    grossIncomeCents,
    filingStatus,
    taxYear,
  })
  return result.marginalTaxRatePercent
}

export function estimateCapitalGainsTax(
  gainsCents: number,
  totalIncomeCents: number,
  filingStatus: FilingStatus,
): number {
  if (gainsCents <= 0) return 0

  const brackets = LONG_TERM_CAPITAL_GAINS_RATES[filingStatus]
  let applicableRate = 0

  for (const bracket of brackets) {
    if (totalIncomeCents > bracket.min) {
      applicableRate = bracket.rate
    }
  }

  return Math.round((gainsCents * applicableRate) / 100)
}

export { getStandardDeduction } from './tax-brackets'
