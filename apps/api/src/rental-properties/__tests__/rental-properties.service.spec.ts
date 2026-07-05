import { Test, type TestingModule } from '@nestjs/testing'
import type { RentalProperty } from '@prisma/client'
import { RentalPropertiesService } from '../rental-properties.service'
import { PrismaService } from '../../prisma/prisma.service'

function makeRental(overrides: Partial<RentalProperty> = {}): RentalProperty {
  return {
    id: 'r1',
    householdId: 'h1',
    name: 'Maple St',
    address: null,
    purchasePriceCents: 40_000_000,
    currentValueCents: 50_000_000,
    downPaymentCents: 10_000_000,
    monthlyRentCents: 300_000,
    vacancyRatePercent: 5,
    annualExpensesCents: 600_000,
    propertyTaxAnnualCents: 600_000,
    mortgagePaymentCents: 200_000,
    mortgageRatePercent: 6,
    appreciationRatePercent: null,
    linkedAssetId: null,
    linkedLiabilityId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  } as unknown as RentalProperty
}

describe('RentalPropertiesService', () => {
  let service: RentalPropertiesService

  const mockPrisma = {
    rentalProperty: { findMany: jest.fn() },
    liability: { findMany: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RentalPropertiesService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get<RentalPropertiesService>(RentalPropertiesService)
    jest.clearAllMocks()
  })

  describe('calculateMetrics — thin adapter over the engine', () => {
    it('returns the engine-computed metrics', () => {
      const metrics = service.calculateMetrics(makeRental())
      expect(metrics.noiCents).toBe(2_220_000)
      expect(metrics.capRatePercent).toBe(4.44)
      expect(metrics.cashOnCashReturnPercent).toBe(-1.8)
      expect(metrics.grossRentMultiplier).toBe(13.89)
      expect(metrics.dscrRatio).toBe(0.93)
      expect(metrics.property.id).toBe('r1')
    })
  })

  describe('getPortfolioSummary — equity accuracy', () => {
    it('uses the linked liability real balance for equity', async () => {
      mockPrisma.rentalProperty.findMany.mockResolvedValue([
        makeRental({ linkedLiabilityId: 'liab-1' }),
      ])
      mockPrisma.liability.findMany.mockResolvedValue([
        { id: 'liab-1', currentBalanceCents: 30_000_000 },
      ])

      const summary = await service.getPortfolioSummary('h1')

      // Equity = value (50M) − real balance (30M) = 20M, NOT the
      // value − downPayment proxy (which would be 40M debt → 10M equity).
      expect(summary.totalEquityCents).toBe(20_000_000)
    })

    it('falls back to the value − downPayment proxy for unlinked mortgaged rentals', async () => {
      mockPrisma.rentalProperty.findMany.mockResolvedValue([makeRental()])
      mockPrisma.liability.findMany.mockResolvedValue([])

      const summary = await service.getPortfolioSummary('h1')

      // Proxy debt = 50M − 10M = 40M → equity = 10M.
      expect(summary.totalEquityCents).toBe(10_000_000)
    })

    it('treats an unmortgaged rental as debt-free', async () => {
      mockPrisma.rentalProperty.findMany.mockResolvedValue([
        makeRental({ mortgagePaymentCents: null }),
      ])
      mockPrisma.liability.findMany.mockResolvedValue([])

      const summary = await service.getPortfolioSummary('h1')

      expect(summary.totalEquityCents).toBe(50_000_000)
    })
  })
})
