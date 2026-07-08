import type { TaxSummaryResponse } from '@finance-app/shared-types'
import type {
  DisclosurePayload,
  DisclosureAssumption,
} from '@/components/dashboard/shared/disclosure.types'

const filingStatusLabels: Record<string, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
}

/**
 * Build the disclosure for the tax summary.
 *
 * This is an *estimate*, not a filing. It applies the federal ordinary-income
 * brackets and the standard deduction for the filing status to estimated gross
 * income. It deliberately ignores most of the real tax code (state tax, FICA,
 * credits, AMT, preferential capital-gains rates, itemized deductions). The
 * "not modeled" list is the important part here — it's what separates this
 * number from what a return would actually show.
 */
export function buildTaxSummaryDisclosure(summary: TaxSummaryResponse): DisclosurePayload {
  const usesStandardDeduction =
    summary.standardDeductionCents === summary.deductions.standardDeductionCents

  const assumptions: DisclosureAssumption[] = [
    {
      label: 'Tax year',
      value: String(summary.taxYear),
      source: 'user',
      note: 'brackets and the standard deduction are the published figures for this year',
    },
    {
      label: 'Filing status',
      value: filingStatusLabels[summary.filingStatus] ?? summary.filingStatus,
      source: 'user',
      note: 'sets the bracket thresholds and standard-deduction amount',
    },
    {
      label: 'Estimated gross income',
      value: `$${(summary.estimatedGrossIncomeCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      source: 'derived',
      note: 'aggregated from your income entries — all treated as ordinary income',
    },
    {
      label: 'Deduction used',
      value: usesStandardDeduction ? 'Standard deduction' : 'Itemized deductions',
      source: usesStandardDeduction ? 'default' : 'user',
      note: usesStandardDeduction
        ? 'the standard deduction was applied; itemizing was not compared'
        : 'your itemized deductions were applied',
    },
  ]

  return {
    kind: 'estimate',
    title: 'How this estimate is built',
    framing:
      'A federal ordinary-income estimate — not a tax return and not tax advice. It applies this year’s brackets and standard deduction to your estimated income. Many parts of the real tax code are excluded.',
    assumptions,
    notModeled: [
      'State and local income tax.',
      'Payroll taxes (Social Security and Medicare / FICA, self-employment tax).',
      'Tax credits — child tax credit, EITC, education, energy, dependent care.',
      'Preferential rates on long-term capital gains and qualified dividends — all income is taxed as ordinary.',
      'Alternative Minimum Tax (AMT) and income phase-outs.',
      'Itemized deductions beyond mortgage interest and property tax, and the SALT cap.',
      'Pre-tax deferrals (401(k), HSA, IRA), QBI deduction, and above-the-line adjustments.',
    ],
    caveats: [
      'Use this to plan and compare, not to file. A preparer or tax software will produce a different, authoritative number.',
    ],
  }
}
