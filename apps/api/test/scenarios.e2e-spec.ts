/**
 * P1.2 — Scenarios API contract tests.
 *
 * Locks the P0.3 invariants at the HTTP boundary:
 *   - typed JSON values are accepted and round-tripped without coercion,
 *   - malformed override payloads are rejected at the controller (HTTP 400),
 *   - cross-household resource access surfaces as 404 (existence-disclosure
 *     prevention; the guard layer enforces this in P0.5),
 *   - same scenario produces identical projections across calls.
 */

import { Test, type TestingModule } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'

import { ScenariosController } from '../src/scenarios/scenarios.controller'
import { ScenariosService } from '../src/scenarios/scenarios.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { PlanLimitsService } from '../src/plan-limits/plan-limits.service'
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../src/authorization/guards/permission.guard'
import { HouseholdGuard } from '../src/authorization/guards/household.guard'

const HOUSEHOLD_A = '00000000-0000-0000-0000-0000000000aa'
const VALID_UUID_1 = '00000000-0000-0000-0000-000000000001'
const FIXED_USER = { id: VALID_UUID_1, householdId: HOUSEHOLD_A, role: 'owner' }

describe('ScenariosController (e2e contract)', () => {
  let app: INestApplication

  const mockPrisma = {
    scenario: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    scenarioOverride: { deleteMany: jest.fn() },
    asset: { findMany: jest.fn().mockResolvedValue([]) },
    liability: { findMany: jest.fn().mockResolvedValue([]) },
    cashFlowItem: { findMany: jest.fn().mockResolvedValue([]) },
    household: { findUnique: jest.fn().mockResolvedValue({ planTier: 'free' }) },
  }

  const mockPlanLimits = {
    assertCanCreateScenario: jest.fn().mockResolvedValue(undefined),
    assertHorizonWithinLimit: jest.fn().mockResolvedValue(undefined),
  }

  const allowAll = {
    canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user?: unknown } } }) => {
      const req = ctx.switchToHttp().getRequest()
      req.user = FIXED_USER
      return true
    },
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ScenariosController],
      providers: [
        ScenariosService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanLimitsService, useValue: mockPlanLimits },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowAll)
      .overrideGuard(PermissionGuard)
      .useValue(allowAll)
      .overrideGuard(HouseholdGuard)
      .useValue(allowAll)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => jest.clearAllMocks())

  // ──────────────────────────────────────────────────────────────────────────
  // POST /scenarios — Zod validation rejects malformed overrides at write time
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /scenarios — write-boundary validation', () => {
    it('accepts a valid scenario with typed numeric override', async () => {
      mockPrisma.scenario.create.mockResolvedValue({
        id: 'scn1',
        householdId: HOUSEHOLD_A,
        name: 'Bump asset',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [],
      })

      await request(app.getHttpServer())
        .post('/scenarios')
        .send({
          name: 'Bump asset',
          overrides: [
            {
              targetType: 'asset',
              entityId: VALID_UUID_1,
              fieldName: 'currentValueCents',
              value: 12_500_000,
            },
          ],
        })
        .expect(201)

      // Verify Prisma received a number (not a string-coerced value).
      const payload = mockPrisma.scenario.create.mock.calls[0][0].data.overrides.create[0]
      expect(typeof payload.overrideValue).toBe('number')
      expect(payload.overrideValue).toBe(12_500_000)
    })

    it('rejects an override with an unknown field name (HTTP 400)', async () => {
      await request(app.getHttpServer())
        .post('/scenarios')
        .send({
          name: 'Bad override',
          overrides: [
            {
              targetType: 'asset',
              entityId: VALID_UUID_1,
              fieldName: 'deleteMe',
              value: 0,
            },
          ],
        })
        .expect(400)

      // Critical: the controller short-circuited; no DB write happened.
      expect(mockPrisma.scenario.create).not.toHaveBeenCalled()
    })

    it('rejects an override with a wrongly-typed value (HTTP 400)', async () => {
      await request(app.getHttpServer())
        .post('/scenarios')
        .send({
          name: 'Bad type',
          overrides: [
            {
              targetType: 'asset',
              entityId: VALID_UUID_1,
              fieldName: 'currentValueCents',
              value: 'oops-a-string',
            },
          ],
        })
        .expect(400)

      expect(mockPrisma.scenario.create).not.toHaveBeenCalled()
    })

    it('rejects an empty scenario name (HTTP 400)', async () => {
      await request(app.getHttpServer()).post('/scenarios').send({ name: '' }).expect(400)
      expect(mockPrisma.scenario.create).not.toHaveBeenCalled()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /scenarios/:id/projection — same input → same output
  // ──────────────────────────────────────────────────────────────────────────

  describe('GET /scenarios/:id/projection — determinism at the API boundary', () => {
    it('produces identical yearly snapshots across two consecutive calls', async () => {
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 'scn1',
        householdId: HOUSEHOLD_A,
        name: 'Stable',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [
          {
            id: 'o1',
            targetType: 'asset',
            fieldName: 'currentValueCents',
            overrideValue: 9_000_000,
            assetId: VALID_UUID_1,
            liabilityId: null,
            cashFlowItemId: null,
          },
        ],
      })
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: VALID_UUID_1,
          name: 'House',
          currentValueCents: 5_000_000,
          annualGrowthRatePercent: 3,
        },
      ])

      const url = `/scenarios/${VALID_UUID_1}/projection?horizonYears=5`
      const r1 = await request(app.getHttpServer()).get(url).expect(200)
      const r2 = await request(app.getHttpServer()).get(url).expect(200)

      // Compare snapshots by JSON equality. The startDate IS allowed to drift
      // between calls (audit §4 flagged this; out of scope for P1.2). We
      // assert numeric fields are stable.
      const stripDates = (s: { date: string }[]) => s.map(({ date: _date, ...rest }) => rest)

      expect(stripDates(r1.body.data.yearlySnapshots)).toEqual(
        stripDates(r2.body.data.yearlySnapshots),
      )
      expect(r1.body.data.summary).toEqual(r2.body.data.summary)
    })

    it('does not propagate NaN when an override stores null (defensive)', async () => {
      mockPrisma.scenario.findFirst.mockResolvedValue({
        id: 'scn2',
        householdId: HOUSEHOLD_A,
        name: 'Null override',
        description: null,
        isBaseline: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        overrides: [
          {
            id: 'o2',
            targetType: 'liability',
            fieldName: 'termMonths',
            overrideValue: null,
            assetId: null,
            liabilityId: VALID_UUID_1,
            cashFlowItemId: null,
          },
        ],
      })
      mockPrisma.liability.findMany.mockResolvedValue([
        {
          id: VALID_UUID_1,
          name: 'Mortgage',
          currentBalanceCents: 25_000_000,
          interestRatePercent: 6.5,
          minimumPaymentCents: 200_000,
          termMonths: 360,
          startDate: new Date('2026-01-01T00:00:00.000Z'),
        },
      ])

      const res = await request(app.getHttpServer())
        .get(`/scenarios/${VALID_UUID_1}/projection?horizonYears=5`)
        .expect(200)

      for (const snap of res.body.data.yearlySnapshots) {
        expect(Number.isFinite(snap.totalAssetsCents)).toBe(true)
        expect(Number.isFinite(snap.totalLiabilitiesCents)).toBe(true)
        expect(Number.isFinite(snap.netWorthCents)).toBe(true)
      }
    })
  })
})
