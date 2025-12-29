import type { Cents } from '../money/money.types'

/**
 * Input parameters for generating an amortization schedule.
 * All monetary values must be in cents.
 */
export interface AmortizationInput {
  /** Original loan principal in cents */
  principalCents: Cents
  /** Annual interest rate as a percentage (e.g., 6.5 for 6.5%) */
  annualInterestRatePercent: number
  /** Total loan term in months */
  termMonths: number
  /** Loan start date */
  startDate: Date
}

/**
 * Extra payment to be applied to the loan.
 */
export interface ExtraPayment {
  /** Payment number (1-indexed) where extra payment is applied */
  paymentNumber: number
  /** Extra amount to apply to principal in cents */
  amountCents: Cents
}

/**
 * Input for generating a schedule with extra payments.
 */
export interface AmortizationWithExtrasInput extends AmortizationInput {
  /** Array of extra payments to apply */
  extraPayments: ExtraPayment[]
}

/**
 * Represents a single month in the amortization schedule.
 */
export interface AmortizationScheduleEntry {
  /** Payment number (1-indexed) */
  paymentNumber: number
  /** Date when this payment is due */
  paymentDate: Date
  /** Beginning balance for this period in cents */
  beginningBalanceCents: Cents
  /** Total scheduled payment in cents (principal + interest) */
  scheduledPaymentCents: Cents
  /** Principal portion of the payment in cents */
  principalCents: Cents
  /** Interest portion of the payment in cents */
  interestCents: Cents
  /** Extra payment applied in cents (0 if none) */
  extraPaymentCents: Cents
  /** Total payment made (scheduled + extra) in cents */
  totalPaymentCents: Cents
  /** Ending balance after this payment in cents */
  endingBalanceCents: Cents
  /** Cumulative principal paid through this payment in cents */
  cumulativePrincipalCents: Cents
  /** Cumulative interest paid through this payment in cents */
  cumulativeInterestCents: Cents
}

/**
 * Complete amortization schedule result.
 */
export interface AmortizationSchedule {
  /** All scheduled payments */
  schedule: AmortizationScheduleEntry[]
  /** Monthly payment amount in cents (standard payment) */
  monthlyPaymentCents: Cents
  /** Total of all payments made in cents */
  totalPaymentsCents: Cents
  /** Total interest paid over loan life in cents */
  totalInterestCents: Cents
  /** Total principal paid (should equal original principal) in cents */
  totalPrincipalCents: Cents
  /** Original loan term in months */
  originalTermMonths: number
  /** Actual payoff month (may be earlier with extra payments) */
  actualPayoffMonth: number
  /** Loan start date */
  startDate: Date
  /** Actual payoff date */
  payoffDate: Date
}

/**
 * Result of comparing schedules with and without extra payments.
 */
export interface EarlyPayoffAnalysis {
  /** Original schedule without extra payments */
  originalSchedule: AmortizationSchedule
  /** Modified schedule with extra payments applied */
  modifiedSchedule: AmortizationSchedule
  /** Number of months saved by making extra payments */
  monthsSaved: number
  /** Total interest saved in cents */
  interestSavedCents: Cents
  /** Was the loan paid off early? */
  isPaidOffEarly: boolean
  /** Original payoff date */
  originalPayoffDate: Date
  /** New payoff date with extra payments */
  newPayoffDate: Date
}

/**
 * Summary for a loan balance at a point in time.
 */
export interface LoanBalanceSummary {
  /** Current balance in cents */
  currentBalanceCents: Cents
  /** Principal paid to date in cents */
  principalPaidCents: Cents
  /** Interest paid to date in cents */
  interestPaidCents: Cents
  /** Remaining payments count */
  remainingPayments: number
  /** Remaining interest to be paid in cents */
  remainingInterestCents: Cents
}

/**
 * Validation result for amortization input.
 */
export interface AmortizationValidationResult {
  valid: boolean
  error?: string
}
