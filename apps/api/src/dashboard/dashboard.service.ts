import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import {
  runProjection,
  generateAmortizationSchedule,
  type ProjectionInput,
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
  type Cents,
} from '@finance-app/finance-engine'
import type {
  NetWorthResponse,
  AssetsByType,
  LiabilitiesByType,
  NetWorthProjection,
  LoansResponse,
  LoanDetail,
  LoanSummary,
  LoanAmortizationResponse,
  AmortizationEntry,
  InvestmentsResponse,
  HoldingSummary,
  PortfolioSummary,
} from './types'
import Decimal from 'decimal.js'

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getNetWorth(householdId: string, horizonYears = 5): Promise<NetWorthResponse> {
    const [assets, liabilities, cashFlowItems] = await Promise.all([
      this.prisma.asset.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.liability.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.cashFlowItem.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
    ])

    // Calculate current totals
    const totalAssetsCents = assets.reduce((sum, a) => sum + a.currentValueCents, 0) as Cents
    const totalLiabilitiesCents = liabilities.reduce(
      (sum, l) => sum + l.currentBalanceCents,
      0,
    ) as Cents
    const netWorthCents = (totalAssetsCents - totalLiabilitiesCents) as Cents

    // Group assets by type
    const assetsByType = this.groupAssetsByType(assets)

    // Group liabilities by type
    const liabilitiesByType = this.groupLiabilitiesByType(liabilities)

    // Run projection if there's data
    let projection: NetWorthProjection[] = []
    if (assets.length > 0 || liabilities.length > 0 || cashFlowItems.length > 0) {
      const projectionInput: ProjectionInput = {
        startDate: new Date(),
        horizonYears,
        assets: assets.map(
          (a): ProjectionAsset => ({
            id: a.id,
            name: a.name,
            currentValueCents: a.currentValueCents as Cents,
            annualGrowthRatePercent: a.annualGrowthRatePercent
              ? Number(a.annualGrowthRatePercent)
              : 0,
          }),
        ),
        liabilities: liabilities.map(
          (l): ProjectionLiability => ({
            id: l.id,
            name: l.name,
            currentBalanceCents: l.currentBalanceCents as Cents,
            interestRatePercent: Number(l.interestRatePercent),
            minimumPaymentCents: l.minimumPaymentCents as Cents,
            termMonths: l.termMonths ?? null,
            startDate: l.startDate,
          }),
        ),
        cashFlowItems: cashFlowItems.map(
          (c): ProjectionCashFlowItem => ({
            id: c.id,
            name: c.name,
            type: c.type,
            amountCents: c.amountCents as Cents,
            frequency: c.frequency,
            startDate: c.startDate ?? null,
            endDate: c.endDate ?? null,
            annualGrowthRatePercent: c.annualGrowthRatePercent
              ? Number(c.annualGrowthRatePercent)
              : null,
          }),
        ),
      }

      const result = runProjection(projectionInput)
      projection = result.yearlySnapshots.map(
        (s): NetWorthProjection => ({
          year: s.year,
          date: s.date,
          totalAssetsCents: s.totalAssetsCents,
          totalLiabilitiesCents: s.totalLiabilitiesCents,
          netWorthCents: s.netWorthCents,
        }),
      )
    }

    return {
      totalAssetsCents,
      totalLiabilitiesCents,
      netWorthCents,
      assetsByType,
      liabilitiesByType,
      projection,
    }
  }

  async getLoans(householdId: string): Promise<LoansResponse> {
    const liabilities = await this.prisma.liability.findMany({
      where: { householdId },
      orderBy: { currentBalanceCents: 'desc' },
    })

    const loans: LoanDetail[] = liabilities.map((l) => {
      let estimatedPayoffDate: Date | null = null
      if (l.termMonths) {
        const schedule = generateAmortizationSchedule({
          principalCents: l.currentBalanceCents as Cents,
          annualInterestRatePercent: Number(l.interestRatePercent),
          termMonths: l.termMonths,
          startDate: new Date(),
        })
        estimatedPayoffDate = schedule.payoffDate
      }

      return {
        id: l.id,
        name: l.name,
        type: l.type,
        principalCents: l.principalCents as Cents,
        currentBalanceCents: l.currentBalanceCents as Cents,
        interestRatePercent: Number(l.interestRatePercent),
        minimumPaymentCents: l.minimumPaymentCents as Cents,
        termMonths: l.termMonths,
        startDate: l.startDate,
        estimatedPayoffDate,
      }
    })

    const totalOutstandingCents = loans.reduce((sum, l) => sum + l.currentBalanceCents, 0) as Cents
    const totalMonthlyPaymentCents = loans.reduce(
      (sum, l) => sum + l.minimumPaymentCents,
      0,
    ) as Cents

    // Weighted average interest rate
    let averageInterestRatePercent = 0
    if (totalOutstandingCents > 0) {
      const weightedSum = loans.reduce(
        (sum, l) => sum + l.interestRatePercent * l.currentBalanceCents,
        0,
      )
      averageInterestRatePercent = new Decimal(weightedSum)
        .dividedBy(totalOutstandingCents)
        .toDecimalPlaces(2)
        .toNumber()
    }

    const summary: LoanSummary = {
      totalOutstandingCents,
      totalMonthlyPaymentCents,
      averageInterestRatePercent,
      loanCount: loans.length,
    }

    return { summary, loans }
  }

  async getLoanAmortization(
    householdId: string,
    loanId: string,
  ): Promise<LoanAmortizationResponse> {
    const liability = await this.prisma.liability.findFirst({
      where: { id: loanId, householdId },
    })

    if (!liability) {
      throw new NotFoundException('Loan not found')
    }

    const termMonths = liability.termMonths ?? 360 // Default 30 years if not specified

    const schedule = generateAmortizationSchedule({
      principalCents: liability.currentBalanceCents as Cents,
      annualInterestRatePercent: Number(liability.interestRatePercent),
      termMonths,
      startDate: new Date(),
    })

    const loan: LoanDetail = {
      id: liability.id,
      name: liability.name,
      type: liability.type,
      principalCents: liability.principalCents as Cents,
      currentBalanceCents: liability.currentBalanceCents as Cents,
      interestRatePercent: Number(liability.interestRatePercent),
      minimumPaymentCents: liability.minimumPaymentCents as Cents,
      termMonths: liability.termMonths,
      startDate: liability.startDate,
      estimatedPayoffDate: schedule.payoffDate,
    }

    const amortizationSchedule: AmortizationEntry[] = schedule.schedule.map((entry) => ({
      paymentNumber: entry.paymentNumber,
      paymentDate: entry.paymentDate,
      beginningBalanceCents: entry.beginningBalanceCents,
      scheduledPaymentCents: entry.scheduledPaymentCents,
      principalCents: entry.principalCents,
      interestCents: entry.interestCents,
      endingBalanceCents: entry.endingBalanceCents,
      cumulativePrincipalCents: entry.cumulativePrincipalCents,
      cumulativeInterestCents: entry.cumulativeInterestCents,
    }))

    return {
      loan,
      monthlyPaymentCents: schedule.monthlyPaymentCents,
      totalPaymentsCents: schedule.totalPaymentsCents,
      totalInterestCents: schedule.totalInterestCents,
      originalTermMonths: schedule.originalTermMonths,
      actualPayoffMonth: schedule.actualPayoffMonth,
      payoffDate: schedule.payoffDate,
      schedule: amortizationSchedule,
    }
  }

  async getInvestments(householdId: string): Promise<InvestmentsResponse> {
    // Get investment-type assets (investment and retirement_account)
    const investmentAssets = await this.prisma.asset.findMany({
      where: {
        householdId,
        type: { in: ['investment', 'retirement_account'] },
      },
      orderBy: { currentValueCents: 'desc' },
    })

    const totalValueCents = investmentAssets.reduce(
      (sum, a) => sum + a.currentValueCents,
      0,
    ) as Cents

    // For now, we don't have cost basis in the schema so we'll estimate
    // In a real app, you'd track purchase transactions
    const totalCostBasisCents = totalValueCents // Placeholder: assume cost = value
    const unrealizedGainCents = (totalValueCents - totalCostBasisCents) as Cents
    const unrealizedGainPercent =
      totalCostBasisCents > 0
        ? new Decimal(unrealizedGainCents)
            .dividedBy(totalCostBasisCents)
            .times(100)
            .toDecimalPlaces(2)
            .toNumber()
        : 0

    const holdings: HoldingSummary[] = investmentAssets.map((a) => {
      const valueCents = a.currentValueCents as Cents
      const costBasisCents = valueCents // Placeholder
      const gainLossCents = (valueCents - costBasisCents) as Cents
      const gainLossPercent =
        costBasisCents > 0
          ? new Decimal(gainLossCents)
              .dividedBy(costBasisCents)
              .times(100)
              .toDecimalPlaces(2)
              .toNumber()
          : 0
      const allocationPercent =
        totalValueCents > 0
          ? new Decimal(valueCents)
              .dividedBy(totalValueCents)
              .times(100)
              .toDecimalPlaces(2)
              .toNumber()
          : 0

      return {
        id: a.id,
        name: a.name,
        type: a.type,
        valueCents,
        costBasisCents,
        gainLossCents,
        gainLossPercent,
        allocationPercent,
      }
    })

    const summary: PortfolioSummary = {
      totalValueCents,
      totalCostBasisCents,
      unrealizedGainCents,
      unrealizedGainPercent,
      totalReturnCents: unrealizedGainCents, // Simplified: no dividends tracked
      totalReturnPercent: unrealizedGainPercent,
    }

    return { summary, holdings }
  }

  private groupAssetsByType(
    assets: Array<{
      id: string
      name: string
      type: string
      currentValueCents: number
      annualGrowthRatePercent: unknown
    }>,
  ): AssetsByType[] {
    const grouped = new Map<string, AssetsByType>()

    for (const asset of assets) {
      const existing = grouped.get(asset.type)
      const item = {
        id: asset.id,
        name: asset.name,
        type: asset.type,
        valueCents: asset.currentValueCents as Cents,
        growthRatePercent: asset.annualGrowthRatePercent
          ? Number(asset.annualGrowthRatePercent)
          : null,
      }

      if (existing) {
        existing.totalValueCents = (existing.totalValueCents + asset.currentValueCents) as Cents
        existing.count++
        existing.items.push(item)
      } else {
        grouped.set(asset.type, {
          type: asset.type,
          totalValueCents: asset.currentValueCents as Cents,
          count: 1,
          items: [item],
        })
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.totalValueCents - a.totalValueCents)
  }

  private groupLiabilitiesByType(
    liabilities: Array<{
      id: string
      name: string
      type: string
      currentBalanceCents: number
      interestRatePercent: unknown
    }>,
  ): LiabilitiesByType[] {
    const grouped = new Map<string, LiabilitiesByType>()

    for (const liability of liabilities) {
      const existing = grouped.get(liability.type)
      const item = {
        id: liability.id,
        name: liability.name,
        type: liability.type,
        balanceCents: liability.currentBalanceCents as Cents,
        interestRatePercent: Number(liability.interestRatePercent),
      }

      if (existing) {
        existing.totalBalanceCents = (existing.totalBalanceCents +
          liability.currentBalanceCents) as Cents
        existing.count++
        existing.items.push(item)
      } else {
        grouped.set(liability.type, {
          type: liability.type,
          totalBalanceCents: liability.currentBalanceCents as Cents,
          count: 1,
          items: [item],
        })
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.totalBalanceCents - a.totalBalanceCents)
  }
}
