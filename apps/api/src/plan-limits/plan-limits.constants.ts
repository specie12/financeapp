export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export interface PlanLimits {
  maxScenarios: number
  maxHorizonYears: number
  maxAiCallsPerDay: number
  taxFeaturesEnabled: boolean
  plaidConnectionsMax: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    maxScenarios: 3,
    maxHorizonYears: 10,
    maxAiCallsPerDay: 5,
    taxFeaturesEnabled: false,
    plaidConnectionsMax: 0,
  },
  [PlanTier.PRO]: {
    maxScenarios: 10,
    maxHorizonYears: 20,
    maxAiCallsPerDay: 50,
    taxFeaturesEnabled: false,
    plaidConnectionsMax: 3,
  },
  [PlanTier.PREMIUM]: {
    maxScenarios: Infinity,
    maxHorizonYears: 30,
    maxAiCallsPerDay: Infinity,
    taxFeaturesEnabled: true,
    plaidConnectionsMax: Infinity,
  },
}

export enum PlanLimitErrorCode {
  SCENARIO_LIMIT_EXCEEDED = 'SCENARIO_LIMIT_EXCEEDED',
  HORIZON_LIMIT_EXCEEDED = 'HORIZON_LIMIT_EXCEEDED',
  TAX_FEATURES_DISABLED = 'TAX_FEATURES_DISABLED',
  PLAID_CONNECTION_LIMIT = 'PLAID_CONNECTION_LIMIT',
}
