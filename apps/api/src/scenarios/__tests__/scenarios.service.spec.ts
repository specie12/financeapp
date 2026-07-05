import { Test, type TestingModule } from '@nestjs/testing'
import { ScenariosService } from '../scenarios.service'
import { PrismaService } from '../../prisma/prisma.service'
import { PlanLimitsService } from '../../plan-limits/plan-limits.service'
import { OverrideTargetType } from '../dto'

/**
 * P0.3 — scenario override write-boundary integrity.
 *
 * Validation moved from runtime (engine) to write-time (Zod). Bad inputs
 * never reach the database, and stored values keep their typed shape
 * end-to-end. These tests lock the service-layer half of that contract.
 *
 * Schema validation itself is exercised against `createScenarioSchema` /
 * `updateScenarioSchema` from `@finance-app/validation`.
 */
describe('ScenariosService — typed override storage (P0.3)', () => {
  let service: ScenariosService

  const mockPrisma = {
    scenario: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scenarioOverride: { deleteMany: jest.fn() },
    asset: { findMany: jest.fn().mockResolvedValue([]) },
    liability: { findMany: jest.fn().mockResolvedValue([]) },
    cashFlowItem: { findMany: jest.fn().mockResolvedValue([]) },
    rentalProperty: { findMany: jest.fn().mockResolvedValue([]) },
  }

  const mockPlanLimits = {
    assertCanCreateScenario: jest.fn().mockResolvedValue(undefined),
    assertHorizonWithinLimit: jest.fn().mockResolvedValue(undefined),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenariosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanLimitsService, useValue: mockPlanLimits },
      ],
    }).compile()

    service = module.get<ScenariosService>(ScenariosService)
    jest.clearAllMocks()
  })

  describe('create — write-time persistence preserves typed JSON', () => {
    it('writes a numeric override as a number on the JSON column', async () => {
      mockPrisma.scenario.create.mockResolvedValue({
        id: 's1',
        householdId: 'h1',
        name: 'What if we sell the car?',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [],
      })

      await service.create('h1', {
        name: 'What if we sell the car?',
        overrides: [
          {
            targetType: OverrideTargetType.ASSET,
            entityId: '00000000-0000-0000-0000-000000000001',
            fieldName: 'currentValueCents',
            value: 12_500_000, // typed number, not a string
          },
        ],
      })

      const passed = mockPrisma.scenario.create.mock.calls[0]?.[0]
      const payload = passed.data.overrides.create[0]
      expect(passed.data.householdId).toBe('h1')
      expect(payload.fieldName).toBe('currentValueCents')
      expect(payload.targetType).toBe('asset')
      // Critical invariant: the value retains its numeric type — no string
      // round-trip, no Number(value) coercion at projection time.
      expect(payload.overrideValue).toBe(12_500_000)
      expect(typeof payload.overrideValue).toBe('number')
      expect(payload.assetId).toBe('00000000-0000-0000-0000-000000000001')
    })

    it('writes a string override (name) as a string on the JSON column', async () => {
      mockPrisma.scenario.create.mockResolvedValue({
        id: 's2',
        householdId: 'h1',
        name: 'Rename test',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [],
      })

      await service.create('h1', {
        name: 'Rename test',
        overrides: [
          {
            targetType: OverrideTargetType.LIABILITY,
            entityId: '00000000-0000-0000-0000-000000000002',
            fieldName: 'name',
            value: 'Refinanced mortgage',
          },
        ],
      })

      const payload = mockPrisma.scenario.create.mock.calls[0][0].data.overrides.create[0]
      expect(payload.overrideValue).toBe('Refinanced mortgage')
      expect(typeof payload.overrideValue).toBe('string')
      expect(payload.liabilityId).toBe('00000000-0000-0000-0000-000000000002')
    })

    it('writes a null override (e.g. termMonths cleared) as null on the JSON column', async () => {
      mockPrisma.scenario.create.mockResolvedValue({
        id: 's3',
        householdId: 'h1',
        name: 'No-term loan',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [],
      })

      await service.create('h1', {
        name: 'No-term loan',
        overrides: [
          {
            targetType: OverrideTargetType.LIABILITY,
            entityId: '00000000-0000-0000-0000-000000000003',
            fieldName: 'termMonths',
            value: null,
          },
        ],
      })

      const payload = mockPrisma.scenario.create.mock.calls[0][0].data.overrides.create[0]
      expect(payload.overrideValue).toBeNull()
    })
  })

  describe('getProjection — typed values flow through to the engine', () => {
    it('hands a numeric override to the engine without coercion', async () => {
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 's1',
        householdId: 'h1',
        name: 'Bumped asset',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [
          {
            id: 'o1',
            targetType: 'asset',
            fieldName: 'currentValueCents',
            overrideValue: 9_000_000, // already a number on the JSON column
            assetId: '00000000-0000-0000-0000-000000000001',
            liabilityId: null,
            cashFlowItemId: null,
          },
        ],
      })

      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'House',
          currentValueCents: 5_000_000,
          annualGrowthRatePercent: 3,
        },
      ])

      const result = await service.getProjection('h1', 's1', 5)
      // Year 0: override applied → asset value should equal the override.
      const yearZero = result.yearlySnapshots[0]
      expect(yearZero?.totalAssetsCents).toBe(9_000_000)
    })

    it('converts ISO date strings to Date objects only at the engine boundary', async () => {
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 's4',
        householdId: 'h1',
        name: 'Delayed income',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [
          {
            id: 'o2',
            targetType: 'cash_flow_item',
            fieldName: 'startDate',
            overrideValue: '2030-01-01T00:00:00.000Z',
            assetId: null,
            liabilityId: null,
            cashFlowItemId: '00000000-0000-0000-0000-000000000010',
          },
        ],
      })

      mockPrisma.cashFlowItem.findMany.mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000010',
          name: 'Salary',
          type: 'income',
          amountCents: 1_000_000,
          frequency: 'monthly',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          annualGrowthRatePercent: null,
        },
      ])

      const result = await service.getProjection('h1', 's4', 5)
      // The cash flow's startDate is overridden to 2030, so income in year 0
      // (which begins at projection start = now) should be zero.
      const yearZero = result.yearlySnapshots[0]
      expect(yearZero?.totalIncomeCents).toBe(0)
    })

    it('returns null Date when an override stores a malformed date string (defensive)', async () => {
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 's5',
        householdId: 'h1',
        name: 'Legacy bad date',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [
          {
            id: 'o3',
            targetType: 'cash_flow_item',
            fieldName: 'startDate',
            overrideValue: 'not-a-date',
            assetId: null,
            liabilityId: null,
            cashFlowItemId: '00000000-0000-0000-0000-000000000020',
          },
        ],
      })

      mockPrisma.cashFlowItem.findMany.mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000020',
          name: 'Salary',
          type: 'income',
          amountCents: 1_000_000,
          frequency: 'monthly',
          startDate: new Date('2026-01-01T00:00:00.000Z'),
          endDate: null,
          annualGrowthRatePercent: null,
        },
      ])

      // Should not throw, and the projection should still run with startDate=null.
      await expect(service.getProjection('h1', 's5', 5)).resolves.toBeDefined()
    })
  })
})
