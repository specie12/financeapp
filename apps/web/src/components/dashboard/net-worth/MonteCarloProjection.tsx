'use client'

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { DisclosureBadge, DisclosurePanel } from '../shared'
import type { MonteCarloNetWorthResponse } from '@/lib/dashboard/types'

interface MonteCarloProjectionProps {
  data: MonteCarloNetWorthResponse
}

const dollars = (cents: number) => Math.round(cents / 100)

export function MonteCarloProjection({ data }: MonteCarloProjectionProps) {
  if (data.yearlyBands.length === 0) {
    return null
  }

  const chartData = data.yearlyBands.map((b) => ({
    label: b.year === 0 ? 'Now' : `Yr ${b.year}`,
    // Range areas take a [low, high] tuple — this renders the p10–p90 band and
    // handles negative net worth correctly (unlike stacked areas).
    range: [dollars(b.p10NetWorthCents), dollars(b.p90NetWorthCents)],
    median: dollars(b.p50NetWorthCents),
  }))

  const { summary } = data

  return (
    <div className="space-y-4">
      <DashboardCard
        title={
          <span className="flex items-center gap-2">
            Range of Outcomes
            <DisclosureBadge kind="projection" />
          </span>
        }
        description={`${data.iterations.toLocaleString()} simulated paths over ${data.horizonYears} years, varying yearly returns around each asset's growth rate.`}
      >
        <div className="space-y-4">
          {/* Headline band */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Pessimistic (10th pct)</p>
              <p className="text-lg font-semibold">
                <MoneyDisplay cents={summary.endingP10NetWorthCents} compact colorCode />
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Median (50th pct)</p>
              <p className="text-lg font-semibold">
                <MoneyDisplay cents={summary.endingP50NetWorthCents} compact colorCode />
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Optimistic (90th pct)</p>
              <p className="text-lg font-semibold">
                <MoneyDisplay cents={summary.endingP90NetWorthCents} compact colorCode />
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            In {summary.probEndAboveStartPercent}% of simulations your net worth ends higher than
            today, and in {summary.probEndPositivePercent}% it ends positive.
          </p>

          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number | number[], name: string) => {
                  if (Array.isArray(value)) {
                    const [low = 0, high = 0] = value
                    return [`$${low.toLocaleString()} – $${high.toLocaleString()}`, '10th–90th pct']
                  }
                  return [`$${value.toLocaleString()}`, name]
                }}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Area
                dataKey="range"
                stroke="none"
                fill="#3b82f6"
                fillOpacity={0.15}
                name="10th–90th pct"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="median"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Median"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </DashboardCard>

      <DisclosurePanel
        payload={{
          kind: 'projection',
          title: 'How this range is built',
          framing: `Each of the ${data.iterations.toLocaleString()} paths draws a fresh return for every asset each year, then reads off the 10th, 50th, and 90th percentiles. It shows spread, not certainty.`,
          assumptions: [
            {
              label: 'Return volatility',
              value: `${data.returnVolatilityPercent}%/yr`,
              source: 'default',
              note: 'one portfolio-wide standard deviation applied to every growing asset; cash-like assets are held flat',
            },
            {
              label: 'Expected returns',
              value: "each asset's growth rate",
              source: 'user',
              note: 'the center of the distribution is what you set on each asset',
            },
            {
              label: 'Liabilities',
              value: 'fixed amortization',
              source: 'derived',
              note: 'debt paydown is contractual, so it is identical across every path',
            },
          ],
          notModeled: [
            'Correlation between assets — each asset is drawn independently, which understates the swings of a concentrated portfolio.',
            'Fat tails and crashes — returns are drawn from a normal distribution, which underweights extreme years.',
            'Changing contributions, taxes on gains, inflation, and sequence-of-returns effects on withdrawals.',
          ],
          caveats: [
            'The band is a range of modeled outcomes under one volatility assumption — not a guarantee, and not the full range of what could happen.',
          ],
        }}
      />
    </div>
  )
}
