import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  calculateRentVsBuy,
  cents,
  type RentVsBuyInput,
  type RentVsBuyResult,
} from '@finance-app/finance-engine'
import type { RentVsBuyDto } from './dto/rent-vs-buy.dto'
import type {
  AffordabilityAnalysis,
  AffordabilityThresholds,
  RentVsBuyResultWithAffordability,
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
   * Convert any frequency amount to monthly
   */
  private toMonthlyCents(amountCents: number, frequency: Frequency): number {
    return Math.round(amountCents * MONTHLY_MULTIPLIERS[frequency])
  }

  /**
   * Calculate monthly mortgage payment using PMT formula
   */
  private calculateMonthlyMortgagePayment(
    principalCents: number,
    annualRatePercent: number,
    termYears: number,
  ): number {
    if (annualRatePercent === 0) {
      return Math.round(principalCents / (termYears * 12))
    }

    const monthlyRate = annualRatePercent / 100 / 12
    const numPayments = termYears * 12

    const payment =
      (principalCents * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)

    return Math.round(payment)
  }

  /**
   * Calculate maximum affordable home price based on income
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
    // Maximum monthly housing payment allowed
    const maxHousingPaymentCents = Math.round(monthlyIncomeCents * (maxHousingPercent / 100))

    // Monthly insurance and HOA
    const monthlyInsuranceCents = Math.round(homeInsuranceAnnualCents / 12)
    const monthlyFixedCosts = monthlyInsuranceCents + hoaMonthlyDuesCents

    // Maximum P+I+T payment
    const maxPITCents = maxHousingPaymentCents - monthlyFixedCosts

    if (maxPITCents <= 0) return 0

    // Estimate property tax as percentage of home value per month
    const monthlyPropertyTaxRate = propertyTaxRatePercent / 100 / 12

    // We need to solve: P+I + PropertyTax = maxPITCents
    // where PropertyTax = HomePrice * monthlyPropertyTaxRate
    // and P+I = (HomePrice * (1 - downPayment%)) * PMT_factor

    const loanPercent = 1 - downPaymentPercent / 100

    if (annualRatePercent === 0) {
      const numPayments = termYears * 12
      // P+I = loan / numPayments = HomePrice * loanPercent / numPayments
      // HomePrice * loanPercent / numPayments + HomePrice * monthlyPropertyTaxRate = maxPITCents
      // HomePrice * (loanPercent / numPayments + monthlyPropertyTaxRate) = maxPITCents
      const factor = loanPercent / numPayments + monthlyPropertyTaxRate
      return Math.round(maxPITCents / factor)
    }

    const monthlyRate = annualRatePercent / 100 / 12
    const numPayments = termYears * 12
    const pmtFactor =
      (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)

    // P+I = HomePrice * loanPercent * pmtFactor
    // PropertyTax = HomePrice * monthlyPropertyTaxRate
    // Total = HomePrice * (loanPercent * pmtFactor + monthlyPropertyTaxRate) = maxPITCents
    const totalFactor = loanPercent * pmtFactor + monthlyPropertyTaxRate

    return Math.round(maxPITCents / totalFactor)
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
    const loanAmountCents = Math.round(
      dto.buy.homePriceCents * (1 - dto.buy.downPaymentPercent / 100),
    )
    const monthlyMortgagePaymentCents = this.calculateMonthlyMortgagePayment(
      loanAmountCents,
      dto.buy.mortgageInterestRatePercent,
      dto.buy.mortgageTermYears,
    )

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
