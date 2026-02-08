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
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CategoryQueryDto } from './dto/category-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Category } from '@prisma/client'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createCategorySchema)) createCategoryDto: CreateCategoryDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.create(userId, createCategoryDto)
    return {
      success: true,
      data: category,
      message: 'Category created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(categoryQuerySchema)) query: CategoryQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResponse<Category>> {
    const { data, total, page, limit } = await this.categoriesService.findAll(userId, query)
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
  @ResourceId({ type: ResourceType.CATEGORY, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.findOne(id, userId)
    return {
      success: true,
      data: category,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.CATEGORY, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) updateCategoryDto: UpdateCategoryDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Category>> {
    const category = await this.categoriesService.update(id, userId, updateCategoryDto)
    return {
      success: true,
      data: category,
      message: 'Category updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.CATEGORY, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.categoriesService.remove(id, userId)
    return {
      success: true,
      data: { id },
      message: 'Category deleted successfully',
    }
  }
}
