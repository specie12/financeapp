import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ResourceType } from '../interfaces/permission.interface'

@Injectable()
export class ResourceOwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getResourceHouseholdId(
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<string | null> {
    switch (resourceType) {
      case ResourceType.ASSET:
        return this.getAssetHouseholdId(resourceId)
      case ResourceType.LIABILITY:
        return this.getLiabilityHouseholdId(resourceId)
      case ResourceType.CASH_FLOW_ITEM:
        return this.getCashFlowItemHouseholdId(resourceId)
      case ResourceType.SCENARIO:
        return this.getScenarioHouseholdId(resourceId)
      case ResourceType.SCENARIO_OVERRIDE:
        return this.getScenarioOverrideHouseholdId(resourceId)
      case ResourceType.GOAL:
        return this.getGoalHouseholdId(resourceId)
      case ResourceType.ACCOUNT:
        return this.getAccountHouseholdId(resourceId)
      case ResourceType.CATEGORY:
        return this.getCategoryHouseholdId(resourceId)
      case ResourceType.BUDGET:
        return this.getBudgetHouseholdId(resourceId)
      case ResourceType.TRANSACTION:
        return this.getTransactionHouseholdId(resourceId)
      default:
        throw new Error(`Unknown resource type: ${resourceType}`)
    }
  }

  private async getAssetHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.asset.findUnique({
      where: { id },
      select: { householdId: true },
    })
    return resource?.householdId ?? null
  }

  private async getLiabilityHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.liability.findUnique({
      where: { id },
      select: { householdId: true },
    })
    return resource?.householdId ?? null
  }

  private async getCashFlowItemHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.cashFlowItem.findUnique({
      where: { id },
      select: { householdId: true },
    })
    return resource?.householdId ?? null
  }

  private async getScenarioHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.scenario.findUnique({
      where: { id },
      select: { householdId: true },
    })
    return resource?.householdId ?? null
  }

  private async getAccountHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.account.findUnique({
      where: { id },
      select: { user: { select: { householdId: true } } },
    })
    return resource?.user?.householdId ?? null
  }

  private async getCategoryHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.category.findUnique({
      where: { id },
      select: { user: { select: { householdId: true } } },
    })
    return resource?.user?.householdId ?? null
  }

  private async getBudgetHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.budget.findUnique({
      where: { id },
      select: { user: { select: { householdId: true } } },
    })
    return resource?.user?.householdId ?? null
  }

  private async getTransactionHouseholdId(id: string): Promise<string | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { account: { select: { user: { select: { householdId: true } } } } },
    })
    return transaction?.account?.user?.householdId ?? null
  }

  private async getScenarioOverrideHouseholdId(id: string): Promise<string | null> {
    const override = await this.prisma.scenarioOverride.findUnique({
      where: { id },
      select: { scenario: { select: { householdId: true } } },
    })
    return override?.scenario?.householdId ?? null
  }

  private async getGoalHouseholdId(id: string): Promise<string | null> {
    const resource = await this.prisma.goal.findUnique({
      where: { id },
      select: { householdId: true },
    })
    return resource?.householdId ?? null
  }
}
