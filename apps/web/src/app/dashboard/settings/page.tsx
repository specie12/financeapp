'use client'

import { useEffect, useState } from 'react'
import { getAccessToken } from '@/lib/auth'
import { useHouseholdEntities } from '@/hooks/useHouseholdEntities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetList } from '@/components/settings/finances/AssetList'
import { LiabilityList } from '@/components/settings/finances/LiabilityList'
import { CashFlowList } from '@/components/settings/finances/CashFlowList'

export default function SettingsFinancesPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    setAccessToken(token)
  }, [])

  const { assets, liabilities, cashFlowItems, isLoading, error, refetch } =
    useHouseholdEntities(accessToken)

  if (isLoading) {
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
            Add, edit, or remove your assets, debts, income, and expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="assets" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger>
              <TabsTrigger value="liabilities">Debts ({liabilities.length})</TabsTrigger>
              <TabsTrigger value="income">Income ({incomeItems.length})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({expenseItems.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="mt-6">
              <AssetList assets={assets} onRefresh={refetch} accessToken={accessToken} />
            </TabsContent>

            <TabsContent value="liabilities" className="mt-6">
              <LiabilityList
                liabilities={liabilities}
                onRefresh={refetch}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="income" className="mt-6">
              <CashFlowList
                items={incomeItems}
                type="income"
                onRefresh={refetch}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <CashFlowList
                items={expenseItems}
                type="expense"
                onRefresh={refetch}
                accessToken={accessToken}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
