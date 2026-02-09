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
import { RentalPropertiesService } from './rental-properties.service'
import { CreateRentalPropertyDtoClass } from './dto/create-rental-property.dto'
import { UpdateRentalPropertyDtoClass } from './dto/update-rental-property.dto'
import { RentalPropertyQueryDto } from './dto/rental-property-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createRentalPropertySchema, updateRentalPropertySchema } from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import type {
  ApiResponse,
  PaginatedResponse,
  RentalPortfolioSummary,
} from '@finance-app/shared-types'
import type { RentalProperty } from '@prisma/client'

@Controller('rental-properties')
export class RentalPropertiesController {
  constructor(private readonly rentalPropertiesService: RentalPropertiesService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createRentalPropertySchema)) dto: CreateRentalPropertyDtoClass,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<RentalProperty>> {
    const property = await this.rentalPropertiesService.create(householdId, dto)
    return {
      success: true,
      data: property,
      message: 'Rental property created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query() query: RentalPropertyQueryDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<PaginatedResponse<RentalProperty>> {
    const { data, total, page, limit } = await this.rentalPropertiesService.findAll(
      householdId,
      query,
    )
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

  @Get('summary')
  @RequirePermission(Permission.READ)
  async getSummary(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<RentalPortfolioSummary>> {
    const summary = await this.rentalPropertiesService.getPortfolioSummary(householdId)
    return {
      success: true,
      data: summary,
    }
  }

  @Get(':id')
  @RequirePermission(Permission.READ)
  @ResourceId({ type: ResourceType.RENTAL_PROPERTY, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<RentalProperty>> {
    const property = await this.rentalPropertiesService.findOne(id, householdId)
    return {
      success: true,
      data: property,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.RENTAL_PROPERTY, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateRentalPropertySchema)) dto: UpdateRentalPropertyDtoClass,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<RentalProperty>> {
    const property = await this.rentalPropertiesService.update(id, householdId, dto)
    return {
      success: true,
      data: property,
      message: 'Rental property updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.RENTAL_PROPERTY, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.rentalPropertiesService.remove(id, householdId)
    return {
      success: true,
      data: { id },
      message: 'Rental property deleted successfully',
    }
  }
}
