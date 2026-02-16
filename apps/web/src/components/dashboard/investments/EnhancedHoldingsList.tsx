'use client'

import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { formatPercent, getAssetTypeLabel } from '@/lib/dashboard/formatters'
import { cn } from '@/lib/utils'
import type { EnhancedHolding } from '@finance-app/shared-types'

interface EnhancedHoldingsListProps {
  holdings: EnhancedHolding[]
  isLoading?: boolean
}

export function EnhancedHoldingsList({ holdings, isLoading }: EnhancedHoldingsListProps) {
  if (isLoading) {
    return (
      <DashboardCard title="Holdings">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                </div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </DashboardCard>
    )
  }

  if (holdings.length === 0) {
    return (
      <DashboardCard title="Holdings">
        <p className="text-muted-foreground text-center py-8">
          No investment holdings recorded yet
        </p>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Holdings" description={`${holdings.length} positions`}>
      <div className="space-y-4">
        {holdings.map((holding) => (
          <div key={holding.id} className="space-y-3 pb-4 border-b last:border-b-0">
            {/* Header with name, ticker, and value */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium truncate">{holding.name}</h4>
                  {holding.ticker && (
                    <Badge variant="secondary" className="text-xs font-mono">
                      {holding.ticker.symbol}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{getAssetTypeLabel(holding.type)}</span>
                  {holding.sector && (
                    <>
                      <span>•</span>
                      <span>{holding.sector}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  <MoneyDisplay cents={holding.valueCents} />
                </p>
                <p
                  className={cn(
                    'text-sm',
                    holding.gainLossCents >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  <MoneyDisplay cents={holding.gainLossCents} showSign /> (
                  {formatPercent(holding.gainLossPercent)})
                </p>
              </div>
            </div>

            {/* Real-time ticker info */}
            {holding.ticker && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Price</div>
                  <div className="font-semibold">
                    ${holding.ticker.currentPrice.toFixed(2)}
                    {holding.shares && (
                      <span className="text-sm text-muted-foreground ml-1">
                        × {holding.shares.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Today</div>
                  <div
                    className={cn(
                      'flex items-center space-x-1 font-semibold text-sm',
                      holding.ticker.dayChange >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {holding.ticker.dayChange >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{formatPercent(holding.ticker.dayChange)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Performance metrics */}
            {holding.performance && (
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-muted-foreground">1W</div>
                  <div
                    className={cn(
                      'font-medium',
                      holding.performance.weekChange >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatPercent(holding.performance.weekChange)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">1M</div>
                  <div
                    className={cn(
                      'font-medium',
                      holding.performance.monthChange >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatPercent(holding.performance.monthChange)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">YTD</div>
                  <div
                    className={cn(
                      'font-medium',
                      holding.performance.ytdChange >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatPercent(holding.performance.ytdChange)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">1Y</div>
                  <div
                    className={cn(
                      'font-medium',
                      holding.performance.yearChange >= 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {formatPercent(holding.performance.yearChange)}
                  </div>
                </div>
              </div>
            )}

            {/* Allocation bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Allocation</span>
                <span className="font-medium">{holding.allocationPercent.toFixed(1)}%</span>
              </div>
              <Progress value={holding.allocationPercent} className="h-2" />
            </div>

            {/* Cost basis and last update */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>
                  Cost Basis: <MoneyDisplay cents={holding.costBasisCents} />
                </span>
                {holding.ticker && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated: {holding.ticker.lastUpdated.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  )
}
