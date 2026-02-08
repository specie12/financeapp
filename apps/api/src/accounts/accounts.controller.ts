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
import { AccountsService } from './accounts.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'
import { AccountQueryDto } from './dto/account-query.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import {
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
} from '@finance-app/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { ResourceId } from '../authorization/decorators/resource-id.decorator'
import { Permission, ResourceType } from '../authorization/interfaces/permission.interface'
import { type ApiResponse, type PaginatedResponse } from '@finance-app/shared-types'
import { type Account } from '@prisma/client'

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @Body(new ZodValidationPipe(createAccountSchema)) createAccountDto: CreateAccountDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Account>> {
    const account = await this.accountsService.create(userId, createAccountDto)
    return {
      success: true,
      data: account,
      message: 'Account created successfully',
    }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @Query(new ZodValidationPipe(accountQuerySchema)) query: AccountQueryDto,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResponse<Account>> {
    const { data, total, page, limit } = await this.accountsService.findAll(userId, query)
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
  @ResourceId({ type: ResourceType.ACCOUNT, idParam: 'id' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Account>> {
    const account = await this.accountsService.findOne(id, userId)
    return {
      success: true,
      data: account,
    }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  @ResourceId({ type: ResourceType.ACCOUNT, idParam: 'id' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) updateAccountDto: UpdateAccountDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<Account>> {
    const account = await this.accountsService.update(id, userId, updateAccountDto)
    return {
      success: true,
      data: account,
      message: 'Account updated successfully',
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permission.DELETE)
  @ResourceId({ type: ResourceType.ACCOUNT, idParam: 'id' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ id: string }>> {
    await this.accountsService.remove(id, userId)
    return {
      success: true,
      data: { id },
      message: 'Account deleted successfully',
    }
  }
}
