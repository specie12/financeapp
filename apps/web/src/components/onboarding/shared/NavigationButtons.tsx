'use client'

import { Button } from '@/components/ui/button'

interface NavigationButtonsProps {
  onNext?: () => void
  onBack?: () => void
  onSkip?: () => void
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  showBack?: boolean
  showSkip?: boolean
  isLoading?: boolean
  isNextDisabled?: boolean
}

export function NavigationButtons({
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  backLabel = 'Back',
  skipLabel = 'Skip this step',
  showBack = true,
  showSkip = false,
  isLoading = false,
  isNextDisabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex flex-col gap-4 pt-6">
      <div className="flex justify-between gap-4">
        {showBack && onBack ? (
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
            {backLabel}
          </Button>
        ) : (
          <div />
        )}
        {onNext && (
          <Button type="submit" onClick={onNext} disabled={isLoading || isNextDisabled}>
            {isLoading ? 'Please wait...' : nextLabel}
          </Button>
        )}
      </div>
      {showSkip && onSkip && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="text-muted-foreground"
        >
          {skipLabel}
        </Button>
      )}
    </div>
  )
}
