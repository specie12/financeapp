export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export interface PlanLimits {
  maxScenarios: number
  maxHorizonYears: number
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  [PlanTier.FREE]: {
    maxScenarios: 3,
    maxHorizonYears: 10,
  },
  [PlanTier.PRO]: {
    maxScenarios: 10,
    maxHorizonYears: 20,
  },
  [PlanTier.PREMIUM]: {
    maxScenarios: Infinity,
    maxHorizonYears: 30,
  },
}

export enum PlanLimitErrorCode {
  SCENARIO_LIMIT_EXCEEDED = 'SCENARIO_LIMIT_EXCEEDED',
  HORIZON_LIMIT_EXCEEDED = 'HORIZON_LIMIT_EXCEEDED',
}
