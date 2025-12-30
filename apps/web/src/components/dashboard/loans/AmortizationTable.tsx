'use client'

import { useState } from 'react'
import { DashboardCard } from '../shared/DashboardCard'
import { MoneyDisplay } from '../shared/MoneyDisplay'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/dashboard/formatters'
import type { AmortizationEntry } from '@/lib/dashboard/types'

interface AmortizationTableProps {
  schedule: AmortizationEntry[]
  monthlyPaymentCents: number
}

const ROWS_PER_PAGE = 24

export function AmortizationTable({ schedule, monthlyPaymentCents }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false)

  const displayedSchedule = showAll ? schedule : schedule.slice(0, ROWS_PER_PAGE)
  const hasMore = schedule.length > ROWS_PER_PAGE

  return (
    <DashboardCard
      title="Amortization Schedule"
      description={`${schedule.length} payments`}
      action={
        <div className="text-sm text-muted-foreground">
          Monthly payment: <MoneyDisplay cents={monthlyPaymentCents} className="font-medium" />
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-2 text-left font-medium">#</th>
              <th className="py-2 px-2 text-left font-medium">Date</th>
              <th className="py-2 px-2 text-right font-medium">Beginning</th>
              <th className="py-2 px-2 text-right font-medium">Payment</th>
              <th className="py-2 px-2 text-right font-medium">Principal</th>
              <th className="py-2 px-2 text-right font-medium">Interest</th>
              <th className="py-2 px-2 text-right font-medium">Ending</th>
            </tr>
          </thead>
          <tbody>
            {displayedSchedule.map((entry) => (
              <tr
                key={entry.paymentNumber}
                className="border-b hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 px-2">{entry.paymentNumber}</td>
                <td className="py-2 px-2">{formatDateShort(entry.paymentDate)}</td>
                <td className="py-2 px-2 text-right">
                  <MoneyDisplay cents={entry.beginningBalanceCents} compact />
                </td>
                <td className="py-2 px-2 text-right">
                  <MoneyDisplay cents={entry.scheduledPaymentCents} />
                </td>
                <td className="py-2 px-2 text-right text-green-600">
                  <MoneyDisplay cents={entry.principalCents} />
                </td>
                <td className="py-2 px-2 text-right text-muted-foreground">
                  <MoneyDisplay cents={entry.interestCents} />
                </td>
                <td className="py-2 px-2 text-right font-medium">
                  <MoneyDisplay cents={entry.endingBalanceCents} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `Show All ${schedule.length} Payments`}
          </Button>
        </div>
      )}
    </DashboardCard>
  )
}
