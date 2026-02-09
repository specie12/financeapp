'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CreateRentalPropertyDto } from '@finance-app/shared-types'

interface AddPropertyModalProps {
  onSubmit: (data: CreateRentalPropertyDto) => Promise<void>
  onCancel: () => void
}

export function AddPropertyModal({ onSubmit, onCancel }: AddPropertyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    address: '',
    purchasePrice: '',
    currentValue: '',
    downPayment: '',
    monthlyRent: '',
    vacancyRate: '5',
    annualExpenses: '',
    propertyTaxAnnual: '',
    mortgagePayment: '',
    mortgageRate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name,
        address: form.address || null,
        purchasePriceCents: Math.round(parseFloat(form.purchasePrice) * 100),
        currentValueCents: Math.round(parseFloat(form.currentValue) * 100),
        downPaymentCents: Math.round(parseFloat(form.downPayment) * 100),
        monthlyRentCents: Math.round(parseFloat(form.monthlyRent) * 100),
        vacancyRatePercent: parseFloat(form.vacancyRate),
        annualExpensesCents: Math.round(parseFloat(form.annualExpenses) * 100),
        propertyTaxAnnualCents: Math.round(parseFloat(form.propertyTaxAnnual) * 100),
        mortgagePaymentCents: form.mortgagePayment
          ? Math.round(parseFloat(form.mortgagePayment) * 100)
          : null,
        mortgageRatePercent: form.mortgageRate ? parseFloat(form.mortgageRate) : null,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add Rental Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-full">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-full">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={form.purchasePrice}
                onChange={(e) => updateField('purchasePrice', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value ($)</Label>
              <Input
                id="currentValue"
                type="number"
                value={form.currentValue}
                onChange={(e) => updateField('currentValue', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="downPayment">Down Payment ($)</Label>
              <Input
                id="downPayment"
                type="number"
                value={form.downPayment}
                onChange={(e) => updateField('downPayment', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent ($)</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={form.monthlyRent}
                onChange={(e) => updateField('monthlyRent', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vacancyRate">Vacancy Rate (%)</Label>
              <Input
                id="vacancyRate"
                type="number"
                value={form.vacancyRate}
                onChange={(e) => updateField('vacancyRate', e.target.value)}
                min="0"
                max="100"
                step="0.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualExpenses">Annual Expenses ($)</Label>
              <Input
                id="annualExpenses"
                type="number"
                value={form.annualExpenses}
                onChange={(e) => updateField('annualExpenses', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyTaxAnnual">Annual Property Tax ($)</Label>
              <Input
                id="propertyTaxAnnual"
                type="number"
                value={form.propertyTaxAnnual}
                onChange={(e) => updateField('propertyTaxAnnual', e.target.value)}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgagePayment">Monthly Mortgage Payment ($)</Label>
              <Input
                id="mortgagePayment"
                type="number"
                value={form.mortgagePayment}
                onChange={(e) => updateField('mortgagePayment', e.target.value)}
                min="0"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageRate">Mortgage Rate (%)</Label>
              <Input
                id="mortgageRate"
                type="number"
                value={form.mortgageRate}
                onChange={(e) => updateField('mortgageRate', e.target.value)}
                min="0"
                max="25"
                step="0.1"
                placeholder="Optional"
              />
            </div>

            <div className="col-span-full flex gap-2 justify-end mt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Property'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
