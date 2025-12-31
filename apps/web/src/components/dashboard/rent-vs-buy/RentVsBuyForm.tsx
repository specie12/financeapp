'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RentVsBuyRequest } from '@finance-app/shared-types'

interface RentVsBuyFormProps {
  onCalculate: (request: RentVsBuyRequest) => void
  isLoading: boolean
}

export function RentVsBuyForm({ onCalculate, isLoading }: RentVsBuyFormProps) {
  // Buy scenario state
  const [homePrice, setHomePrice] = useState(400000)
  const [downPaymentPercent, setDownPaymentPercent] = useState(20)
  const [mortgageRate, setMortgageRate] = useState(6.5)
  const [mortgageTerm, setMortgageTerm] = useState(30)
  const [closingCostPercent, setClosingCostPercent] = useState(3)
  const [homeInsurance, setHomeInsurance] = useState(1500)
  const [hoaDues, setHoaDues] = useState(0)
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2)
  const [maintenanceRate, setMaintenanceRate] = useState(1)

  // Rent scenario state
  const [monthlyRent, setMonthlyRent] = useState(2000)
  const [securityDeposit, setSecurityDeposit] = useState(1)
  const [rentersInsurance, setRentersInsurance] = useState(200)
  const [rentIncrease, setRentIncrease] = useState(3)

  // Projection settings
  const [projectionYears, setProjectionYears] = useState(10)

  // Advanced assumptions (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [homeAppreciation, setHomeAppreciation] = useState(3)
  const [investmentReturn, setInvestmentReturn] = useState(7)
  const [inflation, setInflation] = useState(2.5)
  const [marginalTaxRate, setMarginalTaxRate] = useState(22)
  const [sellingCosts, setSellingCosts] = useState(6)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const request: RentVsBuyRequest = {
      startDate: new Date(),
      projectionYears,
      buy: {
        homePriceCents: homePrice * 100,
        downPaymentPercent,
        mortgageInterestRatePercent: mortgageRate,
        mortgageTermYears: mortgageTerm,
        closingCostPercent,
        homeownersInsuranceAnnualCents: homeInsurance * 100,
        hoaMonthlyDuesCents: hoaDues * 100,
        propertyTaxRateOverride: propertyTaxRate,
        maintenanceRateOverride: maintenanceRate,
      },
      rent: {
        monthlyRentCents: monthlyRent * 100,
        securityDepositMonths: securityDeposit,
        rentersInsuranceAnnualCents: rentersInsurance * 100,
        rentIncreaseRateOverride: rentIncrease,
      },
      assumptions: {
        homeAppreciationRatePercent: homeAppreciation,
        investmentReturnRatePercent: investmentReturn,
        inflationRatePercent: inflation,
        propertyTaxRatePercent: propertyTaxRate,
        maintenanceRatePercent: maintenanceRate,
        rentIncreaseRatePercent: rentIncrease,
        marginalTaxRatePercent: marginalTaxRate,
        sellingCostPercent: sellingCosts,
      },
    }

    onCalculate(request)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Buy Scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buy Scenario</CardTitle>
            <CardDescription>Enter details about the home you want to buy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="homePrice">Home Price ($)</Label>
              <Input
                id="homePrice"
                type="number"
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="downPayment">Down Payment (%)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mortgageRate">Interest Rate (%)</Label>
                <Input
                  id="mortgageRate"
                  type="number"
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(Number(e.target.value))}
                  min={0}
                  step={0.125}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mortgageTerm">Loan Term (years)</Label>
                <Input
                  id="mortgageTerm"
                  type="number"
                  value={mortgageTerm}
                  onChange={(e) => setMortgageTerm(Number(e.target.value))}
                  min={1}
                  max={40}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingCosts">Closing Costs (%)</Label>
                <Input
                  id="closingCosts"
                  type="number"
                  value={closingCostPercent}
                  onChange={(e) => setClosingCostPercent(Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeInsurance">Home Insurance ($/yr)</Label>
                <Input
                  id="homeInsurance"
                  type="number"
                  value={homeInsurance}
                  onChange={(e) => setHomeInsurance(Number(e.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoaDues">HOA Dues ($/mo)</Label>
                <Input
                  id="hoaDues"
                  type="number"
                  value={hoaDues}
                  onChange={(e) => setHoaDues(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyTax">Property Tax (%)</Label>
                <Input
                  id="propertyTax"
                  type="number"
                  value={propertyTaxRate}
                  onChange={(e) => setPropertyTaxRate(Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenance">Maintenance (%)</Label>
                <Input
                  id="maintenance"
                  type="number"
                  value={maintenanceRate}
                  onChange={(e) => setMaintenanceRate(Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rent Scenario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rent Scenario</CardTitle>
            <CardDescription>Enter details about renting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                min={0}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit (months)</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentersInsurance">Renters Insurance ($/yr)</Label>
                <Input
                  id="rentersInsurance"
                  type="number"
                  value={rentersInsurance}
                  onChange={(e) => setRentersInsurance(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rentIncrease">Annual Rent Increase (%)</Label>
              <Input
                id="rentIncrease"
                type="number"
                value={rentIncrease}
                onChange={(e) => setRentIncrease(Number(e.target.value))}
                min={0}
                step={0.5}
              />
            </div>

            {/* Projection Period */}
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="projectionYears">Projection Period (years)</Label>
                <Input
                  id="projectionYears"
                  type="number"
                  value={projectionYears}
                  onChange={(e) => setProjectionYears(Number(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Assumptions */}
      <Card className="mt-6">
        <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>Advanced Assumptions</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </CardTitle>
          <CardDescription>Customize economic assumptions</CardDescription>
        </CardHeader>
        {showAdvanced && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeAppreciation">Home Appreciation (%)</Label>
                <Input
                  id="homeAppreciation"
                  type="number"
                  value={homeAppreciation}
                  onChange={(e) => setHomeAppreciation(Number(e.target.value))}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="investmentReturn">Investment Return (%)</Label>
                <Input
                  id="investmentReturn"
                  type="number"
                  value={investmentReturn}
                  onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inflation">Inflation (%)</Label>
                <Input
                  id="inflation"
                  type="number"
                  value={inflation}
                  onChange={(e) => setInflation(Number(e.target.value))}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginalTaxRate">Marginal Tax Rate (%)</Label>
                <Input
                  id="marginalTaxRate"
                  type="number"
                  value={marginalTaxRate}
                  onChange={(e) => setMarginalTaxRate(Number(e.target.value))}
                  min={0}
                  max={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingCosts">Selling Costs (%)</Label>
                <Input
                  id="sellingCosts"
                  type="number"
                  value={sellingCosts}
                  onChange={(e) => setSellingCosts(Number(e.target.value))}
                  min={0}
                  step={0.5}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="mt-6">
        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? 'Calculating...' : 'Calculate Comparison'}
        </Button>
      </div>
    </form>
  )
}
