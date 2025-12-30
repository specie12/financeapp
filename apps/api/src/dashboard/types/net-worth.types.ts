import type { Cents } from '@finance-app/finance-engine'

export interface AssetBreakdown {
  id: string
  name: string
  type: string
  valueCents: Cents
  growthRatePercent: number | null
}

export interface LiabilityBreakdown {
  id: string
  name: string
  type: string
  balanceCents: Cents
  interestRatePercent: number
}

export interface AssetsByType {
  type: string
  totalValueCents: Cents
  count: number
  items: AssetBreakdown[]
}

export interface LiabilitiesByType {
  type: string
  totalBalanceCents: Cents
  count: number
  items: LiabilityBreakdown[]
}

export interface NetWorthProjection {
  year: number
  date: Date
  totalAssetsCents: Cents
  totalLiabilitiesCents: Cents
  netWorthCents: Cents
}

export interface NetWorthResponse {
  totalAssetsCents: Cents
  totalLiabilitiesCents: Cents
  netWorthCents: Cents
  assetsByType: AssetsByType[]
  liabilitiesByType: LiabilitiesByType[]
  projection: NetWorthProjection[]
}
