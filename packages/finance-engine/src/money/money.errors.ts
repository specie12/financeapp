/**
 * Base error class for money-related errors.
 */
export class MoneyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MoneyError'
    Object.setPrototypeOf(this, MoneyError.prototype)
  }
}

/**
 * Thrown when a non-integer value is passed where cents are expected.
 */
export class InvalidCentsError extends MoneyError {
  constructor(value: unknown) {
    super(
      `Invalid cents value: ${String(value)}. ` +
        `Cents must be an integer. Received type: ${typeof value}`,
    )
    this.name = 'InvalidCentsError'
    Object.setPrototypeOf(this, InvalidCentsError.prototype)
  }
}

/**
 * Thrown when attempting division by zero.
 */
export class DivisionByZeroError extends MoneyError {
  constructor() {
    super('Division by zero is not allowed in money calculations')
    this.name = 'DivisionByZeroError'
    Object.setPrototypeOf(this, DivisionByZeroError.prototype)
  }
}

/**
 * Thrown when a percentage value is invalid (e.g., not finite).
 */
export class InvalidPercentageError extends MoneyError {
  constructor(percentage: number, reason: string) {
    super(`Invalid percentage ${percentage}: ${reason}`)
    this.name = 'InvalidPercentageError'
    Object.setPrototypeOf(this, InvalidPercentageError.prototype)
  }
}

/**
 * Thrown when overflow occurs in money calculations.
 */
export class OverflowError extends MoneyError {
  constructor(operation: string) {
    super(`Overflow occurred during ${operation}. Result exceeds safe integer bounds.`)
    this.name = 'OverflowError'
    Object.setPrototypeOf(this, OverflowError.prototype)
  }
}
