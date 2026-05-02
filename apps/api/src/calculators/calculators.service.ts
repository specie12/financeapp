import { Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { PrismaService } from '../prisma/prisma.service'
import {
  calculateMonthlyPayment,
  calculateRentVsBuy,
  calculateMortgageVsInvest,
  cents,
  type Cents,
  type RentVsBuyInput,
  type RentVsBuyResult,
  type MortgageVsInvestInput,
} from '@finance-app/finance-engine'
import type { RentVsBuyDto } from './dto/rent-vs-buy.dto'
import type { MortgageVsInvestDto } from './dto/mortgage-vs-invest.dto'
import type { PmtDto, PmtResponse } from './dto/pmt.dto'
import type {
  AffordabilityAnalysis,
  AffordabilityThresholds,
  RentVsBuyResultWithAffordability,
  MortgageVsInvestResult,
} from '@finance-app/shared-types'
import type { Frequency, CashFlowType } from '@prisma/client'

// Default affordability thresholds
const DEFAULT_THRESHOLDS: AffordabilityThresholds = {
  housingCostMaxPercent: 28,
  totalDebtMaxPercent: 36,
  rentMaxPercent: 30,
}

// Frequency multipliers to convert to monthly
const MONTHLY_MULTIPLIERS: Record<Frequency, number> = {
  one_time: 0, // One-time doesn't contribute to monthly
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
}

@Injectable()
export class CalculatorsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate the monthly amortizing payment for a loan.
   *
   * Thin wrapper over the canonical finance-engine PMT to enforce that
   * `principalCents` is a valid integer and that the engine's Decimal-based
   * implementation is the only PMT source in the system.
   */
  calculatePmt(dto: PmtDto): PmtResponse {
    const monthlyPaymentCents = calculateMonthlyPayment(
      cents(dto.principalCents),
      dto.annualRatePercent,
      dto.termMonths,
    )
    return { monthlyPaymentCents }
  }

  /**
   * Convert any frequency amount to monthly
   */
  private toMonthlyCents(amountCents: number, frequency: Frequency): number {
    return Math.round(amountCents * MONTHLY_MULTIPLIERS[frequency])
  }

  /**
   * Compute the total monthly housing cost (P+I + property tax + insurance + HOA)
   * for a candidate home price, using the canonical engine PMT.
   */
  private monthlyHousingCostForHomePrice(params: {
    homePriceCents: number
    annualRatePercent: number
    termYears: number
    downPaymentPercent: number
    propertyTaxRatePercent: number
    monthlyInsuranceCents: number
    hoaMonthlyDuesCents: number
  }): number {
    const homePriceDec = new Decimal(params.homePriceCents)
    const loanAmountDec = homePriceDec.times(
      new Decimal(1).minus(new Decimal(params.downPaymentPercent).dividedBy(100)),
    )
    const loanAmountCents = loanAmountDec.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()

    let principalAndInterestCents = 0
    if (loanAmountCents > 0 && params.termYears > 0) {
      principalAndInterestCents = calculateMonthlyPayment(
        cents(loanAmountCents),
        params.annualRatePercent,
        params.termYears * 12,
      )
    }

    const monthlyPropertyTaxCents = homePriceDec
      .times(params.propertyTaxRatePercent)
      .dividedBy(100)
      .dividedBy(12)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber()

    return (
      principalAndInterestCents +
      monthlyPropertyTaxCents +
      params.monthlyInsuranceCents +
      params.hoaMonthlyDuesCents
    )
  }

  /**
   * Calculate maximum affordable home price via binary search using the
   * canonical engine PMT. Avoids any closed-form PMT inversion.
   */
  private calculateMaxAffordableHomePrice(
    monthlyIncomeCents: number,
    annualRatePercent: number,
    termYears: number,
    downPaymentPercent: number,
    propertyTaxRatePercent: number,
    homeInsuranceAnnualCents: number,
    hoaMonthlyDuesCents: number,
    maxHousingPercent: number,
  ): number {
    const maxHousingPaymentCents = new Decimal(monthlyIncomeCents)
      .times(maxHousingPercent)
      .dividedBy(100)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber()

    const monthlyInsuranceCents = new Decimal(homeInsuranceAnnualCents)
      .dividedBy(12)
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber()

    // Fixed monthly costs floor: if insurance + HOA already exceed cap, no home is affordable.
    if (monthlyInsuranceCents + hoaMonthlyDuesCents >= maxHousingPaymentCents) return 0

    const evaluate = (homePriceCents: number) =>
      this.monthlyHousingCostForHomePrice({
        homePriceCents,
        annualRatePercent,
        termYears,
        downPaymentPercent,
        propertyTaxRatePercent,
        monthlyInsuranceCents,
        hoaMonthlyDuesCents,
      })

    // Binary search [0, 100M USD]. 100M is a generous upper bound for residential.
    let lo = 0
    let hi = 100_000_000_00 // $100,000,000 in cents
    // Ensure hi is high enough: scale up if needed.
    while (evaluate(hi) <= maxHousingPaymentCents && hi < Number.MAX_SAFE_INTEGER / 2) {
      hi *= 2
    }

    for (let i = 0; i < 60; i++) {
      const mid = Math.floor((lo + hi) / 2)
      if (mid === lo) break
      const cost = evaluate(mid)
      if (cost <= maxHousingPaymentCents) {
        lo = mid
      } else {
        hi = mid
      }
    }
    return lo
  }

  /**
   * Calculate affordability analysis based on user's income and debts
   */
  async calculateAffordability(
    householdId: string,
    dto: RentVsBuyDto,
  ): Promise<AffordabilityAnalysis | null> {
    // Fetch income and liability data
    const [cashFlowItems, liabilities] = await Promise.all([
      this.prisma.cashFlowItem.findMany({
        where: { householdId, type: 'income' as CashFlowType },
      }),
      this.prisma.liability.findMany({
        where: { householdId },
      }),
    ])

    // If no income data, return null
    if (cashFlowItems.length === 0) {
      return null
    }

    // Calculate gross monthly income
    const grossMonthlyIncomeCents = cashFlowItems.reduce((total, item) => {
      return total + this.toMonthlyCents(item.amountCents, item.frequency)
    }, 0)

    // Calculate existing monthly debt payments (minimum payments on liabilities)
    const existingDebtPaymentsCents = liabilities.reduce((total, liability) => {
      return total + liability.minimumPaymentCents
    }, 0)

    // Calculate monthly housing costs for buy scenario
    const loanAmountCents = new Decimal(dto.buy.homePriceCents)
      .times(new Decimal(1).minus(new Decimal(dto.buy.downPaymentPercent).dividedBy(100)))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber()

    const monthlyMortgagePaymentCents =
      loanAmountCents > 0
        ? calculateMonthlyPayment(
            cents(loanAmountCents) as Cents,
            dto.buy.mortgageInterestRatePercent,
            dto.buy.mortgageTermYears * 12,
          )
        : 0

    // Property tax rate (use override or default)
    const propertyTaxRatePercent =
      dto.buy.propertyTaxRateOverride ?? dto.assumptions?.propertyTaxRatePercent ?? 1.2

    const monthlyPropertyTaxCents = Math.round(
      (dto.buy.homePriceCents * propertyTaxRatePercent) / 100 / 12,
    )
    const monthlyInsuranceCents = Math.round(dto.buy.homeownersInsuranceAnnualCents / 12)
    const monthlyHousingCostCents =
      monthlyMortgagePaymentCents +
      monthlyPropertyTaxCents +
      monthlyInsuranceCents +
      dto.buy.hoaMonthlyDuesCents

    // Calculate percentages
    const housingCostPercent =
      grossMonthlyIncomeCents > 0
        ? Math.round((monthlyHousingCostCents / grossMonthlyIncomeCents) * 10000) / 100
        : 100

    const totalMonthlyDebtCents = monthlyHousingCostCents + existingDebtPaymentsCents
    const totalDebtPercent =
      grossMonthlyIncomeCents > 0
        ? Math.round((totalMonthlyDebtCents / grossMonthlyIncomeCents) * 10000) / 100
        : 100

    // Calculate rent affordability
    const rentPercent =
      grossMonthlyIncomeCents > 0
        ? Math.round((dto.rent.monthlyRentCents / grossMonthlyIncomeCents) * 10000) / 100
        : 100

    // Calculate maximum affordable values
    const maxAffordableHomePriceCents = this.calculateMaxAffordableHomePrice(
      grossMonthlyIncomeCents,
      dto.buy.mortgageInterestRatePercent,
      dto.buy.mortgageTermYears,
      dto.buy.downPaymentPercent,
      propertyTaxRatePercent,
      dto.buy.homeownersInsuranceAnnualCents,
      dto.buy.hoaMonthlyDuesCents,
      DEFAULT_THRESHOLDS.housingCostMaxPercent,
    )

    const maxAffordableRentCents = Math.round(
      grossMonthlyIncomeCents * (DEFAULT_THRESHOLDS.rentMaxPercent / 100),
    )

    return {
      hasIncomeData: true,
      grossMonthlyIncomeCents,
      existingDebtPaymentsCents,
      buy: {
        monthlyHousingCostCents,
        housingCostPercent,
        isHousingAffordable: housingCostPercent <= DEFAULT_THRESHOLDS.housingCostMaxPercent,
        totalDebtPercent,
        isTotalDebtAffordable: totalDebtPercent <= DEFAULT_THRESHOLDS.totalDebtMaxPercent,
        maxAffordableHomePriceCents,
      },
      rent: {
        monthlyRentCents: dto.rent.monthlyRentCents,
        rentPercent,
        isAffordable: rentPercent <= DEFAULT_THRESHOLDS.rentMaxPercent,
        maxAffordableRentCents,
      },
      thresholds: DEFAULT_THRESHOLDS,
    }
  }

  /**
   * Calculate rent vs buy with affordability analysis
   */
  async calculateRentVsBuyWithAffordability(
    householdId: string,
    dto: RentVsBuyDto,
  ): Promise<RentVsBuyResultWithAffordability> {
    // Run the core calculation
    const result = this.calculateRentVsBuy(dto)

    // Calculate affordability
    const affordability = await this.calculateAffordability(householdId, dto)

    // Transform result to match the response type
    return {
      calculation: {
        input: {
          startDate: new Date(dto.startDate),
          projectionYears: dto.projectionYears,
          buy: {
            homePriceCents: dto.buy.homePriceCents,
            downPaymentPercent: dto.buy.downPaymentPercent,
            mortgageInterestRatePercent: dto.buy.mortgageInterestRatePercent,
            mortgageTermYears: dto.buy.mortgageTermYears,
            closingCostPercent: dto.buy.closingCostPercent,
            homeownersInsuranceAnnualCents: dto.buy.homeownersInsuranceAnnualCents,
            hoaMonthlyDuesCents: dto.buy.hoaMonthlyDuesCents,
            propertyTaxRateOverride: dto.buy.propertyTaxRateOverride,
            maintenanceRateOverride: dto.buy.maintenanceRateOverride,
          },
          rent: {
            monthlyRentCents: dto.rent.monthlyRentCents,
            securityDepositMonths: dto.rent.securityDepositMonths,
            rentersInsuranceAnnualCents: dto.rent.rentersInsuranceAnnualCents,
            rentIncreaseRateOverride: dto.rent.rentIncreaseRateOverride,
          },
          assumptions: dto.assumptions,
        },
        effectiveAssumptions: result.effectiveAssumptions,
        yearlyComparisons: result.yearlyComparisons.map((yc) => ({
          year: yc.year,
          date: yc.date.toISOString(),
          buyNetWorthCents: yc.buyNetWorthCents,
          rentNetWorthCents: yc.rentNetWorthCents,
          netWorthDifferenceCents: yc.netWorthDifferenceCents,
          buyAnnualCostCents: yc.buyAnnualCostCents,
          rentAnnualCostCents: yc.rentAnnualCostCents,
          buyIsBetterThisYear: yc.buyIsBetterThisYear,
        })),
        summary: result.summary,
      },
      affordability,
    }
  }

  calculateMortgageVsInvest(dto: MortgageVsInvestDto): MortgageVsInvestResult {
    const input: MortgageVsInvestInput = {
      currentBalanceCents: dto.currentBalanceCents,
      mortgageRatePercent: dto.mortgageRatePercent,
      remainingTermMonths: dto.remainingTermMonths,
      extraMonthlyPaymentCents: dto.extraMonthlyPaymentCents,
      expectedReturnPercent: dto.expectedReturnPercent,
      capitalGainsTaxPercent: dto.capitalGainsTaxPercent,
      horizonYears: dto.horizonYears,
      mortgageInterestDeductible: dto.mortgageInterestDeductible,
      marginalTaxRatePercent: dto.marginalTaxRatePercent,
    }

    const result = calculateMortgageVsInvest(input)

    return {
      yearlyComparisons: result.yearlyComparisons,
      payExtraSummary: result.payExtraSummary,
      investSummary: result.investSummary,
      recommendation: result.recommendation,
      breakEvenReturnPercent: result.breakEvenReturnPercent,
    }
  }

  calculateRentVsBuy(dto: RentVsBuyDto): RentVsBuyResult {
    const input: RentVsBuyInput = {
      startDate: new Date(dto.startDate),
      projectionYears: dto.projectionYears,
      buy: {
        homePriceCents: cents(dto.buy.homePriceCents),
        downPaymentPercent: dto.buy.downPaymentPercent,
        mortgageInterestRatePercent: dto.buy.mortgageInterestRatePercent,
        mortgageTermYears: dto.buy.mortgageTermYears,
        closingCostPercent: dto.buy.closingCostPercent,
        homeownersInsuranceAnnualCents: cents(dto.buy.homeownersInsuranceAnnualCents),
        hoaMonthlyDuesCents: cents(dto.buy.hoaMonthlyDuesCents),
        propertyTaxRateOverride: dto.buy.propertyTaxRateOverride,
        maintenanceRateOverride: dto.buy.maintenanceRateOverride,
      },
      rent: {
        monthlyRentCents: cents(dto.rent.monthlyRentCents),
        securityDepositMonths: dto.rent.securityDepositMonths,
        rentersInsuranceAnnualCents: cents(dto.rent.rentersInsuranceAnnualCents),
        rentIncreaseRateOverride: dto.rent.rentIncreaseRateOverride,
      },
      assumptions: dto.assumptions
        ? {
            propertyAppreciationRatePercent: dto.assumptions.homeAppreciationRatePercent,
            investmentReturnRatePercent: dto.assumptions.investmentReturnRatePercent,
            inflationRatePercent: dto.assumptions.inflationRatePercent,
            propertyTaxRatePercent: dto.assumptions.propertyTaxRatePercent,
            maintenanceRatePercent: dto.assumptions.maintenanceRatePercent,
            rentIncreaseRatePercent: dto.assumptions.rentIncreaseRatePercent,
            marginalTaxRatePercent: dto.assumptions.marginalTaxRatePercent,
            sellingCostPercent: dto.assumptions.sellingCostPercent,
          }
        : undefined,
    }

    return calculateRentVsBuy(input)
  }
}
