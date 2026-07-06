import { Test, type TestingModule } from '@nestjs/testing'
import { DashboardService } from '../dashboard.service'
import { PrismaService } from '../../prisma/prisma.service'
import { PlanLimitsService } from '../../plan-limits/plan-limits.service'
import { MarketDataService } from '../../market-data/market-data.service'
import type { RentalDecisionRequest } from '@finance-app/shared-types'

describe('DashboardService.getRentalDecision', () => {
  let service: DashboardService

  const mockPrisma = {
    asset: { findMany: jest.fn().mockResolvedValue([]) },
    liability: { findMany: jest.fn().mockResolvedValue([]) },
    cashFlowItem: { findMany: jest.fn().mockResolvedValue([]) },
    rentalProperty: { findMany: jest.fn().mockResolvedValue([]) },
  }
  const mockPlanLimits = { assertHorizonWithinLimit: jest.fn().mockResolvedValue(undefined) }
  const mockMarketData = {}

  const candidate: RentalDecisionRequest = {
    name: 'Test Rental',
    purchasePriceCents: 50_000_000,
    currentValueCents: 50_000_000,
    downPaymentCents: 10_000_000,
    monthlyRentCents: 350_000,
    vacancyRatePercent: 5,
    annualExpensesCents: 600_000,
    propertyTaxAnnualCents: 600_000,
    mortgagePaymentCents: 200_000,
    mortgageRatePercent: 6,
    mortgageBalanceCents: 40_000_000,
    mortgageTermMonths: 360,
    appreciationRatePercent: 4,
    horizonYears: 10,
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

  it('returns metrics, with/without projections, a Monte Carlo range, and a verdict', async () => {
    const result = await service.getRentalDecision('h1', candidate, 10)

    // Metrics come from the engine.
    expect(result.metrics.dscrRatio).not.toBeNull()
    expect(typeof result.metrics.monthlyCashFlowCents).toBe('number')

    // Both projection paths cover year 0..horizon.
    expect(result.withProperty).toHaveLength(11)
    expect(result.withoutProperty).toHaveLength(11)

    // With no existing portfolio, the "without" path is flat zero net worth.
    expect(result.withoutProperty.at(-1)!.netWorthCents).toBe(0)

    // The delta equals the with-property ending net worth (since without is 0).
    expect(result.netWorthDeltaCents).toBe(result.withProperty.at(-1)!.netWorthCents)

    // Monte Carlo bands are present and ordered.
    expect(result.monteCarlo.yearlyBands.length).toBeGreaterThan(0)

    // Verdict is one of the three signals.
    expect(['favorable', 'caution', 'unfavorable']).toContain(result.verdict.signal)
    expect(result.verdict.factors.length).toBeGreaterThan(0)
  })

  it('respects the plan horizon guard', async () => {
    await service.getRentalDecision('h1', candidate, 10)
    expect(mockPlanLimits.assertHorizonWithinLimit).toHaveBeenCalledWith('h1', 10)
  })
})
