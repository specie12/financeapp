import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateCategoryDto } from './dto/create-category.dto'
import { type UpdateCategoryDto } from './dto/update-category.dto'
import { type CategoryQueryDto } from './dto/category-query.dto'
import { type Category, type TransactionType } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type as TransactionType,
        icon: dto.icon ?? null,
        color: dto.color ?? null,
        parentId: dto.parentId ?? null,
      },
      include: { children: true },
    })
  }

  async findAll(userId: string, query: CategoryQueryDto): Promise<PaginatedResult<Category>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(query.type && { type: query.type as TransactionType }),
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { children: true },
      }),
      this.prisma.category.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
      include: { children: true },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    return category
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id, userId)

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as TransactionType }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      },
      include: { children: true },
    })
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)

    await this.prisma.category.delete({
      where: { id },
    })
  }
}
