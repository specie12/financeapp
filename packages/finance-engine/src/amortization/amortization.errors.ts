import { MoneyError } from '../money/money.errors'

/**
 * Thrown when amortization input parameters are invalid.
 */
export class InvalidAmortizationInputError extends MoneyError {
  constructor(message: string) {
    super(`Invalid amortization input: ${message}`)
    this.name = 'InvalidAmortizationInputError'
    Object.setPrototypeOf(this, InvalidAmortizationInputError.prototype)
  }
}

/**
 * Thrown when a payment is insufficient to cover accrued interest.
 * This creates negative amortization.
 */
export class NegativeAmortizationError extends MoneyError {
  constructor(paymentNumber: number, interestDueCents: number, paymentCents: number) {
    super(
      `Negative amortization at payment ${paymentNumber}: ` +
        `interest due (${interestDueCents} cents) exceeds payment (${paymentCents} cents)`,
    )
    this.name = 'NegativeAmortizationError'
    Object.setPrototypeOf(this, NegativeAmortizationError.prototype)
  }
}
