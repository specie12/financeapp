'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  assetItemSchema,
  liabilityItemSchema,
  type AssetItem,
  type LiabilityItem,
  type IncomeItem,
} from '@/lib/onboarding/schemas'
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
import type { AuthTokens, AssetType, LiabilityType } from '@finance-app/shared-types'

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

  const assetForm = useForm<Omit<AssetItem, 'id'>>({
    resolver: zodResolver(assetItemSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      type: 'bank_account',
      value: 0,
    },
  })

  const liabilityForm = useForm<Omit<LiabilityItem, 'id'>>({
    resolver: zodResolver(liabilityItemSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      type: 'credit_card',
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
    },
  })

  const handleAddAsset = (data: Omit<AssetItem, 'id'>) => {
    onAddAsset({ ...data, id: generateId() })
    assetForm.reset()
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
    liabilityForm.setValue('name', name)
    liabilityForm.setValue('type', type as LiabilityType)
    setIsAddingLiability(true)
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
        promises.push(
          apiClient.assets.create({
            name: asset.name,
            type: asset.type,
            currentValueCents: dollarsToCents(asset.value),
          }),
        )
      }

      // Create liabilities
      for (const liability of liabilities) {
        promises.push(
          apiClient.liabilities.create({
            name: liability.name,
            type: liability.type,
            principalCents: dollarsToCents(liability.balance),
            currentBalanceCents: dollarsToCents(liability.balance),
            interestRatePercent: liability.interestRate,
            minimumPaymentCents: dollarsToCents(liability.minimumPayment),
            startDate: new Date(),
          }),
        )
      }

      await Promise.all(promises)
      onNext()
    } catch (error) {
      console.error('Failed to save onboarding data:', error)
      setError('Failed to save your data. Please try again.')
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
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
              {liabilities.map((liability, index) => (
                <Card key={liability.id}>
                  <CardContent className="py-2 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{liability.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {LIABILITY_TYPE_LABELS[liability.type]} -{' '}
                          {formatDollars(liability.balance)} at {liability.interestRate}%
                        </p>
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
              ))}
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
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={liabilityForm.control}
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
                      <FormField
                        control={liabilityForm.control}
                        name="balance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Balance ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                            <FormLabel>Min Payment ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
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
