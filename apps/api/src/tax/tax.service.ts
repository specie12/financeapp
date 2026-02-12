import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import { calculateTaxLiability } from '@finance-app/finance-engine'
import type { CreateTaxProfileDto } from './dto/create-tax-profile.dto'
import type { FilingStatus as PrismaFilingStatus, TaxProfile } from '@prisma/client'
import type { TaxSummaryResponse, TaxBracketInfo, FilingStatus } from '@finance-app/shared-types'

@Injectable()
export class TaxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async getProfile(householdId: string, taxYear?: number): Promise<TaxProfile> {
    const year = taxYear ?? new Date().getFullYear()

    const profile = await this.prisma.taxProfile.findUnique({
      where: {
        householdId_taxYear: { householdId, taxYear: year },
      },
    })

    if (!profile) {
      throw new NotFoundException(`Tax profile for year ${year} not found`)
    }

    return profile
  }

  async upsertProfile(householdId: string, dto: CreateTaxProfileDto): Promise<TaxProfile> {
    await this.planLimitsService.assertTaxFeatureEnabled(householdId)

    return this.prisma.taxProfile.upsert({
      where: {
        householdId_taxYear: { householdId, taxYear: dto.taxYear },
      },
      create: {
        householdId,
        taxYear: dto.taxYear,
        filingStatus: dto.filingStatus as PrismaFilingStatus,
        stateCode: dto.stateCode ?? null,
        dependents: dto.dependents ?? 0,
        additionalIncomeCents: dto.additionalIncomeCents ?? null,
      },
      update: {
        filingStatus: dto.filingStatus as PrismaFilingStatus,
        stateCode: dto.stateCode ?? null,
        dependents: dto.dependents ?? 0,
        additionalIncomeCents: dto.additionalIncomeCents ?? null,
      },
    })
  }

  async getSummary(householdId: string, taxYear?: number): Promise<TaxSummaryResponse> {
    await this.planLimitsService.assertTaxFeatureEnabled(householdId)

    const year = taxYear ?? new Date().getFullYear()

    // Try to get existing profile, default to single
    let filingStatus: FilingStatus = 'single'
    const profile = await this.prisma.taxProfile.findUnique({
      where: { householdId_taxYear: { householdId, taxYear: year } },
    })
    if (profile) {
      filingStatus = profile.filingStatus as FilingStatus
    }

    // Aggregate income from cash flow items
    const incomeItems = await this.prisma.cashFlowItem.findMany({
      where: { householdId, type: 'income' },
    })

    let annualIncomeCents = 0
    for (const item of incomeItems) {
      switch (item.frequency) {
        case 'weekly':
          annualIncomeCents += item.amountCents * 52
          break
        case 'biweekly':
          annualIncomeCents += item.amountCents * 26
          break
        case 'monthly':
          annualIncomeCents += item.amountCents * 12
          break
        case 'quarterly':
          annualIncomeCents += item.amountCents * 4
          break
        case 'annually':
          annualIncomeCents += item.amountCents
          break
        default:
          break
      }
    }

    // Add additional income from profile
    if (profile?.additionalIncomeCents) {
      annualIncomeCents += profile.additionalIncomeCents
    }

    // Get mortgage interest and property tax deductions from liabilities
    const mortgages = await this.prisma.liability.findMany({
      where: { householdId, type: 'mortgage' },
    })

    let mortgageInterestCents = 0
    for (const mortgage of mortgages) {
      // Estimated annual interest: current balance * rate
      const annualInterest = Math.round(
        (mortgage.currentBalanceCents * Number(mortgage.interestRatePercent)) / 100,
      )
      mortgageInterestCents += annualInterest
    }

    // Get property tax from rental properties
    const rentalProperties = await this.prisma.rentalProperty.findMany({
      where: { householdId },
    })
    let propertyTaxCents = 0
    for (const prop of rentalProperties) {
      propertyTaxCents += prop.propertyTaxAnnualCents
    }

    // Calculate tax
    const taxResult = calculateTaxLiability({
      grossIncomeCents: annualIncomeCents,
      filingStatus,
      taxYear: year,
      deductions: {
        mortgageInterestCents,
        propertyTaxCents,
      },
    })

    const brackets: TaxBracketInfo[] = taxResult.brackets.map((b) => ({
      min: b.min,
      max: b.max,
      rate: b.rate,
      taxInBracket: b.taxInBracket,
    }))

    return {
      taxYear: year,
      filingStatus,
      estimatedGrossIncomeCents: annualIncomeCents,
      standardDeductionCents: taxResult.standardDeductionCents,
      taxableIncomeCents: taxResult.taxableIncomeCents,
      estimatedTaxLiabilityCents: taxResult.estimatedTaxLiabilityCents,
      effectiveTaxRatePercent: taxResult.effectiveTaxRatePercent,
      marginalTaxRatePercent: taxResult.marginalTaxRatePercent,
      brackets,
      deductions: {
        mortgageInterestCents,
        propertyTaxCents,
        standardDeductionCents: taxResult.standardDeductionCents,
      },
    }
  }
}
