import { Logger } from '@nestjs/common'
import type { MarketDataSource, TickerData } from '@finance-app/shared-types'
import type { MarketDataProvider } from '../market-data.provider'
import { MOCK_TICKER_DATA, VALID_TICKERS } from '../mock-ticker-data'

interface FinnhubQuote {
  c: number // current price
  dp: number // percent change on the day
}

/**
 * Live quotes from Finnhub (https://finnhub.io). Activated by
 * `MARKET_DATA_PROVIDER=finnhub` + `FINNHUB_API_KEY`. Serves a curated universe
 * (the same symbols as the mock) and pulls live price + day change per symbol;
 * names/sectors come from static metadata (they don't move). The longer
 * performance windows (week/month/YTD/year) require the candle endpoint and are
 * left at 0 until that's wired — a known limitation, tracked separately.
 *
 * Any request failure returns null so the service degrades gracefully rather
 * than breaking the investments page.
 */
export class FinnhubMarketDataProvider implements MarketDataProvider {
  readonly source: MarketDataSource = 'live'
  private readonly logger = new Logger(FinnhubMarketDataProvider.name)
  private readonly baseUrl = 'https://finnhub.io/api/v1'

  constructor(private readonly apiKey: string) {}

  async getTicker(symbol: string): Promise<TickerData | null> {
    const key = symbol.toUpperCase()
    const meta = MOCK_TICKER_DATA[key]
    try {
      const url = `${this.baseUrl}/quote?symbol=${encodeURIComponent(key)}&token=${this.apiKey}`
      const res = await fetch(url)
      if (!res.ok) {
        this.logger.warn(`Finnhub quote for ${key} returned ${res.status}`)
        return null
      }
      const quote = (await res.json()) as FinnhubQuote
      if (typeof quote.c !== 'number' || quote.c === 0) return null

      return {
        symbol: key,
        name: meta?.name ?? key,
        currentPrice: quote.c,
        dayChange: typeof quote.dp === 'number' ? quote.dp : 0,
        // Longer windows need the candle endpoint; not yet wired.
        weekChange: 0,
        monthChange: 0,
        ytdChange: 0,
        yearChange: 0,
        lastUpdated: new Date(),
        sector: meta?.sector,
        industry: meta?.industry,
        marketCap: meta?.marketCap,
      }
    } catch (err) {
      this.logger.warn(`Finnhub quote for ${key} failed: ${(err as Error).message}`)
      return null
    }
  }

  async listSymbols(): Promise<string[]> {
    return VALID_TICKERS
  }
}
