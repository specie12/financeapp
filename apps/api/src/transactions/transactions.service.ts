import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { type CreateTransactionDto } from './dto/create-transaction.dto'
import { type UpdateTransactionDto } from './dto/update-transaction.dto'
import { type TransactionQueryDto } from './dto/transaction-query.dto'
import { type Transaction, type TransactionType } from '@prisma/client'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    // Verify account belongs to user
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId },
    })
    if (!account) {
      throw new ForbiddenException('Account not found or does not belong to user')
    }

    return this.prisma.transaction.create({
      data: {
        accountId: dto.accountId,
        categoryId: dto.categoryId ?? null,
        type: dto.type as TransactionType,
        amount: dto.amount,
        description: dto.description,
        date: dto.date,
      },
    })
  }

  async findAll(userId: string, query: TransactionQueryDto): Promise<PaginatedResult<Transaction>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      account: { userId },
      ...(query.accountId && { accountId: query.accountId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.type && { type: query.type as TransactionType }),
    }

    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { category: true },
      }),
      this.prisma.transaction.count({ where }),
    ])

    return { data, total, page, limit }
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
      include: { category: true },
    })

    if (!transaction) {
      throw new NotFoundException('Transaction not found')
    }

    return transaction
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    await this.findOne(id, userId)

    // If changing account, verify new account belongs to user
    if (dto.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId },
      })
      if (!account) {
        throw new ForbiddenException('Account not found or does not belong to user')
      }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...(dto.accountId !== undefined && { accountId: dto.accountId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.type !== undefined && { type: dto.type as TransactionType }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.date !== undefined && { date: dto.date }),
      },
    })
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId)

    await this.prisma.transaction.delete({
      where: { id },
    })
  }
}
