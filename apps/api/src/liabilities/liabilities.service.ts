import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateLiabilityDto } from './dto/create-liability.dto'
import { type UpdateLiabilityDto } from './dto/update-liability.dto'
import { type LiabilityQueryDto } from './dto/liability-query.dto'
import { type Frequency, type Liability, type LiabilityType } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class LiabilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateLiabilityDto): Promise<Liability> {
    return this.prisma.liability.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type as LiabilityType,
        principalCents: dto.principalCents,
        currentBalanceCents: dto.currentBalanceCents,
        interestRatePercent: dto.interestRatePercent,
        minimumPaymentCents: dto.minimumPaymentCents,
        paymentFrequency: dto.paymentFrequency as Frequency,
        termMonths: dto.termMonths ?? null,
        startDate: dto.startDate,
      },
    })
  }

  async findAll(
    householdId: string,
    query: LiabilityQueryDto,
  ): Promise<PaginatedResult<Liability>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      householdId,
      ...(query.type && { type: query.type as LiabilityType }),
    }

    const [data, total] = await Promise.all([
      this.prisma.liability.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.liability.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string, householdId: string): Promise<Liability> {
    const liability = await this.prisma.liability.findFirst({
      where: {
        id,
        householdId,
      },
    })

    if (!liability) {
      throw new NotFoundException('Liability not found')
    }

    return liability
  }

  async update(id: string, householdId: string, dto: UpdateLiabilityDto): Promise<Liability> {
    await this.findOne(id, householdId)

    return this.prisma.liability.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as LiabilityType }),
        ...(dto.principalCents !== undefined && { principalCents: dto.principalCents }),
        ...(dto.currentBalanceCents !== undefined && {
          currentBalanceCents: dto.currentBalanceCents,
        }),
        ...(dto.interestRatePercent !== undefined && {
          interestRatePercent: dto.interestRatePercent,
        }),
        ...(dto.minimumPaymentCents !== undefined && {
          minimumPaymentCents: dto.minimumPaymentCents,
        }),
        ...(dto.paymentFrequency !== undefined && {
          paymentFrequency: dto.paymentFrequency as Frequency,
        }),
        ...(dto.termMonths !== undefined && { termMonths: dto.termMonths }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
      },
    })
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId)

    await this.prisma.liability.delete({
      where: { id },
    })
  }
}
