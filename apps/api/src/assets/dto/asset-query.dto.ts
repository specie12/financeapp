import { type AssetType } from '@finance-app/validation'

export class AssetQueryDto {
  page?: number
  limit?: number
  type?: AssetType
}
