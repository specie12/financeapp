import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AiForecastResponse } from '@finance-app/shared-types'

@Injectable()
export class AiPredictionService {
  constructor(private readonly prisma: PrismaService) {}

  async predictMonthEnd(householdId: string): Promise<AiForecastResponse> {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: { select: { id: true } } },
    })

    if (!household || household.users.length === 0) {
      return {
        predictedEndOfMonthBalanceCents: 0,
        currentBalanceCents: 0,
        projectedIncomeCents: 0,
        projectedExpensesCents: 0,
        confidenceLevel: 'low',
        insights: ['No data available for forecasting.'],
      }
    }

    const userIds = household.users.map((u) => u.id)

    // Get current account balances
    const accounts = await this.prisma.account.findMany({
      where: { userId: { in: userIds } },
    })
    const currentBalanceCents = accounts.reduce((sum, a) => sum + a.balance, 0)

    // Get cash flow items for projected income/expenses
    const cashFlowItems = await this.prisma.cashFlowItem.findMany({
      where: { householdId },
    })

    let projectedMonthlyIncome = 0
    let projectedMonthlyExpenses = 0

    for (const item of cashFlowItems) {
      let monthlyAmount = item.amountCents
      switch (item.frequency) {
        case 'weekly':
          monthlyAmount = (item.amountCents * 52) / 12
          break
        case 'biweekly':
          monthlyAmount = (item.amountCents * 26) / 12
          break
        case 'monthly':
          monthlyAmount = item.amountCents
          break
        case 'quarterly':
          monthlyAmount = item.amountCents / 3
          break
        case 'annually':
          monthlyAmount = item.amountCents / 12
          break
        case 'one_time':
          monthlyAmount = 0
          break
      }

      if (item.type === 'income') {
        projectedMonthlyIncome += monthlyAmount
      } else {
        projectedMonthlyExpenses += monthlyAmount
      }
    }

    // Calculate how much of the month is remaining
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dayOfMonth = now.getDate()
    const remainingRatio = (daysInMonth - dayOfMonth) / daysInMonth

    // Get actual spending so far this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const actualSpending = await this.prisma.transaction.aggregate({
      where: {
        account: { userId: { in: userIds } },
        type: 'expense',
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    })
    const actualSpentSoFar = actualSpending._sum.amount ?? 0

    // Project remaining expenses based on actual spending rate
    const dailySpendingRate = dayOfMonth > 0 ? actualSpentSoFar / dayOfMonth : 0
    const projectedRemainingExpenses = Math.round(dailySpendingRate * (daysInMonth - dayOfMonth))
    const totalProjectedExpenses = actualSpentSoFar + projectedRemainingExpenses

    // Calculate remaining income based on cash flow
    const remainingIncome = Math.round(projectedMonthlyIncome * remainingRatio)

    const predictedEndBalance = currentBalanceCents + remainingIncome - projectedRemainingExpenses

    // Determine confidence
    let confidenceLevel: 'low' | 'medium' | 'high' = 'low'
    if (cashFlowItems.length > 0 && dayOfMonth > 15) {
      confidenceLevel = 'high'
    } else if (cashFlowItems.length > 0 || dayOfMonth > 7) {
      confidenceLevel = 'medium'
    }

    // Generate insights
    const insights: string[] = []
    const netCashFlow = projectedMonthlyIncome - totalProjectedExpenses

    if (netCashFlow > 0) {
      insights.push(`Projected to save $${(netCashFlow / 100).toFixed(2)} this month.`)
    } else if (netCashFlow < 0) {
      insights.push(
        `Projected to overspend by $${(Math.abs(netCashFlow) / 100).toFixed(2)} this month.`,
      )
    }

    if (dailySpendingRate > (projectedMonthlyExpenses / daysInMonth) * 1.2) {
      insights.push(
        'Spending rate is above your monthly average. Consider reducing discretionary spending.',
      )
    }

    if (predictedEndBalance < 0) {
      insights.push('Warning: Account balance may go negative before month end.')
    }

    if (insights.length === 0) {
      insights.push('Cash flow is on track for this month.')
    }

    return {
      predictedEndOfMonthBalanceCents: Math.round(predictedEndBalance),
      currentBalanceCents,
      projectedIncomeCents: Math.round(projectedMonthlyIncome),
      projectedExpensesCents: Math.round(totalProjectedExpenses),
      confidenceLevel,
      insights,
    }
  }
}
