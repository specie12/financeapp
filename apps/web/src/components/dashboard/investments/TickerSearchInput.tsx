'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Check, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useDebouncedTickerSearch } from '@/hooks/useMarketData'
import { formatPercent } from '@/lib/format'
import type { TickerData } from '@finance-app/shared-types'

interface TickerSearchInputProps {
  value?: TickerData | null
  onSelect: (ticker: TickerData | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TickerSearchInput({
  value,
  onSelect,
  placeholder = 'Search tickers (e.g., AAPL, Apple)...',
  disabled = false,
  className,
}: TickerSearchInputProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: searchResults, isLoading } = useDebouncedTickerSearch(searchQuery)

  const handleSelect = useCallback(
    (ticker: TickerData) => {
      onSelect(ticker)
      setOpen(false)
      setSearchQuery('')
    },
    [onSelect],
  )

  const handleClear = useCallback(() => {
    onSelect(null)
    setSearchQuery('')
  }, [onSelect])

  const displayValue = value ? `${value.symbol} - ${value.name}` : ''

  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between', !value && 'text-muted-foreground')}
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span className="truncate">{displayValue || placeholder}</span>
            </div>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              >
                ×
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              ref={inputRef}
              placeholder="Search tickers..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              {isLoading && searchQuery.trim() && <CommandEmpty>Searching...</CommandEmpty>}
              {!isLoading &&
                searchQuery.trim() &&
                (!searchResults || searchResults.length === 0) && (
                  <CommandEmpty>No tickers found.</CommandEmpty>
                )}
              {!searchQuery.trim() && (
                <CommandEmpty>Start typing to search for tickers...</CommandEmpty>
              )}
              {searchResults && searchResults.length > 0 && (
                <CommandGroup>
                  {searchResults.map((ticker: TickerData) => (
                    <CommandItem
                      key={ticker.symbol}
                      value={ticker.symbol}
                      onSelect={() => handleSelect(ticker)}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{ticker.symbol}</span>
                          {ticker.sector && (
                            <Badge variant="secondary" className="text-xs">
                              {ticker.sector}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{ticker.name}</span>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="font-medium">${ticker.currentPrice.toFixed(2)}</span>
                        <div
                          className={cn(
                            'flex items-center space-x-1 text-sm',
                            ticker.dayChange >= 0 ? 'text-green-600' : 'text-red-600',
                          )}
                        >
                          {ticker.dayChange >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{formatPercent(ticker.dayChange)}</span>
                        </div>
                      </div>
                      {value && value.symbol === ticker.symbol && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected ticker details */}
      {value && (
        <div className="rounded-md border bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{value.symbol}</span>
                  {value.sector && (
                    <Badge variant="secondary" className="text-xs">
                      {value.sector}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{value.name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">${value.currentPrice.toFixed(2)}</div>
              <div
                className={cn(
                  'flex items-center space-x-1 text-sm',
                  value.dayChange >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {value.dayChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercent(value.dayChange)}</span>
              </div>
            </div>
          </div>

          {/* Performance metrics */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="text-muted-foreground">1W</div>
              <div
                className={cn(
                  'font-medium',
                  value.weekChange >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatPercent(value.weekChange)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">1M</div>
              <div
                className={cn(
                  'font-medium',
                  value.monthChange >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatPercent(value.monthChange)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">YTD</div>
              <div
                className={cn(
                  'font-medium',
                  value.ytdChange >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatPercent(value.ytdChange)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">1Y</div>
              <div
                className={cn(
                  'font-medium',
                  value.yearChange >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                {formatPercent(value.yearChange)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
