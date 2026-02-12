'use client'

import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SpendingSuggestionRowProps {
  categoryName: string
  averageCents: number
  suggestedCents: number
  overrideDollars: string
  selected: boolean
  disabled: boolean
  onToggle: () => void
  onOverrideChange: (value: string) => void
}

export function SpendingSuggestionRow({
  categoryName,
  averageCents,
  suggestedCents,
  overrideDollars,
  selected,
  disabled,
  onToggle,
  onOverrideChange,
}: SpendingSuggestionRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 py-2 px-2 rounded-md',
        disabled && 'opacity-50',
        selected && !disabled && 'bg-muted/50',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        onChange={onToggle}
        className="h-4 w-4 rounded border-gray-300 accent-primary"
      />
      <span className="flex-1 text-sm font-medium truncate">{categoryName}</span>
      <span className="text-sm text-muted-foreground w-24 text-right">
        {formatCurrency(averageCents)}/mo
      </span>
      <span className="text-sm text-muted-foreground w-24 text-right">
        {formatCurrency(suggestedCents)}
      </span>
      <Input
        type="number"
        min="0"
        step="1"
        value={overrideDollars}
        onChange={(e) => onOverrideChange(e.target.value)}
        disabled={disabled || !selected}
        className="w-24 text-right"
        placeholder="$0"
      />
    </div>
  )
}
