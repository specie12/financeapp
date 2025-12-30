'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Scenario } from '@/lib/dashboard/types'

interface ScenarioCardProps {
  scenario: Scenario
  onDelete: () => void
}

export function ScenarioCard({ scenario, onDelete }: ScenarioCardProps) {
  const overrideCount = scenario.overrides.length
  const assetOverrides = scenario.overrides.filter((o) => o.targetType === 'asset').length
  const liabilityOverrides = scenario.overrides.filter((o) => o.targetType === 'liability').length
  const cashFlowOverrides = scenario.overrides.filter(
    (o) => o.targetType === 'cash_flow_item',
  ).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {scenario.name}
              {scenario.isBaseline && (
                <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  Baseline
                </span>
              )}
            </CardTitle>
            {scenario.description && (
              <CardDescription className="mt-1">{scenario.description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {overrideCount === 0 ? (
            <p>No overrides configured</p>
          ) : (
            <div className="flex gap-4">
              {assetOverrides > 0 && (
                <span>
                  {assetOverrides} asset override{assetOverrides !== 1 ? 's' : ''}
                </span>
              )}
              {liabilityOverrides > 0 && (
                <span>
                  {liabilityOverrides} liability override{liabilityOverrides !== 1 ? 's' : ''}
                </span>
              )}
              {cashFlowOverrides > 0 && (
                <span>
                  {cashFlowOverrides} cash flow override{cashFlowOverrides !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/scenarios/${scenario.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Projection
            </Button>
          </Link>
          <Link href={`/dashboard/scenarios/${scenario.id}/edit`}>
            <Button variant="ghost" size="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-destructive"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
