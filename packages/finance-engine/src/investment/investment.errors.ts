import { MoneyError } from '../money/money.errors'

/**
 * Error thrown when investment input validation fails.
 */
export class InvalidInvestmentInputError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInvestmentInputError'
    Object.setPrototypeOf(this, InvalidInvestmentInputError.prototype)
  }
}

/**
 * Error thrown when a holding is invalid.
 */
export class InvalidHoldingError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidHoldingError'
    Object.setPrototypeOf(this, InvalidHoldingError.prototype)
  }
}

/**
 * Error thrown when a transaction is invalid.
 */
export class InvalidTransactionError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidTransactionError'
    Object.setPrototypeOf(this, InvalidTransactionError.prototype)
  }
}
