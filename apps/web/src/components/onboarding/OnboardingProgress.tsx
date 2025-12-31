'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { OnboardingStep } from '@/lib/onboarding/types'

interface OnboardingProgressProps {
  currentStep: OnboardingStep
  totalSteps?: number
}

const STEP_LABELS = [
  'Account',
  'Country',
  'Connect',
  'Goals',
  'Income',
  'Expenses',
  'Assets',
  'Complete',
]

export function OnboardingProgress({ currentStep, totalSteps = 8 }: OnboardingProgressProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex justify-between mb-2">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center gap-1',
                isCompleted && 'text-primary',
                isCurrent && 'text-primary font-medium',
                !isCompleted && !isCurrent && 'text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-colors',
                  isCompleted && 'bg-primary border-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  !isCompleted && !isCurrent && 'border-muted-foreground/30',
                )}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              <span className="text-xs hidden sm:block">{label}</span>
            </div>
          )
        })}
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-center text-sm text-muted-foreground mt-2">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  )
}
