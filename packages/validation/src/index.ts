import { z } from 'zod'

// ============================================
// Base Schemas
// ============================================

export const currencySchema = z.enum([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'INR',
  'NGN',
])

export const accountTypeSchema = z.enum([
  'checking',
  'savings',
  'credit_card',
  'investment',
  'loan',
  'cash',
])

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer'])

export const budgetPeriodSchema = z.enum(['weekly', 'monthly', 'quarterly', 'yearly'])

export const assetTypeSchema = z.enum([
  'real_estate',
  'vehicle',
  'investment',
  'retirement_account',
  'bank_account',
  'crypto',
  'other',
])

// ============================================
// User Schemas
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// Account Schemas
// ============================================

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100),
  type: accountTypeSchema,
  currency: currencySchema,
  initialBalance: z.number().default(0),
})

export const updateAccountSchema = createAccountSchema.partial()

// ============================================
// Transaction Schemas
// ============================================

export const createTransactionSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  type: transactionTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(255),
  date: z.coerce.date(),
})

export const updateTransactionSchema = createTransactionSchema.partial()

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: transactionTypeSchema,
  icon: z.string().max(50).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .nullable()
    .optional(),
  parentId: z.string().uuid('Invalid parent category ID').nullable().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ============================================
// Budget Schemas
// ============================================

export const createBudgetSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Budget amount must be positive'),
  period: budgetPeriodSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
})

export const updateBudgetSchema = createBudgetSchema.partial()

// ============================================
// Asset Schemas
// ============================================

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').max(100),
  type: assetTypeSchema,
  currentValueCents: z.number().int().nonnegative('Value must be non-negative'),
  annualGrowthRatePercent: z.number().min(-100).max(1000).nullable().optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

// ============================================
// Query Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export const transactionQuerySchema = paginationSchema.merge(dateRangeSchema).extend({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeSchema.optional(),
})

export const assetQuerySchema = paginationSchema.extend({
  type: assetTypeSchema.optional(),
})

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>
export type AssetType = z.infer<typeof assetTypeSchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type AssetQueryInput = z.infer<typeof assetQuerySchema>

// Re-export zod for convenience
export { z } from 'zod'
