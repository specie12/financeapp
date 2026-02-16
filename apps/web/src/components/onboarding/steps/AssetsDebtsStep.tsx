'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  assetItemSchema,
  liabilityItemSchema,
  type AssetItem,
  type LiabilityItem,
  type IncomeItem,
} from '@/lib/onboarding/schemas'
import type { OnboardingGoal } from '@/lib/onboarding/types'
import { StepContainer } from '../shared/StepContainer'
import { NavigationButtons } from '../shared/NavigationButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { generateId, formatDollars, dollarsToCents } from '@/lib/onboarding/utils'
import { ASSET_QUICK_ADD, LIABILITY_QUICK_ADD, type MonthlyExpenses } from '@/lib/onboarding/types'
import { createApiClient } from '@finance-app/api-client'
import { TickerSearchInput } from '@/components/dashboard/investments/TickerSearchInput'
import type { AuthTokens, AssetType, LiabilityType, TickerData } from '@finance-app/shared-types'

// Default terms by liability type (in months)
const DEFAULT_TERMS: Record<LiabilityType, number> = {
  mortgage: 360, // 30 years
  auto_loan: 60, // 5 years
  student_loan: 120, // 10 years
  credit_card: 60, // 5 years (payoff target)
  personal_loan: 36, // 3 years
  other: 60, // 5 years
}

// Default interest rates by liability type
const DEFAULT_RATES: Record<LiabilityType, number> = {
  mortgage: 6.5,
  auto_loan: 7.5,
  student_loan: 5.5,
  credit_card: 22,
  personal_loan: 12,
  other: 10,
}

// Term options by type
const MORTGAGE_TERMS = [
  { value: 180, label: '15 years' },
  { value: 240, label: '20 years' },
  { value: 360, label: '30 years' },
]

const CREDIT_CARD_TARGETS = [
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 60, label: '5 years' },
  { value: 84, label: '7 years' },
]

const AUTO_LOAN_TERMS = [
  { value: 36, label: '3 years' },
  { value: 48, label: '4 years' },
  { value: 60, label: '5 years' },
  { value: 72, label: '6 years' },
]

const STUDENT_LOAN_TERMS = [
  { value: 120, label: '10 years' },
  { value: 180, label: '15 years' },
  { value: 240, label: '20 years' },
  { value: 300, label: '25 years' },
]

const PERSONAL_LOAN_TERMS = [
  { value: 24, label: '2 years' },
  { value: 36, label: '3 years' },
  { value: 48, label: '4 years' },
  { value: 60, label: '5 years' },
]

// Helper to calculate monthly payment using PMT formula
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (termMonths <= 0 || principal <= 0) return 0
  if (annualRate === 0) return Math.round((principal / termMonths) * 100) / 100

  const monthlyRate = annualRate / 12 / 100
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  return Math.round(payment * 100) / 100
}

// Helper to calculate remaining balance using amortization
function calculateRemainingBalance(
  originalPrincipal: number,
  annualRate: number,
  termMonths: number,
  monthsPaid: number,
): number {
  if (monthsPaid <= 0 || termMonths <= 0 || originalPrincipal <= 0) return originalPrincipal
  if (monthsPaid >= termMonths) return 0
  if (annualRate === 0) {
    // Simple linear paydown for 0% loans
    return Math.round(originalPrincipal * (1 - monthsPaid / termMonths) * 100) / 100
  }

  const monthlyRate = annualRate / 12 / 100
  const payment = calculateMonthlyPayment(originalPrincipal, annualRate, termMonths)

  // Remaining balance = PV of remaining payments
  const remainingMonths = termMonths - monthsPaid
  const remainingBalance =
    (payment * (1 - Math.pow(1 + monthlyRate, -remainingMonths))) / monthlyRate

  return Math.round(remainingBalance * 100) / 100
}

// Helper to calculate start date based on months paid
function calculateStartDate(_termMonths: number, monthsPaid: number): Date {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - monthsPaid)
  return startDate
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  real_estate: 'Real Estate',
  vehicle: 'Vehicle',
  investment: 'Investment',
  retirement_account: 'Retirement Account',
  bank_account: 'Bank Account',
  crypto: 'Cryptocurrency',
  other: 'Other',
}

const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  mortgage: 'Mortgage',
  auto_loan: 'Auto Loan',
  student_loan: 'Student Loan',
  credit_card: 'Credit Card',
  personal_loan: 'Personal Loan',
  other: 'Other',
}

interface AssetsDebtsStepProps {
  assets: AssetItem[]
  liabilities: LiabilityItem[]
  onAddAsset: (asset: AssetItem) => void
  onRemoveAsset: (index: number) => void
  onAddLiability: (liability: LiabilityItem) => void
  onRemoveLiability: (index: number) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  tokens: AuthTokens | null
  incomeItems: IncomeItem[]
  expenses: MonthlyExpenses
  goals?: OnboardingGoal[]
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  isLoading: boolean
}

export function AssetsDebtsStep({
  assets,
  liabilities,
  onAddAsset,
  onRemoveAsset,
  onAddLiability,
  onRemoveLiability,
  onNext,
  onBack,
  onSkip: _onSkip,
  tokens,
  incomeItems,
  expenses,
  setLoading,
  setError,
  isLoading,
}: AssetsDebtsStepProps) {
  const [isAddingAsset, setIsAddingAsset] = useState(false)
  const [isAddingLiability, setIsAddingLiability] = useState(false)
  const [timeInputMode, setTimeInputMode] = useState<'paid' | 'remaining'>('paid')
  const [selectedTicker, setSelectedTicker] = useState<TickerData | null>(null)

  const assetForm = useForm<
    Omit<AssetItem, 'id'> & { ticker?: string; shares?: number; costBasis?: number }
  >({
    resolver: zodResolver(assetItemSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      type: 'bank_account',
      value: 0,
      ticker: undefined,
      shares: undefined,
      costBasis: undefined,
    },
  })

  const liabilityForm = useForm<Omit<LiabilityItem, 'id'>>({
    resolver: zodResolver(liabilityItemSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      type: 'credit_card',
      originalBalance: 0,
      currentBalance: 0,
      interestRate: DEFAULT_RATES.credit_card,
      minimumPayment: 0,
      termMonths: DEFAULT_TERMS.credit_card,
      monthsPaid: 0,
    },
  })

  // Watch form values for auto-calculation
  const watchedType = liabilityForm.watch('type')
  const watchedAssetType = assetForm.watch('type')
  const watchedOriginalBalance = liabilityForm.watch('originalBalance')
  const watchedCurrentBalance = liabilityForm.watch('currentBalance')
  const watchedInterestRate = liabilityForm.watch('interestRate')
  const watchedTermMonths = liabilityForm.watch('termMonths')
  const watchedMonthsPaid = liabilityForm.watch('monthsPaid')

  // Auto-calculate current balance based on original balance and months paid (for non-credit-card loans)
  useEffect(() => {
    if (
      watchedType !== 'credit_card' &&
      watchedOriginalBalance > 0 &&
      watchedTermMonths &&
      watchedTermMonths > 0
    ) {
      const calculatedBalance = calculateRemainingBalance(
        watchedOriginalBalance,
        watchedInterestRate || 0,
        watchedTermMonths,
        watchedMonthsPaid || 0,
      )
      liabilityForm.setValue('currentBalance', calculatedBalance)
    }
  }, [
    watchedOriginalBalance,
    watchedInterestRate,
    watchedTermMonths,
    watchedMonthsPaid,
    watchedType,
    liabilityForm,
  ])

  // Auto-calculate monthly payment when relevant fields change
  useEffect(() => {
    if (watchedCurrentBalance > 0 && watchedTermMonths && watchedTermMonths > 0) {
      const remainingMonths = watchedTermMonths - (watchedMonthsPaid || 0)
      if (remainingMonths > 0) {
        const calculatedPayment = calculateMonthlyPayment(
          watchedCurrentBalance,
          watchedInterestRate || 0,
          remainingMonths,
        )
        liabilityForm.setValue('minimumPayment', calculatedPayment)
      }
    }
  }, [
    watchedCurrentBalance,
    watchedInterestRate,
    watchedTermMonths,
    watchedMonthsPaid,
    liabilityForm,
  ])

  // Get term options based on liability type
  const getTermOptions = useCallback((type: LiabilityType) => {
    switch (type) {
      case 'mortgage':
        return MORTGAGE_TERMS
      case 'credit_card':
        return CREDIT_CARD_TARGETS
      case 'auto_loan':
        return AUTO_LOAN_TERMS
      case 'student_loan':
        return STUDENT_LOAN_TERMS
      case 'personal_loan':
        return PERSONAL_LOAN_TERMS
      default:
        return PERSONAL_LOAN_TERMS
    }
  }, [])

  const handleAddAsset = (
    data: Omit<AssetItem, 'id'> & { ticker?: string; shares?: number; costBasis?: number },
  ) => {
    const { ticker, shares, costBasis, ...assetData } = data
    onAddAsset({ ...assetData, id: generateId(), ticker, shares, costBasis })
    assetForm.reset()
    setSelectedTicker(null)
    setIsAddingAsset(false)
  }

  const handleAddLiability = (data: Omit<LiabilityItem, 'id'>) => {
    onAddLiability({ ...data, id: generateId() })
    liabilityForm.reset()
    setIsAddingLiability(false)
  }

  const handleQuickAddAsset = (name: string, type: string) => {
    assetForm.setValue('name', name)
    assetForm.setValue('type', type as AssetType)
    setIsAddingAsset(true)
  }

  const handleQuickAddLiability = (name: string, type: string) => {
    const liabilityType = type as LiabilityType
    liabilityForm.setValue('name', name)
    liabilityForm.setValue('type', liabilityType)
    liabilityForm.setValue('interestRate', DEFAULT_RATES[liabilityType])
    liabilityForm.setValue('termMonths', DEFAULT_TERMS[liabilityType])
    liabilityForm.setValue('monthsPaid', 0)
    liabilityForm.setValue('originalBalance', 0)
    liabilityForm.setValue('currentBalance', 0)
    liabilityForm.setValue('minimumPayment', 0)
    setTimeInputMode('paid')
    setIsAddingLiability(true)
  }

  // Handle type change to update defaults
  const handleTypeChange = (newType: LiabilityType) => {
    liabilityForm.setValue('type', newType)
    liabilityForm.setValue('interestRate', DEFAULT_RATES[newType])
    liabilityForm.setValue('termMonths', DEFAULT_TERMS[newType])
    liabilityForm.setValue('monthsPaid', 0)
    // For credit cards, original = current
    if (newType === 'credit_card') {
      const currentBalance = liabilityForm.getValues('currentBalance')
      liabilityForm.setValue('originalBalance', currentBalance)
    }
  }

  const handleFinish = async () => {
    if (!tokens) {
      setError('Session expired. Please restart onboarding.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiClient = createApiClient({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      })
      apiClient.setAccessToken(tokens.accessToken)

      // Create all data in parallel
      const promises: Promise<unknown>[] = []

      // Create income cash flow items
      for (const income of incomeItems) {
        promises.push(
          apiClient.cashFlowItems.create({
            name: income.name,
            type: 'income',
            amountCents: dollarsToCents(income.amount),
            frequency: income.frequency,
          }),
        )
      }

      // Create expense cash flow items
      const expenseEntries = [
        { key: 'housing', name: 'Housing', amount: expenses.housing },
        { key: 'utilities', name: 'Utilities', amount: expenses.utilities },
        { key: 'transportation', name: 'Transportation', amount: expenses.transportation },
        { key: 'food', name: 'Food', amount: expenses.food },
        { key: 'other', name: 'Other Expenses', amount: expenses.other },
      ]

      for (const expense of expenseEntries) {
        if (expense.amount > 0) {
          promises.push(
            apiClient.cashFlowItems.create({
              name: expense.name,
              type: 'expense',
              amountCents: dollarsToCents(expense.amount),
              frequency: 'monthly',
            }),
          )
        }
      }

      // Create assets
      for (const asset of assets) {
        const assetData: any = {
          name: asset.name,
          type: asset.type,
          currentValueCents: dollarsToCents(asset.value),
        }

        // Add ticker data if available
        if (asset.ticker) {
          assetData.ticker = asset.ticker
        }
        if (asset.shares) {
          assetData.shares = asset.shares
        }
        if (asset.costBasis) {
          assetData.costBasisCents = dollarsToCents(asset.costBasis)
        }

        promises.push(apiClient.assets.create(assetData))
      }

      // Create liabilities
      for (const liability of liabilities) {
        const termMonths = liability.termMonths ?? DEFAULT_TERMS[liability.type]
        const monthsPaid = liability.monthsPaid ?? 0
        const startDate = calculateStartDate(termMonths, monthsPaid)

        promises.push(
          apiClient.liabilities.create({
            name: liability.name,
            type: liability.type,
            principalCents: dollarsToCents(liability.originalBalance),
            currentBalanceCents: dollarsToCents(liability.currentBalance),
            interestRatePercent: liability.interestRate,
            minimumPaymentCents: dollarsToCents(liability.minimumPayment),
            termMonths: termMonths,
            startDate: startDate,
          }),
        )
      }

      await Promise.all(promises)
      onNext()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      // Extract detailed error message
      let errorMessage = 'Failed to save your data. Please try again.'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string | string[]; errors?: string[] } }
        }
        const apiMessage = axiosError.response?.data?.message
        const apiErrors = axiosError.response?.data?.errors
        if (apiErrors && apiErrors.length > 0) {
          errorMessage = apiErrors.join(', ')
        } else if (apiMessage) {
          errorMessage = Array.isArray(apiMessage) ? apiMessage.join(', ') : apiMessage
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StepContainer
      title="Assets & Debts"
      description="Add what you own and owe for better insights (optional)"
    >
      <div className="space-y-6">
        {/* Assets Section */}
        <div>
          <h3 className="font-semibold mb-3">Assets</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {ASSET_QUICK_ADD.map((option) => (
              <Button
                key={option.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddAsset(option.name, option.type!)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {assets.length > 0 && (
            <div className="space-y-2 mb-3">
              {assets.map((asset, index) => (
                <Card key={asset.id}>
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ASSET_TYPE_LABELS[asset.type]} - {formatDollars(asset.value)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveAsset(index)}
                        className="text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isAddingAsset ? (
            <Card>
              <CardContent className="pt-4">
                <Form {...assetForm}>
                  <form onSubmit={assetForm.handleSubmit(handleAddAsset)} className="space-y-3">
                    <FormField
                      control={assetForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Primary Home" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={assetForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assetForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Ticker fields for investment assets */}
                    {(watchedAssetType === 'investment' ||
                      watchedAssetType === 'retirement_account') && (
                      <div className="space-y-3">
                        <div>
                          <FormLabel>Ticker Symbol (Optional)</FormLabel>
                          <TickerSearchInput
                            value={selectedTicker}
                            onChange={(ticker) => {
                              setSelectedTicker(ticker)
                              assetForm.setValue('ticker', ticker?.symbol || '')
                              if (ticker) {
                                assetForm.setValue('name', `${ticker.name} (${ticker.symbol})`)
                              }
                            }}
                            placeholder="Search for stocks, ETFs..."
                          />
                        </div>

                        {selectedTicker && (
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={assetForm.control}
                              name="shares"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Shares</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      placeholder="0"
                                      value={field.value || ''}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={assetForm.control}
                              name="costBasis"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cost Basis per Share ($)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      value={field.value || ''}
                                      onChange={(e) =>
                                        field.onChange(parseFloat(e.target.value) || 0)
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Add Asset
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          assetForm.reset()
                          setSelectedTicker(null)
                          setIsAddingAsset(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingAsset(true)}
            >
              + Add asset
            </Button>
          )}
        </div>

        <Separator />

        {/* Liabilities Section */}
        <div>
          <h3 className="font-semibold mb-3">Debts</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {LIABILITY_QUICK_ADD.map((option) => (
              <Button
                key={option.name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickAddLiability(option.name, option.type!)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {liabilities.length > 0 && (
            <div className="space-y-2 mb-3">
              {liabilities.map((liability, index) => {
                const paidOffPercent =
                  liability.originalBalance > 0
                    ? ((liability.originalBalance - liability.currentBalance) /
                        liability.originalBalance) *
                      100
                    : 0
                const remainingMonths = (liability.termMonths ?? 0) - (liability.monthsPaid ?? 0)

                return (
                  <Card key={liability.id}>
                    <CardContent className="py-2 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{liability.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {LIABILITY_TYPE_LABELS[liability.type]} -{' '}
                            {formatDollars(liability.currentBalance)}
                            {liability.originalBalance !== liability.currentBalance && (
                              <span> of {formatDollars(liability.originalBalance)}</span>
                            )}{' '}
                            at {liability.interestRate}%
                          </p>
                          {paidOffPercent > 0 && (
                            <p className="text-xs text-green-600">
                              {paidOffPercent.toFixed(1)}% paid off
                              {remainingMonths > 0 && ` • ${remainingMonths} months remaining`}
                            </p>
                          )}
                          {remainingMonths > 0 && paidOffPercent === 0 && (
                            <p className="text-xs text-muted-foreground">
                              {remainingMonths} months remaining
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveLiability(index)}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {isAddingLiability ? (
            <Card>
              <CardContent className="pt-4">
                <Form {...liabilityForm}>
                  <form
                    onSubmit={liabilityForm.handleSubmit(handleAddLiability)}
                    className="space-y-3"
                  >
                    {/* Name and Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={liabilityForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debt Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Chase Credit Card" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={liabilityForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              onValueChange={(value) => handleTypeChange(value as LiabilityType)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(LIABILITY_TYPE_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Balance fields - different for credit cards */}
                    {watchedType === 'credit_card' ? (
                      <FormField
                        control={liabilityForm.control}
                        name="currentBalance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Balance ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  field.onChange(value)
                                  // For credit cards, original = current
                                  liabilityForm.setValue('originalBalance', value)
                                }}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={liabilityForm.control}
                          name="originalBalance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Loan Amount ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={liabilityForm.control}
                          name="currentBalance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Balance ($)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Term and Time fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={liabilityForm.control}
                        name="termMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {watchedType === 'credit_card' ? 'Payoff Target' : 'Loan Term'}
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={
                                field.value?.toString() || DEFAULT_TERMS[watchedType].toString()
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getTermOptions(watchedType).map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Months paid/remaining - hide for credit cards */}
                      {watchedType !== 'credit_card' && (
                        <div className="space-y-2">
                          <div className="flex gap-2 text-sm">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                checked={timeInputMode === 'paid'}
                                onChange={() => setTimeInputMode('paid')}
                                className="h-3 w-3"
                              />
                              Months paid
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                checked={timeInputMode === 'remaining'}
                                onChange={() => setTimeInputMode('remaining')}
                                className="h-3 w-3"
                              />
                              Remaining
                            </label>
                          </div>
                          <FormField
                            control={liabilityForm.control}
                            name="monthsPaid"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={watchedTermMonths || 360}
                                    placeholder="0"
                                    value={
                                      timeInputMode === 'paid'
                                        ? field.value || ''
                                        : (watchedTermMonths || 0) - (field.value || 0) || ''
                                    }
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0
                                      if (timeInputMode === 'paid') {
                                        field.onChange(value)
                                      } else {
                                        field.onChange((watchedTermMonths || 0) - value)
                                      }
                                    }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  {timeInputMode === 'paid'
                                    ? `${(watchedTermMonths || 0) - (field.value || 0)} months remaining`
                                    : `${field.value || 0} months already paid`}
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Interest Rate and Monthly Payment */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={liabilityForm.control}
                        name="interestRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interest Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={liabilityForm.control}
                        name="minimumPayment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Payment ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Auto-calculated"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Auto-calculated, edit if needed
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Add Debt
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          liabilityForm.reset()
                          setIsAddingLiability(false)
                          setTimeInputMode('paid')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingLiability(true)}
            >
              + Add debt
            </Button>
          )}
        </div>

        <NavigationButtons
          onNext={handleFinish}
          onBack={onBack}
          onSkip={handleFinish}
          nextLabel="Finish Setup"
          showBack={true}
          showSkip={true}
          skipLabel="Skip & finish"
          isLoading={isLoading}
        />
      </div>
    </StepContainer>
  )
}
