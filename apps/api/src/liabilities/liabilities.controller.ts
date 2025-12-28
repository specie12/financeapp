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
  UsePipes,
} from '@nestjs/common'
import { type LiabilitiesService } from './liabilities.service'
import { type CreateLiabilityDto } from './dto/create-liability.dto'
import { type UpdateLiabilityDto } from './dto/update-liability.dto'
import { type LiabilityQueryDto } from './dto/liability-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createLiabilitySchema,
  updateLiabilitySchema,
  liabilityQuerySchema,
} from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Liability } from '@prisma/client'

@Controller('liabilities')
export class LiabilitiesController {
  constructor(private readonly liabilitiesService: LiabilitiesService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  @UsePipes(new ZodValidationPipe(createLiabilitySchema))
  async create(
    @Body() createLiabilityDto: CreateLiabilityDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Liability>> {
    const liability = await this.liabilitiesService.create(householdId, createLiabilityDto)
    return {
      success: true,
      data: liability,
      message: 'Liability created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(liabilityQuerySchema)) query: LiabilityQueryDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<PaginatedResponse<Liability>> {
    const { data, total, page, limit } = await this.liabilitiesService.findAll(householdId, query)
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
  @ResourceId({ type: ResourceType.LIABILITY, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Liability>> {
    const liability = await this.liabilitiesService.findOne(id, householdId)
    return {
      success: true,
      data: liability,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.LIABILITY, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateLiabilitySchema)) updateLiabilityDto: UpdateLiabilityDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Liability>> {
    const liability = await this.liabilitiesService.update(id, householdId, updateLiabilityDto)
    return {
      success: true,
      data: liability,
      message: 'Liability updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.LIABILITY, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.liabilitiesService.remove(id, householdId)
    return {
      success: true,
      data: { id },
      message: 'Liability deleted successfully',
    }
  }
}
