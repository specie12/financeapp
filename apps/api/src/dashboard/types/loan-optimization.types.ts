import type { Cents } from '@finance-app/finance-engine'
import type { AmortizationEntry, LoanDetail } from './loans.types'

export interface LoanSimulationRequest {
  extraMonthlyPaymentCents: Cents
  oneTimePaymentCents: Cents
  oneTimePaymentMonth: number // Which month to apply the one-time payment (1-based)
  useBiweekly: boolean // If true, pays half the monthly payment every 2 weeks (26 payments/year)
}

export interface LoanSimulationResponse {
  loan: LoanDetail
  // Original schedule summary
  original: {
    monthlyPaymentCents: Cents
    totalPaymentsCents: Cents
    totalInterestCents: Cents
    payoffMonth: number
    payoffDate: Date
  }
  // Modified schedule summary
  modified: {
    monthlyPaymentCents: Cents // Effective monthly payment including extras
    totalPaymentsCents: Cents
    totalInterestCents: Cents
    payoffMonth: number
    payoffDate: Date
  }
  // Savings analysis
  savings: {
    interestSavedCents: Cents
    monthsSaved: number
    totalSavedCents: Cents // Total payments saved
  }
  // Schedules for comparison chart
  originalSchedule: AmortizationEntry[]
  modifiedSchedule: AmortizationEntry[]
}
