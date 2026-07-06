import type { MarketDataSource, TickerData } from '@finance-app/shared-types'

/** DI token for the active market-data provider. */
export const MARKET_DATA_PROVIDER = Symbol('MARKET_DATA_PROVIDER')

/**
 * A source of ticker quotes. Implementations only need two primitives — the
 * `MarketDataService` builds search / sector / summary / portfolio math on top
 * of these and adds caching, so providers stay small.
 */
export interface MarketDataProvider {
  /** Whether this provider serves live or simulated data. */
  readonly source: MarketDataSource
  /** Quote for one symbol, or null if the provider can't serve it. */
  getTicker(symbol: string): Promise<TickerData | null>
  /** The symbols this provider covers (its universe). */
  listSymbols(): Promise<string[]>
}
