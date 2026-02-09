'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MortgageVsInvestRequest } from '@finance-app/shared-types'

interface MortgageVsInvestFormProps {
  onCalculate: (request: MortgageVsInvestRequest) => Promise<void>
  isLoading: boolean
}

export function MortgageVsInvestForm({ onCalculate, isLoading }: MortgageVsInvestFormProps) {
  const [currentBalance, setCurrentBalance] = useState('250000')
  const [mortgageRate, setMortgageRate] = useState('3.5')
  const [remainingTermYears, setRemainingTermYears] = useState('25')
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState('500')
  const [expectedReturn, setExpectedReturn] = useState('8')
  const [capitalGainsTax, setCapitalGainsTax] = useState('15')
  const [horizonYears, setHorizonYears] = useState('10')
  const [mortgageDeductible, setMortgageDeductible] = useState(true)
  const [marginalTaxRate, setMarginalTaxRate] = useState('24')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCalculate({
      currentBalanceCents: Math.round(parseFloat(currentBalance) * 100),
      mortgageRatePercent: parseFloat(mortgageRate),
      remainingTermMonths: parseInt(remainingTermYears) * 12,
      extraMonthlyPaymentCents: Math.round(parseFloat(extraMonthlyPayment) * 100),
      expectedReturnPercent: parseFloat(expectedReturn),
      capitalGainsTaxPercent: parseFloat(capitalGainsTax),
      horizonYears: parseInt(horizonYears),
      mortgageInterestDeductible: mortgageDeductible,
      marginalTaxRatePercent: parseFloat(marginalTaxRate),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage vs Invest Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div className="space-y-2">
            <Label htmlFor="currentBalance">Current Mortgage Balance ($)</Label>
            <Input
              id="currentBalance"
              type="number"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              min="0"
              step="1000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mortgageRate">Mortgage Interest Rate (%)</Label>
            <Input
              id="mortgageRate"
              type="number"
              value={mortgageRate}
              onChange={(e) => setMortgageRate(e.target.value)}
              min="0"
              max="25"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remainingTerm">Remaining Term (Years)</Label>
            <Input
              id="remainingTerm"
              type="number"
              value={remainingTermYears}
              onChange={(e) => setRemainingTermYears(e.target.value)}
              min="1"
              max="40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraPayment">Extra Monthly Payment ($)</Label>
            <Input
              id="extraPayment"
              type="number"
              value={extraMonthlyPayment}
              onChange={(e) => setExtraMonthlyPayment(e.target.value)}
              min="1"
              step="50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedReturn">Expected Investment Return (%)</Label>
            <Input
              id="expectedReturn"
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              min="-20"
              max="30"
              step="0.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capitalGainsTax">Capital Gains Tax Rate (%)</Label>
            <Input
              id="capitalGainsTax"
              type="number"
              value={capitalGainsTax}
              onChange={(e) => setCapitalGainsTax(e.target.value)}
              min="0"
              max="50"
              step="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horizonYears">Comparison Horizon (Years)</Label>
            <Input
              id="horizonYears"
              type="number"
              value={horizonYears}
              onChange={(e) => setHorizonYears(e.target.value)}
              min="1"
              max="30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marginalTaxRate">Marginal Tax Rate (%)</Label>
            <Input
              id="marginalTaxRate"
              type="number"
              value={marginalTaxRate}
              onChange={(e) => setMarginalTaxRate(e.target.value)}
              min="0"
              max="50"
              step="1"
            />
          </div>

          <div className="space-y-2 flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mortgageDeductible}
                onChange={(e) => setMortgageDeductible(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Mortgage Interest Tax-Deductible</span>
            </label>
          </div>

          <div className="col-span-full">
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? 'Calculating...' : 'Compare Strategies'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
