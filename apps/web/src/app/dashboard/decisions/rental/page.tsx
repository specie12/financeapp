'use client'

import { useEffect, useState } from 'react'
import { createAuthenticatedApiClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ErrorState } from '@/components/dashboard/shared/ErrorState'
import { MoneyDisplay } from '@/components/dashboard/shared/MoneyDisplay'
import { DisclosureBadge, DisclosurePanel } from '@/components/dashboard/shared'
import { MonteCarloProjection } from '@/components/dashboard/net-worth'
import type { RentalDecisionResponse, RentalDealFactorDto } from '@/lib/dashboard/types'

const emptyForm = {
  name: '',
  price: '',
  downPayment: '',
  monthlyRent: '',
  vacancyRate: '5',
  annualExpenses: '',
  propertyTaxAnnual: '',
  mortgagePayment: '',
  mortgageRate: '',
  mortgageBalance: '',
  mortgageTerm: '',
  appreciationRate: '',
  horizonYears: '10',
}

const SIGNAL_STYLES: Record<
  RentalDecisionResponse['verdict']['signal'],
  { label: string; cls: string }
> = {
  favorable: { label: 'Looks favorable', cls: 'border-green-500 bg-green-50 dark:bg-green-950' },
  caution: { label: 'Proceed with caution', cls: 'border-amber-500 bg-amber-50 dark:bg-amber-950' },
  unfavorable: { label: 'Hard to justify', cls: 'border-red-500 bg-red-50 dark:bg-red-950' },
}

const FACTOR_DOT: Record<RentalDealFactorDto['status'], string> = {
  positive: 'bg-green-500',
  neutral: 'bg-slate-400',
  negative: 'bg-red-500',
}

function endingNetWorth(path: RentalDecisionResponse['withProperty']): number {
  return path.length > 0 ? path[path.length - 1]!.netWorthCents : 0
}

export default function RentalDecisionPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [result, setResult] = useState<RentalDecisionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'))
  }, [])

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const dollarsToCents = (v: string) => Math.round(parseFloat(v) * 100)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const apiClient = createAuthenticatedApiClient(accessToken)
      const response = await apiClient.dashboard.getRentalDecision({
        name: form.name || 'Candidate property',
        purchasePriceCents: dollarsToCents(form.price),
        currentValueCents: dollarsToCents(form.price),
        downPaymentCents: dollarsToCents(form.downPayment),
        monthlyRentCents: dollarsToCents(form.monthlyRent),
        vacancyRatePercent: parseFloat(form.vacancyRate),
        annualExpensesCents: dollarsToCents(form.annualExpenses),
        propertyTaxAnnualCents: dollarsToCents(form.propertyTaxAnnual),
        mortgagePaymentCents: form.mortgagePayment ? dollarsToCents(form.mortgagePayment) : null,
        mortgageRatePercent: form.mortgageRate ? parseFloat(form.mortgageRate) : null,
        mortgageBalanceCents: form.mortgageBalance ? dollarsToCents(form.mortgageBalance) : null,
        mortgageTermMonths: form.mortgageTerm
          ? Math.round(parseFloat(form.mortgageTerm) * 12)
          : null,
        appreciationRatePercent: form.appreciationRate ? parseFloat(form.appreciationRate) : null,
        horizonYears: parseInt(form.horizonYears, 10),
      })
      setResult(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze the property')
    } finally {
      setIsLoading(false)
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Should I buy this rental?</h1>
        <ErrorState title="Not Authenticated" message="Please log in to run a rental analysis." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Should I buy this rental?</h1>
        <p className="text-muted-foreground mt-2">
          Enter a property you&apos;re considering. We&apos;ll score the deal and show how it would
          move your whole financial picture — not just the property in isolation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">The property</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              id="name"
              label="Name"
              value={form.name}
              onChange={set}
              type="text"
              required={false}
            />
            <Field id="price" label="Price ($)" value={form.price} onChange={set} />
            <Field
              id="downPayment"
              label="Down Payment ($)"
              value={form.downPayment}
              onChange={set}
            />
            <Field
              id="monthlyRent"
              label="Monthly Rent ($)"
              value={form.monthlyRent}
              onChange={set}
            />
            <Field
              id="vacancyRate"
              label="Vacancy (%)"
              value={form.vacancyRate}
              onChange={set}
              required={false}
            />
            <Field
              id="annualExpenses"
              label="Annual Expenses ($)"
              value={form.annualExpenses}
              onChange={set}
            />
            <Field
              id="propertyTaxAnnual"
              label="Annual Property Tax ($)"
              value={form.propertyTaxAnnual}
              onChange={set}
            />
            <Field
              id="mortgagePayment"
              label="Monthly Mortgage ($)"
              value={form.mortgagePayment}
              onChange={set}
              required={false}
            />
            <Field
              id="mortgageRate"
              label="Mortgage Rate (%)"
              value={form.mortgageRate}
              onChange={set}
              required={false}
            />
            <Field
              id="mortgageBalance"
              label="Mortgage Balance ($)"
              value={form.mortgageBalance}
              onChange={set}
              required={false}
            />
            <Field
              id="mortgageTerm"
              label="Mortgage Term (yrs)"
              value={form.mortgageTerm}
              onChange={set}
              required={false}
            />
            <Field
              id="appreciationRate"
              label="Appreciation (%/yr)"
              value={form.appreciationRate}
              onChange={set}
              required={false}
            />
            <Field
              id="horizonYears"
              label="Horizon (years)"
              value={form.horizonYears}
              onChange={set}
              required={false}
            />
            <div className="md:col-span-3">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Analyzing…' : 'Analyze this deal'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-6">
          {/* Verdict */}
          <Card className={SIGNAL_STYLES[result.verdict.signal].cls}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">
                  {SIGNAL_STYLES[result.verdict.signal].label}
                </CardTitle>
                <DisclosureBadge kind="estimate" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.verdict.factors.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${FACTOR_DOT[f.status]}`}
                    />
                    <span>
                      <span className="font-medium">{f.label}:</span> {f.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Deal metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Metric label="Cap rate" value={`${result.metrics.capRatePercent}%`} />
            <Metric label="Cash-on-cash" value={`${result.metrics.cashOnCashReturnPercent}%`} />
            <Metric
              label="DSCR"
              value={result.metrics.dscrRatio === null ? '—' : result.metrics.dscrRatio.toFixed(2)}
            />
            <Metric label="Monthly cash flow" money={result.metrics.monthlyCashFlowCents} />
            <Metric label="Annual NOI" money={result.metrics.noiCents} />
          </div>

          {/* Net-worth impact */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Impact on your net worth</CardTitle>
                <DisclosureBadge kind="projection" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    Year {result.horizonYears} — don&apos;t buy
                  </p>
                  <p className="text-lg font-semibold">
                    <MoneyDisplay
                      cents={endingNetWorth(result.withoutProperty)}
                      compact
                      colorCode
                    />
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Year {result.horizonYears} — buy</p>
                  <p className="text-lg font-semibold">
                    <MoneyDisplay cents={endingNetWorth(result.withProperty)} compact colorCode />
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Difference</p>
                  <p className="text-lg font-semibold">
                    <MoneyDisplay cents={result.netWorthDeltaCents} compact showSign colorCode />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monte Carlo range for the buy case */}
          <MonteCarloProjection data={result.monteCarlo} />

          <DisclosurePanel
            payload={{
              kind: 'estimate',
              title: 'How this analysis works',
              framing:
                'We score the deal on conventional rules of thumb and project your net worth with vs without the property, then run a Monte Carlo range for the buy case. Thresholds are guidelines, not guarantees.',
              assumptions: [
                {
                  label: 'Verdict thresholds',
                  value: 'rules of thumb',
                  source: 'default',
                  note: 'DSCR ≥ 1.25 strong / ≥ 1.0 tight; cap rate ≥ 5% favorable; positive cash flow and higher long-run net worth count in favor',
                },
                {
                  label: 'Comparison',
                  value: 'with vs without',
                  source: 'derived',
                  note: 'the same projection engine is run on your current portfolio with and without this property',
                },
              ],
              notModeled: [
                'Taxes on rental income, depreciation, and gains at sale.',
                'Rent growth, capital expenditures, and turnover.',
                'Financing costs beyond the mortgage entered, and closing costs.',
                'Local market conditions — cap-rate norms vary widely by area.',
              ],
              caveats: [
                'This is a screening tool, not investment advice. Treat a favorable signal as “worth a closer look,” not “buy.”',
              ],
            }}
          />
        </div>
      )}
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'number',
  required = true,
}: {
  id: keyof typeof emptyForm
  label: string
  value: string
  onChange: (field: keyof typeof emptyForm, value: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        required={required}
        min={type === 'number' ? '0' : undefined}
      />
    </div>
  )
}

function Metric({ label, value, money }: { label: string; value?: string; money?: number }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="text-lg font-semibold">
          {money !== undefined ? <MoneyDisplay cents={money} compact colorCode /> : value}
        </div>
      </CardContent>
    </Card>
  )
}
