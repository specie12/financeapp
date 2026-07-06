import { Injectable } from '@nestjs/common'
import type { MarketDataSource, TickerData } from '@finance-app/shared-types'
import type { MarketDataProvider } from '../market-data.provider'
import { MOCK_TICKER_DATA, VALID_TICKERS } from '../mock-ticker-data'

/**
 * Simulated market data for demos and local development. No network, no timers
 * (the old service kept a leaked 30s `setInterval`) — a small deterministic-ish
 * jitter is applied per read so prices feel live, and the service's cache holds
 * a quote steady within its TTL. Always reports `source: 'simulated'` so the UI
 * can label it honestly.
 */
@Injectable()
export class MockMarketDataProvider implements MarketDataProvider {
  readonly source: MarketDataSource = 'simulated'

  async getTicker(symbol: string): Promise<TickerData | null> {
    const base = MOCK_TICKER_DATA[symbol.toUpperCase()]
    if (!base) return null

    // Light intraday jitter keyed off sector volatility, so tech moves more
    // than fixed income. Mock only — real randomness is fine outside the engine.
    const volatility =
      base.sector === 'Technology' ? 0.02 : base.sector === 'Fixed Income' ? 0.003 : 0.01
    const move = (Math.random() * 2 - 1) * volatility
    const currentPrice = Math.round(base.currentPrice * (1 + move) * 100) / 100
    const dayChange = Math.round((base.dayChange + move * 100) * 100) / 100

    return {
      ...base,
      currentPrice,
      dayChange,
      lastUpdated: new Date(),
    }
  }

  async listSymbols(): Promise<string[]> {
    return VALID_TICKERS
  }
}
