// Projection module - Financial projection over time
export {
  runProjection,
  validateProjectionInput,
  projectAssetValue,
  projectLiabilityToYear,
  projectCashFlowItem,
  annualizeCashFlow,
} from './projection'

export type {
  Frequency,
  CashFlowType,
  ProjectionAsset,
  ProjectionLiability,
  ProjectionCashFlowItem,
  ProjectionInput,
  ProjectionResult,
  YearlySnapshot,
  ProjectionSummary,
  AssetValue,
  LiabilityBalance,
  LiabilityYearProjection,
  ProjectionValidationResult,
} from './projection.types'

export { FREQUENCY_MULTIPLIERS, MIN_HORIZON_YEARS, MAX_HORIZON_YEARS } from './projection.types'

export {
  InvalidProjectionInputError,
  InvalidHorizonError,
  InvalidStartDateError,
} from './projection.errors'
