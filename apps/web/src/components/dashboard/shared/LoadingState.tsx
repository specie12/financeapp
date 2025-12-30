'use client'

import { Card, CardContent } from '@/components/ui/card'

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </CardContent>
    </Card>
  )
}
