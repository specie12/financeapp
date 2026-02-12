import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PlanTier, PLAN_LIMITS, PlanLimitErrorCode, type PlanLimits } from './plan-limits.constants'

@Injectable()
export class PlanLimitsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the plan limits for a household
   */
  async getHouseholdPlanLimits(householdId: string): Promise<PlanLimits> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { planTier: true },
    })

    if (!household) {
      return PLAN_LIMITS[PlanTier.FREE]
    }

    return PLAN_LIMITS[household.planTier as PlanTier]
  }

  /**
   * Assert that a scenario can be created or throw ForbiddenException
   */
  async assertCanCreateScenario(householdId: string): Promise<void> {
    const limits = await this.getHouseholdPlanLimits(householdId)

    const currentCount = await this.prisma.scenario.count({
      where: { householdId },
    })

    if (currentCount >= limits.maxScenarios) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: PlanLimitErrorCode.SCENARIO_LIMIT_EXCEEDED,
        message:
          `Scenario limit reached. Your plan allows ${limits.maxScenarios} scenarios. ` +
          `You currently have ${currentCount}. Upgrade to create more.`,
        currentCount,
        limit: limits.maxScenarios,
      })
    }
  }

  /**
   * Assert that an AI call can be made or throw ForbiddenException
   */
  async assertCanMakeAiCall(householdId: string, currentDailyCount: number): Promise<void> {
    const limits = await this.getHouseholdPlanLimits(householdId)

    if (currentDailyCount >= limits.maxAiCallsPerDay) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: 'AI_LIMIT_EXCEEDED',
        message:
          `Daily AI usage limit reached. Your plan allows ${limits.maxAiCallsPerDay} AI calls per day. ` +
          `Upgrade for more AI-powered insights.`,
        currentCount: currentDailyCount,
        limit: limits.maxAiCallsPerDay,
      })
    }
  }

  /**
   * Assert that horizon years is within plan limit or throw ForbiddenException
   */
  async assertHorizonWithinLimit(householdId: string, requestedYears: number): Promise<void> {
    const limits = await this.getHouseholdPlanLimits(householdId)

    if (requestedYears > limits.maxHorizonYears) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: PlanLimitErrorCode.HORIZON_LIMIT_EXCEEDED,
        message:
          `Projection horizon of ${requestedYears} years exceeds your plan limit ` +
          `of ${limits.maxHorizonYears} years. Upgrade for longer projections.`,
        requested: requestedYears,
        limit: limits.maxHorizonYears,
      })
    }
  }

  /**
   * Assert that tax features are enabled for the household's plan
   */
  async assertTaxFeatureEnabled(householdId: string): Promise<void> {
    const limits = await this.getHouseholdPlanLimits(householdId)

    if (!limits.taxFeaturesEnabled) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: PlanLimitErrorCode.TAX_FEATURES_DISABLED,
        message:
          'Tax planning features are available on the Premium plan. Upgrade to access tax optimization tools.',
      })
    }
  }

  /**
   * Assert that a Plaid connection can be created
   */
  async assertCanConnectPlaid(householdId: string): Promise<void> {
    const limits = await this.getHouseholdPlanLimits(householdId)

    const currentCount = await this.prisma.plaidItem.count({
      where: { householdId },
    })

    if (currentCount >= limits.plaidConnectionsMax) {
      throw new ForbiddenException({
        statusCode: 403,
        errorCode: PlanLimitErrorCode.PLAID_CONNECTION_LIMIT,
        message:
          limits.plaidConnectionsMax === 0
            ? 'Bank connections are not available on the Free plan. Upgrade to Pro or Premium to connect your accounts.'
            : `Bank connection limit reached. Your plan allows ${limits.plaidConnectionsMax} connections. Upgrade for more.`,
        currentCount,
        limit: limits.plaidConnectionsMax,
      })
    }
  }
}
