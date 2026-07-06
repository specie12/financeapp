'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StepContainer } from '../shared/StepContainer'
import {
  calculateDashboardPreview,
  formatDollars,
  recommendedToolForIntent,
} from '@/lib/onboarding/utils'
import type { OnboardingState } from '@/lib/onboarding/types'

interface CompletionStepProps {
  state: OnboardingState
}

/** Secondary tools offered alongside the personalized recommendation. */
const OTHER_TOOLS: Array<{ href: string; label: string }> = [
  { href: '/dashboard/decisions/rental', label: 'Analyze a rental purchase' },
  { href: '/dashboard/rent-vs-buy', label: 'Rent vs. buy' },
  { href: '/dashboard/net-worth', label: 'Net worth projection' },
  { href: '/dashboard/scenarios', label: 'What-if scenarios' },
]

export function CompletionStep({ state }: CompletionStepProps) {
  const router = useRouter()
  const preview = calculateDashboardPreview(state)
  const recommended = recommendedToolForIntent(state.primaryIntent)

  const goTo = (href: string) => {
    // Store tokens in localStorage for the dashboard to use, then navigate.
    if (state.tokens) {
      localStorage.setItem('accessToken', state.tokens.accessToken)
      localStorage.setItem('refreshToken', state.tokens.refreshToken)
    }
    router.push(href)
  }

  return (
    <StepContainer title="" description="">
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">You&apos;re All Set!</h2>
          <p className="text-muted-foreground">
            Welcome, {state.user?.firstName}! Here&apos;s your financial snapshot.
          </p>
        </div>

        {/* Dashboard Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Financial Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cash Flow Section */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Income</p>
                <p className="text-xl font-semibold text-green-600">
                  {formatDollars(preview.monthlyIncome)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                <p className="text-xl font-semibold text-red-600">
                  {formatDollars(preview.monthlyExpenses)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Savings</p>
                <p
                  className={`text-xl font-semibold ${
                    preview.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatDollars(preview.monthlySavings)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Net Worth Section */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-lg font-medium">{formatDollars(preview.totalAssets)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debts</p>
                <p className="text-lg font-medium">{formatDollars(preview.totalLiabilities)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Worth</p>
                <p
                  className={`text-lg font-semibold ${
                    preview.netWorth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatDollars(preview.netWorth)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Savings Rate */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Savings Rate</p>
              <p
                className={`text-2xl font-bold ${
                  preview.savingsRate >= 20
                    ? 'text-green-600'
                    : preview.savingsRate >= 10
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {preview.savingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {preview.savingsRate >= 20
                  ? "Excellent! You're saving a healthy amount."
                  : preview.savingsRate >= 10
                    ? 'Good start! Consider increasing savings.'
                    : 'Tip: Aim for at least 20% savings rate.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Income Sources</p>
              <p className="text-2xl font-bold">{state.incomeItems.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">Assets Tracked</p>
              <p className="text-2xl font-bold">{state.assets.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* What to do first — route straight to the value tools */}
        <div className="text-left space-y-3">
          <h3 className="text-lg font-semibold text-center">What would you like to do first?</h3>

          {/* Personalized recommendation from the intent chosen earlier */}
          <button
            type="button"
            onClick={() => goTo(recommended.href)}
            className="w-full text-left rounded-lg border-2 border-primary bg-primary/5 p-4 transition-colors hover:bg-primary/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-primary">
                  Recommended for you
                </div>
                <div className="font-semibold">{recommended.label}</div>
                <div className="text-sm text-muted-foreground">{recommended.description}</div>
              </div>
              <span className="text-primary">→</span>
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OTHER_TOOLS.filter((t) => t.href !== recommended.href).map((tool) => (
              <button
                key={tool.href}
                type="button"
                onClick={() => goTo(tool.href)}
                className="text-left rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary: full dashboard */}
        <Button variant="outline" size="lg" onClick={() => goTo('/dashboard')} className="w-full">
          Go to Dashboard
        </Button>
      </div>
    </StepContainer>
  )
}
