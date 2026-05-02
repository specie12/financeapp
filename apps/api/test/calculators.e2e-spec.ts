/**
 * P1.2 — Calculators API contract tests.
 *
 * Mounts the CalculatorsController with mocked Prisma and bypassed auth
 * guards. Asserts:
 *   - the API output equals the canonical finance-engine output for the
 *     same input, byte-exact (no API-side coercion or rounding drift),
 *   - the Zod validation pipe rejects malformed input with HTTP 400,
 *   - no endpoint returns fabricated financial values.
 */

import { Test, type TestingModule } from '@nestjs/testing'
import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  calculateMonthlyPayment,
  calculateRentVsBuy,
  calculateMortgageVsInvest,
  cents,
} from '@finance-app/finance-engine'

import { CalculatorsController } from '../src/calculators/calculators.controller'
import { CalculatorsService } from '../src/calculators/calculators.service'
import { PrismaService } from '../src/prisma/prisma.service'
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard'
import { PermissionGuard } from '../src/authorization/guards/permission.guard'
import { HouseholdGuard } from '../src/authorization/guards/household.guard'

const FIXED_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  householdId: '00000000-0000-0000-0000-0000000000aa',
  role: 'owner',
}

describe('CalculatorsController (e2e contract)', () => {
  let app: INestApplication

  // Mock Prisma — calculateAffordability reads cashFlowItems + liabilities.
  const mockPrisma = {
    cashFlowItem: { findMany: jest.fn().mockResolvedValue([]) },
    liability: { findMany: jest.fn().mockResolvedValue([]) },
  }

  // Auto-allow auth guards so the contract focuses on validation + math.
  // Guard behavior itself is locked by the unit tests in P0.5.
  const allowAll = {
    canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user?: unknown } } }) => {
      const req = ctx.switchToHttp().getRequest()
      req.user = FIXED_USER
      return true
    },
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CalculatorsController],
      providers: [CalculatorsService, { provide: PrismaService, useValue: mockPrisma }],
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

  // ──────────────────────────────────────────────────────────────────────────
  // POST /calculators/pmt
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /calculators/pmt', () => {
    const cases = [
      { principalCents: 30_000_000, annualRatePercent: 6.5, termMonths: 360 },
      { principalCents: 15_000_000, annualRatePercent: 5, termMonths: 180 },
      { principalCents: 1_000_000, annualRatePercent: 0, termMonths: 36 },
    ]

    it.each(cases)(
      'API output equals engine output for principal=$principalCents rate=$annualRatePercent term=$termMonths',
      async ({ principalCents, annualRatePercent, termMonths }) => {
        const expected = calculateMonthlyPayment(
          cents(principalCents),
          annualRatePercent,
          termMonths,
        )

        const res = await request(app.getHttpServer())
          .post('/calculators/pmt')
          .send({ principalCents, annualRatePercent, termMonths })
          .expect(201)

        expect(res.body).toEqual({
          success: true,
          data: { monthlyPaymentCents: expected },
        })
      },
    )

    it('rejects non-integer principal with HTTP 400', async () => {
      await request(app.getHttpServer())
        .post('/calculators/pmt')
        .send({ principalCents: 1234.5, annualRatePercent: 5, termMonths: 60 })
        .expect(400)
    })

    it('rejects negative rate with HTTP 400', async () => {
      await request(app.getHttpServer())
        .post('/calculators/pmt')
        .send({ principalCents: 1000000, annualRatePercent: -1, termMonths: 60 })
        .expect(400)
    })

    it('rejects term over 600 months with HTTP 400', async () => {
      await request(app.getHttpServer())
        .post('/calculators/pmt')
        .send({ principalCents: 1000000, annualRatePercent: 5, termMonths: 601 })
        .expect(400)
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /calculators/rent-vs-buy
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /calculators/rent-vs-buy', () => {
    const baseRequest = {
      startDate: '2026-01-01T00:00:00.000Z',
      projectionYears: 10,
      buy: {
        homePriceCents: 80_000_000,
        downPaymentPercent: 20,
        mortgageInterestRatePercent: 6.5,
        mortgageTermYears: 30,
        closingCostPercent: 3,
        homeownersInsuranceAnnualCents: 200_000,
        hoaMonthlyDuesCents: 0,
      },
      rent: {
        monthlyRentCents: 400_000,
        securityDepositMonths: 1,
        rentersInsuranceAnnualCents: 30_000,
      },
    }

    it('API summary equals engine summary for the same input', async () => {
      const engineOutput = calculateRentVsBuy({
        startDate: new Date(baseRequest.startDate),
        projectionYears: baseRequest.projectionYears,
        buy: {
          homePriceCents: cents(baseRequest.buy.homePriceCents),
          downPaymentPercent: baseRequest.buy.downPaymentPercent,
          mortgageInterestRatePercent: baseRequest.buy.mortgageInterestRatePercent,
          mortgageTermYears: baseRequest.buy.mortgageTermYears,
          closingCostPercent: baseRequest.buy.closingCostPercent,
          homeownersInsuranceAnnualCents: cents(baseRequest.buy.homeownersInsuranceAnnualCents),
          hoaMonthlyDuesCents: cents(baseRequest.buy.hoaMonthlyDuesCents),
        },
        rent: {
          monthlyRentCents: cents(baseRequest.rent.monthlyRentCents),
          securityDepositMonths: baseRequest.rent.securityDepositMonths,
          rentersInsuranceAnnualCents: cents(baseRequest.rent.rentersInsuranceAnnualCents),
        },
      })

      const res = await request(app.getHttpServer())
        .post('/calculators/rent-vs-buy')
        .send(baseRequest)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.calculation.summary).toEqual(engineOutput.summary)
    })

    it('returns affordability=null when no income data is configured', async () => {
      mockPrisma.cashFlowItem.findMany.mockResolvedValueOnce([])

      const res = await request(app.getHttpServer())
        .post('/calculators/rent-vs-buy')
        .send(baseRequest)
        .expect(201)

      // No income data → affordability is null. Critically, the API does NOT
      // fabricate a "0%" affordability score.
      expect(res.body.data.affordability).toBeNull()
    })
  })

  // ──────────────────────────────────────────────────────────────────────────
  // POST /calculators/mortgage-vs-invest
  // ──────────────────────────────────────────────────────────────────────────

  describe('POST /calculators/mortgage-vs-invest', () => {
    const baseRequest = {
      currentBalanceCents: 30_000_000,
      mortgageRatePercent: 6.5,
      remainingTermMonths: 360,
      extraMonthlyPaymentCents: 20_000,
      expectedReturnPercent: 7,
      capitalGainsTaxPercent: 15,
      horizonYears: 30,
      mortgageInterestDeductible: false,
      marginalTaxRatePercent: 24,
    }

    it('API output equals engine output for the same input', async () => {
      const engineOutput = calculateMortgageVsInvest(baseRequest)

      const res = await request(app.getHttpServer())
        .post('/calculators/mortgage-vs-invest')
        .send(baseRequest)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.payExtraSummary).toEqual(engineOutput.payExtraSummary)
      expect(res.body.data.investSummary).toEqual(engineOutput.investSummary)
      expect(res.body.data.recommendation).toBe(engineOutput.recommendation)
      expect(res.body.data.breakEvenReturnPercent).toBe(engineOutput.breakEvenReturnPercent)
    })

    it('rejects horizonYears > 30 with HTTP 400', async () => {
      await request(app.getHttpServer())
        .post('/calculators/mortgage-vs-invest')
        .send({ ...baseRequest, horizonYears: 50 })
        .expect(400)
    })
  })
})
