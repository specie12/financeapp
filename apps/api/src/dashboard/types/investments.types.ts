import type { Cents } from '@finance-app/finance-engine'

export interface HoldingSummary {
  id: string
  name: string
  type: string
  valueCents: Cents
  costBasisCents: Cents
  gainLossCents: Cents
  gainLossPercent: number
  allocationPercent: number
}

export interface PortfolioSummary {
  totalValueCents: Cents
  totalCostBasisCents: Cents
  unrealizedGainCents: Cents
  unrealizedGainPercent: number
  totalReturnCents: Cents
  totalReturnPercent: number
}

export interface InvestmentsResponse {
  summary: PortfolioSummary
  holdings: HoldingSummary[]
}
