import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { MarketDataSource, TickerData } from '@finance-app/shared-types'
import { MARKET_DATA_PROVIDER, type MarketDataProvider } from './market-data.provider'

/** How long a fetched quote is reused before refetching. */
const CACHE_TTL_MS = 30_000

interface CacheEntry {
  data: TickerData
  expiresAt: number
}

/**
 * Orchestration + caching over a pluggable {@link MarketDataProvider}. Providers
 * only implement `getTicker` / `listSymbols`; this layer derives search, sector,
 * summary, and portfolio math, and caches each symbol for a short TTL so a
 * single page render doesn't hammer a live API (or reshuffle mock jitter).
 */
@Injectable()
export class MarketDataService {
  private readonly cache = new Map<string, CacheEntry>()

  constructor(@Inject(MARKET_DATA_PROVIDER) private readonly provider: MarketDataProvider) {}

  /** Whether the underlying data is live or simulated. */
  getSource(): MarketDataSource {
    return this.provider.source
  }

  async getTickerData(symbol: string): Promise<TickerData> {
    const key = symbol.toUpperCase()
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    const data = await this.provider.getTicker(key)
    if (!data) {
      throw new NotFoundException(`Ticker data not found for symbol: ${symbol}`)
    }
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
    return data
  }

  async getMultipleTickerData(symbols: string[]): Promise<TickerData[]> {
    const results: TickerData[] = []
    for (const symbol of symbols) {
      try {
        results.push(await this.getTickerData(symbol))
      } catch {
        // Skip unknown symbols without failing the whole request.
      }
    }
    return results
  }

  async validateTicker(symbol: string): Promise<boolean> {
    const symbols = await this.provider.listSymbols()
    return symbols.includes(symbol.toUpperCase())
  }

  async getAvailableTickers(): Promise<string[]> {
    return this.provider.listSymbols()
  }

  /** All quotes the provider serves (cached per symbol). */
  private async getUniverse(): Promise<TickerData[]> {
    const symbols = await this.provider.listSymbols()
    return this.getMultipleTickerData(symbols)
  }

  async getTickersBySector(sector: string): Promise<TickerData[]> {
    const universe = await this.getUniverse()
    return universe.filter((ticker) => ticker.sector === sector)
  }

  async searchTickers(query: string): Promise<TickerData[]> {
    const normalized = query.toLowerCase()
    const universe = await this.getUniverse()
    return universe.filter(
      (ticker) =>
        ticker.symbol.toLowerCase().includes(normalized) ||
        ticker.name.toLowerCase().includes(normalized),
    )
  }

  async getMarketSummary(): Promise<{
    topGainers: TickerData[]
    topLosers: TickerData[]
    mostActive: TickerData[]
  }> {
    const universe = await this.getUniverse()
    const byDayChange = [...universe].sort((a, b) => b.dayChange - a.dayChange)

    return {
      topGainers: byDayChange.slice(0, 5),
      topLosers: byDayChange.slice(-5).reverse(),
      mostActive: universe.filter((t) => t.marketCap && t.marketCap > 100_000_000_000).slice(0, 5),
    }
  }

  async calculatePortfolioPerformance(
    holdings: Array<{ ticker: string; shares: number; costBasisCents: number }>,
  ): Promise<{
    totalValueCents: number
    totalCostBasisCents: number
    totalReturnCents: number
    totalReturnPercent: number
    dayChangeCents: number
    dayChangePercent: number
  }> {
    let totalValueCents = 0
    let totalCostBasisCents = 0
    let dayChangeCents = 0

    for (const holding of holdings) {
      try {
        const tickerData = await this.getTickerData(holding.ticker)
        const currentValueCents = Math.round(tickerData.currentPrice * 100 * holding.shares)
        const dayChangeForHoldingCents = Math.round(
          ((tickerData.currentPrice * holding.shares * tickerData.dayChange) / 100) * 100,
        )

        totalValueCents += currentValueCents
        totalCostBasisCents += holding.costBasisCents
        dayChangeCents += dayChangeForHoldingCents
      } catch {
        // Skip holdings whose ticker isn't served.
      }
    }

    const totalReturnCents = totalValueCents - totalCostBasisCents
    const totalReturnPercent =
      totalCostBasisCents > 0 ? (totalReturnCents / totalCostBasisCents) * 100 : 0
    const dayChangePercent =
      totalValueCents > 0 ? (dayChangeCents / (totalValueCents - dayChangeCents)) * 100 : 0

    return {
      totalValueCents,
      totalCostBasisCents,
      totalReturnCents,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      dayChangeCents,
      dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    }
  }
}
