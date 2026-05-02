import type { Cents } from '@finance-app/finance-engine'

export interface HoldingSummary {
  id: string
  name: string
  type: string
  valueCents: Cents
  /** `null` when the asset has no cost basis set. */
  costBasisCents: Cents | null
  /** `null` when cost basis is unset (cannot be derived). */
  gainLossCents: Cents | null
  /** `null` when cost basis is unset (cannot be derived). */
  gainLossPercent: number | null
  allocationPercent: number
}

export interface PortfolioSummary {
  totalValueCents: Cents
  /** `null` when ANY holding lacks cost basis (the total cannot be trusted). */
  totalCostBasisCents: Cents | null
  unrealizedGainCents: Cents | null
  unrealizedGainPercent: number | null
  totalReturnCents: Cents | null
  totalReturnPercent: number | null
}

export interface InvestmentsResponse {
  summary: PortfolioSummary
  holdings: HoldingSummary[]
}
