import { MoneyError } from '../money/money.errors'

/**
 * Error thrown when rent vs buy input validation fails.
 */
export class InvalidRentVsBuyInputError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRentVsBuyInputError'
    Object.setPrototypeOf(this, InvalidRentVsBuyInputError.prototype)
  }
}

/**
 * Error thrown when buy scenario input is invalid.
 */
export class InvalidBuyScenarioError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidBuyScenarioError'
    Object.setPrototypeOf(this, InvalidBuyScenarioError.prototype)
  }
}

/**
 * Error thrown when rent scenario input is invalid.
 */
export class InvalidRentScenarioError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRentScenarioError'
    Object.setPrototypeOf(this, InvalidRentScenarioError.prototype)
  }
}

/**
 * Error thrown when projection years are out of range.
 */
export class InvalidProjectionYearsError extends MoneyError {
  constructor(
    public readonly years: number,
    public readonly minYears: number,
    public readonly maxYears: number,
  ) {
    super(`Invalid projection years: ${years}. Must be between ${minYears} and ${maxYears} years.`)
    this.name = 'InvalidProjectionYearsError'
    Object.setPrototypeOf(this, InvalidProjectionYearsError.prototype)
  }
}
