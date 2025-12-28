import { type AssetType, type CreateAssetInput } from '@finance-app/validation'

export class CreateAssetDto implements CreateAssetInput {
  name!: string
  type!: AssetType
  currentValueCents!: number
  annualGrowthRatePercent?: number | null
}
