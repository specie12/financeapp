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
import { CashFlowItemsService } from './cash-flow-items.service'
import { CreateCashFlowItemDto } from './dto/create-cash-flow-item.dto'
import { UpdateCashFlowItemDto } from './dto/update-cash-flow-item.dto'
import { CashFlowItemQueryDto } from './dto/cash-flow-item-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createCashFlowItemSchema,
  updateCashFlowItemSchema,
  cashFlowItemQuerySchema,
} from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type CashFlowItem } from '@prisma/client'

@Controller('cash-flow-items')
export class CashFlowItemsController {
  constructor(private readonly cashFlowItemsService: CashFlowItemsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createCashFlowItemSchema))
    createCashFlowItemDto: CreateCashFlowItemDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<CashFlowItem>> {
    const item = await this.cashFlowItemsService.create(householdId, createCashFlowItemDto)
    return {
      success: true,
      data: item,
      message: 'Cash flow item created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(cashFlowItemQuerySchema)) query: CashFlowItemQueryDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<PaginatedResponse<CashFlowItem>> {
    const { data, total, page, limit } = await this.cashFlowItemsService.findAll(householdId, query)
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
  @ResourceId({ type: ResourceType.CASH_FLOW_ITEM, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<CashFlowItem>> {
    const item = await this.cashFlowItemsService.findOne(id, householdId)
    return {
      success: true,
      data: item,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.CASH_FLOW_ITEM, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCashFlowItemSchema))
    updateCashFlowItemDto: UpdateCashFlowItemDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<CashFlowItem>> {
    const item = await this.cashFlowItemsService.update(id, householdId, updateCashFlowItemDto)
    return {
      success: true,
      data: item,
      message: 'Cash flow item updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.CASH_FLOW_ITEM, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.cashFlowItemsService.remove(id, householdId)
    return {
      success: true,
      data: { id },
      message: 'Cash flow item deleted successfully',
    }
  }
}
