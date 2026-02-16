import { Injectable, NotFoundException } from '@nestjs/common'
import { TickerData } from '@finance-app/shared-types'
import { MOCK_TICKER_DATA, VALID_TICKERS, updateMockPrices } from './mock-ticker-data'

@Injectable()
export class MarketDataService {
  private readonly mockData: Map<string, TickerData>

  constructor() {
    // Initialize with mock data
    this.mockData = new Map()
    this.loadMockData()

    // Update prices every 30 seconds for demo purposes
    setInterval(() => {
      updateMockPrices()
      this.loadMockData()
    }, 30000)
  }

  /**
   * Get ticker data for a single symbol
   */
  async getTickerData(symbol: string): Promise<TickerData> {
    const normalizedSymbol = symbol.toUpperCase()
    const tickerData = this.mockData.get(normalizedSymbol)

    if (!tickerData) {
      throw new NotFoundException(`Ticker data not found for symbol: ${symbol}`)
    }

    return {
      ...tickerData,
      lastUpdated: new Date(), // Always return current timestamp
    }
  }

  /**
   * Get ticker data for multiple symbols
   */
  async getMultipleTickerData(symbols: string[]): Promise<TickerData[]> {
    const results = []

    for (const symbol of symbols) {
      try {
        const data = await this.getTickerData(symbol)
        results.push(data)
      } catch {
        // Skip invalid symbols but don't fail the entire request
        console.warn(`Skipping invalid ticker symbol: ${symbol}`)
      }
    }

    return results
  }

  /**
   * Validate if a ticker symbol is supported
   */
  async validateTicker(symbol: string): Promise<boolean> {
    const normalizedSymbol = symbol.toUpperCase()
    return VALID_TICKERS.includes(normalizedSymbol)
  }

  /**
   * Get all available ticker symbols
   */
  async getAvailableTickers(): Promise<string[]> {
    return VALID_TICKERS
  }

  /**
   * Get tickers by sector
   */
  async getTickersBySector(sector: string): Promise<TickerData[]> {
    const sectorTickers = Array.from(this.mockData.values()).filter(
      (ticker) => ticker.sector === sector,
    )

    return sectorTickers
  }

  /**
   * Search tickers by name or symbol
   */
  async searchTickers(query: string): Promise<TickerData[]> {
    const normalizedQuery = query.toLowerCase()

    return Array.from(this.mockData.values()).filter(
      (ticker) =>
        ticker.symbol.toLowerCase().includes(normalizedQuery) ||
        ticker.name.toLowerCase().includes(normalizedQuery),
    )
  }

  /**
   * Get market summary (top performing tickers)
   */
  async getMarketSummary(): Promise<{
    topGainers: TickerData[]
    topLosers: TickerData[]
    mostActive: TickerData[]
  }> {
    const allTickers = Array.from(this.mockData.values())

    // Sort by day change for gainers/losers
    const sortedByDayChange = [...allTickers].sort((a, b) => b.dayChange - a.dayChange)

    return {
      topGainers: sortedByDayChange.slice(0, 5),
      topLosers: sortedByDayChange.slice(-5).reverse(),
      mostActive: allTickers
        .filter((t) => t.marketCap && t.marketCap > 100000000000) // $100B+ market cap
        .slice(0, 5),
    }
  }

  /**
   * Load mock data into memory
   */
  private loadMockData(): void {
    this.mockData.clear()

    for (const [symbol, data] of Object.entries(MOCK_TICKER_DATA)) {
      this.mockData.set(symbol, {
        ...data,
        lastUpdated: new Date(),
      })
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  async calculatePortfolioPerformance(
    holdings: Array<{
      ticker: string
      shares: number
      costBasisCents: number
    }>,
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
        console.warn(`Skipping ticker ${holding.ticker} in portfolio calculation`)
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
