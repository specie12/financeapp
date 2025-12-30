'use client'

import { formatCents, formatCentsCompact } from '@/lib/dashboard/formatters'
import { cn } from '@/lib/utils'

interface MoneyDisplayProps {
  cents: number
  compact?: boolean
  showSign?: boolean
  colorCode?: boolean
  className?: string
}

export function MoneyDisplay({
  cents,
  compact = false,
  showSign = false,
  colorCode = false,
  className,
}: MoneyDisplayProps) {
  const formatted = compact ? formatCentsCompact(cents) : formatCents(cents)
  const display = showSign && cents > 0 ? `+${formatted}` : formatted

  return (
    <span
      className={cn(
        colorCode && cents > 0 && 'text-green-600',
        colorCode && cents < 0 && 'text-red-600',
        className,
      )}
    >
      {display}
    </span>
  )
}
