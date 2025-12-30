'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  action,
}: DashboardCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
