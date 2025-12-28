import { type AssetType, type UpdateAssetInput } from '@finance-app/validation'

export class UpdateAssetDto implements UpdateAssetInput {
  name?: string
  type?: AssetType
  currentValueCents?: number
  annualGrowthRatePercent?: number | null
}
