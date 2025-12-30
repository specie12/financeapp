'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useScenarioProjection } from '@/hooks/useScenarioProjection'
import { useScenarios } from '@/hooks/useScenarios'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { DashboardCard } from '@/components/dashboard/shared/DashboardCard'
import { MoneyDisplay } from '@/components/dashboard/shared/MoneyDisplay'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ScenarioDetailPage() {
  const router = useRouter()
  const params = useParams()
  const scenarioId = params.id as string

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [horizonYears, setHorizonYears] = useState(5)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { projection, isLoading, error, refetch } = useScenarioProjection(
    accessToken,
    scenarioId,
    horizonYears,
  )
  const { deleteScenario } = useScenarios(accessToken)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      try {
        await deleteScenario(scenarioId)
        router.push('/dashboard/scenarios')
      } catch (err) {
        console.error('Failed to delete scenario:', err)
      }
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenario Projection</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view scenario projections."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenario Projection</h1>
        <LoadingState message="Calculating projection..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenario Projection</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!projection) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenario Projection</h1>
        <ErrorState message="Projection not found" />
      </div>
    )
  }

  const { scenario, yearlySnapshots, summary } = projection
  const maxAssets = Math.max(...yearlySnapshots.map((p) => p.totalAssetsCents))
  const maxLiabilities = Math.max(...yearlySnapshots.map((p) => p.totalLiabilitiesCents))
  const maxValue = Math.max(maxAssets, maxLiabilities)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/scenarios"
              className="text-muted-foreground hover:text-foreground"
            >
              Scenarios
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-3xl font-bold">{scenario.name}</h1>
            {scenario.isBaseline && (
              <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                Baseline
              </span>
            )}
          </div>
          {scenario.description && (
            <p className="text-muted-foreground mt-1">{scenario.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/scenarios/${scenario.id}/edit`}>
            <Button variant="outline">Edit Scenario</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Horizon selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Projection horizon:</span>
        <Select value={horizonYears.toString()} onValueChange={(v) => setHorizonYears(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 years</SelectItem>
            <SelectItem value="10">10 years</SelectItem>
            <SelectItem value="15">15 years</SelectItem>
            <SelectItem value="20">20 years</SelectItem>
            <SelectItem value="30">30 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Starting Net Worth">
          <MoneyDisplay cents={summary.startingNetWorthCents} className="text-2xl font-bold" />
        </DashboardCard>
        <DashboardCard title="Ending Net Worth">
          <MoneyDisplay cents={summary.endingNetWorthCents} className="text-2xl font-bold" />
        </DashboardCard>
        <DashboardCard title="Net Worth Change">
          <MoneyDisplay
            cents={summary.netWorthChangeCents}
            showSign
            colorCode
            className="text-2xl font-bold"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {summary.netWorthChangePercent >= 0 ? '+' : ''}
            {summary.netWorthChangePercent.toFixed(1)}%
          </p>
        </DashboardCard>
        <DashboardCard title="Total Debt Paid">
          <MoneyDisplay cents={summary.totalDebtPaidCents} className="text-2xl font-bold" />
          <p className="text-sm text-muted-foreground mt-1">
            Interest: <MoneyDisplay cents={summary.totalInterestPaidCents} compact />
          </p>
        </DashboardCard>
      </div>

      {/* Projection Table */}
      <DashboardCard title="Year-by-Year Projection" description="Detailed financial forecast">
        <div className="space-y-4">
          {/* Header */}
          <div className="grid grid-cols-5 text-sm font-medium text-muted-foreground border-b pb-2">
            <span>Year</span>
            <span className="text-right">Assets</span>
            <span className="text-right">Liabilities</span>
            <span className="text-right">Net Worth</span>
            <span className="text-right">Cash Flow</span>
          </div>

          {/* Data rows */}
          <div className="space-y-2">
            {yearlySnapshots.map((point) => {
              const year = new Date(point.date).getFullYear()
              return (
                <div key={point.year} className="grid grid-cols-5 text-sm">
                  <span className="font-medium">
                    {point.year === 0 ? 'Now' : `Year ${point.year}`}
                    <span className="text-xs text-muted-foreground ml-1">({year})</span>
                  </span>
                  <span className="text-right">
                    <MoneyDisplay cents={point.totalAssetsCents} compact />
                  </span>
                  <span className="text-right">
                    <MoneyDisplay cents={point.totalLiabilitiesCents} compact />
                  </span>
                  <span className="text-right font-medium">
                    <MoneyDisplay cents={point.netWorthCents} compact colorCode />
                  </span>
                  <span className="text-right">
                    <MoneyDisplay cents={point.netCashFlowCents} compact colorCode />
                  </span>
                </div>
              )
            })}
          </div>

          {/* Visual bar chart */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Visual Projection</p>
            <div className="space-y-2">
              {yearlySnapshots.map((point) => {
                const assetsWidth = maxValue > 0 ? (point.totalAssetsCents / maxValue) * 100 : 0
                const liabilitiesWidth =
                  maxValue > 0 ? (point.totalLiabilitiesCents / maxValue) * 100 : 0

                return (
                  <div key={`bar-${point.year}`} className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {point.year === 0 ? 'Now' : `Year ${point.year}`}
                    </span>
                    <div className="flex gap-1 h-4">
                      <div
                        className="bg-green-500 rounded-sm"
                        style={{ width: `${assetsWidth}%` }}
                        title={`Assets: $${(point.totalAssetsCents / 100).toLocaleString()}`}
                      />
                      <div
                        className="bg-red-400 rounded-sm"
                        style={{ width: `${liabilitiesWidth}%` }}
                        title={`Liabilities: $${(point.totalLiabilitiesCents / 100).toLocaleString()}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-500 rounded-sm" /> Assets
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-400 rounded-sm" /> Liabilities
              </span>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Override Summary */}
      {scenario.overrides.length > 0 && (
        <DashboardCard
          title="Applied Overrides"
          description={`${scenario.overrides.length} override(s) in this scenario`}
        >
          <div className="space-y-2">
            {scenario.overrides.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
              >
                <span className="text-muted-foreground">
                  <span className="capitalize">{override.targetType.replace('_', ' ')}</span>
                  {' → '}
                  {override.fieldName}
                </span>
                <span className="font-mono">{override.value}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}
    </div>
  )
}
