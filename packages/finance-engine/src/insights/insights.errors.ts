import { MoneyError } from '../money/money.errors'

/**
 * Base error class for insights-related errors.
 */
export class InsightError extends MoneyError {
  constructor(message: string) {
    super(message)
    this.name = 'InsightError'
    Object.setPrototypeOf(this, InsightError.prototype)
  }
}

/**
 * Error thrown when insight input validation fails.
 */
export class InvalidInsightInputError extends InsightError {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidInsightInputError'
    Object.setPrototypeOf(this, InvalidInsightInputError.prototype)
  }
}

/**
 * Error thrown when monthly income is invalid.
 */
export class InvalidIncomeError extends InsightError {
  constructor(public readonly incomeCents: number) {
    super(`Invalid monthly income: ${incomeCents} cents. Income must be positive.`)
    this.name = 'InvalidIncomeError'
    Object.setPrototypeOf(this, InvalidIncomeError.prototype)
  }
}

/**
 * Error thrown when expense values are invalid.
 */
export class InvalidExpenseError extends InsightError {
  constructor(
    public readonly expenseType: string,
    public readonly valueCents: number,
  ) {
    super(`Invalid ${expenseType} expense: ${valueCents} cents. Expenses cannot be negative.`)
    this.name = 'InvalidExpenseError'
    Object.setPrototypeOf(this, InvalidExpenseError.prototype)
  }
}

/**
 * Error thrown when asset data is invalid.
 */
export class InvalidAssetError extends InsightError {
  constructor(
    public readonly assetId: string,
    public readonly reason: string,
  ) {
    super(`Invalid asset "${assetId}": ${reason}`)
    this.name = 'InvalidAssetError'
    Object.setPrototypeOf(this, InvalidAssetError.prototype)
  }
}

/**
 * Error thrown when liability data is invalid.
 */
export class InvalidLiabilityError extends InsightError {
  constructor(
    public readonly liabilityId: string,
    public readonly reason: string,
  ) {
    super(`Invalid liability "${liabilityId}": ${reason}`)
    this.name = 'InvalidLiabilityError'
    Object.setPrototypeOf(this, InvalidLiabilityError.prototype)
  }
}

/**
 * Error thrown when goal data is invalid.
 */
export class InvalidGoalError extends InsightError {
  constructor(
    public readonly goalId: string,
    public readonly reason: string,
  ) {
    super(`Invalid goal "${goalId}": ${reason}`)
    this.name = 'InvalidGoalError'
    Object.setPrototypeOf(this, InvalidGoalError.prototype)
  }
}

/**
 * Error thrown when reference date is invalid.
 */
export class InvalidReferenceDateError extends InsightError {
  constructor(public readonly date: unknown) {
    super(`Invalid reference date: ${String(date)}. Must be a valid Date object.`)
    this.name = 'InvalidReferenceDateError'
    Object.setPrototypeOf(this, InvalidReferenceDateError.prototype)
  }
}

/**
 * Error thrown when rule configuration is invalid.
 */
export class InvalidRuleConfigError extends InsightError {
  constructor(
    public readonly ruleName: string,
    public readonly reason: string,
  ) {
    super(`Invalid rule configuration for "${ruleName}": ${reason}`)
    this.name = 'InvalidRuleConfigError'
    Object.setPrototypeOf(this, InvalidRuleConfigError.prototype)
  }
}
