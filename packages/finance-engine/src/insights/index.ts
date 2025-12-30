// Financial Insights Engine - Rule-based financial analysis
export { generateInsights, validateInsightInput, mergeRuleConfig } from './insights'

// Types
export type {
  // Input types
  InsightInput,
  MonthlyExpenses,
  AssetInput,
  LiabilityInput,
  GoalInput,
  AssetType,
  LiabilityType,

  // Output types
  InsightsResult,
  Insight,
  InsightsSummary,
  InsightSeverity,
  InsightCategory,
  InsightUnit,
  PotentialImpact,

  // Metrics types
  BaseMetrics,
  GoalProgressMetrics,
  HighestInterestDebt,

  // Validation types
  InsightValidationResult,

  // Interest savings types
  InterestSavingsScenario,
} from './insights.types'

// Configuration types
export type {
  RuleConfiguration,
  HousingCostRuleConfig,
  DebtToIncomeRuleConfig,
  EmergencyFundRuleConfig,
  GoalProgressRuleConfig,
  InterestSavingsRuleConfig,
} from './insights.constants'

// Constants
export { DEFAULT_RULE_CONFIG, RULE_IDS, SEVERITY_ORDER } from './insights.constants'

// Errors
export {
  InsightError,
  InvalidInsightInputError,
  InvalidIncomeError,
  InvalidExpenseError,
  InvalidAssetError,
  InvalidLiabilityError,
  InvalidGoalError,
  InvalidReferenceDateError,
  InvalidRuleConfigError,
} from './insights.errors'

// Metrics (for advanced usage)
export { calculateBaseMetrics } from './insights.metrics'

// Individual rules (for advanced usage / testing)
export {
  evaluateHousingCostRule,
  evaluateDebtToIncomeRule,
  evaluateEmergencyFundRule,
  evaluateGoalProgressRule,
  evaluateInterestSavingsRule,
} from './insights.rules'
