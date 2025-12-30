'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expensesStepSchema, type ExpensesStepInput } from '@/lib/onboarding/schemas'
import { StepContainer } from '../shared/StepContainer'
import { NavigationButtons } from '../shared/NavigationButtons'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { EXPENSE_CATEGORIES } from '@/lib/onboarding/utils'
import type { MonthlyExpenses } from '@/lib/onboarding/types'

interface ExpensesStepProps {
  expenses: MonthlyExpenses
  onSetExpenses: (expenses: Partial<MonthlyExpenses>) => void
  onNext: () => void
  onBack: () => void
}

export function ExpensesStep({ expenses, onSetExpenses, onNext, onBack }: ExpensesStepProps) {
  const form = useForm<ExpensesStepInput>({
    resolver: zodResolver(expensesStepSchema),
    defaultValues: expenses,
  })

  const onSubmit = (data: ExpensesStepInput) => {
    onSetExpenses(data)
    onNext()
  }

  return (
    <StepContainer title="Monthly Expenses" description="Estimate your typical monthly spending">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {EXPENSE_CATEGORIES.map((category) => (
            <FormField
              key={category.key}
              control={form.control}
              name={category.key as keyof ExpensesStepInput}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{category.label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-7"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{category.description}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <NavigationButtons onBack={onBack} showBack={true} />
        </form>
      </Form>
    </StepContainer>
  )
}
