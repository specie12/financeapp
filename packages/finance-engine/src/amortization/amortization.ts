import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import {
  cents,
  assertCents,
  addCents,
  subtractCents,
  minCents,
  isPositiveCents,
} from '../money/money'
import { InvalidAmortizationInputError, NegativeAmortizationError } from './amortization.errors'
import type {
  AmortizationInput,
  AmortizationSchedule,
  AmortizationScheduleEntry,
  AmortizationWithExtrasInput,
  EarlyPayoffAnalysis,
  ExtraPayment,
  LoanBalanceSummary,
  AmortizationValidationResult,
} from './amortization.types'

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

/**
 * Adds months to a date.
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Validates amortization input parameters.
 */
export function validateAmortizationInput(input: AmortizationInput): AmortizationValidationResult {
  if (typeof input.principalCents !== 'number' || !Number.isInteger(input.principalCents)) {
    return { valid: false, error: 'Principal must be an integer (cents)' }
  }
  if (input.principalCents <= 0) {
    return { valid: false, error: 'Principal must be positive' }
  }
  if (typeof input.annualInterestRatePercent !== 'number') {
    return { valid: false, error: 'Interest rate must be a number' }
  }
  if (input.annualInterestRatePercent < 0) {
    return { valid: false, error: 'Interest rate cannot be negative' }
  }
  if (!Number.isFinite(input.annualInterestRatePercent)) {
    return { valid: false, error: 'Interest rate must be finite' }
  }
  if (typeof input.termMonths !== 'number' || !Number.isInteger(input.termMonths)) {
    return { valid: false, error: 'Term must be an integer (months)' }
  }
  if (input.termMonths <= 0) {
    return { valid: false, error: 'Term must be positive' }
  }
  if (!(input.startDate instanceof Date) || isNaN(input.startDate.getTime())) {
    return { valid: false, error: 'Start date must be a valid Date' }
  }
  return { valid: true }
}

/**
 * Asserts that amortization input is valid, throwing if not.
 */
function assertValidInput(input: AmortizationInput): void {
  const result = validateAmortizationInput(input)
  if (!result.valid) {
    throw new InvalidAmortizationInputError(result.error!)
  }
}

/**
 * Calculates the monthly interest for a given balance.
 *
 * Uses simple interest formula: balance * (annualRate / 12 / 100)
 * Rounds using ROUND_HALF_UP for financial accuracy.
 */
export function calculateMonthlyInterest(
  balanceCents: Cents,
  annualInterestRatePercent: number,
): Cents {
  assertCents(balanceCents)

  if (annualInterestRatePercent === 0) {
    return cents(0)
  }

  const monthlyRate = new Decimal(annualInterestRatePercent).dividedBy(12).dividedBy(100)
  const interest = new Decimal(balanceCents).times(monthlyRate)
  const rounded = interest.toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP).toNumber()

  return cents(rounded)
}

/**
 * Calculates the fixed monthly payment for a loan using the PMT formula.
 *
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where:
 *   M = monthly payment
 *   P = principal
 *   r = monthly interest rate (annual rate / 12 / 100)
 *   n = number of payments (term in months)
 *
 * For zero interest loans, simply divides principal by term.
 */
export function calculateMonthlyPayment(
  principalCents: Cents,
  annualInterestRatePercent: number,
  termMonths: number,
): Cents {
  assertCents(principalCents)

  if (principalCents <= 0) {
    throw new InvalidAmortizationInputError('Principal must be positive')
  }
  if (termMonths <= 0) {
    throw new InvalidAmortizationInputError('Term must be positive')
  }
  if (annualInterestRatePercent < 0) {
    throw new InvalidAmortizationInputError('Interest rate cannot be negative')
  }

  // Zero interest: simple division
  if (annualInterestRatePercent === 0) {
    const payment = new Decimal(principalCents)
      .dividedBy(termMonths)
      .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)
      .toNumber()
    return cents(payment)
  }

  // PMT formula
  const principal = new Decimal(principalCents)
  const monthlyRate = new Decimal(annualInterestRatePercent).dividedBy(12).dividedBy(100)
  const n = termMonths

  // (1 + r)^n
  const onePlusR = monthlyRate.plus(1)
  const onePlusRtoN = onePlusR.pow(n)

  // M = P * [r * (1+r)^n] / [(1+r)^n - 1]
  const numerator = principal.times(monthlyRate).times(onePlusRtoN)
  const denominator = onePlusRtoN.minus(1)
  const payment = numerator.dividedBy(denominator)

  const rounded = payment.toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP).toNumber()
  return cents(rounded)
}

/**
 * Generates a complete amortization schedule without extra payments.
 */
export function generateAmortizationSchedule(input: AmortizationInput): AmortizationSchedule {
  assertValidInput(input)

  const { principalCents, annualInterestRatePercent, termMonths, startDate } = input

  const monthlyPayment = calculateMonthlyPayment(
    principalCents,
    annualInterestRatePercent,
    termMonths,
  )

  const schedule: AmortizationScheduleEntry[] = []
  let balance = principalCents
  let cumulativePrincipal = cents(0)
  let cumulativeInterest = cents(0)

  for (let i = 1; i <= termMonths; i++) {
    const beginningBalance = balance
    const paymentDate = addMonths(startDate, i)

    // Calculate interest for this period
    const interestPortion = calculateMonthlyInterest(balance, annualInterestRatePercent)

    // For the final payment, adjust to pay off exactly
    let principalPortion: Cents
    let scheduledPayment: Cents

    if (i === termMonths) {
      // Final payment: pay off remaining balance
      principalPortion = balance
      scheduledPayment = addCents(principalPortion, interestPortion)
    } else {
      // Check for negative amortization
      if (interestPortion > monthlyPayment) {
        throw new NegativeAmortizationError(i, interestPortion, monthlyPayment)
      }
      principalPortion = subtractCents(monthlyPayment, interestPortion)
      scheduledPayment = monthlyPayment
    }

    // Update balance
    balance = subtractCents(balance, principalPortion)

    // Update cumulative totals
    cumulativePrincipal = addCents(cumulativePrincipal, principalPortion)
    cumulativeInterest = addCents(cumulativeInterest, interestPortion)

    schedule.push({
      paymentNumber: i,
      paymentDate,
      beginningBalanceCents: beginningBalance,
      scheduledPaymentCents: scheduledPayment,
      principalCents: principalPortion,
      interestCents: interestPortion,
      extraPaymentCents: cents(0),
      totalPaymentCents: scheduledPayment,
      endingBalanceCents: balance,
      cumulativePrincipalCents: cumulativePrincipal,
      cumulativeInterestCents: cumulativeInterest,
    })

    // Safety check: if balance is already zero, stop
    if (balance <= 0) {
      break
    }
  }

  const lastEntry = schedule[schedule.length - 1]!
  const totalPayments = schedule.reduce(
    (sum, entry) => addCents(sum, entry.totalPaymentCents),
    cents(0),
  )

  return {
    schedule,
    monthlyPaymentCents: monthlyPayment,
    totalPaymentsCents: totalPayments,
    totalInterestCents: cumulativeInterest,
    totalPrincipalCents: cumulativePrincipal,
    originalTermMonths: termMonths,
    actualPayoffMonth: schedule.length,
    startDate,
    payoffDate: lastEntry.paymentDate,
  }
}

/**
 * Generates an amortization schedule with extra payments applied.
 *
 * Extra payments are applied entirely to principal reduction.
 * The schedule terminates early if the balance reaches zero.
 */
export function generateAmortizationScheduleWithExtras(
  input: AmortizationWithExtrasInput,
): AmortizationSchedule {
  assertValidInput(input)

  const { principalCents, annualInterestRatePercent, termMonths, startDate, extraPayments } = input

  // Create a map of extra payments by payment number
  const extraPaymentMap = new Map<number, Cents>()
  for (const extra of extraPayments) {
    const existing = extraPaymentMap.get(extra.paymentNumber) ?? cents(0)
    extraPaymentMap.set(extra.paymentNumber, addCents(existing, extra.amountCents))
  }

  const monthlyPayment = calculateMonthlyPayment(
    principalCents,
    annualInterestRatePercent,
    termMonths,
  )

  const schedule: AmortizationScheduleEntry[] = []
  let balance = principalCents
  let cumulativePrincipal = cents(0)
  let cumulativeInterest = cents(0)

  for (let i = 1; i <= termMonths; i++) {
    if (balance <= 0) {
      break
    }

    const beginningBalance = balance
    const paymentDate = addMonths(startDate, i)

    // Calculate interest for this period
    const interestPortion = calculateMonthlyInterest(balance, annualInterestRatePercent)

    // Determine principal portion from regular payment
    let principalFromPayment: Cents
    let scheduledPayment: Cents

    // Check if this would be a payoff payment
    const remainingAfterInterest = subtractCents(balance, cents(0)) // balance itself
    const isPayoffPayment = remainingAfterInterest <= subtractCents(monthlyPayment, interestPortion)

    if (isPayoffPayment || i === termMonths) {
      // This is a payoff payment
      principalFromPayment = balance
      scheduledPayment = addCents(balance, interestPortion)
    } else {
      // Check for negative amortization
      if (interestPortion > monthlyPayment) {
        throw new NegativeAmortizationError(i, interestPortion, monthlyPayment)
      }
      principalFromPayment = subtractCents(monthlyPayment, interestPortion)
      scheduledPayment = monthlyPayment
    }

    // Apply extra payment (capped at remaining balance after regular principal)
    let extraPayment = extraPaymentMap.get(i) ?? cents(0)
    const remainingAfterRegular = subtractCents(balance, principalFromPayment)

    if (isPositiveCents(extraPayment)) {
      // Cap extra payment at remaining balance
      extraPayment = minCents(extraPayment, remainingAfterRegular)
    }

    // Total principal paid this period
    const totalPrincipal = addCents(principalFromPayment, extraPayment)
    const totalPayment = addCents(scheduledPayment, extraPayment)

    // Update balance
    balance = subtractCents(balance, totalPrincipal)

    // Ensure balance doesn't go negative
    if (balance < 0) {
      balance = cents(0)
    }

    // Update cumulative totals
    cumulativePrincipal = addCents(cumulativePrincipal, totalPrincipal)
    cumulativeInterest = addCents(cumulativeInterest, interestPortion)

    schedule.push({
      paymentNumber: i,
      paymentDate,
      beginningBalanceCents: beginningBalance,
      scheduledPaymentCents: scheduledPayment,
      principalCents: totalPrincipal,
      interestCents: interestPortion,
      extraPaymentCents: extraPayment,
      totalPaymentCents: totalPayment,
      endingBalanceCents: balance,
      cumulativePrincipalCents: cumulativePrincipal,
      cumulativeInterestCents: cumulativeInterest,
    })

    // Stop if paid off
    if (balance <= 0) {
      break
    }
  }

  const lastEntry = schedule[schedule.length - 1]!
  const totalPayments = schedule.reduce(
    (sum, entry) => addCents(sum, entry.totalPaymentCents),
    cents(0),
  )

  return {
    schedule,
    monthlyPaymentCents: monthlyPayment,
    totalPaymentsCents: totalPayments,
    totalInterestCents: cumulativeInterest,
    totalPrincipalCents: cumulativePrincipal,
    originalTermMonths: termMonths,
    actualPayoffMonth: schedule.length,
    startDate,
    payoffDate: lastEntry.paymentDate,
  }
}

/**
 * Analyzes the impact of extra payments on loan payoff.
 *
 * Compares original schedule to modified schedule and calculates:
 * - Months saved
 * - Interest saved
 * - New payoff date
 */
export function analyzeEarlyPayoff(
  originalInput: AmortizationInput,
  extraPayments: ExtraPayment[],
): EarlyPayoffAnalysis {
  const originalSchedule = generateAmortizationSchedule(originalInput)
  const modifiedSchedule = generateAmortizationScheduleWithExtras({
    ...originalInput,
    extraPayments,
  })

  const monthsSaved = originalSchedule.actualPayoffMonth - modifiedSchedule.actualPayoffMonth
  const interestSaved = subtractCents(
    originalSchedule.totalInterestCents,
    modifiedSchedule.totalInterestCents,
  )

  return {
    originalSchedule,
    modifiedSchedule,
    monthsSaved,
    interestSavedCents: interestSaved,
    isPaidOffEarly: monthsSaved > 0,
    originalPayoffDate: originalSchedule.payoffDate,
    newPayoffDate: modifiedSchedule.payoffDate,
  }
}

/**
 * Gets the loan balance summary at a specific payment number.
 */
export function getLoanBalanceAtPayment(
  schedule: AmortizationSchedule,
  paymentNumber: number,
): LoanBalanceSummary {
  if (paymentNumber <= 0) {
    throw new InvalidAmortizationInputError('Payment number must be positive')
  }
  if (paymentNumber > schedule.schedule.length) {
    throw new InvalidAmortizationInputError(
      `Payment number ${paymentNumber} exceeds schedule length ${schedule.schedule.length}`,
    )
  }

  const entry = schedule.schedule[paymentNumber - 1]!
  const remainingPayments = schedule.schedule.length - paymentNumber

  // Calculate remaining interest
  let remainingInterest = cents(0)
  for (let i = paymentNumber; i < schedule.schedule.length; i++) {
    remainingInterest = addCents(remainingInterest, schedule.schedule[i]!.interestCents)
  }

  return {
    currentBalanceCents: entry.endingBalanceCents,
    principalPaidCents: entry.cumulativePrincipalCents,
    interestPaidCents: entry.cumulativeInterestCents,
    remainingPayments,
    remainingInterestCents: remainingInterest,
  }
}

/**
 * Calculates interest saved by making a one-time extra payment.
 *
 * This is a convenience function that generates schedules internally
 * to calculate the exact interest savings.
 */
export function calculateInterestSaved(
  currentBalanceCents: Cents,
  annualInterestRatePercent: number,
  remainingMonths: number,
  extraPaymentCents: Cents,
): Cents {
  assertCents(currentBalanceCents)
  assertCents(extraPaymentCents)

  if (extraPaymentCents <= 0) {
    return cents(0)
  }

  // Cap extra payment at current balance
  const cappedExtra = minCents(extraPaymentCents, currentBalanceCents)

  const baseInput: AmortizationInput = {
    principalCents: currentBalanceCents,
    annualInterestRatePercent,
    termMonths: remainingMonths,
    startDate: new Date(),
  }

  const originalSchedule = generateAmortizationSchedule(baseInput)
  const modifiedSchedule = generateAmortizationScheduleWithExtras({
    ...baseInput,
    extraPayments: [{ paymentNumber: 1, amountCents: cappedExtra }],
  })

  return subtractCents(originalSchedule.totalInterestCents, modifiedSchedule.totalInterestCents)
}
