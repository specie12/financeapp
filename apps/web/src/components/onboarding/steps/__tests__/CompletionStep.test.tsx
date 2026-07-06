import { render, screen, fireEvent } from '@testing-library/react'
import { CompletionStep } from '../CompletionStep'
import type { OnboardingState } from '@/lib/onboarding/types'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

function makeState(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return {
    currentStep: 8,
    isLoading: false,
    error: null,
    user: {
      id: 'u1',
      email: 'a@b.com',
      firstName: 'Ada',
      lastName: 'L',
      role: 'owner',
    } as OnboardingState['user'],
    tokens: { accessToken: 'atk', refreshToken: 'rtk' } as OnboardingState['tokens'],
    country: 'US',
    primaryIntent: null,
    goals: [],
    incomeItems: [],
    expenses: { housing: 0, utilities: 0, transportation: 0, food: 0, other: 0 },
    assets: [],
    liabilities: [],
    ...overrides,
  }
}

describe('CompletionStep', () => {
  beforeEach(() => {
    pushMock.mockClear()
    localStorage.clear()
  })

  it('recommends the rental decision flow for the buy_rental intent', () => {
    render(<CompletionStep state={makeState({ primaryIntent: 'buy_rental' })} />)
    expect(screen.getByText('Recommended for you')).toBeInTheDocument()
    expect(screen.getByText('Analyze a rental purchase')).toBeInTheDocument()
  })

  it('stores tokens and navigates to the recommended tool on click', () => {
    render(<CompletionStep state={makeState({ primaryIntent: 'rent_vs_buy' })} />)
    fireEvent.click(screen.getByText('Compare renting vs. buying'))
    expect(localStorage.getItem('accessToken')).toBe('atk')
    expect(pushMock).toHaveBeenCalledWith('/dashboard/rent-vs-buy')
  })

  it('falls back to net worth when no intent was chosen', () => {
    render(<CompletionStep state={makeState({ primaryIntent: null })} />)
    expect(screen.getByText('See your net worth projection')).toBeInTheDocument()
  })

  it('still offers the full dashboard as a secondary action', () => {
    render(<CompletionStep state={makeState()} />)
    fireEvent.click(screen.getByText('Go to Dashboard'))
    expect(pushMock).toHaveBeenCalledWith('/dashboard')
  })
})
