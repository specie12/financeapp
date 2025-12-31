'use client'

import { useReducer, useCallback, useMemo } from 'react'
import type {
  OnboardingState,
  OnboardingAction,
  OnboardingStep,
  MonthlyExpenses,
  OnboardingGoal,
} from '@/lib/onboarding/types'
import type { IncomeItem, AssetItem, LiabilityItem } from '@/lib/onboarding/schemas'
import type { AuthUser, AuthTokens, Country } from '@finance-app/shared-types'
import {
  canProceedToStep,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
} from '@/lib/onboarding/utils'

// ============================================
// Initial State
// ============================================

const initialState: OnboardingState = {
  currentStep: 1,
  isLoading: false,
  error: null,
  user: null,
  tokens: null,
  country: 'US',
  goals: [],
  incomeItems: [],
  expenses: {
    housing: 0,
    utilities: 0,
    transportation: 0,
    food: 0,
    other: 0,
  },
  assets: [],
  liabilities: [],
}

// ============================================
// Reducer
// ============================================

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step }

    case 'NEXT_STEP':
      if (state.currentStep < 8) {
        return { ...state, currentStep: (state.currentStep + 1) as OnboardingStep }
      }
      return state

    case 'PREV_STEP':
      if (state.currentStep > 1) {
        return { ...state, currentStep: (state.currentStep - 1) as OnboardingStep }
      }
      return state

    case 'SET_USER':
      return { ...state, user: action.user, tokens: action.tokens }

    case 'SET_COUNTRY':
      return { ...state, country: action.country }

    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.goal] }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((item, idx) => (idx === action.index ? action.goal : item)),
      }

    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((_, idx) => idx !== action.index),
      }

    case 'ADD_INCOME':
      return { ...state, incomeItems: [...state.incomeItems, action.income] }

    case 'UPDATE_INCOME':
      return {
        ...state,
        incomeItems: state.incomeItems.map((item, idx) =>
          idx === action.index ? action.income : item,
        ),
      }

    case 'REMOVE_INCOME':
      return {
        ...state,
        incomeItems: state.incomeItems.filter((_, idx) => idx !== action.index),
      }

    case 'SET_INCOME_ITEMS':
      return { ...state, incomeItems: action.items }

    case 'SET_EXPENSES':
      return {
        ...state,
        expenses: { ...state.expenses, ...action.expenses },
      }

    case 'ADD_ASSET':
      return { ...state, assets: [...state.assets, action.asset] }

    case 'UPDATE_ASSET':
      return {
        ...state,
        assets: state.assets.map((item, idx) => (idx === action.index ? action.asset : item)),
      }

    case 'REMOVE_ASSET':
      return {
        ...state,
        assets: state.assets.filter((_, idx) => idx !== action.index),
      }

    case 'ADD_LIABILITY':
      return { ...state, liabilities: [...state.liabilities, action.liability] }

    case 'UPDATE_LIABILITY':
      return {
        ...state,
        liabilities: state.liabilities.map((item, idx) =>
          idx === action.index ? action.liability : item,
        ),
      }

    case 'REMOVE_LIABILITY':
      return {
        ...state,
        liabilities: state.liabilities.filter((_, idx) => idx !== action.index),
      }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ============================================
// Hook
// ============================================

export function useOnboarding() {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)

  // Step Navigation
  const goToStep = useCallback((step: OnboardingStep) => {
    dispatch({ type: 'SET_STEP', step })
  }, [])

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' })
  }, [])

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' })
  }, [])

  // Auth Actions
  const setUser = useCallback((user: AuthUser, tokens: AuthTokens) => {
    dispatch({ type: 'SET_USER', user, tokens })
  }, [])

  // Country Actions
  const setCountry = useCallback((country: Country) => {
    dispatch({ type: 'SET_COUNTRY', country })
  }, [])

  // Goal Actions
  const addGoal = useCallback((goal: OnboardingGoal) => {
    dispatch({ type: 'ADD_GOAL', goal })
  }, [])

  const updateGoal = useCallback((index: number, goal: OnboardingGoal) => {
    dispatch({ type: 'UPDATE_GOAL', index, goal })
  }, [])

  const removeGoal = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_GOAL', index })
  }, [])

  // Income Actions
  const addIncome = useCallback((income: IncomeItem) => {
    dispatch({ type: 'ADD_INCOME', income })
  }, [])

  const updateIncome = useCallback((index: number, income: IncomeItem) => {
    dispatch({ type: 'UPDATE_INCOME', index, income })
  }, [])

  const removeIncome = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_INCOME', index })
  }, [])

  const setIncomeItems = useCallback((items: IncomeItem[]) => {
    dispatch({ type: 'SET_INCOME_ITEMS', items })
  }, [])

  // Expense Actions
  const setExpenses = useCallback((expenses: Partial<MonthlyExpenses>) => {
    dispatch({ type: 'SET_EXPENSES', expenses })
  }, [])

  // Asset Actions
  const addAsset = useCallback((asset: AssetItem) => {
    dispatch({ type: 'ADD_ASSET', asset })
  }, [])

  const updateAsset = useCallback((index: number, asset: AssetItem) => {
    dispatch({ type: 'UPDATE_ASSET', index, asset })
  }, [])

  const removeAsset = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_ASSET', index })
  }, [])

  // Liability Actions
  const addLiability = useCallback((liability: LiabilityItem) => {
    dispatch({ type: 'ADD_LIABILITY', liability })
  }, [])

  const updateLiability = useCallback((index: number, liability: LiabilityItem) => {
    dispatch({ type: 'UPDATE_LIABILITY', index, liability })
  }, [])

  const removeLiability = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_LIABILITY', index })
  }, [])

  // Loading/Error Actions
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', isLoading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  // Validation State
  const validation = useMemo(
    () => ({
      isStep1Complete: isStep1Complete(state),
      isStep2Complete: isStep2Complete(state),
      isStep3Complete: isStep3Complete(state),
      canProceedToStep: (step: number) => canProceedToStep(state, step),
    }),
    [state],
  )

  return {
    state,
    validation,
    actions: {
      goToStep,
      nextStep,
      prevStep,
      setUser,
      setCountry,
      addGoal,
      updateGoal,
      removeGoal,
      addIncome,
      updateIncome,
      removeIncome,
      setIncomeItems,
      setExpenses,
      addAsset,
      updateAsset,
      removeAsset,
      addLiability,
      updateLiability,
      removeLiability,
      setLoading,
      setError,
      reset,
    },
  }
}

export type UseOnboardingReturn = ReturnType<typeof useOnboarding>
