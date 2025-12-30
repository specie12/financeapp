'use client'

import { useEffect, useState } from 'react'
import { useNetWorth } from '@/hooks/useNetWorth'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  NetWorthSummary,
  AssetBreakdown,
  LiabilityBreakdown,
  NetWorthProjection,
} from '@/components/dashboard/net-worth'

export default function NetWorthPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    // Get token from localStorage (set during onboarding)
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { data, isLoading, error, refetch } = useNetWorth(accessToken, 5)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Net Worth</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to view your net worth dashboard."
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Net Worth</h1>
        <LoadingState message="Loading net worth data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Net Worth</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Net Worth</h1>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Net Worth</h1>

      <NetWorthSummary data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AssetBreakdown assetsByType={data.assetsByType} totalAssetsCents={data.totalAssetsCents} />
        <LiabilityBreakdown
          liabilitiesByType={data.liabilitiesByType}
          totalLiabilitiesCents={data.totalLiabilitiesCents}
        />
      </div>

      <NetWorthProjection projection={data.projection} />
    </div>
  )
}
