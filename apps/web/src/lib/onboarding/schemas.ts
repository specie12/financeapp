import { z } from 'zod'
import {
  createUserSchema,
  frequencySchema,
  assetTypeSchema,
  liabilityTypeSchema,
} from '@finance-app/validation'

// ============================================
// Step 1: Account Schema
// ============================================

export const accountStepSchema = createUserSchema
  .extend({
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type AccountStepInput = z.infer<typeof accountStepSchema>

// ============================================
// Step 2: Income Schema
// ============================================

export const incomeItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  amount: z.number().positive('Amount must be positive'),
  frequency: frequencySchema,
})

export const incomeStepSchema = z.object({
  items: z.array(incomeItemSchema).min(1, 'At least one income source is required'),
})

export type IncomeItem = z.infer<typeof incomeItemSchema>
export type IncomeStepInput = z.infer<typeof incomeStepSchema>

// ============================================
// Step 3: Expenses Schema
// ============================================

export const expensesStepSchema = z
  .object({
    housing: z.number().min(0, 'Amount cannot be negative'),
    utilities: z.number().min(0, 'Amount cannot be negative'),
    transportation: z.number().min(0, 'Amount cannot be negative'),
    food: z.number().min(0, 'Amount cannot be negative'),
    other: z.number().min(0, 'Amount cannot be negative'),
  })
  .refine(
    (data) => {
      const total = data.housing + data.utilities + data.transportation + data.food + data.other
      return total > 0
    },
    { message: 'Please enter at least one expense' },
  )

export type ExpensesStepInput = z.infer<typeof expensesStepSchema>

// ============================================
// Step 4: Assets & Debts Schema
// ============================================

export const assetItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  type: assetTypeSchema,
  value: z.number().positive('Value must be positive'),
})

export const liabilityItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  type: liabilityTypeSchema,
  originalBalance: z.number().positive('Original balance must be positive'),
  currentBalance: z.number().positive('Current balance must be positive'),
  interestRate: z.number().min(0, 'Rate cannot be negative').max(100, 'Rate cannot exceed 100%'),
  minimumPayment: z.number().min(0, 'Payment cannot be negative'),
  termMonths: z.number().min(1).max(600).optional(), // Up to 50 years
  monthsPaid: z.number().min(0).optional(),
})

export const assetsDebtsStepSchema = z.object({
  assets: z.array(assetItemSchema),
  liabilities: z.array(liabilityItemSchema),
})

export type AssetItem = z.infer<typeof assetItemSchema>
export type LiabilityItem = z.infer<typeof liabilityItemSchema>
export type AssetsDebtsStepInput = z.infer<typeof assetsDebtsStepSchema>
