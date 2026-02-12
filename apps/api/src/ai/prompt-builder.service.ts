import { Injectable } from '@nestjs/common'
import { DashboardService } from '../dashboard/dashboard.service'
import { GoalsService } from '../goals/goals.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class PromptBuilderService {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly goalsService: GoalsService,
    private readonly prisma: PrismaService,
  ) {}

  async buildFinancialContext(householdId: string): Promise<string> {
    const [
      netWorth,
      cashFlow,
      budgetStatus,
      loans,
      investments,
      goals,
      recentTransactions,
      accountBalances,
    ] = await Promise.allSettled([
      this.dashboardService.getNetWorth(householdId, 5),
      this.dashboardService.getCashFlow(householdId),
      this.dashboardService.getBudgetStatus(householdId),
      this.dashboardService.getLoans(householdId),
      this.dashboardService.getInvestments(householdId),
      this.goalsService.getAllProgressWithInsights(householdId),
      this.getRecentTransactionsSummary(householdId),
      this.getAccountBalances(householdId),
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

    // Recent Transactions Summary
    if (recentTransactions.status === 'fulfilled' && recentTransactions.value) {
      sections.push(recentTransactions.value)
    }

    // Account Balances
    if (accountBalances.status === 'fulfilled' && accountBalances.value) {
      sections.push(accountBalances.value)
    }

    return sections.join('\n\n')
  }

  private async getRecentTransactionsSummary(householdId: string): Promise<string | null> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: { select: { id: true } } },
    })

    if (!household || household.users.length === 0) return null

    const userIds = household.users.map((u) => u.id)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId: { in: userIds } },
        date: { gte: thirtyDaysAgo },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: 100,
    })

    if (transactions.length === 0) return null

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Top spending categories
    const categorySpending = new Map<string, number>()
    for (const txn of transactions.filter((t) => t.type === 'expense')) {
      const name = txn.category?.name || 'Uncategorized'
      categorySpending.set(name, (categorySpending.get(name) || 0) + txn.amount)
    }
    const topCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return `## Recent Transactions (Last 30 Days)
- Total Income: $${(totalIncome / 100).toLocaleString()}
- Total Expenses: $${(totalExpenses / 100).toLocaleString()}
- Transaction Count: ${transactions.length}
- Top Spending Categories:
${topCategories.map(([name, amount]) => `  - ${name}: $${(amount / 100).toLocaleString()}`).join('\n')}`
  }

  private async getAccountBalances(householdId: string): Promise<string | null> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: { select: { id: true } } },
    })

    if (!household || household.users.length === 0) return null

    const userIds = household.users.map((u) => u.id)

    const accounts = await this.prisma.account.findMany({
      where: { userId: { in: userIds } },
    })

    if (accounts.length === 0) return null

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

    return `## Account Balances
- Total Balance: $${(totalBalance / 100).toLocaleString()}
${accounts.map((a) => `- ${a.name} (${a.type}): $${(a.balance / 100).toLocaleString()}`).join('\n')}`
  }
}
