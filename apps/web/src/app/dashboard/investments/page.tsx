'use client'

import { useEffect, useState } from 'react'

// Force dynamic rendering for this page due to React Query usage
export const dynamic = 'force-dynamic'
import { useEnhancedInvestments } from '@/hooks/useEnhancedInvestments'
import { useEnhancedInvestmentsWithTickers, useMarketSummary } from '@/hooks/useMarketData'
import { useGoals } from '@/hooks/useGoals'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  PortfolioSummary,
  HoldingsList,
  AllocationChart,
  DividendProjectionCard,
} from '@/components/dashboard/investments'
import { EnhancedHoldingsList } from '@/components/dashboard/investments/EnhancedHoldingsList'
import { GoalsSummaryCard } from '@/components/dashboard/goals'
import type { TickerData } from '@finance-app/shared-types'

export default function InvestmentsPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useEnhancedInvestments(accessToken)
  const {
    data: tickerData,
    isLoading: tickerLoading,
    error: tickerError,
  } = useEnhancedInvestmentsWithTickers()
  const { data: marketSummary } = useMarketSummary()
  const { goals } = useGoals(accessToken)

  // Use ticker-enhanced data if available, otherwise fall back to regular enhanced data
  const investmentData = tickerData || data
  const isLoadingData = isLoading || (tickerLoading && !data)
  const dataError = error || tickerError

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your investments dashboard."
        />
      </div>
    )
  }

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <LoadingState message="Loading investments data..." />
      </div>
    )
  }

  if (dataError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <ErrorState
          message={dataError instanceof Error ? dataError.message : dataError}
          onRetry={refetch}
        />
      </div>
    )
  }

  if (!investmentData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Investments</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Investments</h1>

      <PortfolioSummary
        summary={investmentData.summary}
        holdingCount={investmentData.holdings.length}
      />

      {/* Market Summary */}
      {marketSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Top Gainers</h3>
            <div className="space-y-1">
              {marketSummary.topGainers.slice(0, 3).map((ticker: TickerData) => (
                <div key={ticker.symbol} className="flex justify-between text-sm">
                  <span className="font-medium">{ticker.symbol}</span>
                  <span className="text-green-600">+{ticker.dayChange.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Top Losers</h3>
            <div className="space-y-1">
              {marketSummary.topLosers.slice(0, 3).map((ticker: TickerData) => (
                <div key={ticker.symbol} className="flex justify-between text-sm">
                  <span className="font-medium">{ticker.symbol}</span>
                  <span className="text-red-600">{ticker.dayChange.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Most Active</h3>
            <div className="space-y-1">
              {marketSummary.mostActive.slice(0, 3).map((ticker: TickerData) => (
                <div key={ticker.symbol} className="flex justify-between text-sm">
                  <span className="font-medium">{ticker.symbol}</span>
                  <span className="text-muted-foreground">${ticker.currentPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {investmentData.holdings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No investment holdings recorded yet. Add investment or retirement account assets during
          onboarding to see them here.
        </p>
      ) : (
        <>
          {/* Dividend & Goals Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DividendProjectionCard
              projections={investmentData.dividendProjections}
              totalAnnualCents={investmentData.totalAnnualDividendsCents}
              totalMonthlyCents={investmentData.totalMonthlyDividendsCents}
            />
            <GoalsSummaryCard goals={goals} title="Investment Goals" filterType="savings_target" />
          </div>

          {/* Holdings & Allocation Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tickerData?.enhancedHoldings ? (
              <EnhancedHoldingsList
                holdings={tickerData.enhancedHoldings}
                isLoading={tickerLoading}
              />
            ) : (
              <HoldingsList holdings={investmentData.holdings} />
            )}
            <AllocationChart holdings={investmentData.holdings} />
          </div>

          {/* Portfolio Performance */}
          {tickerData?.portfolioPerformance && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total Value</div>
                <div className="font-semibold">
                  ${(tickerData.portfolioPerformance.totalValueCents / 100).toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Day Change</div>
                <div
                  className={`font-semibold ${tickerData.portfolioPerformance.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {tickerData.portfolioPerformance.dayChangePercent >= 0 ? '+' : ''}
                  {tickerData.portfolioPerformance.dayChangePercent.toFixed(2)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Sectors</div>
                <div className="font-semibold">{tickerData.sectorAllocations.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Top Sector</div>
                <div className="font-semibold text-sm">
                  {tickerData.sectorAllocations[0]?.sector || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
