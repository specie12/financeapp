import { Test, type TestingModule } from '@nestjs/testing'
import { CalculatorsService } from '../calculators.service'
import { PrismaService } from '../../prisma/prisma.service'
import { calculateMonthlyPayment, cents } from '@finance-app/finance-engine'

describe('CalculatorsService', () => {
  let service: CalculatorsService

  const mockPrisma = {
    cashFlowItem: { findMany: jest.fn() },
    liability: { findMany: jest.fn() },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculatorsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile()

    service = module.get<CalculatorsService>(CalculatorsService)
    jest.clearAllMocks()
  })

  describe('calculatePmt', () => {
    // Reference cases. Expected values come straight from the canonical
    // engine implementation (Decimal.js, ROUND_HALF_UP). The whole point
    // of this spec is that the API and the engine never disagree.
    const cases: Array<{
      label: string
      principalCents: number
      annualRatePercent: number
      termMonths: number
    }> = [
      {
        label: '30-yr fixed at 6.5%, $300k',
        principalCents: 30_000_000,
        annualRatePercent: 6.5,
        termMonths: 360,
      },
      {
        label: '15-yr fixed at 5.0%, $150k',
        principalCents: 15_000_000,
        annualRatePercent: 5.0,
        termMonths: 180,
      },
      {
        label: '5-yr auto loan at 7%, $25k',
        principalCents: 2_500_000,
        annualRatePercent: 7,
        termMonths: 60,
      },
      {
        label: 'subprime 12%, 30-yr $200k',
        principalCents: 20_000_000,
        annualRatePercent: 12,
        termMonths: 360,
      },
      {
        label: 'zero-rate 36-mo $10k',
        principalCents: 1_000_000,
        annualRatePercent: 0,
        termMonths: 36,
      },
      {
        label: 'one-month payoff, $1k @ 5%',
        principalCents: 100_000,
        annualRatePercent: 5,
        termMonths: 1,
      },
    ]

    it.each(cases)(
      'matches engine PMT exactly for $label',
      ({ principalCents, annualRatePercent, termMonths }) => {
        const expected = calculateMonthlyPayment(
          cents(principalCents),
          annualRatePercent,
          termMonths,
        )
        const actual = service.calculatePmt({ principalCents, annualRatePercent, termMonths })
        expect(actual.monthlyPaymentCents).toBe(expected)
      },
    )

    it('rejects non-integer principal', () => {
      expect(() =>
        service.calculatePmt({ principalCents: 1234.5, annualRatePercent: 5, termMonths: 60 }),
      ).toThrow()
    })

    it('rejects zero principal (engine assertion)', () => {
      // The engine's calculateMonthlyPayment throws InvalidAmortizationInputError
      // when principal <= 0. We rely on validation upstream (Zod schema), but
      // confirm the engine still rejects defensively.
      expect(() =>
        service.calculatePmt({ principalCents: 0, annualRatePercent: 5, termMonths: 60 }),
      ).toThrow()
    })
  })
})
