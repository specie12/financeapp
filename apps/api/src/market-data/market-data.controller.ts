import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { RequirePermission } from '../authorization/decorators/require-permission.decorator'
import { Permission } from '../authorization/interfaces/permission.interface'
import { TickerData, ApiResponse as ApiResponseType } from '@finance-app/shared-types'
import { MarketDataService } from './market-data.service'

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('search')
  @RequirePermission(Permission.READ)
  async searchTickers(@Query('q') query: string): Promise<ApiResponseType<TickerData[]>> {
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        message: 'No query provided',
      }
    }

    const results = await this.marketDataService.searchTickers(query.trim())

    return {
      success: true,
      data: results,
      message: `Found ${results.length} ticker(s) matching "${query}"`,
    }
  }

  @Get('ticker/:symbol')
  @RequirePermission(Permission.READ)
  async getTicker(@Param('symbol') symbol: string): Promise<ApiResponseType<TickerData>> {
    const tickerData = await this.marketDataService.getTickerData(symbol)

    return {
      success: true,
      data: tickerData,
      message: `Ticker data for ${symbol.toUpperCase()}`,
    }
  }

  @Post('validate')
  @RequirePermission(Permission.READ)
  @HttpCode(HttpStatus.OK)
  async validateTicker(@Body() dto: { symbol: string }): Promise<ApiResponseType<boolean>> {
    const isValid = await this.marketDataService.validateTicker(dto.symbol)

    return {
      success: true,
      data: isValid,
      message: isValid
        ? `${dto.symbol.toUpperCase()} is a valid ticker symbol`
        : `${dto.symbol.toUpperCase()} is not a valid ticker symbol`,
    }
  }

  @Get('available')
  @RequirePermission(Permission.READ)
  async getAvailableTickers(): Promise<ApiResponseType<string[]>> {
    const tickers = await this.marketDataService.getAvailableTickers()

    return {
      success: true,
      data: tickers,
      message: `${tickers.length} ticker symbols available`,
    }
  }

  @Get('sector/:sector')
  @RequirePermission(Permission.READ)
  async getTickersBySector(
    @Param('sector') sector: string,
  ): Promise<ApiResponseType<TickerData[]>> {
    const tickers = await this.marketDataService.getTickersBySector(sector)

    return {
      success: true,
      data: tickers,
      message: `Found ${tickers.length} ticker(s) in ${sector} sector`,
    }
  }

  @Get('summary')
  @RequirePermission(Permission.READ)
  async getMarketSummary(): Promise<
    ApiResponseType<{
      topGainers: TickerData[]
      topLosers: TickerData[]
      mostActive: TickerData[]
    }>
  > {
    const summary = await this.marketDataService.getMarketSummary()

    return {
      success: true,
      data: summary,
      message: 'Market summary retrieved successfully',
    }
  }
}
