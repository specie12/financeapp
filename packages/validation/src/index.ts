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

export const liabilityTypeSchema = z.enum([
  'mortgage',
  'auto_loan',
  'student_loan',
  'credit_card',
  'personal_loan',
  'other',
])

export const frequencySchema = z.enum([
  'one_time',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'annually',
])

export const cashFlowTypeSchema = z.enum(['income', 'expense'])

export const countrySchema = z.enum(['US', 'UK', 'CA'])

export const goalTypeSchema = z.enum(['net_worth_target', 'savings_target', 'debt_freedom'])

export const goalStatusSchema = z.enum(['active', 'achieved', 'paused'])

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
  dividendYieldPercent: z.number().min(0).max(100).nullable().optional(),
  ticker: z.string().min(1).max(10).nullable().optional(),
  shares: z.number().positive().nullable().optional(),
  costBasisCents: z.number().int().nonnegative().nullable().optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

// ============================================
// Liability Schemas
// ============================================

export const createLiabilitySchema = z.object({
  name: z.string().min(1, 'Liability name is required').max(100),
  type: liabilityTypeSchema,
  principalCents: z.number().int().nonnegative('Principal must be non-negative'),
  currentBalanceCents: z.number().int().nonnegative('Balance must be non-negative'),
  interestRatePercent: z.number().min(0, 'Interest rate must be non-negative').max(100),
  minimumPaymentCents: z.number().int().nonnegative('Minimum payment must be non-negative'),
  paymentFrequency: frequencySchema.default('monthly'),
  termMonths: z.number().int().positive('Term must be positive').nullable().optional(),
  startDate: z.coerce.date(),
})

export const updateLiabilitySchema = createLiabilitySchema.partial()

// ============================================
// CashFlowItem Schemas
// ============================================

export const createCashFlowItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: cashFlowTypeSchema,
  amountCents: z.number().int().nonnegative('Amount must be non-negative'),
  frequency: frequencySchema,
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  annualGrowthRatePercent: z.number().min(-100).max(1000).nullable().optional(),
})

export const updateCashFlowItemSchema = createCashFlowItemSchema.partial()

// ============================================
// Goal Schemas
// ============================================

export const createGoalSchema = z.object({
  type: goalTypeSchema,
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmountCents: z.number().int().positive('Target amount must be positive'),
  targetDate: z.coerce.date().nullable().optional(),
  linkedLiabilityId: z.string().uuid('Invalid liability ID').nullable().optional(),
  linkedAssetIds: z.array(z.string().uuid('Invalid asset ID')).optional(),
})

export const updateGoalSchema = z.object({
  type: goalTypeSchema.optional(),
  name: z.string().min(1, 'Goal name is required').max(100).optional(),
  targetAmountCents: z.number().int().positive('Target amount must be positive').optional(),
  currentAmountCents: z
    .number()
    .int()
    .nonnegative('Current amount must be non-negative')
    .optional(),
  targetDate: z.coerce.date().nullable().optional(),
  status: goalStatusSchema.optional(),
  linkedLiabilityId: z.string().uuid('Invalid liability ID').nullable().optional(),
  linkedAssetIds: z.array(z.string().uuid('Invalid asset ID')).optional(),
})

// ============================================
// Rent vs Buy Calculator Schemas
// ============================================

export const rentVsBuyRequestSchema = z.object({
  startDate: z.coerce.date(),
  projectionYears: z.number().int().min(1).max(30),
  buy: z.object({
    homePriceCents: z.number().int().positive('Home price must be positive'),
    downPaymentPercent: z.number().min(0).max(100),
    mortgageInterestRatePercent: z.number().min(0).max(25),
    mortgageTermYears: z.number().int().min(1).max(40),
    closingCostPercent: z.number().min(0).max(10),
    homeownersInsuranceAnnualCents: z.number().int().nonnegative(),
    hoaMonthlyDuesCents: z.number().int().nonnegative(),
    propertyTaxRateOverride: z.number().min(0).max(10).optional(),
    maintenanceRateOverride: z.number().min(0).max(10).optional(),
  }),
  rent: z.object({
    monthlyRentCents: z.number().int().positive('Monthly rent must be positive'),
    securityDepositMonths: z.number().min(0).max(12),
    rentersInsuranceAnnualCents: z.number().int().nonnegative(),
    rentIncreaseRateOverride: z.number().min(0).max(20).optional(),
  }),
  assumptions: z
    .object({
      homeAppreciationRatePercent: z.number().min(-10).max(20).optional(),
      investmentReturnRatePercent: z.number().min(-20).max(30).optional(),
      inflationRatePercent: z.number().min(0).max(15).optional(),
      propertyTaxRatePercent: z.number().min(0).max(10).optional(),
      maintenanceRatePercent: z.number().min(0).max(10).optional(),
      rentIncreaseRatePercent: z.number().min(0).max(20).optional(),
      marginalTaxRatePercent: z.number().min(0).max(50).optional(),
      sellingCostPercent: z.number().min(0).max(15).optional(),
    })
    .optional(),
})

// ============================================
// Loan Optimization Schemas
// ============================================

export const extraPaymentSchema = z.object({
  paymentNumber: z.number().int().positive('Payment number must be positive'),
  amountCents: z.number().int().positive('Amount must be positive'),
})

export const extraPaymentSimulationSchema = z.object({
  extraPayments: z.array(extraPaymentSchema).min(1, 'At least one extra payment is required'),
})

export const recurringExtraPaymentSchema = z.object({
  extraAmountCents: z.number().int().positive('Extra amount must be positive'),
  startPaymentNumber: z.number().int().positive('Start payment number must be positive').optional(),
})

// ============================================
// Mortgage vs Invest Calculator Schemas
// ============================================

export const mortgageVsInvestRequestSchema = z.object({
  currentBalanceCents: z.number().int().positive('Balance must be positive'),
  mortgageRatePercent: z.number().min(0).max(25),
  remainingTermMonths: z.number().int().positive().max(480),
  extraMonthlyPaymentCents: z.number().int().positive('Extra payment must be positive'),
  expectedReturnPercent: z.number().min(-20).max(30),
  capitalGainsTaxPercent: z.number().min(0).max(50),
  horizonYears: z.number().int().min(1).max(30),
  mortgageInterestDeductible: z.boolean(),
  marginalTaxRatePercent: z.number().min(0).max(50),
})

// ============================================
// Rental Property Schemas
// ============================================

export const createRentalPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(100),
  address: z.string().max(255).nullable().optional(),
  purchasePriceCents: z.number().int().positive('Purchase price must be positive'),
  currentValueCents: z.number().int().positive('Current value must be positive'),
  downPaymentCents: z.number().int().nonnegative('Down payment must be non-negative'),
  monthlyRentCents: z.number().int().positive('Monthly rent must be positive'),
  vacancyRatePercent: z.number().min(0).max(100).default(5),
  annualExpensesCents: z.number().int().nonnegative('Expenses must be non-negative'),
  propertyTaxAnnualCents: z.number().int().nonnegative('Property tax must be non-negative'),
  mortgagePaymentCents: z.number().int().nonnegative().nullable().optional(),
  mortgageRatePercent: z.number().min(0).max(25).nullable().optional(),
  linkedAssetId: z.string().uuid().nullable().optional(),
  linkedLiabilityId: z.string().uuid().nullable().optional(),
})

export const updateRentalPropertySchema = createRentalPropertySchema.partial()

export const rentalPropertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// ============================================
// AI Advice Schemas
// ============================================

export const adviceRequestSchema = z.object({
  topic: z.string().max(500).optional(),
})

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  conversationId: z.string().uuid().optional(),
})

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

export const accountQuerySchema = paginationSchema.extend({
  type: accountTypeSchema.optional(),
})

export const categoryQuerySchema = paginationSchema.extend({
  type: transactionTypeSchema.optional(),
})

export const budgetQuerySchema = paginationSchema.extend({
  period: budgetPeriodSchema.optional(),
})

export const assetQuerySchema = paginationSchema.extend({
  type: assetTypeSchema.optional(),
})

export const liabilityQuerySchema = paginationSchema.extend({
  type: liabilityTypeSchema.optional(),
})

export const cashFlowItemQuerySchema = paginationSchema.extend({
  type: cashFlowTypeSchema.optional(),
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
export type AccountType = z.infer<typeof accountTypeSchema>
export type AccountQueryInput = z.infer<typeof accountQuerySchema>
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>
export type BudgetQueryInput = z.infer<typeof budgetQuerySchema>
export type AssetType = z.infer<typeof assetTypeSchema>
export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
export type AssetQueryInput = z.infer<typeof assetQuerySchema>
export type LiabilityType = z.infer<typeof liabilityTypeSchema>
export type Frequency = z.infer<typeof frequencySchema>
export type CreateLiabilityInput = z.infer<typeof createLiabilitySchema>
export type UpdateLiabilityInput = z.infer<typeof updateLiabilitySchema>
export type LiabilityQueryInput = z.infer<typeof liabilityQuerySchema>
export type CashFlowType = z.infer<typeof cashFlowTypeSchema>
export type CreateCashFlowItemInput = z.infer<typeof createCashFlowItemSchema>
export type UpdateCashFlowItemInput = z.infer<typeof updateCashFlowItemSchema>
export type CashFlowItemQueryInput = z.infer<typeof cashFlowItemQuerySchema>
export type Country = z.infer<typeof countrySchema>
export type GoalType = z.infer<typeof goalTypeSchema>
export type GoalStatus = z.infer<typeof goalStatusSchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type RentVsBuyRequestInput = z.infer<typeof rentVsBuyRequestSchema>
export type ExtraPaymentInput = z.infer<typeof extraPaymentSchema>
export type ExtraPaymentSimulationInput = z.infer<typeof extraPaymentSimulationSchema>
export type RecurringExtraPaymentInput = z.infer<typeof recurringExtraPaymentSchema>
export type MortgageVsInvestRequestInput = z.infer<typeof mortgageVsInvestRequestSchema>
export type CreateRentalPropertyInput = z.infer<typeof createRentalPropertySchema>
export type UpdateRentalPropertyInput = z.infer<typeof updateRentalPropertySchema>
export type RentalPropertyQueryInput = z.infer<typeof rentalPropertyQuerySchema>
export type AdviceRequestInput = z.infer<typeof adviceRequestSchema>
export type ChatRequestInput = z.infer<typeof chatRequestSchema>

// ============================================
// Notification Schemas
// ============================================

export const notificationQuerySchema = z.object({
  unreadOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const markNotificationReadSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
})

// ============================================
// Tax Schemas
// ============================================

export const filingStatusSchema = z.enum([
  'single',
  'married_filing_jointly',
  'married_filing_separately',
  'head_of_household',
])

export const createTaxProfileSchema = z.object({
  taxYear: z.number().int().min(2020).max(2030),
  filingStatus: filingStatusSchema,
  stateCode: z.string().length(2).nullable().optional(),
  dependents: z.number().int().min(0).max(20).default(0),
  additionalIncomeCents: z.number().int().nonnegative().nullable().optional(),
})

export const updateTaxProfileSchema = z.object({
  filingStatus: filingStatusSchema.optional(),
  stateCode: z.string().length(2).nullable().optional(),
  dependents: z.number().int().min(0).max(20).optional(),
  additionalIncomeCents: z.number().int().nonnegative().nullable().optional(),
})

export const taxSummaryQuerySchema = z.object({
  taxYear: z.coerce.number().int().min(2020).max(2030).optional(),
})

// ============================================
// Plaid Schemas
// ============================================

export const plaidExchangeTokenSchema = z.object({
  publicToken: z.string().min(1, 'Public token is required'),
  institutionId: z.string().min(1, 'Institution ID is required'),
  institutionName: z.string().min(1, 'Institution name is required'),
})

export const plaidWebhookSchema = z.object({
  webhook_type: z.string(),
  webhook_code: z.string(),
  item_id: z.string(),
  error: z.any().nullable().optional(),
})

// ============================================
// AI Query Schemas
// ============================================

export const aiQueryRequestSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000),
})

// ============================================
// Ticker Data Schemas
// ============================================

export const tickerValidationSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(10)
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
})

export const updateAssetWithTickerSchema = z.object({
  ticker: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only'),
  shares: z.number().positive().optional(),
  costBasisCents: z.number().int().nonnegative().optional(),
})

// ============================================
// Type Exports (additional)
// ============================================

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>
export type FilingStatusInput = z.infer<typeof filingStatusSchema>
export type CreateTaxProfileInput = z.infer<typeof createTaxProfileSchema>
export type UpdateTaxProfileInput = z.infer<typeof updateTaxProfileSchema>
export type TaxSummaryQueryInput = z.infer<typeof taxSummaryQuerySchema>
export type PlaidExchangeTokenInput = z.infer<typeof plaidExchangeTokenSchema>
export type PlaidWebhookInput = z.infer<typeof plaidWebhookSchema>
export type AiQueryRequestInput = z.infer<typeof aiQueryRequestSchema>
export type TickerValidationInput = z.infer<typeof tickerValidationSchema>
export type UpdateAssetWithTickerInput = z.infer<typeof updateAssetWithTickerSchema>

// Re-export zod for convenience
export { z } from 'zod'
