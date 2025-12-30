import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateCashFlowItemDto } from './dto/create-cash-flow-item.dto'
import { type UpdateCashFlowItemDto } from './dto/update-cash-flow-item.dto'
import { type CashFlowItemQueryDto } from './dto/cash-flow-item-query.dto'
import { type CashFlowItem, type CashFlowType, type Frequency } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class CashFlowItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateCashFlowItemDto): Promise<CashFlowItem> {
    return this.prisma.cashFlowItem.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type as CashFlowType,
        amountCents: dto.amountCents,
        frequency: dto.frequency as Frequency,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        annualGrowthRatePercent: dto.annualGrowthRatePercent ?? null,
      },
    })
  }

  async findAll(
    householdId: string,
    query: CashFlowItemQueryDto,
  ): Promise<PaginatedResult<CashFlowItem>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      householdId,
      ...(query.type && { type: query.type as CashFlowType }),
    }

    const [data, total] = await Promise.all([
      this.prisma.cashFlowItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cashFlowItem.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string, householdId: string): Promise<CashFlowItem> {
    const item = await this.prisma.cashFlowItem.findFirst({
      where: {
        id,
        householdId,
      },
    })

    if (!item) {
      throw new NotFoundException('Cash flow item not found')
    }

    return item
  }

  async update(id: string, householdId: string, dto: UpdateCashFlowItemDto): Promise<CashFlowItem> {
    await this.findOne(id, householdId)

    return this.prisma.cashFlowItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as CashFlowType }),
        ...(dto.amountCents !== undefined && { amountCents: dto.amountCents }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency as Frequency }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.annualGrowthRatePercent !== undefined && {
          annualGrowthRatePercent: dto.annualGrowthRatePercent,
        }),
      },
    })
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId)

    await this.prisma.cashFlowItem.delete({
      where: { id },
    })
  }
}
