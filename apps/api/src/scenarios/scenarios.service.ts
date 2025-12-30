import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import {
  runProjection,
  type ProjectionInput,
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
  type Scenario as EngineScenario,
  type EntityOverride,
  type FieldOverride,
  type Cents,
} from '@finance-app/finance-engine'
import { CreateScenarioDto, ScenarioOverrideDto, OverrideTargetType } from './dto'
import { UpdateScenarioDto } from './dto'
import type {
  ScenarioResponse,
  ScenarioOverrideResponse,
  ScenarioProjectionResponse,
  ScenarioComparisonResponse,
  YearlyProjectionSnapshot,
  ProjectionSummaryResponse,
} from './types'

@Injectable()
export class ScenariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(householdId: string, dto: CreateScenarioDto): Promise<ScenarioResponse> {
    await this.planLimitsService.assertCanCreateScenario(householdId)

    const scenario = await this.prisma.scenario.create({
      data: {
        householdId,
        name: dto.name,
        description: dto.description,
        isBaseline: dto.isBaseline ?? false,
        overrides: dto.overrides
          ? {
              create: dto.overrides.map((o) => this.mapOverrideToCreate(o)),
            }
          : undefined,
      },
      include: { overrides: true },
    })

    return this.mapToResponse(scenario)
  }

  async findAll(householdId: string): Promise<ScenarioResponse[]> {
    const scenarios = await this.prisma.scenario.findMany({
      where: { householdId },
      include: { overrides: true },
      orderBy: { createdAt: 'desc' },
    })

    return scenarios.map((s) => this.mapToResponse(s))
  }

  async findOne(householdId: string, id: string): Promise<ScenarioResponse> {
    const scenario = await this.prisma.scenario.findFirst({
      where: { id, householdId },
      include: { overrides: true },
    })

    if (!scenario) {
      throw new NotFoundException('Scenario not found')
    }

    return this.mapToResponse(scenario)
  }

  async update(householdId: string, id: string, dto: UpdateScenarioDto): Promise<ScenarioResponse> {
    const existing = await this.prisma.scenario.findFirst({
      where: { id, householdId },
    })

    if (!existing) {
      throw new NotFoundException('Scenario not found')
    }

    // If overrides are being updated, delete old ones and create new ones
    if (dto.overrides !== undefined) {
      await this.prisma.scenarioOverride.deleteMany({
        where: { scenarioId: id },
      })
    }

    const scenario = await this.prisma.scenario.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isBaseline: dto.isBaseline,
        overrides:
          dto.overrides !== undefined
            ? {
                create: dto.overrides.map((o) => this.mapOverrideToCreate(o)),
              }
            : undefined,
      },
      include: { overrides: true },
    })

    return this.mapToResponse(scenario)
  }

  async remove(householdId: string, id: string): Promise<void> {
    const existing = await this.prisma.scenario.findFirst({
      where: { id, householdId },
    })

    if (!existing) {
      throw new NotFoundException('Scenario not found')
    }

    await this.prisma.scenario.delete({ where: { id } })
  }

  async getProjection(
    householdId: string,
    scenarioId: string,
    horizonYears = 5,
  ): Promise<ScenarioProjectionResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

    const scenario = await this.findOne(householdId, scenarioId)

    const [assets, liabilities, cashFlowItems] = await Promise.all([
      this.prisma.asset.findMany({ where: { householdId } }),
      this.prisma.liability.findMany({ where: { householdId } }),
      this.prisma.cashFlowItem.findMany({ where: { householdId } }),
    ])

    const engineScenario = this.convertToEngineScenario(scenario)

    const projectionInput: ProjectionInput = {
      startDate: new Date(),
      horizonYears,
      assets: assets.map(
        (a): ProjectionAsset => ({
          id: a.id,
          name: a.name,
          currentValueCents: a.currentValueCents as Cents,
          annualGrowthRatePercent: a.annualGrowthRatePercent
            ? Number(a.annualGrowthRatePercent)
            : 0,
        }),
      ),
      liabilities: liabilities.map(
        (l): ProjectionLiability => ({
          id: l.id,
          name: l.name,
          currentBalanceCents: l.currentBalanceCents as Cents,
          interestRatePercent: Number(l.interestRatePercent),
          minimumPaymentCents: l.minimumPaymentCents as Cents,
          termMonths: l.termMonths ?? null,
          startDate: l.startDate,
        }),
      ),
      cashFlowItems: cashFlowItems.map(
        (c): ProjectionCashFlowItem => ({
          id: c.id,
          name: c.name,
          type: c.type,
          amountCents: c.amountCents as Cents,
          frequency: c.frequency,
          startDate: c.startDate ?? null,
          endDate: c.endDate ?? null,
          annualGrowthRatePercent: c.annualGrowthRatePercent
            ? Number(c.annualGrowthRatePercent)
            : null,
        }),
      ),
      scenario: engineScenario,
    }

    const result = runProjection(projectionInput)

    return {
      scenario,
      startDate: result.startDate,
      horizonYears: result.horizonYears,
      yearlySnapshots: result.yearlySnapshots.map(
        (s): YearlyProjectionSnapshot => ({
          year: s.year,
          date: s.date,
          totalAssetsCents: s.totalAssetsCents,
          totalLiabilitiesCents: s.totalLiabilitiesCents,
          netWorthCents: s.netWorthCents,
          totalIncomeCents: s.totalIncomeCents,
          totalExpensesCents: s.totalExpensesCents,
          debtPaymentsCents: s.debtPaymentsCents,
          netCashFlowCents: s.netCashFlowCents,
        }),
      ),
      summary: result.summary as ProjectionSummaryResponse,
    }
  }

  async compareScenarios(
    householdId: string,
    scenarioIds: string[],
    horizonYears = 5,
  ): Promise<ScenarioComparisonResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

    if (scenarioIds.length === 0) {
      throw new BadRequestException('At least one scenario ID is required')
    }

    if (scenarioIds.length > 4) {
      throw new BadRequestException('Maximum 4 scenarios can be compared at once')
    }

    const comparisons = await Promise.all(
      scenarioIds.map(async (scenarioId) => {
        const projection = await this.getProjection(householdId, scenarioId, horizonYears)
        return {
          scenario: projection.scenario,
          projection: {
            startDate: projection.startDate,
            horizonYears: projection.horizonYears,
            yearlySnapshots: projection.yearlySnapshots,
            summary: projection.summary,
          },
        }
      }),
    )

    return { comparisons }
  }

  private mapOverrideToCreate(dto: ScenarioOverrideDto) {
    const data: {
      targetType: 'asset' | 'liability' | 'cash_flow_item'
      fieldName: string
      overrideValue: string
      assetId?: string
      liabilityId?: string
      cashFlowItemId?: string
    } = {
      targetType: dto.targetType,
      fieldName: dto.fieldName,
      overrideValue: dto.value,
    }

    switch (dto.targetType) {
      case OverrideTargetType.ASSET:
        data.assetId = dto.entityId
        break
      case OverrideTargetType.LIABILITY:
        data.liabilityId = dto.entityId
        break
      case OverrideTargetType.CASH_FLOW_ITEM:
        data.cashFlowItemId = dto.entityId
        break
    }

    return data
  }

  private mapToResponse(scenario: {
    id: string
    householdId: string
    name: string
    description: string | null
    isBaseline: boolean
    createdAt: Date
    updatedAt: Date
    overrides: Array<{
      id: string
      targetType: string
      fieldName: string
      overrideValue: string
      assetId: string | null
      liabilityId: string | null
      cashFlowItemId: string | null
    }>
  }): ScenarioResponse {
    return {
      id: scenario.id,
      householdId: scenario.householdId,
      name: scenario.name,
      description: scenario.description,
      isBaseline: scenario.isBaseline,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
      overrides: scenario.overrides.map(
        (o): ScenarioOverrideResponse => ({
          id: o.id,
          targetType: o.targetType as 'asset' | 'liability' | 'cash_flow_item',
          entityId: o.assetId ?? o.liabilityId ?? o.cashFlowItemId ?? '',
          fieldName: o.fieldName,
          value: o.overrideValue,
        }),
      ),
    }
  }

  private convertToEngineScenario(scenario: ScenarioResponse): EngineScenario {
    // Group overrides by entity
    const entityOverridesMap = new Map<string, EntityOverride>()

    for (const override of scenario.overrides) {
      const key = `${override.targetType}:${override.entityId}`
      let entityOverride = entityOverridesMap.get(key)

      if (!entityOverride) {
        entityOverride = {
          entityId: override.entityId,
          targetType: override.targetType,
          overrides: [],
        }
        entityOverridesMap.set(key, entityOverride)
      }

      const fieldOverride: FieldOverride = {
        fieldName: override.fieldName,
        value: this.parseOverrideValue(override.fieldName, override.value),
      }
      entityOverride.overrides.push(fieldOverride)
    }

    return {
      id: scenario.id,
      name: scenario.name,
      description: scenario.description ?? undefined,
      isBaseline: scenario.isBaseline,
      overrides: Array.from(entityOverridesMap.values()),
    }
  }

  private parseOverrideValue(fieldName: string, value: string): unknown {
    // Parse numeric fields
    const numericFields = [
      'currentValueCents',
      'annualGrowthRatePercent',
      'currentBalanceCents',
      'interestRatePercent',
      'minimumPaymentCents',
      'termMonths',
      'amountCents',
    ]

    if (numericFields.includes(fieldName)) {
      const parsed = Number(value)
      return isNaN(parsed) ? value : parsed
    }

    // Parse date fields
    const dateFields = ['startDate', 'endDate']
    if (dateFields.includes(fieldName)) {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    // Return as string for other fields (name, type, frequency)
    return value
  }
}
