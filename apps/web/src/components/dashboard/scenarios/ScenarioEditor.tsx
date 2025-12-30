'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type {
  Scenario,
  CreateScenarioDto,
  CreateScenarioOverrideDto,
  Asset,
  Liability,
  CashFlowItem,
} from '@finance-app/shared-types'

interface ScenarioEditorProps {
  scenario?: Scenario
  assets: Asset[]
  liabilities: Liability[]
  cashFlowItems: CashFlowItem[]
  onSave: (data: CreateScenarioDto) => Promise<void>
  isLoading?: boolean
}

type OverrideState = {
  [entityId: string]: {
    [fieldName: string]: string
  }
}

const ASSET_FIELDS = [
  { name: 'currentValueCents', label: 'Current Value (cents)', type: 'number' },
  { name: 'annualGrowthRatePercent', label: 'Annual Growth Rate (%)', type: 'number' },
]

const LIABILITY_FIELDS = [
  { name: 'currentBalanceCents', label: 'Current Balance (cents)', type: 'number' },
  { name: 'interestRatePercent', label: 'Interest Rate (%)', type: 'number' },
  { name: 'minimumPaymentCents', label: 'Minimum Payment (cents)', type: 'number' },
]

const CASH_FLOW_FIELDS = [
  { name: 'amountCents', label: 'Amount (cents)', type: 'number' },
  { name: 'annualGrowthRatePercent', label: 'Annual Growth Rate (%)', type: 'number' },
]

export function ScenarioEditor({
  scenario,
  assets,
  liabilities,
  cashFlowItems,
  onSave,
  isLoading = false,
}: ScenarioEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(scenario?.name || '')
  const [description, setDescription] = useState(scenario?.description || '')
  const [isBaseline, setIsBaseline] = useState(scenario?.isBaseline || false)
  const [activeTab, setActiveTab] = useState<'assets' | 'liabilities' | 'cashFlow'>('assets')

  // Initialize overrides from existing scenario
  const initializeOverrides = (): OverrideState => {
    const overrides: OverrideState = {}
    if (scenario) {
      for (const override of scenario.overrides) {
        if (!overrides[override.entityId]) {
          overrides[override.entityId] = {}
        }
        overrides[override.entityId][override.fieldName] = override.value
      }
    }
    return overrides
  }

  const [assetOverrides, setAssetOverrides] = useState<OverrideState>(() => {
    const initial = initializeOverrides()
    const assetIds = new Set(assets.map((a) => a.id))
    return Object.fromEntries(Object.entries(initial).filter(([id]) => assetIds.has(id)))
  })

  const [liabilityOverrides, setLiabilityOverrides] = useState<OverrideState>(() => {
    const initial = initializeOverrides()
    const liabilityIds = new Set(liabilities.map((l) => l.id))
    return Object.fromEntries(Object.entries(initial).filter(([id]) => liabilityIds.has(id)))
  })

  const [cashFlowOverrides, setCashFlowOverrides] = useState<OverrideState>(() => {
    const initial = initializeOverrides()
    const cashFlowIds = new Set(cashFlowItems.map((c) => c.id))
    return Object.fromEntries(Object.entries(initial).filter(([id]) => cashFlowIds.has(id)))
  })

  const updateOverride = (
    type: 'asset' | 'liability' | 'cash_flow_item',
    entityId: string,
    fieldName: string,
    value: string,
  ) => {
    const setter =
      type === 'asset'
        ? setAssetOverrides
        : type === 'liability'
          ? setLiabilityOverrides
          : setCashFlowOverrides

    setter((prev) => {
      const entityOverrides = prev[entityId] || {}
      if (value === '') {
        const { [fieldName]: _, ...rest } = entityOverrides
        if (Object.keys(rest).length === 0) {
          const { [entityId]: __, ...restEntities } = prev
          return restEntities
        }
        return { ...prev, [entityId]: rest }
      }
      return {
        ...prev,
        [entityId]: {
          ...entityOverrides,
          [fieldName]: value,
        },
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const overrides: CreateScenarioOverrideDto[] = []

    // Collect asset overrides
    for (const [entityId, fields] of Object.entries(assetOverrides)) {
      for (const [fieldName, value] of Object.entries(fields)) {
        if (value !== '') {
          overrides.push({ targetType: 'asset', entityId, fieldName, value })
        }
      }
    }

    // Collect liability overrides
    for (const [entityId, fields] of Object.entries(liabilityOverrides)) {
      for (const [fieldName, value] of Object.entries(fields)) {
        if (value !== '') {
          overrides.push({ targetType: 'liability', entityId, fieldName, value })
        }
      }
    }

    // Collect cash flow overrides
    for (const [entityId, fields] of Object.entries(cashFlowOverrides)) {
      for (const [fieldName, value] of Object.entries(fields)) {
        if (value !== '') {
          overrides.push({ targetType: 'cash_flow_item', entityId, fieldName, value })
        }
      }
    }

    await onSave({
      name,
      description: description || undefined,
      isBaseline,
      overrides,
    })
  }

  const formatCents = (cents: number): string => {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const tabs = [
    { id: 'assets' as const, label: 'Assets', count: assets.length },
    { id: 'liabilities' as const, label: 'Liabilities', count: liabilities.length },
    { id: 'cashFlow' as const, label: 'Cash Flow', count: cashFlowItems.length },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Details</CardTitle>
          <CardDescription>Give your scenario a name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Early Retirement, Aggressive Savings"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the assumptions in this scenario"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBaseline"
              checked={isBaseline}
              onChange={(e) => setIsBaseline(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isBaseline" className="font-normal">
              Mark as baseline scenario
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overrides</CardTitle>
          <CardDescription>
            Adjust values for your assets, liabilities, and cash flow items. Leave fields empty to
            use the original values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-b mb-4">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 px-1 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'assets' && (
            <div className="space-y-4">
              {assets.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No assets to override</p>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className="border rounded-lg p-4 space-y-3">
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {formatCents(asset.currentValueCents)} | Growth:{' '}
                      {asset.annualGrowthRatePercent ?? 0}%
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {ASSET_FIELDS.map((field) => (
                        <div key={field.name} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            type={field.type}
                            placeholder="Original value"
                            value={assetOverrides[asset.id]?.[field.name] || ''}
                            onChange={(e) =>
                              updateOverride('asset', asset.id, field.name, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'liabilities' && (
            <div className="space-y-4">
              {liabilities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No liabilities to override</p>
              ) : (
                liabilities.map((liability) => (
                  <div key={liability.id} className="border rounded-lg p-4 space-y-3">
                    <div className="font-medium">{liability.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Balance: {formatCents(liability.currentBalanceCents)} | Rate:{' '}
                      {liability.interestRatePercent}%
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {LIABILITY_FIELDS.map((field) => (
                        <div key={field.name} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            type={field.type}
                            placeholder="Original value"
                            value={liabilityOverrides[liability.id]?.[field.name] || ''}
                            onChange={(e) =>
                              updateOverride('liability', liability.id, field.name, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'cashFlow' && (
            <div className="space-y-4">
              {cashFlowItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No cash flow items to override
                </p>
              ) : (
                cashFlowItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          item.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: {formatCents(item.amountCents)} | Frequency: {item.frequency}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {CASH_FLOW_FIELDS.map((field) => (
                        <div key={field.name} className="space-y-1">
                          <Label className="text-xs">{field.label}</Label>
                          <Input
                            type={field.type}
                            placeholder="Original value"
                            value={cashFlowOverrides[item.id]?.[field.name] || ''}
                            onChange={(e) =>
                              updateOverride('cash_flow_item', item.id, field.name, e.target.value)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !name}>
          {isLoading ? 'Saving...' : scenario ? 'Update Scenario' : 'Create Scenario'}
        </Button>
      </div>
    </form>
  )
}
