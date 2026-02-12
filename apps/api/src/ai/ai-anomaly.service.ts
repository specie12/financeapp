import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { AiAnomaly } from '@finance-app/shared-types'

@Injectable()
export class AiAnomalyService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAnomalies(
    householdId: string,
  ): Promise<{ anomalies: AiAnomaly[]; hasAnomalies: boolean }> {
    // Get the household's users
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: { users: { select: { id: true } } },
    })

    if (!household || household.users.length === 0) {
      return { anomalies: [], hasAnomalies: false }
    }

    const userIds = household.users.map((u) => u.id)

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get recent transactions (last 30 days)
    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId: { in: userIds } },
        type: 'expense',
        date: { gte: thirtyDaysAgo },
      },
      include: { category: true },
    })

    // Get historical transactions (30-60 days ago)
    const historicalTransactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId: { in: userIds } },
        type: 'expense',
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      include: { category: true },
    })

    // Group by category
    const recentByCategory = new Map<string, { total: number; name: string }>()
    for (const txn of recentTransactions) {
      const key = txn.categoryId || 'uncategorized'
      const existing = recentByCategory.get(key) || {
        total: 0,
        name: txn.category?.name || 'Uncategorized',
      }
      existing.total += txn.amount
      recentByCategory.set(key, existing)
    }

    const historicalByCategory = new Map<string, { total: number; name: string }>()
    for (const txn of historicalTransactions) {
      const key = txn.categoryId || 'uncategorized'
      const existing = historicalByCategory.get(key) || {
        total: 0,
        name: txn.category?.name || 'Uncategorized',
      }
      existing.total += txn.amount
      historicalByCategory.set(key, existing)
    }

    // Compare and detect anomalies
    const anomalies: AiAnomaly[] = []

    for (const [categoryId, recent] of recentByCategory) {
      const historical = historicalByCategory.get(categoryId)

      if (!historical || historical.total === 0) continue

      const deviationPercent = ((recent.total - historical.total) / historical.total) * 100

      // Flag if spending increased by more than 50%
      if (deviationPercent > 50 && recent.total > 5000) {
        // Over $50 minimum
        let severity: 'low' | 'medium' | 'high' = 'low'
        if (deviationPercent > 200) severity = 'high'
        else if (deviationPercent > 100) severity = 'medium'

        anomalies.push({
          category: recent.name,
          currentAmountCents: recent.total,
          averageAmountCents: historical.total,
          deviationPercent: Math.round(deviationPercent),
          severity,
          message: `${recent.name} spending is up ${Math.round(deviationPercent)}% compared to the previous month ($${(recent.total / 100).toFixed(2)} vs $${(historical.total / 100).toFixed(2)}).`,
        })
      }
    }

    // Sort by severity (high first)
    const severityOrder = { high: 0, medium: 1, low: 2 }
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return { anomalies, hasAnomalies: anomalies.length > 0 }
  }
}
