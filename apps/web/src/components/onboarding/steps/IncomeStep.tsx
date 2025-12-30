'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { incomeItemSchema, type IncomeItem } from '@/lib/onboarding/schemas'
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
import { generateId, formatDollars } from '@/lib/onboarding/utils'
import { INCOME_QUICK_ADD, FREQUENCY_LABELS } from '@/lib/onboarding/types'
import type { Frequency } from '@finance-app/shared-types'

interface IncomeStepProps {
  incomeItems: IncomeItem[]
  onAddIncome: (income: IncomeItem) => void
  onUpdateIncome: (index: number, income: IncomeItem) => void
  onRemoveIncome: (index: number) => void
  onNext: () => void
  onBack: () => void
}

export function IncomeStep({
  incomeItems,
  onAddIncome,
  onRemoveIncome,
  onNext,
  onBack,
}: IncomeStepProps) {
  const [isAdding, setIsAdding] = useState(incomeItems.length === 0)

  const form = useForm<Omit<IncomeItem, 'id'>>({
    resolver: zodResolver(incomeItemSchema.omit({ id: true })),
    defaultValues: {
      name: '',
      amount: 0,
      frequency: 'monthly',
    },
  })

  const handleAddIncome = (data: Omit<IncomeItem, 'id'>) => {
    onAddIncome({
      ...data,
      id: generateId(),
    })
    form.reset()
    setIsAdding(false)
  }

  const handleQuickAdd = (name: string) => {
    form.setValue('name', name)
    setIsAdding(true)
  }

  const handleNext = () => {
    if (incomeItems.length === 0) {
      form.setError('name', { message: 'Please add at least one income source' })
      return
    }
    onNext()
  }

  return (
    <StepContainer title="What's your income?" description="Add your regular income sources">
      <div className="space-y-6">
        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-2">
          {INCOME_QUICK_ADD.map((option) => (
            <Button
              key={option.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(option.name)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Existing Income Items */}
        {incomeItems.length > 0 && (
          <div className="space-y-3">
            {incomeItems.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDollars(item.amount)}{' '}
                        {FREQUENCY_LABELS[item.frequency].toLowerCase()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveIncome(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Income Form */}
        {isAdding ? (
          <Card>
            <CardContent className="pt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddIncome)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Income Source</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Primary Salary" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(Object.entries(FREQUENCY_LABELS) as [Frequency, string][])
                                .filter(([key]) => key !== 'one_time')
                                .map(([value, label]) => (
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

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm">
                      Add Income
                    </Button>
                    {incomeItems.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.reset()
                          setIsAdding(false)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
          >
            + Add another income source
          </Button>
        )}

        <NavigationButtons
          onNext={handleNext}
          onBack={onBack}
          showBack={true}
          isNextDisabled={incomeItems.length === 0}
        />
      </div>
    </StepContainer>
  )
}
