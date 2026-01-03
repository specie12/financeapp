import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateGoalDto } from './dto/create-goal.dto'
import { type UpdateGoalDto } from './dto/update-goal.dto'
import { type GoalQueryDto } from './dto/goal-query.dto'
import { type Goal, type GoalType, type GoalStatus } from '@prisma/client'
import {
  type GoalProgressResponse,
  type GoalProgressWithInsights,
  type GoalMilestone,
  type GoalInsights,
} from '@finance-app/shared-types'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateGoalDto): Promise<Goal> {
    return this.prisma.goal.create({
      data: {
        householdId,
        type: dto.type as GoalType,
        name: dto.name,
        targetAmountCents: dto.targetAmountCents,
        targetDate: dto.targetDate ?? null,
        linkedLiabilityId: dto.linkedLiabilityId ?? null,
        linkedAssetIds: dto.linkedAssetIds ?? [],
      },
    })
  }

  async findAll(householdId: string, query: GoalQueryDto): Promise<PaginatedResult<Goal>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      householdId,
      ...(query.type && { type: query.type as GoalType }),
      ...(query.status && { status: query.status as GoalStatus }),
    }

    const [data, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          linkedLiability: true,
        },
      }),
      this.prisma.goal.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string, householdId: string): Promise<Goal> {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id,
        householdId,
      },
      include: {
        linkedLiability: true,
      },
    })

    if (!goal) {
      throw new NotFoundException('Goal not found')
    }

    return goal
  }

  async update(id: string, householdId: string, dto: UpdateGoalDto): Promise<Goal> {
    await this.findOne(id, householdId)

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type as GoalType }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.targetAmountCents !== undefined && { targetAmountCents: dto.targetAmountCents }),
        ...(dto.currentAmountCents !== undefined && { currentAmountCents: dto.currentAmountCents }),
        ...(dto.targetDate !== undefined && { targetDate: dto.targetDate }),
        ...(dto.status !== undefined && { status: dto.status as GoalStatus }),
        ...(dto.linkedLiabilityId !== undefined && { linkedLiabilityId: dto.linkedLiabilityId }),
        ...(dto.linkedAssetIds !== undefined && { linkedAssetIds: dto.linkedAssetIds }),
      },
      include: {
        linkedLiability: true,
      },
    })
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId)

    await this.prisma.goal.delete({
      where: { id },
    })
  }

  async getProgress(id: string, householdId: string): Promise<GoalProgressResponse> {
    const goal = await this.findOne(id, householdId)

    // Calculate current amount based on goal type
    let currentAmountCents = goal.currentAmountCents

    if (goal.type === 'net_worth_target') {
      // Calculate current net worth
      const [assets, liabilities] = await Promise.all([
        this.prisma.asset.aggregate({
          where: { householdId },
          _sum: { currentValueCents: true },
        }),
        this.prisma.liability.aggregate({
          where: { householdId },
          _sum: { currentBalanceCents: true },
        }),
      ])
      currentAmountCents =
        (assets._sum.currentValueCents ?? 0) - (liabilities._sum.currentBalanceCents ?? 0)
    } else if (goal.type === 'savings_target') {
      // Calculate savings from linked assets if specified, otherwise all savings accounts
      if (goal.linkedAssetIds && goal.linkedAssetIds.length > 0) {
        // Sum only the linked assets
        const savings = await this.prisma.asset.aggregate({
          where: {
            householdId,
            id: { in: goal.linkedAssetIds },
          },
          _sum: { currentValueCents: true },
        })
        currentAmountCents = savings._sum.currentValueCents ?? 0
      } else {
        // Fallback: sum all bank accounts + investments
        const savings = await this.prisma.asset.aggregate({
          where: {
            householdId,
            type: { in: ['bank_account', 'investment'] },
          },
          _sum: { currentValueCents: true },
        })
        currentAmountCents = savings._sum.currentValueCents ?? 0
      }
    } else if (goal.type === 'debt_freedom' && goal.linkedLiabilityId) {
      // For debt freedom, current amount is how much has been paid off
      const liability = await this.prisma.liability.findUnique({
        where: { id: goal.linkedLiabilityId },
      })
      if (liability) {
        currentAmountCents = liability.principalCents - liability.currentBalanceCents
      }
    }

    const progressPercent =
      goal.targetAmountCents > 0
        ? Math.min(100, Math.round((currentAmountCents / goal.targetAmountCents) * 10000) / 100)
        : 0

    const remainingAmountCents = Math.max(0, goal.targetAmountCents - currentAmountCents)

    // Calculate if on track
    let onTrack = progressPercent >= 100
    let projectedCompletionDate: Date | null = null
    let daysRemaining: number | null = null

    if (goal.targetDate && progressPercent < 100) {
      const now = new Date()
      const targetDate = new Date(goal.targetDate)
      daysRemaining = Math.max(
        0,
        Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      )

      // Calculate days elapsed since goal creation
      const createdAt = new Date(goal.createdAt)
      const daysElapsed = Math.max(
        1,
        Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      )

      // Calculate daily rate and projected completion
      if (progressPercent > 0 && daysElapsed > 0) {
        const dailyRate = progressPercent / daysElapsed
        const daysToComplete =
          dailyRate > 0 ? Math.ceil((100 - progressPercent) / dailyRate) : Infinity

        if (Number.isFinite(daysToComplete)) {
          projectedCompletionDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
          onTrack = projectedCompletionDate <= targetDate
        }
      }
    }

    return {
      goal: {
        id: goal.id,
        householdId: goal.householdId,
        type: goal.type as 'net_worth_target' | 'savings_target' | 'debt_freedom',
        name: goal.name,
        targetAmountCents: goal.targetAmountCents,
        currentAmountCents,
        targetDate: goal.targetDate,
        status: goal.status as 'active' | 'achieved' | 'paused',
        linkedLiabilityId: goal.linkedLiabilityId,
        linkedAssetIds: goal.linkedAssetIds,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
      },
      progressPercent,
      remainingAmountCents,
      onTrack,
      projectedCompletionDate,
      daysRemaining,
    }
  }

  async getAllProgress(householdId: string): Promise<GoalProgressResponse[]> {
    const goals = await this.prisma.goal.findMany({
      where: { householdId, status: 'active' },
    })

    return Promise.all(goals.map((goal) => this.getProgress(goal.id, householdId)))
  }

  /**
   * Calculate monthly savings rate from cash flow items
   */
  private async calculateMonthlySavingsRate(householdId: string): Promise<number> {
    const cashFlowItems = await this.prisma.cashFlowItem.findMany({
      where: { householdId },
    })

    let monthlyIncome = 0
    let monthlyExpenses = 0

    for (const item of cashFlowItems) {
      // Convert to monthly amount based on frequency
      let monthlyAmount = item.amountCents
      switch (item.frequency) {
        case 'weekly':
          monthlyAmount = (item.amountCents * 52) / 12
          break
        case 'biweekly':
          monthlyAmount = (item.amountCents * 26) / 12
          break
        case 'monthly':
          monthlyAmount = item.amountCents
          break
        case 'quarterly':
          monthlyAmount = item.amountCents / 3
          break
        case 'annually':
          monthlyAmount = item.amountCents / 12
          break
        case 'one_time':
          monthlyAmount = 0 // One-time items don't contribute to monthly rate
          break
      }

      if (item.type === 'income') {
        monthlyIncome += monthlyAmount
      } else {
        monthlyExpenses += monthlyAmount
      }
    }

    return Math.round(monthlyIncome - monthlyExpenses)
  }

  /**
   * Calculate milestone status for a goal
   */
  private calculateMilestones(progressPercent: number): GoalMilestone[] {
    const milestonePercents: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100]
    return milestonePercents.map((percent) => ({
      percent,
      reached: progressPercent >= percent,
    }))
  }

  /**
   * Get goal progress with additional insights
   */
  async getProgressWithInsights(
    id: string,
    householdId: string,
  ): Promise<GoalProgressWithInsights> {
    const progress = await this.getProgress(id, householdId)
    const currentMonthlySavingsRateCents = await this.calculateMonthlySavingsRate(householdId)

    // Calculate months to goal based on current savings rate
    let monthsToGoal: number | null = null
    let monthlySavingsNeededCents = 0
    let isAheadOfSchedule = false

    if (progress.remainingAmountCents > 0) {
      // Calculate monthly savings needed based on target date
      if (progress.daysRemaining !== null && progress.daysRemaining > 0) {
        const monthsRemaining = progress.daysRemaining / 30.44 // Average days per month
        monthlySavingsNeededCents = Math.ceil(progress.remainingAmountCents / monthsRemaining)

        // Check if ahead of schedule
        if (currentMonthlySavingsRateCents > 0) {
          isAheadOfSchedule = currentMonthlySavingsRateCents >= monthlySavingsNeededCents
        }
      }

      // Calculate months to goal at current savings rate
      if (currentMonthlySavingsRateCents > 0) {
        monthsToGoal = Math.ceil(progress.remainingAmountCents / currentMonthlySavingsRateCents)
      }
    }

    const milestones = this.calculateMilestones(progress.progressPercent)

    const insights: GoalInsights = {
      monthlySavingsNeededCents,
      currentMonthlySavingsRateCents,
      milestones,
      isAheadOfSchedule,
      monthsToGoal,
    }

    return {
      ...progress,
      insights,
    }
  }

  /**
   * Get all goals with insights
   */
  async getAllProgressWithInsights(householdId: string): Promise<GoalProgressWithInsights[]> {
    const goals = await this.prisma.goal.findMany({
      where: { householdId, status: 'active' },
    })

    return Promise.all(goals.map((goal) => this.getProgressWithInsights(goal.id, householdId)))
  }
}
