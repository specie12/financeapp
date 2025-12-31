import { Injectable } from '@nestjs/common'
import {
  calculateRentVsBuy,
  cents,
  type RentVsBuyInput,
  type RentVsBuyResult,
} from '@finance-app/finance-engine'
import type { RentVsBuyDto } from './dto/rent-vs-buy.dto'

@Injectable()
export class CalculatorsService {
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
