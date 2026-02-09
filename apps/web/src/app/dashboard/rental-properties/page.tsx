'use client'

import { useEffect, useState } from 'react'
import { useRentalProperties } from '@/hooks/useRentalProperties'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import {
  PortfolioSummary,
  PropertyCard,
  PropertyMetricsTable,
  AddPropertyModal,
} from '@/components/dashboard/rental-properties'

export default function RentalPropertiesPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { properties, summary, isLoading, error, createProperty, deleteProperty } =
    useRentalProperties(accessToken)

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rental Properties</h1>
        <ErrorState
          title="Not Authenticated"
          message="Please log in to manage your rental properties."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rental Properties</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your rental property portfolio
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Property</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && <p className="text-muted-foreground">Loading properties...</p>}

      {summary && summary.totalProperties > 0 && (
        <>
          <PortfolioSummary summary={summary} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.properties.map((metrics) => (
              <PropertyCard
                key={metrics.property.id}
                metrics={metrics}
                onEdit={() => {}}
                onDelete={() => deleteProperty(metrics.property.id)}
              />
            ))}
          </div>

          <PropertyMetricsTable properties={summary.properties} />
        </>
      )}

      {!isLoading && properties.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold">No Properties Yet</h3>
          <p className="text-muted-foreground mt-1">
            Add your first rental property to get started
          </p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            Add Property
          </Button>
        </div>
      )}

      {showAddModal && (
        <AddPropertyModal
          onSubmit={async (data) => {
            await createProperty(data)
            setShowAddModal(false)
          }}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
