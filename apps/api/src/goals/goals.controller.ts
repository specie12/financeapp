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
import { GoalsService } from './goals.service'
import { CreateGoalDto } from './dto/create-goal.dto'
import { UpdateGoalDto } from './dto/update-goal.dto'
import { GoalQueryDto } from './dto/goal-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createGoalSchema, updateGoalSchema } from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import {
  type ApiResponse,
  type PaginatedResponse,
  type GoalProgressResponse,
  type GoalProgressWithInsights,
} from '@finance-app/shared-types'
import { type Goal } from '@prisma/client'

@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createGoalSchema)) createGoalDto: CreateGoalDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Goal>> {
    const goal = await this.goalsService.create(householdId, createGoalDto)
    return {
      success: true,
      data: goal,
      message: 'Goal created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query() query: GoalQueryDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<PaginatedResponse<Goal>> {
    const { data, total, page, limit } = await this.goalsService.findAll(householdId, query)
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

  @Get('progress')
  @RequirePermission(Permission.READ)
  async getAllProgress(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<GoalProgressResponse[]>> {
    const progress = await this.goalsService.getAllProgress(householdId)
    return {
      success: true,
      data: progress,
    }
  }

  @Get('insights')
  @RequirePermission(Permission.READ)
  async getAllInsights(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<GoalProgressWithInsights[]>> {
    const insights = await this.goalsService.getAllProgressWithInsights(householdId)
    return {
      success: true,
      data: insights,
    }
  }

  @Get(':id')
  @RequirePermission(Permission.READ)
  @ResourceId({ type: ResourceType.GOAL, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Goal>> {
    const goal = await this.goalsService.findOne(id, householdId)
    return {
      success: true,
      data: goal,
    }
  }

  @Get(':id/progress')
  @RequirePermission(Permission.READ)
  @ResourceId({ type: ResourceType.GOAL, idParam: 'id' })
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<GoalProgressResponse>> {
    const progress = await this.goalsService.getProgress(id, householdId)
    return {
      success: true,
      data: progress,
    }
  }

  @Get(':id/insights')
  @RequirePermission(Permission.READ)
  @ResourceId({ type: ResourceType.GOAL, idParam: 'id' })
  async getInsights(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<GoalProgressWithInsights>> {
    const insights = await this.goalsService.getProgressWithInsights(id, householdId)
    return {
      success: true,
      data: insights,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.GOAL, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateGoalSchema)) updateGoalDto: UpdateGoalDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Goal>> {
    const goal = await this.goalsService.update(id, householdId, updateGoalDto)
    return {
      success: true,
      data: goal,
      message: 'Goal updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.GOAL, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.goalsService.remove(id, householdId)
    return {
      success: true,
      data: { id },
      message: 'Goal deleted successfully',
    }
  }
}
