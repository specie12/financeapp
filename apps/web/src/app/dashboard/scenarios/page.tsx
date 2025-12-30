'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useScenarios } from '@/hooks/useScenarios'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { ScenarioCard } from '@/components/dashboard/scenarios/ScenarioCard'
import { Button } from '@/components/ui/button'

export default function ScenariosPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const { scenarios, isLoading, error, refetch, deleteScenario } = useScenarios(accessToken)

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      try {
        await deleteScenario(id)
      } catch (err) {
        console.error('Failed to delete scenario:', err)
      }
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <ErrorState title="Not Authenticated" message="Please log in to view your scenarios." />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <LoadingState message="Loading scenarios..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scenarios</h1>
        <div className="flex gap-2">
          {scenarios.length >= 2 && (
            <Link href="/dashboard/scenarios/compare">
              <Button variant="outline">Compare Scenarios</Button>
            </Link>
          )}
          <Link href="/dashboard/scenarios/new">
            <Button>Create Scenario</Button>
          </Link>
        </div>
      </div>

      <p className="text-muted-foreground">
        Create &quot;what-if&quot; scenarios to explore how changes to your financial assumptions
        affect your projections.
      </p>

      {scenarios.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No scenarios created yet. Create your first scenario to start exploring financial
            what-ifs.
          </p>
          <Link href="/dashboard/scenarios/new">
            <Button>Create Your First Scenario</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onDelete={() => handleDelete(scenario.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
