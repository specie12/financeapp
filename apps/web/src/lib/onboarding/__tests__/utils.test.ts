import { recommendedToolForIntent } from '../utils'
import { ONBOARDING_INTENTS } from '../types'

describe('recommendedToolForIntent', () => {
  it('routes the property-buyer intent to the rental decision flow', () => {
    expect(recommendedToolForIntent('buy_rental').href).toBe('/dashboard/decisions/rental')
  })

  it('routes rent-vs-buy, debt, and net-worth intents to their tools', () => {
    expect(recommendedToolForIntent('rent_vs_buy').href).toBe('/dashboard/rent-vs-buy')
    expect(recommendedToolForIntent('pay_off_debt').href).toBe('/dashboard/loans')
    expect(recommendedToolForIntent('grow_net_worth').href).toBe('/dashboard/net-worth')
  })

  it('falls back to net worth when no intent was chosen', () => {
    expect(recommendedToolForIntent(null).href).toBe('/dashboard/net-worth')
  })

  it('returns a non-empty label and description for every intent option', () => {
    for (const option of ONBOARDING_INTENTS) {
      const tool = recommendedToolForIntent(option.value)
      expect(tool.href).toMatch(/^\/dashboard\//)
      expect(tool.label.length).toBeGreaterThan(0)
      expect(tool.description.length).toBeGreaterThan(0)
    }
  })
})
