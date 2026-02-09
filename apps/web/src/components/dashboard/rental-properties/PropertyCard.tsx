'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { RentalPropertyMetrics } from '@finance-app/shared-types'

interface PropertyCardProps {
  metrics: RentalPropertyMetrics
  onEdit: () => void
  onDelete: () => void
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PropertyCard({ metrics, onEdit, onDelete }: PropertyCardProps) {
  const { property } = metrics

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{property.name}</CardTitle>
            {property.address && (
              <p className="text-sm text-muted-foreground">{property.address}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value</span>
            <span className="font-medium">{formatDollars(property.currentValueCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monthly Rent</span>
            <span className="font-medium">{formatDollars(property.monthlyRentCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NOI</span>
            <span className="font-medium">{formatDollars(metrics.noiCents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cap Rate</span>
            <span className="font-medium">{metrics.capRatePercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cash-on-Cash</span>
            <span className="font-medium">{metrics.cashOnCashReturnPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GRM</span>
            <span className="font-medium">{metrics.grossRentMultiplier}x</span>
          </div>
          {metrics.dscrRatio !== null && (
            <div className="flex justify-between col-span-2">
              <span className="text-muted-foreground">DSCR</span>
              <span
                className={`font-medium ${metrics.dscrRatio >= 1.25 ? 'text-green-600' : metrics.dscrRatio >= 1 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {metrics.dscrRatio}x
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
