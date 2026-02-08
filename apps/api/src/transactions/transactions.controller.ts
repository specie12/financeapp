import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common'
import { TransactionsService } from './transactions.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { TransactionQueryDto } from './dto/transaction-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Transaction } from '@prisma/client'

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createTransactionSchema))
    createTransactionDto: CreateTransactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.create(userId, createTransactionDto)
    return {
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(transactionQuerySchema)) query: TransactionQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResponse<Transaction>> {
    const { data, total, page, limit } = await this.transactionsService.findAll(userId, query)
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  @Get(':id')
  @RequirePermission(Permission.READ)
  @ResourceId({ type: ResourceType.TRANSACTION, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.findOne(id, userId)
    return {
      success: true,
      data: transaction,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.TRANSACTION, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    updateTransactionDto: UpdateTransactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Transaction>> {
    const transaction = await this.transactionsService.update(id, userId, updateTransactionDto)
    return {
      success: true,
      data: transaction,
      message: 'Transaction updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.TRANSACTION, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.transactionsService.remove(id, userId)
    return {
      success: true,
      data: { id },
      message: 'Transaction deleted successfully',
    }
  }
}
