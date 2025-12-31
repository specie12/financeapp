export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum HouseholdRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export const ROLE_PERMISSIONS: Record<HouseholdRole, Permission[]> = {
  [HouseholdRole.OWNER]: [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE],
  [HouseholdRole.EDITOR]: [Permission.CREATE, Permission.READ, Permission.UPDATE],
  [HouseholdRole.VIEWER]: [Permission.READ],
}

export enum ResourceType {
  // Direct household resources
  ASSET = 'asset',
  LIABILITY = 'liability',
  CASH_FLOW_ITEM = 'cashFlowItem',
  SCENARIO = 'scenario',
  SCENARIO_OVERRIDE = 'scenarioOverride',
  GOAL = 'goal',

  // User-owned resources (indirect household access)
  ACCOUNT = 'account',
  CATEGORY = 'category',
  BUDGET = 'budget',
  TRANSACTION = 'transaction',
}

export interface ResourceConfig {
  type: ResourceType
  idParam: string
}
