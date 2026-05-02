// P0.3: Scenario create/update bodies are validated by `createScenarioSchema`
// / `updateScenarioSchema` from `@finance-app/validation` via ZodValidationPipe
// at the controller boundary. The DTO classes below exist only for typing the
// request shape inside the service. They DO NOT carry any class-validator
// decorators because the Zod schema is the single source of truth for input
// validation — duplicating it here would let the two validators drift.

export enum OverrideTargetType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  CASH_FLOW_ITEM = 'cash_flow_item',
}

export class ScenarioOverrideDto {
  targetType!: OverrideTargetType
  entityId!: string
  fieldName!: string
  /** Typed JSON value (number | string | boolean | null) — typed per (targetType, fieldName). */
  value!: unknown
}

export class CreateScenarioDto {
  name!: string
  description?: string | null
  isBaseline?: boolean
  overrides?: ScenarioOverrideDto[]
}
