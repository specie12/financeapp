import { NotFoundException } from '@nestjs/common'
import type { TickerData } from '@finance-app/shared-types'
import { MarketDataService } from '../market-data.service'
import type { MarketDataProvider } from '../market-data.provider'

function ticker(symbol: string, overrides: Partial<TickerData> = {}): TickerData {
  return {
    symbol,
    name: `${symbol} Inc`,
    currentPrice: 100,
    dayChange: 1,
    weekChange: 0,
    monthChange: 0,
    ytdChange: 0,
    yearChange: 0,
    lastUpdated: new Date(),
    marketCap: 200_000_000_000,
    ...overrides,
  }
}

class FakeProvider implements MarketDataProvider {
  readonly source = 'live' as const
  calls: Record<string, number> = {}
  async getTicker(symbol: string): Promise<TickerData | null> {
    this.calls[symbol] = (this.calls[symbol] ?? 0) + 1
    if (symbol === 'ZZZ') return null
    // Price changes each call so we can prove the cache is being used.
    return ticker(symbol, {
      currentPrice: 100 + this.calls[symbol]!,
      dayChange: symbol === 'AAA' ? 3 : -2,
    })
  }
  async listSymbols(): Promise<string[]> {
    return ['AAA', 'BBB']
  }
}

describe('MarketDataService', () => {
  let provider: FakeProvider
  let service: MarketDataService

  beforeEach(() => {
    provider = new FakeProvider()
    service = new MarketDataService(provider)
  })

  it('reports the provider source', () => {
    expect(service.getSource()).toBe('live')
  })

  it('caches a quote within the TTL (provider hit once per symbol)', async () => {
    const first = await service.getTickerData('AAA')
    const second = await service.getTickerData('AAA')
    expect(provider.calls['AAA']).toBe(1)
    expect(second.currentPrice).toBe(first.currentPrice)
  })

  it('throws NotFound for an unknown symbol', async () => {
    await expect(service.getTickerData('ZZZ')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('validates against the provider universe', async () => {
    expect(await service.validateTicker('aaa')).toBe(true)
    expect(await service.validateTicker('nope')).toBe(false)
  })

  it('skips unknown symbols in a multi-fetch', async () => {
    const results = await service.getMultipleTickerData(['AAA', 'ZZZ', 'BBB'])
    expect(results.map((t) => t.symbol)).toEqual(['AAA', 'BBB'])
  })

  it('builds a market summary from the universe', async () => {
    const summary = await service.getMarketSummary()
    // AAA has dayChange +3, BBB -2 → AAA leads gainers.
    expect(summary.topGainers[0]!.symbol).toBe('AAA')
  })
})
