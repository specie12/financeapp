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
import { type AssetsService } from './assets.service'
import { type CreateAssetDto } from './dto/create-asset.dto'
import { type UpdateAssetDto } from './dto/update-asset.dto'
import { type AssetQueryDto } from './dto/asset-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { createAssetSchema, updateAssetSchema, assetQuerySchema } from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Asset } from '@prisma/client'

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  @UsePipes(new ZodValidationPipe(createAssetSchema))
  async create(
    @Body() createAssetDto: CreateAssetDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Asset>> {
    const asset = await this.assetsService.create(householdId, createAssetDto)
    return {
      success: true,
      data: asset,
      message: 'Asset created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(assetQuerySchema)) query: AssetQueryDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<PaginatedResponse<Asset>> {
    const { data, total, page, limit } = await this.assetsService.findAll(householdId, query)
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
  @ResourceId({ type: ResourceType.ASSET, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Asset>> {
    const asset = await this.assetsService.findOne(id, householdId)
    return {
      success: true,
      data: asset,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.ASSET, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAssetSchema)) updateAssetDto: UpdateAssetDto,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<Asset>> {
    const asset = await this.assetsService.update(id, householdId, updateAssetDto)
    return {
      success: true,
      data: asset,
      message: 'Asset updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.ASSET, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.assetsService.remove(id, householdId)
    return {
      success: true,
      data: { id },
      message: 'Asset deleted successfully',
    }
  }
}
