import { Test, type TestingModule } from '@nestjs/testing'
import { DashboardService } from '../dashboard.service'
import { PrismaService } from '../../prisma/prisma.service'
import { PlanLimitsService } from '../../plan-limits/plan-limits.service'
import { MarketDataService } from '../../market-data/market-data.service'

/**
 * Regression suite for P0.4 — fabricated investment outputs.
 *
 * The dashboard previously defaulted cost basis to current value (every holding
 * showed "0% gain") and invented per-asset-type dividend yields (4% on bank
 * accounts, 2% on retirement). Both have been removed. This suite locks the
 * invariant that missing inputs surface as `null`, never as a number.
 */
describe('DashboardService — no fabricated outputs (P0.4)', () => {
  let service: DashboardService

  const mockPrisma = {
    asset: { findMany: jest.fn() },
    liability: { findMany: jest.fn() },
    cashFlowItem: { findMany: jest.fn() },
    goal: { findMany: jest.fn() },
    budget: { findMany: jest.fn() },
    transaction: { aggregate: jest.fn() },
  }

  const mockPlanLimits = {
    assertHorizonWithinLimit: jest.fn().mockResolvedValue(undefined),
  }

  const mockMarketData = {
    getMultipleTickerData: jest.fn().mockResolvedValue([]),
    calculatePortfolioPerformance: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanLimitsService, useValue: mockPlanLimits },
        { provide: MarketDataService, useValue: mockMarketData },
      ],
    }).compile()

    service = module.get<DashboardService>(DashboardService)
    jest.clearAllMocks()
  })

  // ──────────────────────────────────────────────────────────────────────────
  // getInvestments — cost basis nullability
  // ──────────────────────────────────────────────────────────────────────────

  describe('getInvestments', () => {
    it('returns null gain/loss when an asset has no cost basis', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'Brokerage',
          type: 'investment',
          currentValueCents: 5_000_000,
          costBasisCents: null,
        },
      ])

      const result = await service.getInvestments('h1')

      expect(result.holdings[0]).toMatchObject({
        id: 'a1',
        valueCents: 5_000_000,
        costBasisCents: null,
        gainLossCents: null,
        gainLossPercent: null,
      })
    })

    it('computes gain/loss correctly when cost basis is set', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'Brokerage',
          type: 'investment',
          currentValueCents: 5_000_000,
          costBasisCents: 4_000_000,
        },
      ])

      const result = await service.getInvestments('h1')

      expect(result.holdings[0]).toMatchObject({
        valueCents: 5_000_000,
        costBasisCents: 4_000_000,
        gainLossCents: 1_000_000,
        gainLossPercent: 25, // (1_000_000 / 4_000_000) * 100
      })
    })

    it('returns null portfolio totals when ANY holding lacks cost basis', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'Set',
          type: 'investment',
          currentValueCents: 1_000_000,
          costBasisCents: 800_000,
        },
        {
          id: 'a2',
          name: 'Unset',
          type: 'investment',
          currentValueCents: 500_000,
          costBasisCents: null,
        },
      ])

      const result = await service.getInvestments('h1')

      expect(result.summary.totalValueCents).toBe(1_500_000)
      expect(result.summary.totalCostBasisCents).toBeNull()
      expect(result.summary.unrealizedGainCents).toBeNull()
      expect(result.summary.unrealizedGainPercent).toBeNull()
      expect(result.summary.totalReturnCents).toBeNull()
      expect(result.summary.totalReturnPercent).toBeNull()
    })

    it('computes portfolio totals when all holdings have cost basis', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([
        {
          id: 'a1',
          name: 'A',
          type: 'investment',
          currentValueCents: 1_000_000,
          costBasisCents: 800_000,
        },
        {
          id: 'a2',
          name: 'B',
          type: 'investment',
          currentValueCents: 500_000,
          costBasisCents: 400_000,
        },
      ])

      const result = await service.getInvestments('h1')

      expect(result.summary.totalValueCents).toBe(1_500_000)
      expect(result.summary.totalCostBasisCents).toBe(1_200_000)
      expect(result.summary.unrealizedGainCents).toBe(300_000)
      expect(result.summary.unrealizedGainPercent).toBe(25)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // getEnhancedInvestments — dividend yield nullability
  // ──────────────────────────────────────────────────────────────────────────

  describe('getEnhancedInvestments', () => {
    it('returns null dividend fields when no asset has yield configured', async () => {
      // getInvestments runs first; mock with one investment, no cost basis.
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
      mockPrisma.goal.findMany.mockResolvedValue([])

      const result = await service.getEnhancedInvestments('h1')

      const projection = result.dividendProjections.find((p) => p.assetId === 'a1')
      expect(projection).toBeDefined()
      expect(projection?.yieldPercent).toBeNull()
      expect(projection?.annualDividendCents).toBeNull()
      expect(projection?.monthlyDividendCents).toBeNull()
      expect(projection?.isCustomYield).toBe(false)

      expect(result.totalAnnualDividendsCents).toBeNull()
      expect(result.totalMonthlyDividendsCents).toBeNull()
      expect(result.dividendsPartial).toBe(true)
    })

    it('does not invent default yields by asset type', async () => {
      // Previously bank_account defaulted to 4% and retirement to 2%.
      // After P0.4 those defaults are gone — yield must be `null`.
      mockPrisma.asset.findMany
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Retirement',
            type: 'retirement_account',
            currentValueCents: 100_000_000,
            costBasisCents: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Retirement',
            type: 'retirement_account',
            currentValueCents: 100_000_000,
            dividendYieldPercent: null,
          },
        ])
      mockPrisma.goal.findMany.mockResolvedValue([])

      const result = await service.getEnhancedInvestments('h1')

      const projection = result.dividendProjections[0]
      expect(projection?.yieldPercent).toBeNull()
      expect(projection?.annualDividendCents).toBeNull()
    })

    it('computes dividends and totals correctly when all assets have configured yields', async () => {
      mockPrisma.asset.findMany
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Brokerage',
            type: 'investment',
            currentValueCents: 100_000_000,
            costBasisCents: 90_000_000,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Brokerage',
            type: 'investment',
            currentValueCents: 100_000_000,
            dividendYieldPercent: 3.0,
          },
        ])
      mockPrisma.goal.findMany.mockResolvedValue([])

      const result = await service.getEnhancedInvestments('h1')

      const p = result.dividendProjections[0]
      expect(p?.yieldPercent).toBe(3)
      expect(p?.isCustomYield).toBe(true)
      // 3% of $1,000,000 = $30,000 annual = 3_000_000 cents
      expect(p?.annualDividendCents).toBe(3_000_000)
      // $30,000 / 12 = $2,500/mo = 250_000 cents
      expect(p?.monthlyDividendCents).toBe(250_000)
      expect(result.totalAnnualDividendsCents).toBe(3_000_000)
      expect(result.totalMonthlyDividendsCents).toBe(250_000)
      expect(result.dividendsPartial).toBe(false)
    })

    it('marks totals partial and sums only configured assets in mixed scenarios', async () => {
      mockPrisma.asset.findMany
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Brokerage',
            type: 'investment',
            currentValueCents: 100_000_000,
            costBasisCents: null,
          },
          {
            id: 'a2',
            name: 'Bank',
            type: 'bank_account',
            currentValueCents: 50_000_000,
            costBasisCents: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'a1',
            name: 'Brokerage',
            type: 'investment',
            currentValueCents: 100_000_000,
            dividendYieldPercent: 2,
          },
          {
            id: 'a2',
            name: 'Bank',
            type: 'bank_account',
            currentValueCents: 50_000_000,
            dividendYieldPercent: null,
          },
        ])
      mockPrisma.goal.findMany.mockResolvedValue([])

      const result = await service.getEnhancedInvestments('h1')

      // Only Brokerage contributes: 2% of $1,000,000 = $20,000/yr = 2,000,000 cents
      expect(result.totalAnnualDividendsCents).toBe(2_000_000)
      expect(result.dividendsPartial).toBe(true)

      const bank = result.dividendProjections.find((p) => p.assetId === 'a2')
      expect(bank?.yieldPercent).toBeNull()
      expect(bank?.annualDividendCents).toBeNull()
    })
  })
})
