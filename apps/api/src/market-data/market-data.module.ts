import { Module, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MarketDataService } from './market-data.service'
import { MarketDataController } from './market-data.controller'
import { MARKET_DATA_PROVIDER, type MarketDataProvider } from './market-data.provider'
import { MockMarketDataProvider } from './providers/mock-market-data.provider'
import { FinnhubMarketDataProvider } from './providers/finnhub-market-data.provider'

/**
 * Selects the market-data provider from config. Defaults to simulated data;
 * set `MARKET_DATA_PROVIDER=finnhub` and `FINNHUB_API_KEY` to serve live
 * quotes. Missing key with finnhub selected falls back to mock with a warning,
 * so the app never boots into a broken investments page.
 */
const marketDataProviderFactory = {
  provide: MARKET_DATA_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService): MarketDataProvider => {
    const provider = (config.get<string>('MARKET_DATA_PROVIDER') ?? 'mock').toLowerCase()
    const apiKey = config.get<string>('FINNHUB_API_KEY')

    if (provider === 'finnhub') {
      if (apiKey) return new FinnhubMarketDataProvider(apiKey)
      new Logger('MarketDataModule').warn(
        'MARKET_DATA_PROVIDER=finnhub but FINNHUB_API_KEY is unset — falling back to simulated data.',
      )
    }
    return new MockMarketDataProvider()
  },
}

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, marketDataProviderFactory],
  exports: [MarketDataService],
})
export class MarketDataModule {}
