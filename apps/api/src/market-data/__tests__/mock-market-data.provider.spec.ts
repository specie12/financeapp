import { MockMarketDataProvider } from '../providers/mock-market-data.provider'

describe('MockMarketDataProvider', () => {
  const provider = new MockMarketDataProvider()

  it('reports simulated source', () => {
    expect(provider.source).toBe('simulated')
  })

  it('returns a quote for a known symbol', async () => {
    const t = await provider.getTicker('aapl')
    expect(t).not.toBeNull()
    expect(t!.symbol).toBe('AAPL')
    expect(t!.currentPrice).toBeGreaterThan(0)
  })

  it('returns null for an unknown symbol', async () => {
    expect(await provider.getTicker('NOTREAL')).toBeNull()
  })

  it('lists a non-empty universe', async () => {
    const symbols = await provider.listSymbols()
    expect(symbols.length).toBeGreaterThan(0)
    expect(symbols).toContain('AAPL')
  })
})
