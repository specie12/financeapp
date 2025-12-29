/**
 * Override target types matching the Prisma OverrideTargetType enum.
 */
export type OverrideTargetType = 'asset' | 'liability' | 'cash_flow_item'

/**
 * A single field override.
 */
export interface FieldOverride {
  /** The name of the field to override */
  fieldName: string
  /** The override value (type varies by field) */
  value: unknown
}

/**
 * Overrides for a specific entity.
 */
export interface EntityOverride {
  /** The ID of the entity to override */
  entityId: string
  /** The type of entity being overridden */
  targetType: OverrideTargetType
  /** The field overrides to apply */
  overrides: FieldOverride[]
}

/**
 * A complete scenario definition.
 */
export interface Scenario {
  /** Unique scenario identifier */
  id: string
  /** Human-readable scenario name */
  name: string
  /** Optional description */
  description?: string
  /** Whether this is the baseline scenario */
  isBaseline: boolean
  /** All entity overrides in this scenario */
  overrides: EntityOverride[]
}

/**
 * Input for applying overrides to a single entity.
 */
export interface ApplyOverridesInput<T> {
  /** The base entity to apply overrides to (will not be mutated) */
  baseEntity: T
  /** The ID of the entity */
  entityId: string
  /** The overrides to apply */
  overrides: EntityOverride[]
}

/**
 * Result of applying overrides to an entity.
 */
export interface ScenarioResult<T> {
  /** The projected entity (new object with overrides applied) */
  entity: T
  /** List of field names that were overridden */
  appliedOverrides: string[]
  /** Whether any overrides were applied */
  isModified: boolean
}

/**
 * Input for applying overrides to multiple entities.
 */
export interface ApplyScenarioInput<T extends { id: string }> {
  /** The base entities to apply overrides to (will not be mutated) */
  entities: T[]
  /** The overrides to apply */
  overrides: EntityOverride[]
}

/**
 * Valid field names for Asset overrides.
 */
export const ASSET_OVERRIDE_FIELDS = [
  'currentValueCents',
  'annualGrowthRatePercent',
  'name',
  'type',
] as const

/**
 * Valid field names for Liability overrides.
 */
export const LIABILITY_OVERRIDE_FIELDS = [
  'currentBalanceCents',
  'interestRatePercent',
  'minimumPaymentCents',
  'termMonths',
  'name',
  'type',
] as const

/**
 * Valid field names for CashFlowItem overrides.
 */
export const CASH_FLOW_ITEM_OVERRIDE_FIELDS = [
  'amountCents',
  'frequency',
  'annualGrowthRatePercent',
  'startDate',
  'endDate',
  'name',
  'type',
] as const

/**
 * Union of all valid override field names by target type.
 */
export type AssetOverrideField = (typeof ASSET_OVERRIDE_FIELDS)[number]
export type LiabilityOverrideField = (typeof LIABILITY_OVERRIDE_FIELDS)[number]
export type CashFlowItemOverrideField = (typeof CASH_FLOW_ITEM_OVERRIDE_FIELDS)[number]

/**
 * Result of validating an override.
 */
export interface OverrideValidationResult {
  valid: boolean
  error?: string
}

/**
 * Result of validating a scenario.
 */
export interface ScenarioValidationResult {
  valid: boolean
  errors: { entityId: string; fieldName: string; error: string }[]
}
