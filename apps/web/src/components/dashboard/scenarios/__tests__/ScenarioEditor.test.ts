import { coerceOverrideValue } from '../ScenarioEditor'

/**
 * Regression: scenario override values must be sent to the API as the type the
 * write-time schema expects — numbers for numeric fields (…Cents, …Percent),
 * strings otherwise. Sending numeric fields as strings 400s ("Validation
 * failed") and the scenario update silently does nothing.
 */
describe('coerceOverrideValue', () => {
  it.each([
    'currentValueCents',
    'annualGrowthRatePercent',
    'currentBalanceCents',
    'interestRatePercent',
    'minimumPaymentCents',
    'amountCents',
  ])('coerces numeric field %s to a number', (field) => {
    const result = coerceOverrideValue(field, '50000000')
    expect(typeof result).toBe('number')
    expect(result).toBe(50000000)
  })

  it('leaves a non-numeric field as a string', () => {
    const result = coerceOverrideValue('name', 'Aggressive growth')
    expect(result).toBe('Aggressive growth')
  })
})
