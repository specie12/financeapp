import { FinnhubMarketDataProvider } from '../providers/finnhub-market-data.provider'

describe('FinnhubMarketDataProvider', () => {
  const provider = new FinnhubMarketDataProvider('test-key')
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    jest.restoreAllMocks()
  })

  it('reports live source', () => {
    expect(provider.source).toBe('live')
  })

  it('maps a Finnhub quote to TickerData', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ c: 187.42, dp: 1.35 }),
    }) as unknown as typeof fetch

    const t = await provider.getTicker('AAPL')
    expect(t).not.toBeNull()
    expect(t!.currentPrice).toBe(187.42)
    expect(t!.dayChange).toBe(1.35)
    // Metadata comes from the static map.
    expect(t!.name).toBeTruthy()
  })

  it('returns null on a non-OK response', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 429 }) as unknown as typeof fetch
    expect(await provider.getTicker('AAPL')).toBeNull()
  })

  it('returns null when the request throws (graceful degradation)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch
    expect(await provider.getTicker('AAPL')).toBeNull()
  })

  it('returns null for a zero/absent price', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ c: 0, dp: 0 }),
    }) as unknown as typeof fetch
    expect(await provider.getTicker('AAPL')).toBeNull()
  })
})
