import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateAccountDto } from './dto/create-account.dto'
import { type UpdateAccountDto } from './dto/update-account.dto'
import { type AccountQueryDto } from './dto/account-query.dto'
import { type Account, type AccountType, type Currency } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type as AccountType,
        currency: (dto.currency as Currency) ?? 'USD',
        balance: dto.initialBalance ?? 0,
      },
    })
  }

  async findAll(userId: string, query: AccountQueryDto): Promise<PaginatedResult<Account>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(query.type && { type: query.type as AccountType }),
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    })

    if (!account) {
      throw new NotFoundException('Account not found')
    }

    return account
  }

  async update(id: string, userId: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(id, userId)

    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.type !== undefined && { type: dto.type as AccountType }),
        ...(dto.currency !== undefined && { currency: dto.currency as Currency }),
        ...(dto.initialBalance !== undefined && { balance: dto.initialBalance }),
      },
    })
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)

    await this.prisma.account.delete({
      where: { id },
    })
  }
}
