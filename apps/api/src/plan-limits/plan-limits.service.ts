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
}
