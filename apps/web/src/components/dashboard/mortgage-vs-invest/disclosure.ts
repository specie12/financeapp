import type { MortgageVsInvestResult, MortgageVsInvestRequest } from '@finance-app/shared-types'
import type {
  DisclosurePayload,
  DisclosureAssumption,
} from '@/components/dashboard/shared/disclosure.types'

const fmtPercent = (value: number) => `${value.toFixed(2)}%`
const fmtPercentInt = (value: number) => `${value.toFixed(0)}%`

/**
 * Build the disclosure for a mortgage-vs-invest result.
 *
 * Unlike rent-vs-buy, every assumption here is a direct user input — the
 * engine has no defaulting layer. We mark them all `source: 'user'` and
 * lean on the "not modeled" list for the things the simulation excludes
 * (notably tax law nuance and market volatility).
 */
export function buildMortgageVsInvestDisclosure(
  request: MortgageVsInvestRequest,
  _result: MortgageVsInvestResult,
): DisclosurePayload {
  const assumptions: DisclosureAssumption[] = [
    {
      label: 'Mortgage rate',
      value: fmtPercent(request.mortgageRatePercent),
      source: 'user',
      note: 'fixed for the entire term — no ARM resets or refinancing',
    },
    {
      label: 'Expected investment return',
      value: fmtPercent(request.expectedReturnPercent),
      source: 'user',
      note: 'compounded monthly at a constant rate',
    },
    {
      label: 'Capital gains tax rate',
      value: fmtPercentInt(request.capitalGainsTaxPercent),
      source: 'user',
      note: 'applied once at horizon to the portfolio gain',
    },
    {
      label: 'Mortgage interest deductible',
      value: request.mortgageInterestDeductible ? 'Yes' : 'No',
      source: 'user',
      note: request.mortgageInterestDeductible
        ? `lost-deduction value reduces interest savings at ${fmtPercentInt(request.marginalTaxRatePercent)}`
        : 'savings counted at face value',
    },
    {
      label: 'Comparison horizon',
      value: `${request.horizonYears} years`,
      source: 'user',
      note: 'the recommendation evaluates net advantage at this horizon only',
    },
    {
      label: 'Extra monthly payment',
      value: `$${(request.extraMonthlyPaymentCents / 100).toFixed(0)}`,
      source: 'user',
      note: 'applied entirely to principal each month, capped at the remaining balance',
    },
  ]

  return {
    kind: 'projection',
    framing:
      'A side-by-side projection of paying extra principal vs investing the same dollars. The recommendation depends entirely on the assumptions you entered — small changes can flip it.',
    assumptions,
    notModeled: [
      'Market volatility — the investment return is a flat constant; real-world returns vary year to year and can be negative.',
      'Tax law changes — TCJA mortgage-interest cap, AGI phase-outs, AMT, and itemized-vs-standard-deduction comparisons are not modeled.',
      'Refinancing, prepayment penalties, recasts, or rate resets.',
      'Sequence-of-returns risk — the order of investment returns matters in real life; this projection ignores it.',
      'Asset-allocation drag (expense ratios, fund fees, taxes on dividends).',
      'Liquidity — paying extra principal reduces accessible cash; investing keeps it liquid. The numbers do not weight that.',
    ],
    caveats: [
      'The break-even return tells you the investment return at which the two strategies tie, given everything else above.',
    ],
  }
}
