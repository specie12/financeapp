'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { InterestSavingsCard } from './InterestSavingsCard'
import { PayoffComparisonChart } from './PayoffComparisonChart'
import type { LoanDetail, LoanSimulationResponse } from '@finance-app/shared-types'
import { MoneyDisplay } from '../shared/MoneyDisplay'

interface LoanOptimizationPanelProps {
  loan: LoanDetail
  accessToken: string // Used for authentication context
  onSimulate: (
    loanId: string,
    request: {
      extraMonthlyPaymentCents: number
      oneTimePaymentCents: number
      oneTimePaymentMonth: number
      useBiweekly: boolean
    },
  ) => Promise<LoanSimulationResponse>
}

export function LoanOptimizationPanel({
  loan,
  onSimulate,
}: Omit<LoanOptimizationPanelProps, 'accessToken'>) {
  // Input state (in dollars for display)
  const [extraMonthly, setExtraMonthly] = useState(0)
  const [oneTimePayment, setOneTimePayment] = useState(0)
  const [oneTimeMonth, setOneTimeMonth] = useState(1)
  const [useBiweekly, setUseBiweekly] = useState(false)

  // Simulation state
  const [result, setResult] = useState<LoanSimulationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate effective monthly payment with biweekly
  const regularMonthlyPayment = loan.minimumPaymentCents / 100
  const biweeklyPayment = regularMonthlyPayment / 2

  // Run simulation
  const runSimulation = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await onSimulate(loan.id, {
        extraMonthlyPaymentCents: Math.round(extraMonthly * 100),
        oneTimePaymentCents: Math.round(oneTimePayment * 100),
        oneTimePaymentMonth: oneTimeMonth,
        useBiweekly,
      })
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed')
    } finally {
      setIsLoading(false)
    }
  }, [loan.id, extraMonthly, oneTimePayment, oneTimeMonth, useBiweekly, onSimulate])

  // Auto-simulate on initial load
  useEffect(() => {
    runSimulation()
  }, []) // Only on mount

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setExtraMonthly(value)
  }

  // Calculate max extra payment (reasonable limit based on current payment)
  const maxExtraMonthly = Math.min(Math.round(regularMonthlyPayment * 2), 5000)

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Optimize Your Payoff</CardTitle>
          <p className="text-sm text-muted-foreground">
            See how extra payments can save you money and time
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Extra Monthly Payment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="extra-monthly">Extra Monthly Payment</Label>
              <span className="text-lg font-semibold">${extraMonthly.toLocaleString()}</span>
            </div>
            <input
              id="extra-monthly"
              type="range"
              min={0}
              max={maxExtraMonthly}
              step={25}
              value={extraMonthly}
              onChange={handleSliderChange}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>${maxExtraMonthly.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* One-Time Lump Sum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="one-time">One-Time Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="one-time"
                  type="number"
                  min={0}
                  step={100}
                  value={oneTimePayment || ''}
                  onChange={(e) => setOneTimePayment(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="one-time-month">Apply in Month</Label>
              <Input
                id="one-time-month"
                type="number"
                min={1}
                max={loan.termMonths || 360}
                value={oneTimeMonth}
                onChange={(e) => setOneTimeMonth(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          <Separator />

          {/* Bi-Weekly Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="biweekly" className="text-base">
                Bi-Weekly Payments
              </Label>
              <p className="text-sm text-muted-foreground">
                Pay ${biweeklyPayment.toFixed(0)} every 2 weeks (equals 13 monthly payments/year)
              </p>
            </div>
            <button
              id="biweekly"
              role="switch"
              aria-checked={useBiweekly}
              onClick={() => setUseBiweekly(!useBiweekly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                useBiweekly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  useBiweekly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Calculate Button */}
          <Button onClick={runSimulation} disabled={isLoading} className="w-full">
            {isLoading ? 'Calculating...' : 'Calculate Savings'}
          </Button>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {/* Savings Summary */}
          <InterestSavingsCard
            savings={result.savings}
            original={result.original}
            modified={result.modified}
          />

          {/* Comparison Chart */}
          <PayoffComparisonChart
            originalSchedule={result.originalSchedule}
            modifiedSchedule={result.modifiedSchedule}
            monthsSaved={result.savings.monthsSaved}
          />

          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Current Payment</p>
                  <p className="text-lg font-semibold">
                    <MoneyDisplay cents={loan.minimumPaymentCents} />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">New Payment</p>
                  <p className="text-lg font-semibold">
                    <MoneyDisplay cents={result.modified.monthlyPaymentCents} />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Original Term</p>
                  <p className="text-lg font-semibold">
                    {Math.ceil(result.original.payoffMonth / 12)} years
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">New Term</p>
                  <p className="text-lg font-semibold text-green-600">
                    {Math.ceil(result.modified.payoffMonth / 12)} years
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
