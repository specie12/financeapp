import { MoneyError } from '../money/money.errors'

/**
 * Error thrown when projection input validation fails.
 */
export class InvalidProjectionInputError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidProjectionInputError'
    Object.setPrototypeOf(this, InvalidProjectionInputError.prototype)
  }
}

/**
 * Error thrown when projection horizon is out of range.
 */
export class InvalidHorizonError extends MoneyError {
  constructor(
    public readonly horizonYears: number,
    public readonly minYears: number,
    public readonly maxYears: number,
  ) {
    super(
      `Invalid projection horizon: ${horizonYears} years. Must be between ${minYears} and ${maxYears} years.`,
    )
    this.name = 'InvalidHorizonError'
    Object.setPrototypeOf(this, InvalidHorizonError.prototype)
  }
}

/**
 * Error thrown when projection start date is invalid.
 */
export class InvalidStartDateError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidStartDateError'
    Object.setPrototypeOf(this, InvalidStartDateError.prototype)
  }
}
