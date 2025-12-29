import { MoneyError } from '../money/money.errors'

/**
 * Error thrown when scenario input validation fails.
 */
export class InvalidScenarioError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidScenarioError'
    Object.setPrototypeOf(this, InvalidScenarioError.prototype)
  }
}

/**
 * Error thrown when an override field is invalid.
 */
export class InvalidOverrideFieldError extends MoneyError {
  constructor(
    public readonly targetType: string,
    public readonly fieldName: string,
  ) {
    super(`Invalid override field '${fieldName}' for target type '${targetType}'`)
    this.name = 'InvalidOverrideFieldError'
    Object.setPrototypeOf(this, InvalidOverrideFieldError.prototype)
  }
}

/**
 * Error thrown when an override value type is invalid.
 */
export class InvalidOverrideValueError extends MoneyError {
  constructor(
    public readonly fieldName: string,
    public readonly expectedType: string,
    public readonly actualType: string,
  ) {
    super(
      `Invalid value type for field '${fieldName}': expected ${expectedType}, got ${actualType}`,
    )
    this.name = 'InvalidOverrideValueError'
    Object.setPrototypeOf(this, InvalidOverrideValueError.prototype)
  }
}
