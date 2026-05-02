export class PmtDto {
  principalCents!: number
  annualRatePercent!: number
  termMonths!: number
}

export interface PmtResponse {
  monthlyPaymentCents: number
}
