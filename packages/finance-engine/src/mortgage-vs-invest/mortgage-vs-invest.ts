import Decimal from 'decimal.js'
import { type Cents, RoundingMode } from '../money/money.types'
import { cents, addCents, subtractCents, percentageOf } from '../money/money'
import { calculateMonthlyPayment } from '../amortization/amortization'
import type {
  MortgageVsInvestInput,
  MortgageVsInvestResult,
  MortgageVsInvestYearlyComparison,
} from './mortgage-vs-invest.types'

/**
 * Mortgage-vs-Invest decision engine.
 *
 * Public API (`MortgageVsInvestInput` / `MortgageVsInvestResult`) is unchanged;
 * fields are still plain `number`s for cross-package serialization. All
 * internal money arithmetic uses Decimal.js + integer cents with
 * `ROUND_HALF_UP`, matching the amortization and projection engines.
 *
 * Determinism: no `Date.now()`, no `Math.random()`. Same inputs always
 * produce the same outputs. Locked by golden tests.
 */

// Decimal.js instance config is set globally by `money.ts`. We re-assert here
// so this module is correct even when imported in isolation.
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
})

export function calculateMortgageVsInvest(input: MortgageVsInvestInput): MortgageVsInvestResult {
  const {
    currentBalanceCents,
    mortgageRatePercent,
    remainingTermMonths,
    extraMonthlyPaymentCents,
    expectedReturnPercent,
    capitalGainsTaxPercent,
    horizonYears,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
  } = input

  const horizonMonths = horizonYears * 12
  const simulationMonths = Math.max(remainingTermMonths, horizonMonths)

  // PMT comes from the canonical engine — no duplicate formula in this file.
  const monthlyPaymentCents = calculateMonthlyPayment(
    cents(currentBalanceCents),
    mortgageRatePercent,
    remainingTermMonths,
  )

  // ── Baseline path: no extra principal payments ────────────────────────────
  const baseline = simulateMortgage({
    principalCents: cents(currentBalanceCents),
    annualRatePercent: mortgageRatePercent,
    basePaymentCents: monthlyPaymentCents,
    extraPaymentCents: cents(0),
    maxMonths: simulationMonths,
  })

  // ── Pay-extra path: add `extraMonthlyPaymentCents` each month ─────────────
  const payExtra = simulateMortgage({
    principalCents: cents(currentBalanceCents),
    annualRatePercent: mortgageRatePercent,
    basePaymentCents: monthlyPaymentCents,
    extraPaymentCents: cents(extraMonthlyPaymentCents),
    maxMonths: simulationMonths,
  })

  // ── Invest path: invest the extra monthly amount instead ──────────────────
  const investPath = simulateInvestment({
    monthlyContributionCents: cents(extraMonthlyPaymentCents),
    annualReturnPercent: expectedReturnPercent,
    maxMonths: horizonMonths,
  })

  const yearlyComparisons = buildYearlyComparisons({
    horizonYears,
    baseline,
    payExtra,
    investPath,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
    capitalGainsTaxPercent,
  })

  // ── Pay-extra summary ────────────────────────────────────────────────────
  const totalInterestWithoutExtraCents = baseline.totalInterestCents()
  const totalInterestWithExtraCents = payExtra.totalInterestCents()

  const payExtraSummary = {
    totalInterestWithoutExtraCents,
    totalInterestWithExtraCents,
    interestSavedCents: subtractCents(totalInterestWithoutExtraCents, totalInterestWithExtraCents),
    originalPayoffMonths: baseline.payoffMonth(),
    newPayoffMonths: payExtra.payoffMonth(),
    monthsSaved: baseline.payoffMonth() - payExtra.payoffMonth(),
  }

  // ── Invest summary ──────────────────────────────────────────────────────
  const lastMonth = horizonMonths - 1
  const finalPortfolioValueCents = investPath.valueAtMonth(lastMonth)
  const totalContributedCents = investPath.contributedAtMonth(lastMonth)
  const totalGainCents = subtractCents(finalPortfolioValueCents, totalContributedCents)
  const afterTaxGainCents = subtractCents(
    totalGainCents,
    percentageOf(totalGainCents, capitalGainsTaxPercent),
  )

  const investSummary = {
    totalContributedCents,
    finalPortfolioValueCents,
    totalGainCents,
    afterTaxGainCents,
    afterTaxPortfolioValueCents: addCents(totalContributedCents, afterTaxGainCents),
  }

  // ── Recommendation ──────────────────────────────────────────────────────
  // Keep the original $100 (10_000 cents) hysteresis so small numerical drift
  // doesn't flip the recommendation between equivalent inputs.
  const lastComparison = yearlyComparisons[yearlyComparisons.length - 1]
  const advantage = lastComparison?.investAdvantageNetCents ?? 0
  const recommendation: 'pay_extra' | 'invest' | 'neutral' =
    advantage > 10000 ? 'invest' : advantage < -10000 ? 'pay_extra' : 'neutral'

  // ── Break-even return rate ──────────────────────────────────────────────
  const breakEvenReturnPercent = findBreakEvenRate(input)

  return {
    input,
    yearlyComparisons,
    payExtraSummary,
    investSummary,
    recommendation,
    breakEvenReturnPercent,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers — all Decimal-based, integer-cents-typed
// ─────────────────────────────────────────────────────────────────────────────

interface MortgageSimulationInput {
  principalCents: Cents
  annualRatePercent: number
  basePaymentCents: Cents
  extraPaymentCents: Cents
  maxMonths: number
}

interface MortgageSimulation {
  cumulativeInterestAtMonth: (month: number) => Cents
  cumulativeExtraAtMonth: (month: number) => Cents
  balanceAtMonth: (month: number) => Cents
  totalInterestCents: () => Cents
  payoffMonth: () => number
}

function simulateMortgage(input: MortgageSimulationInput): MortgageSimulation {
  const { principalCents, annualRatePercent, basePaymentCents, extraPaymentCents, maxMonths } =
    input

  const monthlyRate = new Decimal(annualRatePercent).dividedBy(12).dividedBy(100)

  const cumulativeInterest: Cents[] = []
  const cumulativeExtra: Cents[] = []
  const balances: Cents[] = []

  let balance: Cents = principalCents
  let totalInterest: Cents = cents(0)
  let totalExtra: Cents = cents(0)
  let payoffMonth = maxMonths

  for (let m = 0; m < maxMonths; m++) {
    if (balance <= 0) {
      cumulativeInterest.push(totalInterest)
      cumulativeExtra.push(totalExtra)
      balances.push(cents(0))
      if (payoffMonth === maxMonths) payoffMonth = m
      continue
    }

    // Period interest = balance * monthlyRate, rounded to cents.
    const interestCents =
      annualRatePercent === 0
        ? cents(0)
        : (cents(
            new Decimal(balance)
              .times(monthlyRate)
              .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)
              .toNumber(),
          ) as Cents)

    totalInterest = addCents(totalInterest, interestCents)

    // Principal portion of the regular payment.
    const principalFromPaymentCents = subtractCents(basePaymentCents, interestCents)

    // Cap extra at remaining balance after the regular principal portion.
    const remainingAfterRegular = subtractCents(balance, principalFromPaymentCents)
    const cappedExtra: Cents = (
      extraPaymentCents > remainingAfterRegular
        ? Math.max(0, remainingAfterRegular)
        : extraPaymentCents
    ) as Cents

    // Total principal reduction this month, capped at the outstanding balance
    // so the loan never overshoots into a negative balance.
    const totalPrincipalCents: Cents = Math.min(
      principalFromPaymentCents + cappedExtra,
      balance,
    ) as Cents

    balance = Math.max(0, balance - totalPrincipalCents) as Cents
    totalExtra = addCents(totalExtra, cappedExtra)

    cumulativeInterest.push(totalInterest)
    cumulativeExtra.push(totalExtra)
    balances.push(balance)

    if (balance <= 0 && payoffMonth === maxMonths) {
      payoffMonth = m + 1
    }
  }

  return {
    cumulativeInterestAtMonth: (month: number) =>
      cumulativeInterest[Math.min(month, cumulativeInterest.length - 1)] ?? cents(0),
    cumulativeExtraAtMonth: (month: number) =>
      cumulativeExtra[Math.min(month, cumulativeExtra.length - 1)] ?? cents(0),
    balanceAtMonth: (month: number) => balances[Math.min(month, balances.length - 1)] ?? cents(0),
    totalInterestCents: () => totalInterest,
    payoffMonth: () => payoffMonth,
  }
}

interface InvestmentSimulationInput {
  monthlyContributionCents: Cents
  annualReturnPercent: number
  maxMonths: number
}

interface InvestmentSimulation {
  valueAtMonth: (month: number) => Cents
  contributedAtMonth: (month: number) => Cents
}

function simulateInvestment(input: InvestmentSimulationInput): InvestmentSimulation {
  const { monthlyContributionCents, annualReturnPercent, maxMonths } = input

  const monthlyReturnFactor = new Decimal(annualReturnPercent).dividedBy(12).dividedBy(100).plus(1)

  const values: Cents[] = []
  const contributions: Cents[] = []

  let portfolioValue: Cents = cents(0)
  let totalContributed: Cents = cents(0)

  for (let m = 0; m < maxMonths; m++) {
    // Grow existing portfolio at the monthly factor (1 + r/12), round to cents.
    const grown =
      portfolioValue === 0
        ? cents(0)
        : (cents(
            new Decimal(portfolioValue)
              .times(monthlyReturnFactor)
              .toDecimalPlaces(0, RoundingMode.ROUND_HALF_UP)
              .toNumber(),
          ) as Cents)

    portfolioValue = addCents(grown, monthlyContributionCents)
    totalContributed = addCents(totalContributed, monthlyContributionCents)

    values.push(portfolioValue)
    contributions.push(totalContributed)
  }

  return {
    valueAtMonth: (month: number) => values[Math.min(month, values.length - 1)] ?? cents(0),
    contributedAtMonth: (month: number) =>
      contributions[Math.min(month, contributions.length - 1)] ?? cents(0),
  }
}

interface BuildYearlyComparisonsInput {
  horizonYears: number
  baseline: MortgageSimulation
  payExtra: MortgageSimulation
  investPath: InvestmentSimulation
  mortgageInterestDeductible: boolean
  marginalTaxRatePercent: number
  capitalGainsTaxPercent: number
}

function buildYearlyComparisons(
  input: BuildYearlyComparisonsInput,
): MortgageVsInvestYearlyComparison[] {
  const {
    horizonYears,
    baseline,
    payExtra,
    investPath,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
    capitalGainsTaxPercent,
  } = input

  const out: MortgageVsInvestYearlyComparison[] = []

  for (let year = 1; year <= horizonYears; year++) {
    const monthIndex = year * 12 - 1

    const baselineInterest = baseline.cumulativeInterestAtMonth(monthIndex)
    const payExtraInterest = payExtra.cumulativeInterestAtMonth(monthIndex)

    let interestSavedCents = subtractCents(baselineInterest, payExtraInterest)
    if (mortgageInterestDeductible) {
      // Lost-deduction value reduces the effective interest savings.
      const lostDeduction = percentageOf(interestSavedCents, marginalTaxRatePercent)
      interestSavedCents = subtractCents(interestSavedCents, lostDeduction)
    }

    const portfolioValueCents = investPath.valueAtMonth(monthIndex)
    const contributedCents = investPath.contributedAtMonth(monthIndex)
    const gainCents = subtractCents(portfolioValueCents, contributedCents)
    const afterTaxGainCents = subtractCents(
      gainCents,
      percentageOf(gainCents, capitalGainsTaxPercent),
    )
    const afterTaxPortfolioCents = addCents(contributedCents, afterTaxGainCents)

    out.push({
      year,
      payExtraCumulativePaidCents: payExtra.cumulativeExtraAtMonth(monthIndex),
      payExtraInterestSavedCents: interestSavedCents,
      payExtraRemainingBalanceCents: payExtra.balanceAtMonth(monthIndex),
      investPortfolioValueCents: portfolioValueCents,
      investCumulativeContributedCents: contributedCents,
      investAdvantageNetCents: subtractCents(afterTaxPortfolioCents, interestSavedCents),
    })
  }

  return out
}

/**
 * Compute the net invest advantage at the horizon for a given return rate.
 * Extracted so `findBreakEvenRate` can call it without recursing through
 * `calculateMortgageVsInvest`.
 */
function computeAdvantageAtRate(input: MortgageVsInvestInput, returnPercent: number): Cents {
  const {
    currentBalanceCents,
    mortgageRatePercent,
    remainingTermMonths,
    extraMonthlyPaymentCents,
    capitalGainsTaxPercent,
    horizonYears,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
  } = input

  const horizonMonths = horizonYears * 12
  const simulationMonths = Math.max(remainingTermMonths, horizonMonths)

  const monthlyPaymentCents = calculateMonthlyPayment(
    cents(currentBalanceCents),
    mortgageRatePercent,
    remainingTermMonths,
  )

  const baseline = simulateMortgage({
    principalCents: cents(currentBalanceCents),
    annualRatePercent: mortgageRatePercent,
    basePaymentCents: monthlyPaymentCents,
    extraPaymentCents: cents(0),
    maxMonths: simulationMonths,
  })

  const payExtra = simulateMortgage({
    principalCents: cents(currentBalanceCents),
    annualRatePercent: mortgageRatePercent,
    basePaymentCents: monthlyPaymentCents,
    extraPaymentCents: cents(extraMonthlyPaymentCents),
    maxMonths: simulationMonths,
  })

  const investPath = simulateInvestment({
    monthlyContributionCents: cents(extraMonthlyPaymentCents),
    annualReturnPercent: returnPercent,
    maxMonths: horizonMonths,
  })

  const comparisons = buildYearlyComparisons({
    horizonYears,
    baseline,
    payExtra,
    investPath,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
    capitalGainsTaxPercent,
  })

  const last = comparisons[comparisons.length - 1]
  return (last?.investAdvantageNetCents ?? 0) as Cents
}

function findBreakEvenRate(input: MortgageVsInvestInput): number {
  let low = 0
  let high = 30
  const toleranceCents = 1000 // $10

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    const advantage = computeAdvantageAtRate(input, mid)

    if (Math.abs(advantage) < toleranceCents) {
      // Quantize to two decimal places for stable serialization across runs.
      return new Decimal(mid).toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP).toNumber()
    }

    if (advantage > 0) {
      high = mid
    } else {
      low = mid
    }
  }

  return new Decimal((low + high) / 2).toDecimalPlaces(2, RoundingMode.ROUND_HALF_UP).toNumber()
}
