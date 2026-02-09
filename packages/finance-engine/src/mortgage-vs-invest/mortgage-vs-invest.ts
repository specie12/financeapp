import type {
  MortgageVsInvestInput,
  MortgageVsInvestResult,
  MortgageVsInvestYearlyComparison,
} from './mortgage-vs-invest.types'

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

  const monthlyMortgageRate = mortgageRatePercent / 100 / 12
  const horizonMonths = horizonYears * 12

  // Calculate standard monthly payment (PMT formula)
  const monthlyPayment = calculatePMT(currentBalanceCents, monthlyMortgageRate, remainingTermMonths)

  // === Simulate no-extra path (baseline) ===
  const baseline = simulateMortgage(
    currentBalanceCents,
    monthlyMortgageRate,
    monthlyPayment,
    0,
    Math.max(remainingTermMonths, horizonMonths),
  )

  // === Simulate pay-extra path ===
  const payExtra = simulateMortgage(
    currentBalanceCents,
    monthlyMortgageRate,
    monthlyPayment,
    extraMonthlyPaymentCents,
    Math.max(remainingTermMonths, horizonMonths),
  )

  // === Simulate invest path ===
  const monthlyReturnRate = expectedReturnPercent / 100 / 12
  const investPath = simulateInvestment(extraMonthlyPaymentCents, monthlyReturnRate, horizonMonths)

  // === Build yearly comparisons ===
  const yearlyComparisons = buildYearlyComparisons(
    horizonYears,
    baseline,
    payExtra,
    investPath,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
    capitalGainsTaxPercent,
  )

  // === Pay extra summary ===
  const totalInterestWithout = baseline.totalInterest()
  const totalInterestWith = payExtra.totalInterest()
  const payExtraSummary = {
    totalInterestWithoutExtraCents: totalInterestWithout,
    totalInterestWithExtraCents: totalInterestWith,
    interestSavedCents: totalInterestWithout - totalInterestWith,
    originalPayoffMonths: baseline.payoffMonth(),
    newPayoffMonths: payExtra.payoffMonth(),
    monthsSaved: baseline.payoffMonth() - payExtra.payoffMonth(),
  }

  // === Invest summary ===
  const lastMonth = horizonMonths - 1
  const finalValue = investPath.valueAtMonth(lastMonth)
  const totalContributed = investPath.contributedAtMonth(lastMonth)
  const totalGain = finalValue - totalContributed
  const afterTaxGain = Math.round(totalGain * (1 - capitalGainsTaxPercent / 100))

  const investSummary = {
    totalContributedCents: totalContributed,
    finalPortfolioValueCents: finalValue,
    totalGainCents: totalGain,
    afterTaxGainCents: afterTaxGain,
    afterTaxPortfolioValueCents: totalContributed + afterTaxGain,
  }

  // === Recommendation ===
  const lastComparison = yearlyComparisons[yearlyComparisons.length - 1]
  const advantage = lastComparison?.investAdvantageNetCents ?? 0
  const recommendation = advantage > 10000 ? 'invest' : advantage < -10000 ? 'pay_extra' : 'neutral'

  // === Breakeven ===
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

// ============================================
// Internal helpers
// ============================================

function calculatePMT(principal: number, monthlyRate: number, termMonths: number): number {
  if (monthlyRate === 0) return Math.round(principal / termMonths)
  const factor = Math.pow(1 + monthlyRate, termMonths)
  return Math.round((principal * monthlyRate * factor) / (factor - 1))
}

interface MortgageSimulation {
  cumulativeInterestAtMonth: (month: number) => number
  cumulativeExtraAtMonth: (month: number) => number
  balanceAtMonth: (month: number) => number
  totalInterest: () => number
  payoffMonth: () => number
}

function simulateMortgage(
  principal: number,
  monthlyRate: number,
  basePayment: number,
  extraPayment: number,
  maxMonths: number,
): MortgageSimulation {
  const cumulativeInterest: number[] = []
  const cumulativeExtra: number[] = []
  const balances: number[] = []

  let balance = principal
  let totalInterest = 0
  let totalExtra = 0
  let payoffMonth = maxMonths

  for (let m = 0; m < maxMonths; m++) {
    if (balance <= 0) {
      cumulativeInterest.push(totalInterest)
      cumulativeExtra.push(totalExtra)
      balances.push(0)
      if (payoffMonth === maxMonths) payoffMonth = m
      continue
    }

    const interest = Math.round(balance * monthlyRate)
    totalInterest += interest

    const principalPayment = basePayment - interest
    let extra = extraPayment

    // Cap total principal reduction at remaining balance
    if (principalPayment + extra > balance) {
      extra = Math.max(0, balance - principalPayment)
    }
    const totalPrincipal = Math.min(principalPayment + extra, balance)

    balance = Math.max(0, balance - totalPrincipal)
    totalExtra += extra

    cumulativeInterest.push(totalInterest)
    cumulativeExtra.push(totalExtra)
    balances.push(balance)

    if (balance <= 0 && payoffMonth === maxMonths) {
      payoffMonth = m + 1
    }
  }

  return {
    cumulativeInterestAtMonth: (month: number) =>
      cumulativeInterest[Math.min(month, cumulativeInterest.length - 1)] ?? 0,
    cumulativeExtraAtMonth: (month: number) =>
      cumulativeExtra[Math.min(month, cumulativeExtra.length - 1)] ?? 0,
    balanceAtMonth: (month: number) => balances[Math.min(month, balances.length - 1)] ?? 0,
    totalInterest: () => totalInterest,
    payoffMonth: () => payoffMonth,
  }
}

interface InvestmentSimulation {
  valueAtMonth: (month: number) => number
  contributedAtMonth: (month: number) => number
}

function simulateInvestment(
  monthlyContribution: number,
  monthlyReturnRate: number,
  maxMonths: number,
): InvestmentSimulation {
  const values: number[] = []
  const contributions: number[] = []

  let portfolioValue = 0
  let totalContributed = 0

  for (let m = 0; m < maxMonths; m++) {
    // Grow existing portfolio
    portfolioValue = Math.round(portfolioValue * (1 + monthlyReturnRate))
    // Add new contribution
    portfolioValue += monthlyContribution
    totalContributed += monthlyContribution

    values.push(portfolioValue)
    contributions.push(totalContributed)
  }

  return {
    valueAtMonth: (month: number) => values[Math.min(month, values.length - 1)] ?? 0,
    contributedAtMonth: (month: number) =>
      contributions[Math.min(month, contributions.length - 1)] ?? 0,
  }
}

function buildYearlyComparisons(
  horizonYears: number,
  baseline: MortgageSimulation,
  payExtra: MortgageSimulation,
  investPath: InvestmentSimulation,
  mortgageInterestDeductible: boolean,
  marginalTaxRatePercent: number,
  capitalGainsTaxPercent: number,
): MortgageVsInvestYearlyComparison[] {
  const yearlyComparisons: MortgageVsInvestYearlyComparison[] = []

  for (let year = 1; year <= horizonYears; year++) {
    const monthIndex = year * 12 - 1 // 0-indexed month at year boundary

    const baselineInterest = baseline.cumulativeInterestAtMonth(monthIndex)
    const payExtraInterest = payExtra.cumulativeInterestAtMonth(monthIndex)

    let interestSaved = baselineInterest - payExtraInterest
    // Adjust for lost tax deduction if mortgage interest is deductible
    if (mortgageInterestDeductible) {
      const deductionLost = interestSaved * (marginalTaxRatePercent / 100)
      interestSaved = Math.round(interestSaved - deductionLost)
    }

    const portfolioValue = investPath.valueAtMonth(monthIndex)
    const contributed = investPath.contributedAtMonth(monthIndex)
    const gain = portfolioValue - contributed
    const afterTaxGain = Math.round(gain * (1 - capitalGainsTaxPercent / 100))
    const afterTaxPortfolio = contributed + afterTaxGain

    yearlyComparisons.push({
      year,
      payExtraCumulativePaidCents: payExtra.cumulativeExtraAtMonth(monthIndex),
      payExtraInterestSavedCents: interestSaved,
      payExtraRemainingBalanceCents: payExtra.balanceAtMonth(monthIndex),
      investPortfolioValueCents: portfolioValue,
      investCumulativeContributedCents: contributed,
      investAdvantageNetCents: afterTaxPortfolio - interestSaved,
    })
  }

  return yearlyComparisons
}

/**
 * Computes the net invest advantage at the end of the horizon for a given
 * return rate. This is the core simulation logic extracted so that
 * findBreakEvenRate can call it without triggering a circular dependency
 * through calculateMortgageVsInvest.
 */
function computeAdvantageAtRate(input: MortgageVsInvestInput, returnPercent: number): number {
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

  const monthlyMortgageRate = mortgageRatePercent / 100 / 12
  const horizonMonths = horizonYears * 12

  const monthlyPayment = calculatePMT(currentBalanceCents, monthlyMortgageRate, remainingTermMonths)

  const baseline = simulateMortgage(
    currentBalanceCents,
    monthlyMortgageRate,
    monthlyPayment,
    0,
    Math.max(remainingTermMonths, horizonMonths),
  )

  const payExtra = simulateMortgage(
    currentBalanceCents,
    monthlyMortgageRate,
    monthlyPayment,
    extraMonthlyPaymentCents,
    Math.max(remainingTermMonths, horizonMonths),
  )

  const monthlyReturnRate = returnPercent / 100 / 12
  const investPath = simulateInvestment(extraMonthlyPaymentCents, monthlyReturnRate, horizonMonths)

  const comparisons = buildYearlyComparisons(
    horizonYears,
    baseline,
    payExtra,
    investPath,
    mortgageInterestDeductible,
    marginalTaxRatePercent,
    capitalGainsTaxPercent,
  )

  const lastComparison = comparisons[comparisons.length - 1]
  return lastComparison?.investAdvantageNetCents ?? 0
}

function findBreakEvenRate(input: MortgageVsInvestInput): number {
  let low = 0
  let high = 30
  const tolerance = 1000 // $10 in cents

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2
    const advantage = computeAdvantageAtRate(input, mid)

    if (Math.abs(advantage) < tolerance) {
      return Math.round(mid * 100) / 100
    }

    if (advantage > 0) {
      high = mid
    } else {
      low = mid
    }
  }

  return Math.round(((low + high) / 2) * 100) / 100
}
