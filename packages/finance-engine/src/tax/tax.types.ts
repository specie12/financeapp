export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'

export interface TaxBracket {
  min: number
  max: number | null
  rate: number
}

export interface TaxCalculationInput {
  grossIncomeCents: number
  filingStatus: FilingStatus
  taxYear: number
  deductions?: {
    mortgageInterestCents?: number
    propertyTaxCents?: number
    stateTaxCents?: number
    charitableCents?: number
  }
  dependents?: number
}

export interface TaxBracketResult {
  min: number
  max: number | null
  rate: number
  taxInBracket: number
}

export interface TaxCalculationResult {
  grossIncomeCents: number
  standardDeductionCents: number
  itemizedDeductionCents: number
  deductionUsed: 'standard' | 'itemized'
  taxableIncomeCents: number
  estimatedTaxLiabilityCents: number
  effectiveTaxRatePercent: number
  marginalTaxRatePercent: number
  brackets: TaxBracketResult[]
}
