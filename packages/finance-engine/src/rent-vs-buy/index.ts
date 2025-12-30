// Rent vs Buy Calculator - Compare renting versus owning a home
export { calculateRentVsBuy, validateRentVsBuyInput, mergeAssumptions } from './rent-vs-buy'

export type {
  RentVsBuyInput,
  RentVsBuyResult,
  RentVsBuyValidationResult,
  BuyScenarioInput,
  RentScenarioInput,
  YearlyBuyMetrics,
  YearlyRentMetrics,
  YearlyComparison,
  RentVsBuySummary,
  RentVsBuyAssumptions,
} from './rent-vs-buy.types'

export {
  DEFAULT_ASSUMPTIONS,
  MIN_PROJECTION_YEARS,
  MAX_PROJECTION_YEARS,
  MIN_DOWN_PAYMENT_PERCENT,
  MAX_DOWN_PAYMENT_PERCENT,
  COMMON_MORTGAGE_TERMS,
} from './rent-vs-buy.constants'

export {
  InvalidRentVsBuyInputError,
  InvalidBuyScenarioError,
  InvalidRentScenarioError,
  InvalidProjectionYearsError,
} from './rent-vs-buy.errors'
