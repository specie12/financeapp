import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateBudgetDto } from './dto/create-budget.dto'
import { type UpdateBudgetDto } from './dto/update-budget.dto'
import { type BudgetQueryDto } from './dto/budget-query.dto'
import { type Budget, type BudgetPeriod } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<Budget> {
    // Verify category belongs to user
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId },
    })
    if (!category) {
      throw new ForbiddenException('Category not found or does not belong to user')
    }

    return this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        amount: dto.amount,
        period: dto.period as BudgetPeriod,
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
      },
      include: { category: true },
    })
  }

  async findAll(userId: string, query: BudgetQueryDto): Promise<PaginatedResult<Budget>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(query.period && { period: query.period as BudgetPeriod }),
    }

    const [data, total] = await Promise.all([
      this.prisma.budget.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      this.prisma.budget.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    })

    if (!budget) {
      throw new NotFoundException('Budget not found')
    }

    return budget
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto): Promise<Budget> {
    await this.findOne(id, userId)

    // If changing category, verify new category belongs to user
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId },
      })
      if (!category) {
        throw new ForbiddenException('Category not found or does not belong to user')
      }
    }

    return this.prisma.budget.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.period !== undefined && { period: dto.period as BudgetPeriod }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
      },
      include: { category: true },
    })
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)

    await this.prisma.budget.delete({
      where: { id },
    })
  }

  async checkBudgetStatusAndNotify(userId: string, categoryId: string): Promise<void> {
    const budget = await this.prisma.budget.findFirst({
      where: { userId, categoryId },
      include: { category: true },
    })

    if (!budget) return

    // Get spending for the current period
    const now = new Date()
    const periodStart = new Date(now)
    switch (budget.period) {
      case 'weekly':
        periodStart.setDate(now.getDate() - now.getDay())
        break
      case 'monthly':
        periodStart.setDate(1)
        break
      case 'quarterly':
        periodStart.setMonth(Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'yearly':
        periodStart.setMonth(0, 1)
        break
    }
    periodStart.setHours(0, 0, 0, 0)

    const spent = await this.prisma.transaction.aggregate({
      where: {
        categoryId,
        type: 'expense',
        date: { gte: periodStart },
        account: { userId },
      },
      _sum: { amount: true },
    })

    const spentAmount = spent._sum.amount ?? 0
    const percentUsed = (spentAmount / budget.amount) * 100

    if (percentUsed >= 80) {
      this.eventEmitter.emit('budget.exceeded', {
        userId,
        budgetId: budget.id,
        categoryName: (budget as Budget & { category: { name: string } }).category.name,
        percentUsed,
        budgetedAmountCents: budget.amount,
        spentAmountCents: spentAmount,
      })
    }
  }
}
