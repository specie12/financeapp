'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import { OnboardingProgress } from './OnboardingProgress'
import { AccountStep } from './steps/AccountStep'
import { IncomeStep } from './steps/IncomeStep'
import { ExpensesStep } from './steps/ExpensesStep'
import { AssetsDebtsStep } from './steps/AssetsDebtsStep'
import { CompletionStep } from './steps/CompletionStep'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function OnboardingWizard() {
  const { state, actions } = useOnboarding()

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <AccountStep
            onSuccess={(user, tokens) => {
              actions.setUser(user, tokens)
              actions.nextStep()
            }}
            isLoading={state.isLoading}
            setLoading={actions.setLoading}
            setError={actions.setError}
          />
        )

      case 2:
        return (
          <IncomeStep
            incomeItems={state.incomeItems}
            onAddIncome={actions.addIncome}
            onUpdateIncome={actions.updateIncome}
            onRemoveIncome={actions.removeIncome}
            onNext={actions.nextStep}
            onBack={actions.prevStep}
          />
        )

      case 3:
        return (
          <ExpensesStep
            expenses={state.expenses}
            onSetExpenses={actions.setExpenses}
            onNext={actions.nextStep}
            onBack={actions.prevStep}
          />
        )

      case 4:
        return (
          <AssetsDebtsStep
            assets={state.assets}
            liabilities={state.liabilities}
            onAddAsset={actions.addAsset}
            onRemoveAsset={actions.removeAsset}
            onAddLiability={actions.addLiability}
            onRemoveLiability={actions.removeLiability}
            onNext={actions.nextStep}
            onBack={actions.prevStep}
            onSkip={actions.nextStep}
            tokens={state.tokens}
            incomeItems={state.incomeItems}
            expenses={state.expenses}
            setLoading={actions.setLoading}
            setError={actions.setError}
            isLoading={state.isLoading}
          />
        )

      case 5:
        return <CompletionStep state={state} />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Finance App</h1>
          <p className="text-muted-foreground">Let&apos;s get you set up in under 5 minutes</p>
        </div>

        <OnboardingProgress currentStep={state.currentStep} />

        {state.error && (
          <Alert variant="destructive" className="max-w-2xl mx-auto mb-6">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {renderStep()}
      </div>
    </div>
  )
}
