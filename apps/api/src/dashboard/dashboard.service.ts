import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import {
  runProjection,
  generateAmortizationSchedule,
  generateAmortizationScheduleWithExtras,
  type ProjectionInput,
  type ProjectionAsset,
  type ProjectionLiability,
  type ProjectionCashFlowItem,
  type Cents,
  type ExtraPayment,
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
  LoanSimulationRequest,
  LoanSimulationResponse,
  EnhancedInvestmentsResponse,
  DividendProjection,
  GoalProgressSummary,
} from './types'
import type { AssetType } from '@finance-app/shared-types'
import Decimal from 'decimal.js'

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async getNetWorth(householdId: string, horizonYears = 5): Promise<NetWorthResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

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

  async getEnhancedInvestments(householdId: string): Promise<EnhancedInvestmentsResponse> {
    // Get base investments data
    const baseResponse = await this.getInvestments(householdId)

    // Get investment assets with dividend yield info
    const investmentAssets = await this.prisma.asset.findMany({
      where: {
        householdId,
        type: { in: ['investment', 'retirement_account', 'real_estate', 'bank_account'] },
      },
      orderBy: { currentValueCents: 'desc' },
    })

    // Default dividend yields by asset type
    const defaultYields: Record<string, number> = {
      investment: 2,
      retirement_account: 2,
      real_estate: 4,
      bank_account: 4,
      crypto: 0,
      vehicle: 0,
      other: 0,
    }

    // Calculate dividend projections
    const dividendProjections: DividendProjection[] = investmentAssets.map((asset) => {
      const yieldPercent = asset.dividendYieldPercent
        ? Number(asset.dividendYieldPercent)
        : (defaultYields[asset.type] ?? 0)
      const annualDividendCents = Math.round(
        (asset.currentValueCents * yieldPercent) / 100,
      ) as Cents
      const monthlyDividendCents = Math.round(annualDividendCents / 12) as Cents

      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type as AssetType,
        valueCents: asset.currentValueCents as Cents,
        yieldPercent,
        annualDividendCents,
        monthlyDividendCents,
        isCustomYield: asset.dividendYieldPercent !== null,
      }
    })

    const totalAnnualDividendsCents = dividendProjections.reduce(
      (sum, p) => sum + p.annualDividendCents,
      0,
    ) as Cents
    const totalMonthlyDividendsCents = dividendProjections.reduce(
      (sum, p) => sum + p.monthlyDividendCents,
      0,
    ) as Cents

    // Get goals with investment-related types
    const goals = await this.prisma.goal.findMany({
      where: {
        householdId,
        type: { in: ['net_worth_target', 'savings_target'] },
        status: 'active',
      },
    })

    const goalProgress: GoalProgressSummary[] = goals.map((goal) => {
      const progressPercent =
        goal.targetAmountCents > 0
          ? new Decimal(goal.currentAmountCents)
              .dividedBy(goal.targetAmountCents)
              .times(100)
              .toDecimalPlaces(1)
              .toNumber()
          : 0

      const remainingCents = Math.max(0, goal.targetAmountCents - goal.currentAmountCents) as Cents

      // Calculate projected completion date based on current investment growth
      let projectedCompletionDate: Date | null = null
      let onTrack = false

      if (goal.targetDate) {
        const now = new Date()
        const targetDate = new Date(goal.targetDate)
        const daysRemaining = Math.max(
          0,
          Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        )

        if (daysRemaining > 0 && remainingCents > 0) {
          // Estimate monthly savings needed
          const monthsRemaining = daysRemaining / 30
          const monthlySavingsNeeded = remainingCents / monthsRemaining

          // If monthly dividends cover at least 50% of needed savings, consider on track
          onTrack = totalMonthlyDividendsCents >= monthlySavingsNeeded * 0.5
          projectedCompletionDate = targetDate
        } else if (remainingCents === 0) {
          onTrack = true
        }
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        goalType: goal.type as 'net_worth_target' | 'savings_target' | 'debt_freedom',
        targetAmountCents: goal.targetAmountCents as Cents,
        currentAmountCents: goal.currentAmountCents as Cents,
        progressPercent,
        remainingCents,
        onTrack,
        projectedCompletionDate,
      }
    })

    return {
      ...baseResponse,
      dividendProjections,
      totalAnnualDividendsCents,
      totalMonthlyDividendsCents,
      goalProgress,
    }
  }

  async simulateLoanPayoff(
    householdId: string,
    loanId: string,
    request: LoanSimulationRequest,
  ): Promise<LoanSimulationResponse> {
    const liability = await this.prisma.liability.findFirst({
      where: { id: loanId, householdId },
    })

    if (!liability) {
      throw new NotFoundException('Loan not found')
    }

    const termMonths = liability.termMonths ?? 360
    const principalCents = liability.currentBalanceCents as Cents
    const interestRate = Number(liability.interestRatePercent)
    const startDate = new Date()

    // Generate original schedule
    const originalSchedule = generateAmortizationSchedule({
      principalCents,
      annualInterestRatePercent: interestRate,
      termMonths,
      startDate,
    })

    // Build extra payments array based on request
    const extraPayments: ExtraPayment[] = []

    // Add recurring monthly extra payments
    if (request.extraMonthlyPaymentCents > 0) {
      for (let i = 1; i <= termMonths; i++) {
        extraPayments.push({
          paymentNumber: i,
          amountCents: request.extraMonthlyPaymentCents as Cents,
        })
      }
    }

    // Add one-time payment
    if (request.oneTimePaymentCents > 0 && request.oneTimePaymentMonth > 0) {
      extraPayments.push({
        paymentNumber: request.oneTimePaymentMonth,
        amountCents: request.oneTimePaymentCents as Cents,
      })
    }

    // Handle bi-weekly payments
    // Bi-weekly = 26 payments per year, which equals an extra monthly payment
    if (request.useBiweekly) {
      // Bi-weekly adds the equivalent of 1 extra monthly payment per year
      // distributed across all months (1/12 of monthly payment as extra each month)
      const extraFromBiweekly = Math.round(originalSchedule.monthlyPaymentCents / 12) as Cents
      for (let i = 1; i <= termMonths; i++) {
        const existingExtra = extraPayments.find((p) => p.paymentNumber === i)
        if (existingExtra) {
          existingExtra.amountCents = (existingExtra.amountCents + extraFromBiweekly) as Cents
        } else {
          extraPayments.push({
            paymentNumber: i,
            amountCents: extraFromBiweekly,
          })
        }
      }
    }

    // Generate modified schedule with extra payments
    const modifiedSchedule = generateAmortizationScheduleWithExtras({
      principalCents,
      annualInterestRatePercent: interestRate,
      termMonths,
      startDate,
      extraPayments,
    })

    // Calculate effective monthly payment for modified schedule
    const modifiedEffectiveMonthly = (originalSchedule.monthlyPaymentCents +
      request.extraMonthlyPaymentCents +
      (request.useBiweekly ? Math.round(originalSchedule.monthlyPaymentCents / 12) : 0)) as Cents

    // Build loan detail
    const loan: LoanDetail = {
      id: liability.id,
      name: liability.name,
      type: liability.type,
      principalCents: liability.principalCents as Cents,
      currentBalanceCents: liability.currentBalanceCents as Cents,
      interestRatePercent: interestRate,
      minimumPaymentCents: liability.minimumPaymentCents as Cents,
      termMonths: liability.termMonths,
      startDate: liability.startDate,
      estimatedPayoffDate: originalSchedule.payoffDate,
    }

    // Convert schedules to response format
    const mapScheduleEntry = (entry: {
      paymentNumber: number
      paymentDate: Date
      beginningBalanceCents: Cents
      scheduledPaymentCents: Cents
      principalCents: Cents
      interestCents: Cents
      endingBalanceCents: Cents
      cumulativePrincipalCents: Cents
      cumulativeInterestCents: Cents
    }): AmortizationEntry => ({
      paymentNumber: entry.paymentNumber,
      paymentDate: entry.paymentDate,
      beginningBalanceCents: entry.beginningBalanceCents,
      scheduledPaymentCents: entry.scheduledPaymentCents,
      principalCents: entry.principalCents,
      interestCents: entry.interestCents,
      endingBalanceCents: entry.endingBalanceCents,
      cumulativePrincipalCents: entry.cumulativePrincipalCents,
      cumulativeInterestCents: entry.cumulativeInterestCents,
    })

    return {
      loan,
      original: {
        monthlyPaymentCents: originalSchedule.monthlyPaymentCents,
        totalPaymentsCents: originalSchedule.totalPaymentsCents,
        totalInterestCents: originalSchedule.totalInterestCents,
        payoffMonth: originalSchedule.actualPayoffMonth,
        payoffDate: originalSchedule.payoffDate,
      },
      modified: {
        monthlyPaymentCents: modifiedEffectiveMonthly,
        totalPaymentsCents: modifiedSchedule.totalPaymentsCents,
        totalInterestCents: modifiedSchedule.totalInterestCents,
        payoffMonth: modifiedSchedule.actualPayoffMonth,
        payoffDate: modifiedSchedule.payoffDate,
      },
      savings: {
        interestSavedCents: (originalSchedule.totalInterestCents -
          modifiedSchedule.totalInterestCents) as Cents,
        monthsSaved: originalSchedule.actualPayoffMonth - modifiedSchedule.actualPayoffMonth,
        totalSavedCents: (originalSchedule.totalPaymentsCents -
          modifiedSchedule.totalPaymentsCents) as Cents,
      },
      originalSchedule: originalSchedule.schedule.map(mapScheduleEntry),
      modifiedSchedule: modifiedSchedule.schedule.map(mapScheduleEntry),
    }
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
