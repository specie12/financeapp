import {
  applyOverrides,
  applyScenarioToEntities,
  mergeScenarios,
  validateOverride,
  validateEntityOverride,
  validateScenario,
  createFieldOverride,
  createEntityOverride,
  createScenario,
  getOverriddenEntityIds,
  filterOverridesByType,
} from '../scenario'
import type { EntityOverride, Scenario } from '../scenario/scenario.types'

describe('Scenario Engine', () => {
  // ========================================
  // Test Data Helpers
  // ========================================
  interface TestAsset {
    id: string
    name: string
    currentValueCents: number
    annualGrowthRatePercent: number
    metadata: { notes: string }
  }

  const createTestAsset = (
    id: string,
    name: string,
    value: number,
    growthRate: number,
  ): TestAsset => ({
    id,
    name,
    currentValueCents: value,
    annualGrowthRatePercent: growthRate,
    metadata: { notes: 'original' },
  })

  // ========================================
  // IMMUTABILITY TESTS (Critical Section)
  // ========================================
  describe('Immutability Guarantees', () => {
    it('should NOT mutate the base entity when applying overrides', () => {
      // Arrange
      const base: TestAsset = createTestAsset('1', 'House', 50000000, 3.5)
      const baseCopy = structuredClone(base)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      // Act
      applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Assert - PROVES base entity is unchanged
      expect(base).toEqual(baseCopy)
      expect(base.currentValueCents).toBe(50000000)
      expect(base.name).toBe('House')
    })

    it('should NOT mutate the overrides array when applying overrides', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]
      const overridesCopy = structuredClone(overrides)

      // Act
      applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Assert - PROVES overrides array is unchanged
      expect(overrides).toEqual(overridesCopy)
    })

    it('should return a NEW object instance, not the original', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      // Act
      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Assert - PROVES different object reference
      expect(result.entity).not.toBe(base)
      expect(result.entity.currentValueCents).toBe(60000000)
      expect(base.currentValueCents).toBe(50000000)
    })

    it('should deeply clone nested objects', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = []

      // Act
      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Mutate the result's nested object
      result.entity.metadata.notes = 'mutated'

      // Assert - PROVES deep clone (original unchanged)
      expect(base.metadata.notes).toBe('original')
      expect(result.entity.metadata.notes).toBe('mutated')
    })

    it('should return independent results for each call', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      // Act
      const result1 = applyOverrides({ baseEntity: base, entityId: '1', overrides })
      const result2 = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Mutate result1
      result1.entity.name = 'Mutated House'

      // Assert - result2 is independent
      expect(result1.entity).not.toBe(result2.entity)
      expect(result2.entity.name).toBe('House')
    })

    it('should NOT mutate entities array in batch operation', () => {
      // Arrange
      const entities = [
        createTestAsset('1', 'House', 50000000, 3.5),
        createTestAsset('2', 'Car', 2500000, -10),
      ]
      const entitiesCopy = structuredClone(entities)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      // Act
      applyScenarioToEntities({ entities, overrides })

      // Assert - PROVES original array unchanged
      expect(entities).toEqual(entitiesCopy)
      expect(entities[0]!.currentValueCents).toBe(50000000)
    })

    it('should NOT mutate scenarios when merging', () => {
      // Arrange
      const base: Scenario = createScenario('base', 'Base Scenario', [
        createEntityOverride('1', 'asset', [createFieldOverride('currentValueCents', 100)]),
      ])
      const overlay: Scenario = createScenario('overlay', 'Overlay Scenario', [
        createEntityOverride('1', 'asset', [createFieldOverride('currentValueCents', 200)]),
      ])
      const baseCopy = structuredClone(base)
      const overlayCopy = structuredClone(overlay)

      // Act
      const merged = mergeScenarios(base, overlay)

      // Assert - PROVES neither input was mutated
      expect(base).toEqual(baseCopy)
      expect(overlay).toEqual(overlayCopy)
      expect(merged).not.toBe(base)
      expect(merged).not.toBe(overlay)
    })
  })

  // ========================================
  // DETERMINISM TESTS
  // ========================================
  describe('Determinism Guarantees', () => {
    it('should produce identical output for identical input', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [
            { fieldName: 'currentValueCents', value: 60000000 },
            { fieldName: 'annualGrowthRatePercent', value: 5.0 },
          ],
        },
      ]

      // Act
      const result1 = applyOverrides({ baseEntity: base, entityId: '1', overrides })
      const result2 = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      // Assert - PROVES determinism
      expect(result1).toEqual(result2)
    })

    it('should apply overrides in consistent order', () => {
      // Arrange
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [
            { fieldName: 'name', value: 'Updated House' },
            { fieldName: 'currentValueCents', value: 60000000 },
            { fieldName: 'annualGrowthRatePercent', value: 5.0 },
          ],
        },
      ]

      // Act - Run multiple times
      const results = Array.from({ length: 10 }, () =>
        applyOverrides({ baseEntity: base, entityId: '1', overrides }),
      )

      // Assert - All results have same appliedOverrides order
      const expectedOrder = ['annualGrowthRatePercent', 'currentValueCents', 'name'] // Alphabetical
      for (const result of results) {
        expect(result.appliedOverrides).toEqual(expectedOrder)
      }
    })

    it('should preserve entity order in batch operations', () => {
      // Arrange
      const entities = [
        createTestAsset('3', 'Third', 300, 3),
        createTestAsset('1', 'First', 100, 1),
        createTestAsset('2', 'Second', 200, 2),
      ]
      const overrides: EntityOverride[] = []

      // Act
      const result1 = applyScenarioToEntities({ entities, overrides })
      const result2 = applyScenarioToEntities({ entities, overrides })

      // Assert - Order preserved
      expect(result1.map((r) => r.entity.id)).toEqual(['3', '1', '2'])
      expect(result2.map((r) => r.entity.id)).toEqual(['3', '1', '2'])
    })
  })

  // ========================================
  // OVERRIDE APPLICATION TESTS
  // ========================================
  describe('applyOverrides()', () => {
    it('should apply a single field override', () => {
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      expect(result.entity.currentValueCents).toBe(60000000)
      expect(result.appliedOverrides).toEqual(['currentValueCents'])
      expect(result.isModified).toBe(true)
    })

    it('should apply multiple field overrides', () => {
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [
            { fieldName: 'currentValueCents', value: 60000000 },
            { fieldName: 'annualGrowthRatePercent', value: 5.0 },
            { fieldName: 'name', value: 'Updated House' },
          ],
        },
      ]

      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      expect(result.entity.currentValueCents).toBe(60000000)
      expect(result.entity.annualGrowthRatePercent).toBe(5.0)
      expect(result.entity.name).toBe('Updated House')
      expect(result.appliedOverrides.length).toBe(3)
      expect(result.isModified).toBe(true)
    })

    it('should handle missing entity (no matching override)', () => {
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '999', // Different ID
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      expect(result.entity.currentValueCents).toBe(50000000) // Unchanged
      expect(result.appliedOverrides).toEqual([])
      expect(result.isModified).toBe(false)
    })

    it('should skip invalid field names', () => {
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [
            { fieldName: 'nonExistentField', value: 'ignored' },
            { fieldName: 'currentValueCents', value: 60000000 },
          ],
        },
      ]

      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      expect(result.entity.currentValueCents).toBe(60000000)
      expect(result.appliedOverrides).toEqual(['currentValueCents'])
      expect(result.isModified).toBe(true)
    })

    it('should handle empty overrides array', () => {
      const base = createTestAsset('1', 'House', 50000000, 3.5)
      const overrides: EntityOverride[] = []

      const result = applyOverrides({ baseEntity: base, entityId: '1', overrides })

      expect(result.entity).toEqual(base)
      expect(result.appliedOverrides).toEqual([])
      expect(result.isModified).toBe(false)
    })
  })

  // ========================================
  // BATCH OPERATION TESTS
  // ========================================
  describe('applyScenarioToEntities()', () => {
    it('should apply overrides to multiple entities', () => {
      const entities = [
        createTestAsset('1', 'House', 50000000, 3.5),
        createTestAsset('2', 'Car', 2500000, -10),
      ]
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
        {
          entityId: '2',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 2000000 }],
        },
      ]

      const results = applyScenarioToEntities({ entities, overrides })

      expect(results.length).toBe(2)
      expect(results[0]!.entity.currentValueCents).toBe(60000000)
      expect(results[1]!.entity.currentValueCents).toBe(2000000)
    })

    it('should handle entities without overrides', () => {
      const entities = [
        createTestAsset('1', 'House', 50000000, 3.5),
        createTestAsset('2', 'Car', 2500000, -10),
      ]
      const overrides: EntityOverride[] = [
        {
          entityId: '1',
          targetType: 'asset',
          overrides: [{ fieldName: 'currentValueCents', value: 60000000 }],
        },
      ]

      const results = applyScenarioToEntities({ entities, overrides })

      expect(results[0]!.isModified).toBe(true)
      expect(results[1]!.isModified).toBe(false)
      expect(results[1]!.entity.currentValueCents).toBe(2500000)
    })
  })

  // ========================================
  // SCENARIO MERGE TESTS
  // ========================================
  describe('mergeScenarios()', () => {
    it('should merge two scenarios with overlay taking precedence', () => {
      const base = createScenario('base', 'Base', [
        createEntityOverride('1', 'asset', [
          createFieldOverride('currentValueCents', 100),
          createFieldOverride('name', 'Original Name'),
        ]),
      ])
      const overlay = createScenario('overlay', 'Overlay', [
        createEntityOverride('1', 'asset', [createFieldOverride('currentValueCents', 200)]),
      ])

      const merged = mergeScenarios(base, overlay)

      expect(merged.id).toBe('overlay')
      expect(merged.name).toBe('Overlay')
      expect(merged.overrides.length).toBe(1)
      expect(merged.overrides[0]!.overrides.length).toBe(2)

      // Find the currentValueCents override
      const valueOverride = merged.overrides[0]!.overrides.find(
        (o) => o.fieldName === 'currentValueCents',
      )
      expect(valueOverride!.value).toBe(200) // Overlay wins
    })

    it('should combine overrides for different entities', () => {
      const base = createScenario('base', 'Base', [
        createEntityOverride('1', 'asset', [createFieldOverride('currentValueCents', 100)]),
      ])
      const overlay = createScenario('overlay', 'Overlay', [
        createEntityOverride('2', 'asset', [createFieldOverride('currentValueCents', 200)]),
      ])

      const merged = mergeScenarios(base, overlay)

      expect(merged.overrides.length).toBe(2)
      const entityIds = merged.overrides.map((o) => o.entityId)
      expect(entityIds).toContain('1')
      expect(entityIds).toContain('2')
    })

    it('should set isBaseline to false for merged scenarios', () => {
      const base = createScenario('base', 'Base', [], { isBaseline: true })
      const overlay = createScenario('overlay', 'Overlay', [], { isBaseline: true })

      const merged = mergeScenarios(base, overlay)

      expect(merged.isBaseline).toBe(false)
    })
  })

  // ========================================
  // VALIDATION TESTS
  // ========================================
  describe('validateOverride()', () => {
    it('should validate correct asset field', () => {
      const result = validateOverride('asset', 'currentValueCents', 100000)
      expect(result.valid).toBe(true)
    })

    it('should reject invalid asset field', () => {
      const result = validateOverride('asset', 'invalidField', 100)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalidField')
    })

    it('should validate correct liability field', () => {
      const result = validateOverride('liability', 'interestRatePercent', 5.5)
      expect(result.valid).toBe(true)
    })

    it('should validate correct cash_flow_item field', () => {
      const result = validateOverride('cash_flow_item', 'amountCents', 50000)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateEntityOverride()', () => {
    it('should validate correct entity override', () => {
      const override: EntityOverride = {
        entityId: '123',
        targetType: 'asset',
        overrides: [{ fieldName: 'currentValueCents', value: 100000 }],
      }
      const result = validateEntityOverride(override)
      expect(result.valid).toBe(true)
    })

    it('should reject empty entity ID', () => {
      const override: EntityOverride = {
        entityId: '',
        targetType: 'asset',
        overrides: [],
      }
      const result = validateEntityOverride(override)
      expect(result.valid).toBe(false)
    })

    it('should reject invalid target type', () => {
      const override = {
        entityId: '123',
        targetType: 'invalid' as 'asset',
        overrides: [],
      }
      const result = validateEntityOverride(override)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateScenario()', () => {
    it('should validate correct scenario', () => {
      const scenario = createScenario('1', 'Test Scenario', [
        createEntityOverride('1', 'asset', [createFieldOverride('currentValueCents', 100)]),
      ])
      const result = validateScenario(scenario)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject scenario with empty ID', () => {
      const scenario: Scenario = {
        id: '',
        name: 'Test',
        isBaseline: false,
        overrides: [],
      }
      const result = validateScenario(scenario)
      expect(result.valid).toBe(false)
    })
  })

  // ========================================
  // HELPER FUNCTION TESTS
  // ========================================
  describe('Helper Functions', () => {
    describe('createFieldOverride()', () => {
      it('should create a field override', () => {
        const override = createFieldOverride('currentValueCents', 100000)
        expect(override.fieldName).toBe('currentValueCents')
        expect(override.value).toBe(100000)
      })
    })

    describe('createEntityOverride()', () => {
      it('should create an entity override', () => {
        const override = createEntityOverride('123', 'asset', [
          createFieldOverride('currentValueCents', 100000),
        ])
        expect(override.entityId).toBe('123')
        expect(override.targetType).toBe('asset')
        expect(override.overrides.length).toBe(1)
      })
    })

    describe('createScenario()', () => {
      it('should create a scenario with defaults', () => {
        const scenario = createScenario('1', 'Test', [])
        expect(scenario.id).toBe('1')
        expect(scenario.name).toBe('Test')
        expect(scenario.isBaseline).toBe(false)
        expect(scenario.description).toBeUndefined()
      })

      it('should create a scenario with options', () => {
        const scenario = createScenario('1', 'Test', [], {
          description: 'A test scenario',
          isBaseline: true,
        })
        expect(scenario.description).toBe('A test scenario')
        expect(scenario.isBaseline).toBe(true)
      })
    })

    describe('getOverriddenEntityIds()', () => {
      it('should extract entity IDs from scenario', () => {
        const scenario = createScenario('1', 'Test', [
          createEntityOverride('a1', 'asset', []),
          createEntityOverride('l1', 'liability', []),
        ])
        const ids = getOverriddenEntityIds(scenario)
        expect(ids).toEqual(['a1', 'l1'])
      })
    })

    describe('filterOverridesByType()', () => {
      it('should filter overrides by target type', () => {
        const overrides: EntityOverride[] = [
          createEntityOverride('1', 'asset', []),
          createEntityOverride('2', 'liability', []),
          createEntityOverride('3', 'asset', []),
        ]

        const assets = filterOverridesByType(overrides, 'asset')
        const liabilities = filterOverridesByType(overrides, 'liability')

        expect(assets.length).toBe(2)
        expect(liabilities.length).toBe(1)
      })
    })
  })

  // ========================================
  // INTEGRATION TEST
  // ========================================
  describe('Integration', () => {
    it('should handle complete scenario workflow', () => {
      // 1. Create entities
      const assets = [
        createTestAsset('a1', 'House', 50000000, 3.5),
        createTestAsset('a2', 'Investment Account', 10000000, 7.0),
      ]

      // 2. Create base scenario
      const baseScenario = createScenario('base', 'Current State', [], { isBaseline: true })

      // 3. Create optimistic scenario
      const optimisticScenario = createScenario('optimistic', 'Optimistic Projection', [
        createEntityOverride('a1', 'asset', [
          createFieldOverride('currentValueCents', 60000000), // 20% increase
          createFieldOverride('annualGrowthRatePercent', 5.0), // Higher growth
        ]),
        createEntityOverride('a2', 'asset', [
          createFieldOverride('annualGrowthRatePercent', 10.0), // Better returns
        ]),
      ])

      // 4. Apply scenarios
      const baseResults = applyScenarioToEntities({
        entities: assets,
        overrides: baseScenario.overrides,
      })
      const optimisticResults = applyScenarioToEntities({
        entities: assets,
        overrides: optimisticScenario.overrides,
      })

      // 5. Verify base scenario (no changes)
      expect(baseResults[0]!.isModified).toBe(false)
      expect(baseResults[0]!.entity.currentValueCents).toBe(50000000)

      // 6. Verify optimistic scenario
      expect(optimisticResults[0]!.isModified).toBe(true)
      expect(optimisticResults[0]!.entity.currentValueCents).toBe(60000000)
      expect(optimisticResults[0]!.entity.annualGrowthRatePercent).toBe(5.0)

      // 7. Verify original data unchanged
      expect(assets[0]!.currentValueCents).toBe(50000000)
      expect(assets[0]!.annualGrowthRatePercent).toBe(3.5)
    })
  })
})
