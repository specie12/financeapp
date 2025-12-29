import type {
  OverrideTargetType,
  FieldOverride,
  EntityOverride,
  Scenario,
  ApplyOverridesInput,
  ScenarioResult,
  ApplyScenarioInput,
  OverrideValidationResult,
  ScenarioValidationResult,
} from './scenario.types'
import {
  ASSET_OVERRIDE_FIELDS,
  LIABILITY_OVERRIDE_FIELDS,
  CASH_FLOW_ITEM_OVERRIDE_FIELDS,
} from './scenario.types'

// ============================================
// Validation Functions
// ============================================

/**
 * Gets the valid override fields for a target type.
 */
function getValidFieldsForType(targetType: OverrideTargetType): readonly string[] {
  switch (targetType) {
    case 'asset':
      return ASSET_OVERRIDE_FIELDS
    case 'liability':
      return LIABILITY_OVERRIDE_FIELDS
    case 'cash_flow_item':
      return CASH_FLOW_ITEM_OVERRIDE_FIELDS
  }
}

/**
 * Validates a single override field and value.
 */
export function validateOverride(
  targetType: OverrideTargetType,
  fieldName: string,
  _value: unknown,
): OverrideValidationResult {
  const validFields = getValidFieldsForType(targetType)

  if (!validFields.includes(fieldName)) {
    return {
      valid: false,
      error: `Invalid field '${fieldName}' for target type '${targetType}'. Valid fields: ${validFields.join(', ')}`,
    }
  }

  // Note: Value type validation is intentionally lenient
  // The engine accepts any value and applies it if the field exists
  // Type enforcement should happen at the API/schema layer

  return { valid: true }
}

/**
 * Validates an entity override.
 */
export function validateEntityOverride(override: EntityOverride): OverrideValidationResult {
  if (!override.entityId || typeof override.entityId !== 'string') {
    return { valid: false, error: 'Entity ID must be a non-empty string' }
  }

  const validTargetTypes: OverrideTargetType[] = ['asset', 'liability', 'cash_flow_item']
  if (!validTargetTypes.includes(override.targetType)) {
    return { valid: false, error: `Invalid target type: ${override.targetType}` }
  }

  if (!Array.isArray(override.overrides)) {
    return { valid: false, error: 'Overrides must be an array' }
  }

  for (const fieldOverride of override.overrides) {
    const result = validateOverride(
      override.targetType,
      fieldOverride.fieldName,
      fieldOverride.value,
    )
    if (!result.valid) {
      return result
    }
  }

  return { valid: true }
}

/**
 * Validates a complete scenario.
 */
export function validateScenario(scenario: Scenario): ScenarioValidationResult {
  const errors: { entityId: string; fieldName: string; error: string }[] = []

  if (!scenario.id || typeof scenario.id !== 'string') {
    errors.push({ entityId: '', fieldName: '', error: 'Scenario ID must be a non-empty string' })
  }

  if (!scenario.name || typeof scenario.name !== 'string') {
    errors.push({ entityId: '', fieldName: '', error: 'Scenario name must be a non-empty string' })
  }

  if (!Array.isArray(scenario.overrides)) {
    errors.push({ entityId: '', fieldName: '', error: 'Overrides must be an array' })
    return { valid: false, errors }
  }

  for (const entityOverride of scenario.overrides) {
    const result = validateEntityOverride(entityOverride)
    if (!result.valid) {
      errors.push({
        entityId: entityOverride.entityId,
        fieldName: '',
        error: result.error!,
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================
// Core Override Functions
// ============================================

/**
 * Applies field overrides to a single entity.
 *
 * IMMUTABILITY GUARANTEE: This function NEVER mutates the input.
 * It creates a deep clone of the base entity before applying overrides.
 *
 * DETERMINISM GUARANTEE: Given the same inputs, this function always
 * produces the same output. No randomness or external state is used.
 *
 * @param input - The base entity, entity ID, and overrides to apply
 * @returns A new object with overrides applied and metadata about what changed
 */
export function applyOverrides<T extends object>(input: ApplyOverridesInput<T>): ScenarioResult<T> {
  // 1. Deep clone to ensure immutability (CRITICAL)
  const cloned = structuredClone(input.baseEntity)

  // 2. Find overrides for this specific entity
  const entityOverride = input.overrides.find((o) => o.entityId === input.entityId)

  if (!entityOverride || entityOverride.overrides.length === 0) {
    return {
      entity: cloned,
      appliedOverrides: [],
      isModified: false,
    }
  }

  // 3. Apply each override to the clone (sorted for determinism)
  const appliedOverrides: string[] = []
  const sortedOverrides = [...entityOverride.overrides].sort((a, b) =>
    a.fieldName.localeCompare(b.fieldName),
  )

  for (const override of sortedOverrides) {
    // Only apply if the field exists on the entity
    if (override.fieldName in cloned) {
      ;(cloned as Record<string, unknown>)[override.fieldName] = override.value
      appliedOverrides.push(override.fieldName)
    }
  }

  // 4. Return new result object
  return {
    entity: cloned,
    appliedOverrides,
    isModified: appliedOverrides.length > 0,
  }
}

/**
 * Applies overrides to multiple entities.
 *
 * IMMUTABILITY GUARANTEE: This function NEVER mutates the input entities.
 * Each entity is deep cloned before overrides are applied.
 *
 * DETERMINISM GUARANTEE: Entities are processed in their original order.
 * Given the same inputs, this function always produces the same output.
 *
 * @param input - The entities and overrides to apply
 * @returns Array of results with new entity objects and metadata
 */
export function applyScenarioToEntities<T extends { id: string }>(
  input: ApplyScenarioInput<T>,
): ScenarioResult<T>[] {
  // Process entities in order (deterministic)
  return input.entities.map((entity) =>
    applyOverrides({
      baseEntity: entity,
      entityId: entity.id,
      overrides: input.overrides,
    }),
  )
}

/**
 * Applies a complete scenario to an entity.
 *
 * @param entity - The base entity
 * @param scenario - The scenario containing overrides
 * @returns Result with the projected entity
 */
export function applyScenario<T extends { id: string }>(
  entity: T,
  scenario: Scenario,
): ScenarioResult<T> {
  return applyOverrides({
    baseEntity: entity,
    entityId: entity.id,
    overrides: scenario.overrides,
  })
}

// ============================================
// Scenario Merge Functions
// ============================================

/**
 * Merges two scenarios, with the overlay taking precedence.
 *
 * IMMUTABILITY GUARANTEE: Neither input scenario is mutated.
 * A completely new scenario object is returned.
 *
 * @param base - The base scenario
 * @param overlay - The overlay scenario (takes precedence on conflicts)
 * @returns A new merged scenario
 */
export function mergeScenarios(base: Scenario, overlay: Scenario): Scenario {
  // Create a map of entity overrides from base
  const mergedOverridesMap = new Map<string, EntityOverride>()

  // Add base overrides
  for (const entityOverride of base.overrides) {
    mergedOverridesMap.set(entityOverride.entityId, structuredClone(entityOverride))
  }

  // Merge overlay overrides (takes precedence)
  for (const entityOverride of overlay.overrides) {
    const existing = mergedOverridesMap.get(entityOverride.entityId)

    if (existing) {
      // Merge field overrides for same entity
      const fieldMap = new Map<string, FieldOverride>()

      for (const field of existing.overrides) {
        fieldMap.set(field.fieldName, structuredClone(field))
      }

      // Overlay takes precedence
      for (const field of entityOverride.overrides) {
        fieldMap.set(field.fieldName, structuredClone(field))
      }

      existing.overrides = Array.from(fieldMap.values())
    } else {
      mergedOverridesMap.set(entityOverride.entityId, structuredClone(entityOverride))
    }
  }

  // Return new scenario (no mutation)
  return {
    id: overlay.id, // Use overlay's ID
    name: overlay.name,
    description: overlay.description ?? base.description,
    isBaseline: false, // Merged scenarios are never baseline
    overrides: Array.from(mergedOverridesMap.values()),
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Creates a field override.
 */
export function createFieldOverride(fieldName: string, value: unknown): FieldOverride {
  return { fieldName, value }
}

/**
 * Creates an entity override.
 */
export function createEntityOverride(
  entityId: string,
  targetType: OverrideTargetType,
  overrides: FieldOverride[],
): EntityOverride {
  return { entityId, targetType, overrides }
}

/**
 * Creates a scenario.
 */
export function createScenario(
  id: string,
  name: string,
  overrides: EntityOverride[],
  options: { description?: string; isBaseline?: boolean } = {},
): Scenario {
  return {
    id,
    name,
    description: options.description,
    isBaseline: options.isBaseline ?? false,
    overrides,
  }
}

/**
 * Extracts the IDs of all entities that have overrides in a scenario.
 */
export function getOverriddenEntityIds(scenario: Scenario): string[] {
  return scenario.overrides.map((o) => o.entityId)
}

/**
 * Filters overrides to only include those for a specific target type.
 */
export function filterOverridesByType(
  overrides: EntityOverride[],
  targetType: OverrideTargetType,
): EntityOverride[] {
  return overrides.filter((o) => o.targetType === targetType)
}
