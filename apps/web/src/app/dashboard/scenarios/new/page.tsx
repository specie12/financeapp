'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useScenarios } from '@/hooks/useScenarios'
import { useHouseholdEntities } from '@/hooks/useHouseholdEntities'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { ScenarioEditor } from '@/components/dashboard/scenarios/ScenarioEditor'
import type { CreateScenarioDto } from '@finance-app/shared-types'

export default function NewScenarioPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { createScenario } = useScenarios(accessToken)
  const { assets, liabilities, cashFlowItems, isLoading, error, refetch } =
    useHouseholdEntities(accessToken)

  const handleSave = async (data: CreateScenarioDto) => {
    setIsSaving(true)
    try {
      await createScenario(data)
      router.push('/dashboard/scenarios')
    } catch (err) {
      console.error('Failed to create scenario:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Scenario</h1>
        <ErrorState title="Not Authenticated" message="Please log in to create a scenario." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Scenario</h1>
        <LoadingState message="Loading financial data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Create Scenario</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Create Scenario</h1>
      <p className="text-muted-foreground">
        Create a new scenario by adjusting assumptions for your assets, liabilities, and cash flow
        items.
      </p>

      <ScenarioEditor
        assets={assets}
        liabilities={liabilities}
        cashFlowItems={cashFlowItems}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  )
}
