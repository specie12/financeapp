import type { Cents } from '@finance-app/finance-engine'

export interface LoanSummary {
  totalOutstandingCents: Cents
  totalMonthlyPaymentCents: Cents
  averageInterestRatePercent: number
  loanCount: number
}

export interface LoanDetail {
  id: string
  name: string
  type: string
  principalCents: Cents
  currentBalanceCents: Cents
  interestRatePercent: number
  minimumPaymentCents: Cents
  termMonths: number | null
  startDate: Date
  estimatedPayoffDate: Date | null
}

export interface LoansResponse {
  summary: LoanSummary
  loans: LoanDetail[]
}

export interface AmortizationEntry {
  paymentNumber: number
  paymentDate: Date
  beginningBalanceCents: Cents
  scheduledPaymentCents: Cents
  principalCents: Cents
  interestCents: Cents
  endingBalanceCents: Cents
  cumulativePrincipalCents: Cents
  cumulativeInterestCents: Cents
}

export interface LoanAmortizationResponse {
  loan: LoanDetail
  monthlyPaymentCents: Cents
  totalPaymentsCents: Cents
  totalInterestCents: Cents
  originalTermMonths: number
  actualPayoffMonth: number
  payoffDate: Date
  schedule: AmortizationEntry[]
}
