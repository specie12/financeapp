'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { useScenarios } from '@/hooks/useScenarios'
import { useHouseholdEntities } from '@/hooks/useHouseholdEntities'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { ScenarioEditor } from '@/components/dashboard/scenarios/ScenarioEditor'
import type { Scenario, CreateScenarioDto } from '@finance-app/shared-types'

export default function EditScenarioPage() {
  const router = useRouter()
  const params = useParams()
  const scenarioId = params.id as string

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [scenarioLoading, setScenarioLoading] = useState(true)
  const [scenarioError, setScenarioError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { updateScenario } = useScenarios(accessToken)
  const {
    assets,
    liabilities,
    cashFlowItems,
    isLoading: entitiesLoading,
    error: entitiesError,
    refetch,
  } = useHouseholdEntities(accessToken)

  useEffect(() => {
    const fetchScenario = async () => {
      if (!accessToken || !scenarioId) return

      setScenarioLoading(true)
      setScenarioError(null)

      try {
        const apiClient = createAuthenticatedApiClient(accessToken)
        const response = await apiClient.scenarios.get(scenarioId)
        setScenario(response.data)
      } catch (err) {
        console.error('Failed to fetch scenario:', err)
        setScenarioError('Failed to load scenario')
      } finally {
        setScenarioLoading(false)
      }
    }

    fetchScenario()
  }, [accessToken, scenarioId])

  const handleSave = async (data: CreateScenarioDto) => {
    setIsSaving(true)
    try {
      await updateScenario(scenarioId, data)
      router.push('/dashboard/scenarios')
    } catch (err) {
      console.error('Failed to update scenario:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Scenario</h1>
        <ErrorState title="Not Authenticated" message="Please log in to edit a scenario." />
      </div>
    )
  }

  if (scenarioLoading || entitiesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Scenario</h1>
        <LoadingState message="Loading scenario..." />
      </div>
    )
  }

  if (scenarioError || entitiesError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Scenario</h1>
        <ErrorState
          message={scenarioError || entitiesError || 'An error occurred'}
          onRetry={refetch}
        />
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Scenario</h1>
        <ErrorState message="Scenario not found" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Scenario</h1>
      <p className="text-muted-foreground">
        Update the assumptions for &quot;{scenario.name}&quot;.
      </p>

      <ScenarioEditor
        scenario={scenario}
        assets={assets}
        liabilities={liabilities}
        cashFlowItems={cashFlowItems}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  )
}
