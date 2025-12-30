'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, subtitle, trend, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600',
                )}
              >
                {trend.value}
              </span>
            )}
            {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
