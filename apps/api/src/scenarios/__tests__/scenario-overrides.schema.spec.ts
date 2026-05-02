import { createScenarioSchema, scenarioOverrideSchema } from '@finance-app/validation'

/**
 * P0.3 — every scenario override must be validated at the API write boundary.
 * These tests exercise the Zod schema directly to lock the (targetType,
 * fieldName, value-type) matrix that backs the new typed JSON column.
 */
describe('scenarioOverrideSchema', () => {
  const VALID_UUID = '00000000-0000-0000-0000-000000000001'

  describe('asset overrides', () => {
    it('accepts a numeric currentValueCents override', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'currentValueCents',
        value: 12_500_000,
      })
      expect(result.success).toBe(true)
    })

    it('rejects a string value for currentValueCents (no silent coercion)', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'currentValueCents',
        value: '12500000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects a non-integer currentValueCents', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'currentValueCents',
        value: 12_500_000.5,
      })
      expect(result.success).toBe(false)
    })

    it('rejects an unknown asset field name', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'deleteMe',
        value: 0,
      })
      expect(result.success).toBe(false)
    })

    it('accepts a valid asset type override', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'type',
        value: 'crypto',
      })
      expect(result.success).toBe(true)
    })

    it('rejects a non-enum asset type', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: VALID_UUID,
        fieldName: 'type',
        value: 'gold_bullion',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('liability overrides', () => {
    it('accepts a null termMonths override (clearing the term)', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'liability',
        entityId: VALID_UUID,
        fieldName: 'termMonths',
        value: null,
      })
      expect(result.success).toBe(true)
    })

    it('accepts a positive termMonths override', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'liability',
        entityId: VALID_UUID,
        fieldName: 'termMonths',
        value: 360,
      })
      expect(result.success).toBe(true)
    })

    it('rejects a negative interestRatePercent', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'liability',
        entityId: VALID_UUID,
        fieldName: 'interestRatePercent',
        value: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejects a boolean value masquerading as currentBalanceCents', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'liability',
        entityId: VALID_UUID,
        fieldName: 'currentBalanceCents',
        value: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('cash flow item overrides', () => {
    it('accepts an ISO datetime string for startDate', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'cash_flow_item',
        entityId: VALID_UUID,
        fieldName: 'startDate',
        value: '2030-01-01T00:00:00.000Z',
      })
      expect(result.success).toBe(true)
    })

    it('accepts a null startDate (clearing the date)', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'cash_flow_item',
        entityId: VALID_UUID,
        fieldName: 'startDate',
        value: null,
      })
      expect(result.success).toBe(true)
    })

    it('rejects a non-ISO string for startDate', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'cash_flow_item',
        entityId: VALID_UUID,
        fieldName: 'startDate',
        value: '2030-01-01',
      })
      expect(result.success).toBe(false)
    })

    it('accepts a valid frequency override', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'cash_flow_item',
        entityId: VALID_UUID,
        fieldName: 'frequency',
        value: 'biweekly',
      })
      expect(result.success).toBe(true)
    })

    it('rejects an unknown frequency value', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'cash_flow_item',
        entityId: VALID_UUID,
        fieldName: 'frequency',
        value: 'fortnightly',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('entityId validation', () => {
    it('rejects a non-UUID entityId', () => {
      const result = scenarioOverrideSchema.safeParse({
        targetType: 'asset',
        entityId: 'not-a-uuid',
        fieldName: 'currentValueCents',
        value: 0,
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('createScenarioSchema', () => {
  const VALID_UUID = '00000000-0000-0000-0000-000000000001'

  it('accepts a valid create payload with no overrides', () => {
    const result = createScenarioSchema.safeParse({
      name: 'Empty scenario',
    })
    expect(result.success).toBe(true)
  })

  it('accepts a valid create payload with mixed-type overrides', () => {
    const result = createScenarioSchema.safeParse({
      name: 'Comprehensive what-if',
      description: 'Bumps asset value, lowers rate, renames liability',
      isBaseline: false,
      overrides: [
        {
          targetType: 'asset',
          entityId: VALID_UUID,
          fieldName: 'currentValueCents',
          value: 25_000_000,
        },
        {
          targetType: 'liability',
          entityId: VALID_UUID,
          fieldName: 'interestRatePercent',
          value: 4.5,
        },
        {
          targetType: 'liability',
          entityId: VALID_UUID,
          fieldName: 'name',
          value: 'Refinanced',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects when ANY override in the array is malformed', () => {
    const result = createScenarioSchema.safeParse({
      name: 'Mixed validity',
      overrides: [
        {
          targetType: 'asset',
          entityId: VALID_UUID,
          fieldName: 'currentValueCents',
          value: 10_000,
        },
        {
          targetType: 'asset',
          entityId: VALID_UUID,
          fieldName: 'currentValueCents',
          value: 'oops-a-string',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty scenario name', () => {
    const result = createScenarioSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects more than 100 overrides (resource bound)', () => {
    const tooMany = Array.from({ length: 101 }, () => ({
      targetType: 'asset' as const,
      entityId: VALID_UUID,
      fieldName: 'currentValueCents' as const,
      value: 0,
    }))
    const result = createScenarioSchema.safeParse({ name: 'Floods', overrides: tooMany })
    expect(result.success).toBe(false)
  })
})
