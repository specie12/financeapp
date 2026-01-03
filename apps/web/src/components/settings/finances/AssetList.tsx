'use client'

import { useState } from 'react'
import type { Asset } from '@finance-app/shared-types'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { AssetModal } from './AssetModal'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

interface AssetListProps {
  assets: Asset[]
  onRefresh: () => void
  accessToken: string | null
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  vehicle: 'Vehicle',
  investment: 'Investment',
  retirement_account: 'Retirement Account',
  bank_account: 'Bank Account',
  crypto: 'Crypto',
  other: 'Other',
}

export function AssetList({ assets, onRefresh, accessToken }: AssetListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Group assets by type
  const assetsByType = assets.reduce(
    (acc, asset) => {
      const type = asset.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(asset)
      return acc
    },
    {} as Record<string, Asset[]>,
  )

  const totalValue = assets.reduce((sum, asset) => sum + asset.currentValueCents, 0)

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingAsset(null)
    setIsModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingAsset || !accessToken) return

    setIsDeleting(true)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      await apiClient.assets.delete(deletingAsset.id)
      onRefresh()
      setDeletingAsset(null)
    } catch (err) {
      console.error('Failed to delete asset:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = () => {
    onRefresh()
    setEditingAsset(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Total Assets</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
        </div>
        <Button onClick={handleAdd}>Add Asset</Button>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No assets added yet.</p>
          <p className="text-sm">Click &quot;Add Asset&quot; to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(assetsByType).map(([type, typeAssets]) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {ASSET_TYPE_LABELS[type] || type}
              </h4>
              <div className="space-y-2">
                {typeAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      {asset.annualGrowthRatePercent !== null && (
                        <p className="text-sm text-muted-foreground">
                          {asset.annualGrowthRatePercent}% annual growth
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatCurrency(asset.currentValueCents)}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingAsset(asset)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AssetModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        asset={editingAsset}
        onSuccess={handleModalSuccess}
        accessToken={accessToken}
      />

      <DeleteConfirmDialog
        open={!!deletingAsset}
        onOpenChange={(open) => !open && setDeletingAsset(null)}
        title="Delete Asset"
        description={`Are you sure you want to delete "${deletingAsset?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
