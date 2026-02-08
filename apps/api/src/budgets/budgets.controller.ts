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
import { BudgetsService } from './budgets.service'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { UpdateBudgetDto } from './dto/update-budget.dto'
import { BudgetQueryDto } from './dto/budget-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createBudgetSchema, updateBudgetSchema, budgetQuerySchema } from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Budget } from '@prisma/client'

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createBudgetSchema)) createBudgetDto: CreateBudgetDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Budget>> {
    const budget = await this.budgetsService.create(userId, createBudgetDto)
    return {
      success: true,
      data: budget,
      message: 'Budget created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(budgetQuerySchema)) query: BudgetQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResponse<Budget>> {
    const { data, total, page, limit } = await this.budgetsService.findAll(userId, query)
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
  @ResourceId({ type: ResourceType.BUDGET, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Budget>> {
    const budget = await this.budgetsService.findOne(id, userId)
    return {
      success: true,
      data: budget,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.BUDGET, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBudgetSchema)) updateBudgetDto: UpdateBudgetDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Budget>> {
    const budget = await this.budgetsService.update(id, userId, updateBudgetDto)
    return {
      success: true,
      data: budget,
      message: 'Budget updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.BUDGET, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.budgetsService.remove(id, userId)
    return {
      success: true,
      data: { id },
      message: 'Budget deleted successfully',
    }
  }
}
