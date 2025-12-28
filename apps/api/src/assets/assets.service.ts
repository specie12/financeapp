import { Injectable, NotFoundException } from '@nestjs/common'
import { type PrismaService } from '../prisma/prisma.service'
import { type CreateAssetDto } from './dto/create-asset.dto'
import { type UpdateAssetDto } from './dto/update-asset.dto'
import { type AssetQueryDto } from './dto/asset-query.dto'
import { type Asset, type AssetType } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(householdId: string, dto: CreateAssetDto): Promise<Asset> {
    return this.prisma.asset.create({
      data: {
        householdId,
        name: dto.name,
        type: dto.type as AssetType,
        currentValueCents: dto.currentValueCents,
        annualGrowthRatePercent: dto.annualGrowthRatePercent ?? null,
      },
    })
  }

  async findAll(householdId: string, query: AssetQueryDto): Promise<PaginatedResult<Asset>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      householdId,
      ...(query.type && { type: query.type as AssetType }),
    }

    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string, householdId: string): Promise<Asset> {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id,
        householdId,
      },
    })

    if (!asset) {
      throw new NotFoundException('Asset not found')
    }

    return asset
  }

  async update(id: string, householdId: string, dto: UpdateAssetDto): Promise<Asset> {
    await this.findOne(id, householdId)

    return this.prisma.asset.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as AssetType }),
        ...(dto.currentValueCents !== undefined && { currentValueCents: dto.currentValueCents }),
        ...(dto.annualGrowthRatePercent !== undefined && {
          annualGrowthRatePercent: dto.annualGrowthRatePercent,
        }),
      },
    })
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId)

    await this.prisma.asset.delete({
      where: { id },
    })
  }
}
