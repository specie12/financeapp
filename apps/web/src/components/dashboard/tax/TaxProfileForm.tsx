'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { TaxProfile, CreateTaxProfileDto, FilingStatus } from '@finance-app/shared-types'

const filingStatuses: { value: FilingStatus; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
]

interface TaxProfileFormProps {
  profile: TaxProfile | null
  onSubmit: (data: CreateTaxProfileDto) => Promise<void>
}

export function TaxProfileForm({ profile, onSubmit }: TaxProfileFormProps) {
  const currentYear = new Date().getFullYear()
  const [taxYear, setTaxYear] = useState(profile?.taxYear ?? currentYear)
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(profile?.filingStatus ?? 'single')
  const [stateCode, setStateCode] = useState(profile?.stateCode ?? '')
  const [dependents, setDependents] = useState(profile?.dependents ?? 0)
  const [additionalIncome, setAdditionalIncome] = useState(
    profile?.additionalIncomeCents ? (profile.additionalIncomeCents / 100).toString() : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        taxYear,
        filingStatus,
        stateCode: stateCode || null,
        dependents,
        additionalIncomeCents: additionalIncome
          ? Math.round(parseFloat(additionalIncome) * 100)
          : null,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tax Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tax Year</label>
              <select
                value={taxYear}
                onChange={(e) => setTaxYear(parseInt(e.target.value))}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Filing Status</label>
              <select
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
              >
                {filingStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">State Code</label>
              <input
                type="text"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g. CA"
                maxLength={2}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dependents</label>
              <input
                type="number"
                value={dependents}
                onChange={(e) => setDependents(parseInt(e.target.value) || 0)}
                min={0}
                max={20}
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Additional Annual Income ($)</label>
              <input
                type="number"
                value={additionalIncome}
                onChange={(e) => setAdditionalIncome(e.target.value)}
                placeholder="Income not tracked in cash flow items"
                step="0.01"
                min="0"
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Tax Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
