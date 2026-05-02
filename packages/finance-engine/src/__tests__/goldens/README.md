# Golden Financial Test Fixtures

This directory holds reference outputs for the canonical financial engines.
Goldens act as a release gate: any change to engine math fails CI unless the
fixture is updated consciously.

## Files

| Fixture                          | What it locks                                                                                                                | Truth source                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pmt.golden.json`                | Monthly amortizing payment for 8 representative loans (zero-rate, 30/15/5-yr, subprime, edges).                              | PMT formula `M = P · r(1+r)^n / ((1+r)^n − 1)`. The 30-yr $300k @ 6.5% and 15-yr $150k @ 5% values match Bankrate's published amortization table. |
| `amortization.golden.json`       | `monthlyPaymentCents`, `totalPaymentsCents`, `totalInterestCents`, `actualPayoffMonth` for 30-yr / 15-yr cases.              | Canonical Decimal engine. The spec also asserts the hand-verifiable invariant `totalInterest = totalPayments − principal`.                        |
| `tax.golden.json`                | Standard deduction, taxable income, tax liability, effective + marginal rate for Single / MFJ / HoH at $50k / $150k / $500k. | Engine `tax-brackets.ts` (2025 IRS Rev. Proc. 2024-40 figures).                                                                                   |
| `rent-vs-buy.golden.json`        | Full `RentVsBuySummary` for two representative scenarios.                                                                    | Canonical Decimal engine. Sensitive to default assumptions in `rent-vs-buy.constants.ts`; if a default changes, this file must be re-generated.   |
| `mortgage-vs-invest.golden.json` | `payExtraSummary`, `investSummary`, `recommendation`, `breakEvenReturnPercent` for three representative scenarios.           | Canonical Decimal engine. Includes a degenerate (no-extra) case that must agree with canonical amortization.                                      |

## Update protocol

Goldens fail when:

1. The engine changed (intentionally or via numerical drift).
2. A default assumption changed (e.g. `DEFAULT_ASSUMPTIONS.investmentReturnRatePercent`).
3. A fixture's input was edited.

If a failure is **expected**:

1. Re-run the engine for the affected fixture and update the JSON.
2. Note in the commit message what changed and why.
3. If the change reflects an external update (e.g. new IRS brackets), cite the publication.

If a failure is **unexpected**:

1. Stop. The engine drifted. Investigate root cause.
2. Cross-reference against the truth source (formula, Bankrate, IRS).
3. Do not "make the test pass" by adjusting the fixture without understanding why.

## Adding new fixtures

- Lock only deterministic outputs. Skip anything that depends on `Date.now()` or `Math.random()` (the engines explicitly avoid both).
- Use `expect(actual).toEqual(fixture.expected)` (no `toBeCloseTo` for cents).
- Where possible, also assert a hand-verifiable invariant (e.g. `total = principal + interest`). The fixture locks the value; the invariant guarantees the value still has the right _meaning_.
