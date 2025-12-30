'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useScenarios } from '@/hooks/useScenarios'
import { useScenarioComparison } from '@/hooks/useScenarioComparison'
import { LoadingState } from '@/components/dashboard/shared/LoadingState'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { ComparisonChart } from '@/components/dashboard/scenarios/ComparisonChart'
import { ComparisonSummary } from '@/components/dashboard/scenarios/ComparisonSummary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ScenarioComparisonPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [horizonYears, setHorizonYears] = useState(5)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    setAccessToken(token)
  }, [])

  const {
    scenarios,
    isLoading: scenariosLoading,
    error: scenariosError,
    refetch,
  } = useScenarios(accessToken)
  const {
    comparison,
    isLoading: compareLoading,
    error: compareError,
    compare,
    clear,
  } = useScenarioComparison(accessToken)

  const toggleScenario = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id)
      }
      if (prev.length >= 4) {
        return prev
      }
      return [...prev, id]
    })
    clear()
  }

  const handleCompare = () => {
    if (selectedIds.length > 0) {
      compare(selectedIds, horizonYears)
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compare Scenarios</h1>
        <ErrorState title="Not Authenticated" message="Please log in to compare scenarios." />
      </div>
    )
  }

  if (scenariosLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compare Scenarios</h1>
        <LoadingState message="Loading scenarios..." />
      </div>
    )
  }

  if (scenariosError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Compare Scenarios</h1>
        <ErrorState message={scenariosError} onRetry={refetch} />
      </div>
    )
  }

  if (scenarios.length < 2) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/scenarios" className="text-muted-foreground hover:text-foreground">
            Scenarios
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-3xl font-bold">Compare</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You need at least 2 scenarios to compare. Create more scenarios to use this feature.
            </p>
            <Link href="/dashboard/scenarios/new">
              <Button>Create Scenario</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/scenarios" className="text-muted-foreground hover:text-foreground">
          Scenarios
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-3xl font-bold">Compare</h1>
      </div>

      <p className="text-muted-foreground">
        Select up to 4 scenarios to compare their projected outcomes side by side.
      </p>

      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Scenarios</CardTitle>
          <CardDescription>
            Click to select scenarios for comparison ({selectedIds.length}/4 selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {scenarios.map((scenario) => {
              const isSelected = selectedIds.includes(scenario.id)
              return (
                <button
                  key={scenario.id}
                  onClick={() => toggleScenario(scenario.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{scenario.name}</span>
                    {scenario.isBaseline && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        Baseline
                      </span>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {scenario.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {scenario.overrides.length} override{scenario.overrides.length !== 1 ? 's' : ''}
                  </p>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Projection horizon:</span>
              <Select
                value={horizonYears.toString()}
                onValueChange={(v) => setHorizonYears(parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 years</SelectItem>
                  <SelectItem value="10">10 years</SelectItem>
                  <SelectItem value="15">15 years</SelectItem>
                  <SelectItem value="20">20 years</SelectItem>
                  <SelectItem value="30">30 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCompare} disabled={selectedIds.length === 0 || compareLoading}>
              {compareLoading ? 'Comparing...' : 'Compare Selected'}
            </Button>

            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedIds([])
                  clear()
                }}
              >
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Error */}
      {compareError && <ErrorState message={compareError} />}

      {/* Comparison Results */}
      {comparison && comparison.comparisons.length > 0 && (
        <>
          <ComparisonChart comparisons={comparison.comparisons} />
          <ComparisonSummary comparisons={comparison.comparisons} />
        </>
      )}
    </div>
  )
}
