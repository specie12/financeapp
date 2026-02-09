import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { CreateRentalPropertyDtoClass } from './dto/create-rental-property.dto'
import type { UpdateRentalPropertyDtoClass } from './dto/update-rental-property.dto'
import type { RentalPropertyQueryDto } from './dto/rental-property-query.dto'
import type { RentalProperty } from '@prisma/client'
import type { RentalPropertyMetrics, RentalPortfolioSummary } from '@finance-app/shared-types'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class RentalPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateRentalPropertyDtoClass): Promise<RentalProperty> {
    return this.prisma.rentalProperty.create({
      data: {
        householdId,
        name: dto.name,
        address: dto.address ?? null,
        purchasePriceCents: dto.purchasePriceCents,
        currentValueCents: dto.currentValueCents,
        downPaymentCents: dto.downPaymentCents,
        monthlyRentCents: dto.monthlyRentCents,
        vacancyRatePercent: dto.vacancyRatePercent ?? 5,
        annualExpensesCents: dto.annualExpensesCents,
        propertyTaxAnnualCents: dto.propertyTaxAnnualCents,
        mortgagePaymentCents: dto.mortgagePaymentCents ?? null,
        mortgageRatePercent: dto.mortgageRatePercent ?? null,
        linkedAssetId: dto.linkedAssetId ?? null,
        linkedLiabilityId: dto.linkedLiabilityId ?? null,
      },
    })
  }

  async findAll(
    householdId: string,
    query: RentalPropertyQueryDto,
  ): Promise<PaginatedResult<RentalProperty>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = { householdId }

    const [data, total] = await Promise.all([
      this.prisma.rentalProperty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rentalProperty.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, householdId: string): Promise<RentalProperty> {
    const property = await this.prisma.rentalProperty.findFirst({
      where: { id, householdId },
    })

    if (!property) {
      throw new NotFoundException(`Rental property ${id} not found`)
    }

    return property
  }

  async update(
    id: string,
    householdId: string,
    dto: UpdateRentalPropertyDtoClass,
  ): Promise<RentalProperty> {
    await this.findOne(id, householdId)

    return this.prisma.rentalProperty.update({
      where: { id },
      data: dto,
    })
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId)
    await this.prisma.rentalProperty.delete({ where: { id } })
  }

  calculateMetrics(property: RentalProperty): RentalPropertyMetrics {
    const vacancyRate = Number(property.vacancyRatePercent) / 100
    const effectiveGrossIncome = Math.round(property.monthlyRentCents * 12 * (1 - vacancyRate))
    const noiCents =
      effectiveGrossIncome - property.annualExpensesCents - property.propertyTaxAnnualCents

    const capRatePercent =
      property.currentValueCents > 0
        ? Math.round((noiCents / property.currentValueCents) * 10000) / 100
        : 0

    const annualMortgage = property.mortgagePaymentCents ? property.mortgagePaymentCents * 12 : 0
    const cashFlow = noiCents - annualMortgage
    const cashOnCashReturnPercent =
      property.downPaymentCents > 0
        ? Math.round((cashFlow / property.downPaymentCents) * 10000) / 100
        : 0

    const annualRent = property.monthlyRentCents * 12
    const grossRentMultiplier =
      annualRent > 0 ? Math.round((property.currentValueCents / annualRent) * 100) / 100 : 0

    const dscrRatio =
      annualMortgage > 0 ? Math.round((noiCents / annualMortgage) * 100) / 100 : null

    return {
      property: {
        id: property.id,
        householdId: property.householdId,
        name: property.name,
        address: property.address,
        purchasePriceCents: property.purchasePriceCents,
        currentValueCents: property.currentValueCents,
        downPaymentCents: property.downPaymentCents,
        monthlyRentCents: property.monthlyRentCents,
        vacancyRatePercent: Number(property.vacancyRatePercent),
        annualExpensesCents: property.annualExpensesCents,
        propertyTaxAnnualCents: property.propertyTaxAnnualCents,
        mortgagePaymentCents: property.mortgagePaymentCents,
        mortgageRatePercent: property.mortgageRatePercent
          ? Number(property.mortgageRatePercent)
          : null,
        linkedAssetId: property.linkedAssetId,
        linkedLiabilityId: property.linkedLiabilityId,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
      noiCents,
      capRatePercent,
      cashOnCashReturnPercent,
      grossRentMultiplier,
      dscrRatio,
    }
  }

  async getPortfolioSummary(householdId: string): Promise<RentalPortfolioSummary> {
    const properties = await this.prisma.rentalProperty.findMany({
      where: { householdId },
    })

    const propertyMetrics = properties.map((p) => this.calculateMetrics(p))

    const totalValueCents = properties.reduce((sum, p) => sum + p.currentValueCents, 0)
    const totalDebtCents = properties.reduce(
      (sum, p) => sum + (p.mortgagePaymentCents ? p.currentValueCents - p.downPaymentCents : 0),
      0,
    )
    const totalMonthlyRentCents = properties.reduce((sum, p) => sum + p.monthlyRentCents, 0)
    const totalNOICents = propertyMetrics.reduce((sum, m) => sum + m.noiCents, 0)

    const averageCapRatePercent =
      propertyMetrics.length > 0
        ? Math.round(
            (propertyMetrics.reduce((sum, m) => sum + m.capRatePercent, 0) /
              propertyMetrics.length) *
              100,
          ) / 100
        : 0

    const averageCashOnCashPercent =
      propertyMetrics.length > 0
        ? Math.round(
            (propertyMetrics.reduce((sum, m) => sum + m.cashOnCashReturnPercent, 0) /
              propertyMetrics.length) *
              100,
          ) / 100
        : 0

    return {
      totalProperties: properties.length,
      totalValueCents,
      totalEquityCents: totalValueCents - totalDebtCents,
      totalMonthlyRentCents,
      totalNOICents,
      averageCapRatePercent,
      averageCashOnCashPercent,
      properties: propertyMetrics,
    }
  }
}
