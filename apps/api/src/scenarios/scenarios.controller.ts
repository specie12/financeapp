import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common'
import { ScenariosService } from './scenarios.service'
import { CreateScenarioDto, UpdateScenarioDto, CompareScenariosDto } from './dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { type ApiResponse } from '@finance-app/shared-types'
import type {
  ScenarioResponse,
  ScenarioProjectionResponse,
  ScenarioComparisonResponse,
} from './types'

@Controller('scenarios')
export class ScenariosController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Post()
  @RequirePermission(Permission.CREATE)
  async create(
    @CurrentUser('householdId') householdId: string,
    @Body() dto: CreateScenarioDto,
  ): Promise<ApiResponse<ScenarioResponse>> {
    const data = await this.scenariosService.create(householdId, dto)
    return { success: true, data }
  }

  @Get()
  @RequirePermission(Permission.READ)
  async findAll(
    @CurrentUser('householdId') householdId: string,
  ): Promise<ApiResponse<ScenarioResponse[]>> {
    const data = await this.scenariosService.findAll(householdId)
    return { success: true, data }
  }

  @Get(':id')
  @RequirePermission(Permission.READ)
  async findOne(
    @CurrentUser('householdId') householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<ScenarioResponse>> {
    const data = await this.scenariosService.findOne(householdId, id)
    return { success: true, data }
  }

  @Patch(':id')
  @RequirePermission(Permission.UPDATE)
  async update(
    @CurrentUser('householdId') householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateScenarioDto,
  ): Promise<ApiResponse<ScenarioResponse>> {
    const data = await this.scenariosService.update(householdId, id, dto)
    return { success: true, data }
  }

  @Delete(':id')
  @RequirePermission(Permission.DELETE)
  async remove(
    @CurrentUser('householdId') householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    await this.scenariosService.remove(householdId, id)
    return { success: true, data: null }
  }

  @Get(':id/projection')
  @RequirePermission(Permission.READ)
  async getProjection(
    @CurrentUser('householdId') householdId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('horizonYears') horizonYears?: string,
  ): Promise<ApiResponse<ScenarioProjectionResponse>> {
    const years = horizonYears ? parseInt(horizonYears, 10) : 5
    const data = await this.scenariosService.getProjection(householdId, id, years)
    return { success: true, data }
  }

  @Post('compare')
  @RequirePermission(Permission.READ)
  async compareScenarios(
    @CurrentUser('householdId') householdId: string,
    @Body() dto: CompareScenariosDto,
  ): Promise<ApiResponse<ScenarioComparisonResponse>> {
    const data = await this.scenariosService.compareScenarios(
      householdId,
      dto.scenarioIds,
      dto.horizonYears,
    )
    return { success: true, data }
  }
}
