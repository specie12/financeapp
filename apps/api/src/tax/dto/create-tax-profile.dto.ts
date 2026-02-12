export class CreateTaxProfileDto {
  taxYear: number
  filingStatus: string
  stateCode?: string | null
  dependents?: number
  additionalIncomeCents?: number | null
}
