import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PlanLimitsService } from '../plan-limits/plan-limits.service'
import { MarketDataService } from '../market-data/market-data.service'
import {
  buildRentalProjectionContributions,
  type RentalProjectionContributions,
} from '../rental-properties/rental-projection.util'
import {
  runProjection,
  runMonteCarloProjection,
  computeRentalMetrics,
  assessRentalDeal,
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
  CashFlowSummaryResponse,
  CashFlowItemSummary,
  BudgetStatusResponse,
  BudgetStatusItem,
} from './types'
import type {
  Frequency,
  BudgetPeriod,
  Asset,
  Liability,
  CashFlowItem,
  RentalProperty,
} from '@prisma/client'
import type {
  AssetType,
  EnhancedInvestmentsWithTickers,
  EnhancedHolding,
  SectorAllocation,
  MonteCarloNetWorthResponse,
  RentalDecisionRequest,
  RentalDecisionResponse,
} from '@finance-app/shared-types'
import Decimal from 'decimal.js'

/** Default annual return volatility (std dev) for the Monte Carlo bands. */
const DEFAULT_RETURN_VOLATILITY_PERCENT = 15
const DEFAULT_MC_ITERATIONS = 1000
const DEFAULT_MC_SEED = 1

/**
 * Assembles a projection input from a household's entities plus its rental
 * contributions. Single source of truth shared by the deterministic net-worth
 * projection and the Monte Carlo projection so the two can never drift.
 */
function buildDashboardProjectionInput(
  assets: Asset[],
  liabilities: Liability[],
  cashFlowItems: CashFlowItem[],
  rentalContributions: RentalProjectionContributions,
  startDate: Date,
  horizonYears: number,
): ProjectionInput {
  return {
    startDate,
    horizonYears,
    assets: [
      ...assets.map(
        (a): ProjectionAsset => ({
          id: a.id,
          name: a.name,
          currentValueCents: a.currentValueCents as Cents,
          annualGrowthRatePercent: a.annualGrowthRatePercent
            ? Number(a.annualGrowthRatePercent)
            : 0,
        }),
      ),
      ...rentalContributions.assets,
    ],
    liabilities: [
      ...liabilities.map(
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
      ...rentalContributions.liabilities,
    ],
    cashFlowItems: [
      ...cashFlowItems.map(
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
      ...rentalContributions.cashFlowItems,
    ],
  }
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planLimitsService: PlanLimitsService,
    private readonly marketDataService: MarketDataService,
  ) {}

  async getNetWorth(householdId: string, horizonYears = 5): Promise<NetWorthResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

    const [assets, liabilities, cashFlowItems, rentalProperties] = await Promise.all([
      this.prisma.asset.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.liability.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.cashFlowItem.findMany({ where: { householdId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.rentalProperty.findMany({ where: { householdId } }),
    ])

    const projectionStartDate = new Date()

    // Fold rental properties into net worth: a synthesized asset for the
    // property value and a liability for the mortgage, skipping any already
    // represented by a linked asset/liability to avoid double counting. The
    // same contributions drive both the current totals and the projection so
    // the headline and the year-0 chart point stay consistent.
    const rentalContributions = buildRentalProjectionContributions(
      rentalProperties,
      new Set(assets.map((a) => a.id)),
      new Set(liabilities.map((l) => l.id)),
      projectionStartDate,
    )
    const rentalAssetValueCents = rentalContributions.assets.reduce(
      (sum, a) => sum + a.currentValueCents,
      0,
    )
    const rentalLiabilityBalanceCents = rentalContributions.liabilities.reduce(
      (sum, l) => sum + l.currentBalanceCents,
      0,
    )

    // Calculate current totals (including unlinked rental equity)
    const totalAssetsCents = (assets.reduce((sum, a) => sum + a.currentValueCents, 0) +
      rentalAssetValueCents) as Cents
    const totalLiabilitiesCents = (liabilities.reduce((sum, l) => sum + l.currentBalanceCents, 0) +
      rentalLiabilityBalanceCents) as Cents
    const netWorthCents = (totalAssetsCents - totalLiabilitiesCents) as Cents

    // Group assets by type
    const assetsByType = this.groupAssetsByType(assets)

    // Group liabilities by type
    const liabilitiesByType = this.groupLiabilitiesByType(liabilities)

    // Run projection if there's data
    let projection: NetWorthProjection[] = []
    if (
      assets.length > 0 ||
      liabilities.length > 0 ||
      cashFlowItems.length > 0 ||
      rentalProperties.length > 0
    ) {
      const projectionInput = buildDashboardProjectionInput(
        assets,
        liabilities,
        cashFlowItems,
        rentalContributions,
        projectionStartDate,
        horizonYears,
      )

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

  /**
   * Monte Carlo net-worth projection: p10/p50/p90 outcome bands built by
   * simulating stochastic asset returns around each asset's growth rate.
   * Uses the same entities (including rentals) as the deterministic projection.
   */
  async getNetWorthMonteCarlo(
    householdId: string,
    horizonYears = 5,
    iterations = DEFAULT_MC_ITERATIONS,
    returnVolatilityPercent = DEFAULT_RETURN_VOLATILITY_PERCENT,
  ): Promise<MonteCarloNetWorthResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

    const [assets, liabilities, cashFlowItems, rentalProperties] = await Promise.all([
      this.prisma.asset.findMany({ where: { householdId } }),
      this.prisma.liability.findMany({ where: { householdId } }),
      this.prisma.cashFlowItem.findMany({ where: { householdId } }),
      this.prisma.rentalProperty.findMany({ where: { householdId } }),
    ])

    const startDate = new Date()
    const rentalContributions = buildRentalProjectionContributions(
      rentalProperties,
      new Set(assets.map((a) => a.id)),
      new Set(liabilities.map((l) => l.id)),
      startDate,
    )
    const input = buildDashboardProjectionInput(
      assets,
      liabilities,
      cashFlowItems,
      rentalContributions,
      startDate,
      horizonYears,
    )

    return runMonteCarloProjection(input, {
      iterations,
      seed: DEFAULT_MC_SEED,
      returnVolatilityPercent,
    })
  }

  /**
   * "Should I buy this rental?" analysis. Computes the candidate property's deal
   * metrics, projects the household's net worth with vs without it, runs a Monte
   * Carlo range for the with-it case, and returns a rules-based verdict. The
   * candidate is NOT persisted.
   */
  async getRentalDecision(
    householdId: string,
    candidate: RentalDecisionRequest,
    horizonYears = 5,
  ): Promise<RentalDecisionResponse> {
    await this.planLimitsService.assertHorizonWithinLimit(householdId, horizonYears)

    const [assets, liabilities, cashFlowItems, rentalProperties] = await Promise.all([
      this.prisma.asset.findMany({ where: { householdId } }),
      this.prisma.liability.findMany({ where: { householdId } }),
      this.prisma.cashFlowItem.findMany({ where: { householdId } }),
      this.prisma.rentalProperty.findMany({ where: { householdId } }),
    ])

    const startDate = new Date()
    const assetIds = new Set(assets.map((a) => a.id))
    const liabilityIds = new Set(liabilities.map((l) => l.id))

    // Baseline: existing portfolio only.
    const baseContributions = buildRentalProjectionContributions(
      rentalProperties,
      assetIds,
      liabilityIds,
      startDate,
    )
    const withoutInput = buildDashboardProjectionInput(
      assets,
      liabilities,
      cashFlowItems,
      baseContributions,
      startDate,
      horizonYears,
    )

    // Candidate treated as an unlinked rental (its own asset + mortgage + NOI).
    const candidateRental = {
      id: 'candidate',
      name: candidate.name,
      currentValueCents: candidate.currentValueCents,
      downPaymentCents: candidate.downPaymentCents,
      monthlyRentCents: candidate.monthlyRentCents,
      vacancyRatePercent: candidate.vacancyRatePercent ?? 5,
      annualExpensesCents: candidate.annualExpensesCents,
      propertyTaxAnnualCents: candidate.propertyTaxAnnualCents,
      mortgagePaymentCents: candidate.mortgagePaymentCents ?? null,
      mortgageRatePercent: candidate.mortgageRatePercent ?? null,
      mortgageBalanceCents: candidate.mortgageBalanceCents ?? null,
      mortgageTermMonths: candidate.mortgageTermMonths ?? null,
      appreciationRatePercent: candidate.appreciationRatePercent ?? null,
      linkedAssetId: null,
      linkedLiabilityId: null,
    } as unknown as RentalProperty

    const candidateContribs = buildRentalProjectionContributions(
      [candidateRental],
      assetIds,
      liabilityIds,
      startDate,
    )
    const withInput = buildDashboardProjectionInput(
      assets,
      liabilities,
      cashFlowItems,
      {
        assets: [...baseContributions.assets, ...candidateContribs.assets],
        liabilities: [...baseContributions.liabilities, ...candidateContribs.liabilities],
        cashFlowItems: [...baseContributions.cashFlowItems, ...candidateContribs.cashFlowItems],
      },
      startDate,
      horizonYears,
    )

    const withoutResult = runProjection(withoutInput)
    const withResult = runProjection(withInput)
    const netWorthDeltaCents =
      withResult.summary.endingNetWorthCents - withoutResult.summary.endingNetWorthCents

    const metrics = computeRentalMetrics({
      currentValueCents: candidate.currentValueCents as Cents,
      downPaymentCents: candidate.downPaymentCents as Cents,
      monthlyRentCents: candidate.monthlyRentCents as Cents,
      vacancyRatePercent: candidate.vacancyRatePercent ?? 5,
      annualExpensesCents: candidate.annualExpensesCents as Cents,
      propertyTaxAnnualCents: candidate.propertyTaxAnnualCents as Cents,
      mortgagePaymentCents: (candidate.mortgagePaymentCents ?? null) as Cents | null,
    })

    const monteCarlo = runMonteCarloProjection(withInput, {
      iterations: DEFAULT_MC_ITERATIONS,
      seed: DEFAULT_MC_SEED,
      returnVolatilityPercent: DEFAULT_RETURN_VOLATILITY_PERCENT,
    })

    const verdict = assessRentalDeal({
      cashFlowCents: metrics.cashFlowCents,
      dscrRatio: metrics.dscrRatio,
      capRatePercent: metrics.capRatePercent,
      netWorthDeltaCents,
    })

    const toProjection = (result: typeof withResult): NetWorthProjection[] =>
      result.yearlySnapshots.map((s) => ({
        year: s.year,
        date: s.date,
        totalAssetsCents: s.totalAssetsCents,
        totalLiabilitiesCents: s.totalLiabilitiesCents,
        netWorthCents: s.netWorthCents,
      }))

    return {
      horizonYears,
      metrics: {
        noiCents: metrics.noiCents,
        capRatePercent: metrics.capRatePercent,
        cashOnCashReturnPercent: metrics.cashOnCashReturnPercent,
        grossRentMultiplier: metrics.grossRentMultiplier,
        dscrRatio: metrics.dscrRatio,
        monthlyCashFlowCents: Math.round(metrics.cashFlowCents / 12),
      },
      withoutProperty: toProjection(withoutResult),
      withProperty: toProjection(withResult),
      netWorthDeltaCents,
      monteCarlo,
      verdict,
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

    // Build per-holding rows. Cost basis is OPTIONAL on assets. When it's
    // missing we MUST surface that as `null` rather than fabricating a value
    // — the previous implementation defaulted cost basis to current value,
    // which produced "0% gain" on every holding and broke user trust.
    const holdings: HoldingSummary[] = investmentAssets.map((a) => {
      const valueCents = a.currentValueCents as Cents
      const costBasisCents = a.costBasisCents !== null ? (a.costBasisCents as Cents) : null

      let gainLossCents: Cents | null = null
      let gainLossPercent: number | null = null
      if (costBasisCents !== null) {
        gainLossCents = (valueCents - costBasisCents) as Cents
        gainLossPercent =
          costBasisCents > 0
            ? new Decimal(gainLossCents)
                .dividedBy(costBasisCents)
                .times(100)
                .toDecimalPlaces(2)
                .toNumber()
            : 0
      }

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

    // Aggregate cost-basis fields are `null` when ANY holding is missing
    // a cost basis: a partial total would mislead users into thinking the
    // displayed gain is the full picture.
    const anyMissingCostBasis = holdings.some((h) => h.costBasisCents === null)

    let totalCostBasisCents: Cents | null = null
    let unrealizedGainCents: Cents | null = null
    let unrealizedGainPercent: number | null = null

    if (!anyMissingCostBasis) {
      totalCostBasisCents = holdings.reduce(
        (sum, h) => sum + (h.costBasisCents as number),
        0,
      ) as Cents
      unrealizedGainCents = (totalValueCents - totalCostBasisCents) as Cents
      unrealizedGainPercent =
        totalCostBasisCents > 0
          ? new Decimal(unrealizedGainCents)
              .dividedBy(totalCostBasisCents)
              .times(100)
              .toDecimalPlaces(2)
              .toNumber()
          : 0
    }

    const summary: PortfolioSummary = {
      totalValueCents,
      totalCostBasisCents,
      unrealizedGainCents,
      unrealizedGainPercent,
      // No dividend tracking yet → total return cannot be computed without it.
      // Mirror the cost-basis-derived fields rather than fabricate a value.
      totalReturnCents: unrealizedGainCents,
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

    // Build per-asset projections. Dividend yield is OPTIONAL on assets.
    // When it's missing the response MUST surface `null` for every yield-derived
    // field — previously this code defaulted bank accounts to 4% and retirement
    // to 2%, presenting fabricated income as fact. Those defaults are removed.
    const dividendProjections: DividendProjection[] = investmentAssets.map((asset) => {
      const isCustomYield = asset.dividendYieldPercent !== null
      const yieldPercent = isCustomYield ? Number(asset.dividendYieldPercent) : null

      let annualDividendCents: Cents | null = null
      let monthlyDividendCents: Cents | null = null
      if (yieldPercent !== null) {
        const annual = new Decimal(asset.currentValueCents)
          .times(yieldPercent)
          .dividedBy(100)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber()
        annualDividendCents = annual as Cents
        monthlyDividendCents = new Decimal(annual)
          .dividedBy(12)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber() as Cents
      }

      return {
        assetId: asset.id,
        assetName: asset.name,
        assetType: asset.type as AssetType,
        valueCents: asset.currentValueCents as Cents,
        yieldPercent,
        annualDividendCents,
        monthlyDividendCents,
        isCustomYield,
      }
    })

    // Aggregate over only the projections that actually have a configured yield.
    // If at least one asset is missing yield, set `dividendsPartial` so the UI
    // can disclose that the total is incomplete.
    const configured = dividendProjections.filter((p) => p.annualDividendCents !== null)
    const dividendsPartial = configured.length < dividendProjections.length
    const totalAnnualDividendsCents: Cents | null = configured.length
      ? (configured.reduce((sum, p) => sum + (p.annualDividendCents as number), 0) as Cents)
      : null
    const totalMonthlyDividendsCents: Cents | null = configured.length
      ? (configured.reduce((sum, p) => sum + (p.monthlyDividendCents as number), 0) as Cents)
      : null

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

          // If monthly dividends cover at least 50% of needed savings, consider on track.
          // When dividends are unconfigured we cannot evaluate this signal — leave
          // `onTrack=false` rather than fabricate a positive answer.
          if (totalMonthlyDividendsCents !== null) {
            onTrack = totalMonthlyDividendsCents >= monthlySavingsNeeded * 0.5
          }
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
      dividendsPartial,
      goalProgress,
    }
  }

  async getEnhancedInvestmentsWithTickers(
    householdId: string,
  ): Promise<EnhancedInvestmentsWithTickers> {
    // Get base enhanced investments data (includes dividends and goal progress)
    const baseResponse = await this.getEnhancedInvestments(householdId)

    // Get investment assets with ticker information
    const investmentAssets = await this.prisma.asset.findMany({
      where: {
        householdId,
        type: { in: ['investment', 'retirement_account'] },
      },
      orderBy: { currentValueCents: 'desc' },
    })

    // Separate assets with and without ticker symbols
    const assetsWithTickers = investmentAssets.filter((asset) => asset.ticker)

    // Get ticker data for assets that have ticker symbols
    const tickerSymbols = assetsWithTickers.map((asset) => asset.ticker!).filter(Boolean)
    const tickerDataArray =
      tickerSymbols.length > 0
        ? await this.marketDataService.getMultipleTickerData(tickerSymbols)
        : []

    // Create ticker data map for quick lookup
    const tickerDataMap = new Map(tickerDataArray.map((data) => [data.symbol, data]))

    // Calculate portfolio performance using MarketDataService
    const holdingsForPerformance = assetsWithTickers
      .filter((asset) => asset.ticker && asset.shares && asset.costBasisCents)
      .map((asset) => ({
        ticker: asset.ticker!,
        shares: Number(asset.shares!),
        costBasisCents: asset.costBasisCents!,
      }))

    const portfolioPerformance =
      holdingsForPerformance.length > 0
        ? await this.marketDataService.calculatePortfolioPerformance(holdingsForPerformance)
        : {
            totalValueCents: baseResponse.summary.totalValueCents,
            totalCostBasisCents: baseResponse.summary.totalCostBasisCents,
            totalReturnCents: baseResponse.summary.totalReturnCents,
            totalReturnPercent: baseResponse.summary.totalReturnPercent,
            dayChangeCents: 0,
            dayChangePercent: 0,
          }

    // Create enhanced holdings with ticker data
    const enhancedHoldings: EnhancedHolding[] = investmentAssets.map((asset) => {
      const baseHolding = baseResponse.holdings.find((h) => h.id === asset.id)!
      const tickerData = asset.ticker ? tickerDataMap.get(asset.ticker) : undefined

      const enhancedHolding: EnhancedHolding = {
        ...baseHolding,
        ticker: tickerData,
        sector: tickerData?.sector || asset.sector || undefined,
        shares: asset.shares ? Number(asset.shares) : undefined,
        lastPriceCents: asset.lastPriceCents || undefined,
      }

      // Add performance metrics if ticker data is available
      if (tickerData) {
        enhancedHolding.performance = {
          totalReturn: baseHolding.gainLossCents,
          totalReturnPercent: baseHolding.gainLossPercent,
          dayChange: tickerData.dayChange,
          weekChange: tickerData.weekChange,
          monthChange: tickerData.monthChange,
          ytdChange: tickerData.ytdChange,
          yearChange: tickerData.yearChange,
        }
      }

      return enhancedHolding
    })

    // Calculate sector allocations
    const sectorMap = new Map<string, { valueCents: number; count: number }>()

    for (const holding of enhancedHoldings) {
      const sector = holding.sector || 'Other'
      const existing = sectorMap.get(sector)

      if (existing) {
        existing.valueCents += holding.valueCents
        existing.count++
      } else {
        sectorMap.set(sector, { valueCents: holding.valueCents, count: 1 })
      }
    }

    const totalPortfolioValue = Math.max(baseResponse.summary.totalValueCents, 1) // Avoid division by zero

    const sectorAllocations: SectorAllocation[] = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        valueCents: data.valueCents,
        allocationPercent: new Decimal(data.valueCents)
          .dividedBy(totalPortfolioValue)
          .times(100)
          .toDecimalPlaces(1)
          .toNumber(),
        count: data.count,
      }))
      .sort((a, b) => b.valueCents - a.valueCents)

    return {
      ...baseResponse,
      portfolioPerformance: {
        totalValueCents: portfolioPerformance.totalValueCents,
        dayChangeCents: portfolioPerformance.dayChangeCents,
        dayChangePercent: portfolioPerformance.dayChangePercent,
        // Time-series aggregates are not yet implemented. Surface `null` so the
        // UI can render "—" for unknown windows, NEVER `0` (which would imply
        // the asset moved zero percent rather than "we don't know yet").
        weekChangeCents: null,
        weekChangePercent: null,
        monthChangeCents: null,
        monthChangePercent: null,
        ytdChangeCents: null,
        ytdChangePercent: null,
      },
      sectorAllocations,
      enhancedHoldings,
      marketDataSource: this.marketDataService.getSource(),
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

  private static readonly MONTHLY_MULTIPLIERS: Record<Frequency, number> = {
    one_time: 0,
    weekly: 52 / 12,
    biweekly: 26 / 12,
    monthly: 1,
    quarterly: 1 / 3,
    annually: 1 / 12,
  }

  async getCashFlow(householdId: string): Promise<CashFlowSummaryResponse> {
    const cashFlowItems = await this.prisma.cashFlowItem.findMany({
      where: { householdId },
      orderBy: { createdAt: 'desc' },
    })

    const items: CashFlowItemSummary[] = cashFlowItems.map((item) => {
      const multiplier = DashboardService.MONTHLY_MULTIPLIERS[item.frequency as Frequency] ?? 0
      const monthlyAmountCents = Math.round(item.amountCents * multiplier)

      return {
        id: item.id,
        name: item.name,
        type: item.type as 'income' | 'expense',
        frequency: item.frequency as Frequency,
        originalAmountCents: item.amountCents,
        monthlyAmountCents,
      }
    })

    const totalMonthlyIncomeCents = items
      .filter((i) => i.type === 'income')
      .reduce((sum, i) => sum + i.monthlyAmountCents, 0)

    const totalMonthlyExpensesCents = items
      .filter((i) => i.type === 'expense')
      .reduce((sum, i) => sum + i.monthlyAmountCents, 0)

    const netMonthlyCashFlowCents = totalMonthlyIncomeCents - totalMonthlyExpensesCents

    const savingsRatePercent =
      totalMonthlyIncomeCents > 0
        ? new Decimal(netMonthlyCashFlowCents)
            .dividedBy(totalMonthlyIncomeCents)
            .times(100)
            .toDecimalPlaces(1)
            .toNumber()
        : 0

    return {
      totalMonthlyIncomeCents,
      totalMonthlyExpensesCents,
      netMonthlyCashFlowCents,
      savingsRatePercent,
      items,
    }
  }

  async getBudgetStatus(householdId: string, period?: string): Promise<BudgetStatusResponse> {
    // Get all budgets for the user's household members
    const budgets = await this.prisma.budget.findMany({
      where: {
        user: { householdId },
        ...(period && { period: period as BudgetPeriod }),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    const budgetStatuses: BudgetStatusItem[] = []

    for (const budget of budgets) {
      // Determine period boundaries
      const { periodStart, periodEnd } = this.getPeriodBounds(now, budget.period as string)

      // Sum transactions for this category within the period
      const result = await this.prisma.transaction.aggregate({
        where: {
          categoryId: budget.categoryId,
          account: { user: { householdId } },
          type: 'expense',
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      })

      const spentAmountCents = result._sum.amount ?? 0
      const budgetedAmountCents = budget.amount
      const remainingCents = budgetedAmountCents - spentAmountCents
      const percentUsed =
        budgetedAmountCents > 0
          ? new Decimal(spentAmountCents)
              .dividedBy(budgetedAmountCents)
              .times(100)
              .toDecimalPlaces(1)
              .toNumber()
          : 0

      budgetStatuses.push({
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        budgetedAmountCents,
        spentAmountCents,
        remainingCents,
        percentUsed,
        isOverBudget: spentAmountCents > budgetedAmountCents,
        period: budget.period as BudgetPeriod,
      })
    }

    const totalBudgetedCents = budgetStatuses.reduce((sum, b) => sum + b.budgetedAmountCents, 0)
    const totalSpentCents = budgetStatuses.reduce((sum, b) => sum + b.spentAmountCents, 0)
    const overBudgetCount = budgetStatuses.filter((b) => b.isOverBudget).length

    return {
      budgets: budgetStatuses,
      totalBudgetedCents,
      totalSpentCents,
      overBudgetCount,
    }
  }

  private getPeriodBounds(now: Date, period: string): { periodStart: Date; periodEnd: Date } {
    const year = now.getFullYear()
    const month = now.getMonth()

    switch (period) {
      case 'weekly': {
        const day = now.getDay()
        const periodStart = new Date(year, month, now.getDate() - day)
        const periodEnd = new Date(year, month, now.getDate() + (6 - day), 23, 59, 59, 999)
        return { periodStart, periodEnd }
      }
      case 'monthly': {
        const periodStart = new Date(year, month, 1)
        const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
        return { periodStart, periodEnd }
      }
      case 'quarterly': {
        const quarterStart = Math.floor(month / 3) * 3
        const periodStart = new Date(year, quarterStart, 1)
        const periodEnd = new Date(year, quarterStart + 3, 0, 23, 59, 59, 999)
        return { periodStart, periodEnd }
      }
      case 'yearly': {
        const periodStart = new Date(year, 0, 1)
        const periodEnd = new Date(year, 11, 31, 23, 59, 59, 999)
        return { periodStart, periodEnd }
      }
      default: {
        // Default to monthly
        const periodStart = new Date(year, month, 1)
        const periodEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
        return { periodStart, periodEnd }
      }
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
