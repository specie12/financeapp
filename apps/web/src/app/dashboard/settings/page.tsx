'use client'

import { useEffect, useState, useCallback } from 'react'
import { getAccessToken, createAuthenticatedApiClient } from '@/lib/auth'
import { useHouseholdEntities } from '@/hooks/useHouseholdEntities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetList } from '@/components/settings/finances/AssetList'
import { LiabilityList } from '@/components/settings/finances/LiabilityList'
import { CashFlowList } from '@/components/settings/finances/CashFlowList'
import { GoalList } from '@/components/settings/finances/GoalList'
import type { Goal } from '@finance-app/shared-types'

export default function SettingsFinancesPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [goalsLoading, setGoalsLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    setAccessToken(token)
  }, [])

  const { assets, liabilities, cashFlowItems, isLoading, error, refetch } =
    useHouseholdEntities(accessToken)

  const fetchGoals = useCallback(async () => {
    if (!accessToken) return
    setGoalsLoading(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.goals.list({ limit: 100 })
      setGoals(response.data)
    } catch (err) {
      console.error('Failed to fetch goals:', err)
    } finally {
      setGoalsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleRefetch = () => {
    refetch()
    fetchGoals()
  }

  if (isLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading financial data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">{error}</div>
      </div>
    )
  }

  const incomeItems = cashFlowItems.filter((item) => item.type === 'income')
  const expenseItems = cashFlowItems.filter((item) => item.type === 'expense')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Finances</CardTitle>
          <CardDescription>
            Add, edit, or remove your assets, debts, income, expenses, and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
              <TabsTrigger value="liabilities">Debts ({liabilities.length})</TabsTrigger>
              <TabsTrigger value="income">Income ({incomeItems.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenseItems.length})</TabsTrigger>
              <TabsTrigger value="goals">Goals ({goals.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
              <AssetList assets={assets} onRefresh={handleRefetch} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="liabilities" className="mt-6">
              <LiabilityList
                liabilities={liabilities}
                onRefresh={handleRefetch}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="income" className="mt-6">
              <CashFlowList
                items={incomeItems}
                type="income"
                onRefresh={handleRefetch}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <CashFlowList
                items={expenseItems}
                type="expense"
                onRefresh={handleRefetch}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <GoalList goals={goals} onRefresh={fetchGoals} accessToken={accessToken} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
