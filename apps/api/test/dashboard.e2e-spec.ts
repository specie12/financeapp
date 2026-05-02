/**
 * P1.2 — Dashboard API contract tests.
 *
 * Verifies the no-fabrication invariants from P0.4 at the HTTP boundary
 * and that loan amortization PMT matches the canonical engine.
 */

import { Test, type TestingModule } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { calculateMonthlyPayment, cents } from '@finance-app/finance-engine'

import { DashboardController } from '../src/dashboard/dashboard.controller'
import { DashboardService } from '../src/dashboard/dashboard.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { PlanLimitsService } from '../src/plan-limits/plan-limits.service'
import { MarketDataService } from '../src/market-data/market-data.service'
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../src/authorization/guards/permission.guard'
import { HouseholdGuard } from '../src/authorization/guards/household.guard'

const HOUSEHOLD_A = '00000000-0000-0000-0000-0000000000aa'
const FIXED_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  householdId: HOUSEHOLD_A,
  role: 'owner',
}

describe('DashboardController (e2e contract)', () => {
  let app: INestApplication

  const mockPrisma = {
    asset: { findMany: jest.fn() },
    liability: { findMany: jest.fn() },
    cashFlowItem: { findMany: jest.fn() },
    goal: { findMany: jest.fn().mockResolvedValue([]) },
    budget: { findMany: jest.fn().mockResolvedValue([]) },
    transaction: { aggregate: jest.fn() },
  }

  const mockPlanLimits = { assertHorizonWithinLimit: jest.fn().mockResolvedValue(undefined) }
  const mockMarketData = {
    getMultipleTickerData: jest.fn().mockResolvedValue([]),
    calculatePortfolioPerformance: jest.fn(),
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
      controllers: [DashboardController],
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanLimitsService, useValue: mockPlanLimits },
        { provide: MarketDataService, useValue: mockMarketData },
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
  // GET /dashboard/investments — no fabricated values
  // ──────────────────────────────────────────────────────────────────────────

  describe('GET /dashboard/investments', () => {
    it('returns null cost basis / gain when an asset has no cost basis set', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'Brokerage',
          type: 'investment',
          currentValueCents: 5_000_000,
          costBasisCents: null,
        },
      ])

      const res = await request(app.getHttpServer()).get('/dashboard/investments').expect(200)

      const holding = res.body.data.holdings[0]
      // The API MUST NOT fabricate a 0% gain when cost basis is missing.
      expect(holding.costBasisCents).toBeNull()
      expect(holding.gainLossCents).toBeNull()
      expect(holding.gainLossPercent).toBeNull()

      // Aggregate totals also surface null when ANY holding lacks cost basis.
      expect(res.body.data.summary.totalCostBasisCents).toBeNull()
      expect(res.body.data.summary.unrealizedGainCents).toBeNull()
    })

    it('returns computed gain/loss when cost basis is configured', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'Brokerage',
          type: 'investment',
          currentValueCents: 5_000_000,
          costBasisCents: 4_000_000,
        },
      ])

      const res = await request(app.getHttpServer()).get('/dashboard/investments').expect(200)

      const holding = res.body.data.holdings[0]
      expect(holding.gainLossCents).toBe(1_000_000)
      expect(holding.gainLossPercent).toBe(25)
      expect(res.body.data.summary.unrealizedGainPercent).toBe(25)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /dashboard/investments/enhanced — no fabricated yields
  // ──────────────────────────────────────────────────────────────────────────

  describe('GET /dashboard/investments/enhanced', () => {
    it('returns null dividend fields when no asset has yield configured', async () => {
      // First call: getInvestments. Second call: getEnhancedInvestments asset list.
      mockPrisma.asset.findMany
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Bank Savings',
            type: 'bank_account',
            currentValueCents: 10_000_000,
            costBasisCents: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Bank Savings',
            type: 'bank_account',
            currentValueCents: 10_000_000,
            dividendYieldPercent: null,
          },
        ])

      const res = await request(app.getHttpServer())
        .get('/dashboard/investments/enhanced')
        .expect(200)

      // Previously the service defaulted bank_account to 4% yield; that is
      // gone. Confirm the API surface reflects the removal.
      const projection = res.body.data.dividendProjections[0]
      expect(projection.yieldPercent).toBeNull()
      expect(projection.annualDividendCents).toBeNull()
      expect(projection.monthlyDividendCents).toBeNull()
      expect(projection.isCustomYield).toBe(false)

      expect(res.body.data.totalAnnualDividendsCents).toBeNull()
      expect(res.body.data.totalMonthlyDividendsCents).toBeNull()
      expect(res.body.data.dividendsPartial).toBe(true)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // GET /dashboard/loans/:id/amortization — PMT parity with canonical engine
  // ──────────────────────────────────────────────────────────────────────────

  describe('GET /dashboard/loans/:id/amortization', () => {
    it('returns a monthlyPaymentCents that exactly matches engine PMT', async () => {
      const principalCents = 30_000_000
      const annualRatePercent = 6.5
      const termMonths = 360

      mockPrisma.liability.findFirst = jest.fn().mockResolvedValue({
        id: 'l1',
        householdId: HOUSEHOLD_A,
        name: 'Mortgage',
        type: 'mortgage',
        principalCents,
        currentBalanceCents: principalCents,
        interestRatePercent: annualRatePercent,
        minimumPaymentCents: 200_000,
        termMonths,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      })

      const res = await request(app.getHttpServer())
        .get('/dashboard/loans/00000000-0000-0000-0000-000000000aaa/amortization')
        .expect(200)

      const expected = calculateMonthlyPayment(cents(principalCents), annualRatePercent, termMonths)
      expect(res.body.data.monthlyPaymentCents).toBe(expected)
    })
  })
})
