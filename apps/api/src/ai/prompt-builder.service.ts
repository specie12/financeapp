import { Injectable } from '@nestjs/common'
import { DashboardService } from '../dashboard/dashboard.service'
import { GoalsService } from '../goals/goals.service'

@Injectable()
export class PromptBuilderService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly goalsService: GoalsService,
  ) {}

  async buildFinancialContext(householdId: string): Promise<string> {
    const [netWorth, cashFlow, budgetStatus, loans, investments, goals] = await Promise.allSettled([
      this.dashboardService.getNetWorth(householdId, 5),
      this.dashboardService.getCashFlow(householdId),
      this.dashboardService.getBudgetStatus(householdId),
      this.dashboardService.getLoans(householdId),
      this.dashboardService.getInvestments(householdId),
      this.goalsService.getAllProgressWithInsights(householdId),
    ])

    const sections: string[] = []

    // Net Worth
    if (netWorth.status === 'fulfilled') {
      const nw = netWorth.value
      sections.push(`## Net Worth
- Total Assets: $${(nw.totalAssetsCents / 100).toLocaleString()}
- Total Liabilities: $${(nw.totalLiabilitiesCents / 100).toLocaleString()}
- Net Worth: $${(nw.netWorthCents / 100).toLocaleString()}
- Asset Categories: ${nw.assetsByType.map((a) => `${a.type} ($${(a.totalValueCents / 100).toLocaleString()})`).join(', ')}
- Liability Categories: ${nw.liabilitiesByType.map((l) => `${l.type} ($${(l.totalBalanceCents / 100).toLocaleString()})`).join(', ')}`)
    }

    // Cash Flow
    if (cashFlow.status === 'fulfilled') {
      const cf = cashFlow.value
      sections.push(`## Cash Flow
- Monthly Income: $${(cf.totalMonthlyIncomeCents / 100).toLocaleString()}
- Monthly Expenses: $${(cf.totalMonthlyExpensesCents / 100).toLocaleString()}
- Net Monthly Cash Flow: $${(cf.netMonthlyCashFlowCents / 100).toLocaleString()}
- Savings Rate: ${cf.savingsRatePercent}%`)
    }

    // Budget Status
    if (budgetStatus.status === 'fulfilled') {
      const bs = budgetStatus.value
      sections.push(`## Budget Status
- Total Budgeted: $${(bs.totalBudgetedCents / 100).toLocaleString()}
- Total Spent: $${(bs.totalSpentCents / 100).toLocaleString()}
- Over-Budget Categories: ${bs.overBudgetCount}
${bs.budgets.map((b) => `- ${b.categoryName}: ${b.percentUsed}% used ($${(b.spentAmountCents / 100).toLocaleString()} / $${(b.budgetedAmountCents / 100).toLocaleString()})${b.isOverBudget ? ' [OVER BUDGET]' : ''}`).join('\n')}`)
    }

    // Loans
    if (loans.status === 'fulfilled') {
      const l = loans.value
      sections.push(`## Loans & Debt
- Total Outstanding: $${(l.summary.totalOutstandingCents / 100).toLocaleString()}
- Monthly Payments: $${(l.summary.totalMonthlyPaymentCents / 100).toLocaleString()}
- Average Interest Rate: ${l.summary.averageInterestRatePercent}%
${l.loans.map((loan) => `- ${loan.name}: $${(loan.currentBalanceCents / 100).toLocaleString()} at ${loan.interestRatePercent}%`).join('\n')}`)
    }

    // Investments
    if (investments.status === 'fulfilled') {
      const inv = investments.value
      sections.push(`## Investments
- Total Value: $${(inv.summary.totalValueCents / 100).toLocaleString()}
- Cost Basis: $${(inv.summary.totalCostBasisCents / 100).toLocaleString()}
- Unrealized Gain: $${(inv.summary.unrealizedGainCents / 100).toLocaleString()} (${inv.summary.unrealizedGainPercent}%)
${inv.holdings.map((h) => `- ${h.name}: $${(h.valueCents / 100).toLocaleString()} (${h.allocationPercent}%)`).join('\n')}`)
    }

    // Goals
    if (goals.status === 'fulfilled') {
      const g = goals.value
      if (g.length > 0) {
        sections.push(`## Financial Goals
${g.map((goal) => `- ${goal.goal.name} (${goal.goal.type}): ${goal.progressPercent}% complete, $${(goal.remainingAmountCents / 100).toLocaleString()} remaining${goal.onTrack ? '' : ' [OFF TRACK]'}`).join('\n')}`)
      }
    }

    return sections.join('\n\n')
  }
}
