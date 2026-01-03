'use client'

import { useState, useEffect } from 'react'
import type { Asset, AssetType, CreateAssetDto } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset | null
  onSuccess: () => void
  accessToken: string | null
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'investment', label: 'Investment' },
  { value: 'retirement_account', label: 'Retirement Account' },
  { value: 'bank_account', label: 'Bank Account' },
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' },
]

export function AssetModal({ open, onOpenChange, asset, onSuccess, accessToken }: AssetModalProps) {
  const isEditing = !!asset

  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('other')
  const [value, setValue] = useState('')
  const [growthRate, setGrowthRate] = useState('')
  const [dividendYield, setDividendYield] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (asset) {
      setName(asset.name)
      setType(asset.type)
      setValue((asset.currentValueCents / 100).toString())
      setGrowthRate(asset.annualGrowthRatePercent?.toString() || '')
      setDividendYield(asset.dividendYieldPercent?.toString() || '')
    } else {
      setName('')
      setType('other')
      setValue('')
      setGrowthRate('')
      setDividendYield('')
    }
    setError(null)
  }, [asset, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      setError('Not authenticated')
      return
    }

    const valueNum = parseFloat(value)
    if (isNaN(valueNum) || valueNum < 0) {
      setError('Please enter a valid value')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const data: CreateAssetDto = {
        name: name.trim(),
        type,
        currentValueCents: Math.round(valueNum * 100),
        annualGrowthRatePercent: growthRate ? parseFloat(growthRate) : null,
        dividendYieldPercent: dividendYield ? parseFloat(dividendYield) : null,
      }

      if (isEditing && asset) {
        await apiClient.assets.update(asset.id, data)
      } else {
        await apiClient.assets.create(data)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save asset:', err)
      setError('Failed to save asset. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the details of your asset.'
                : 'Add a new asset to track your net worth.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Home, 401k"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as AssetType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">Current Value ($)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="growthRate">Annual Growth Rate (%) - Optional</Label>
              <Input
                id="growthRate"
                type="number"
                step="0.1"
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                placeholder="e.g., 7"
              />
            </div>

            {(type === 'investment' || type === 'retirement_account') && (
              <div className="grid gap-2">
                <Label htmlFor="dividendYield">Dividend Yield (%) - Optional</Label>
                <Input
                  id="dividendYield"
                  type="number"
                  step="0.1"
                  value={dividendYield}
                  onChange={(e) => setDividendYield(e.target.value)}
                  placeholder="e.g., 2.5"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
