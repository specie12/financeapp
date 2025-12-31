import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateGoalDto } from './dto/create-goal.dto'
import { type UpdateGoalDto } from './dto/update-goal.dto'
import { type GoalQueryDto } from './dto/goal-query.dto'
import { type Goal, type GoalType, type GoalStatus } from '@prisma/client'
import { type GoalProgressResponse } from '@finance-app/shared-types'

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
      // Calculate total savings (bank accounts + investments)
      const savings = await this.prisma.asset.aggregate({
        where: {
          householdId,
          type: { in: ['bank_account', 'investment'] },
        },
        _sum: { currentValueCents: true },
      })
      currentAmountCents = savings._sum.currentValueCents ?? 0
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
}
