import { TickerData } from '@finance-app/shared-types'

// Mock ticker data with realistic performance metrics
export const MOCK_TICKER_DATA: Record<string, TickerData> = {
  // Technology Stocks
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 175.25,
    dayChange: 1.25,
    weekChange: -2.3,
    monthChange: 4.8,
    ytdChange: 12.4,
    yearChange: 18.6,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'Consumer Electronics',
    marketCap: 2800000000000, // $2.8T
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    currentPrice: 378.5,
    dayChange: -0.8,
    weekChange: 1.2,
    monthChange: 6.1,
    ytdChange: 15.3,
    yearChange: 22.1,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'Software',
    marketCap: 2790000000000, // $2.79T
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: 132.4,
    dayChange: 2.1,
    weekChange: 0.9,
    monthChange: 3.7,
    ytdChange: 8.9,
    yearChange: 16.2,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'Internet Services',
    marketCap: 1650000000000, // $1.65T
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    currentPrice: 155.8,
    dayChange: 0.6,
    weekChange: -1.4,
    monthChange: 5.2,
    ytdChange: 11.7,
    yearChange: 19.8,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'E-commerce',
    marketCap: 1620000000000, // $1.62T
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: 248.9,
    dayChange: -3.2,
    weekChange: 4.1,
    monthChange: 8.6,
    ytdChange: 25.3,
    yearChange: 45.2,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'Electric Vehicles',
    marketCap: 789000000000, // $789B
  },

  // Financial Services
  JPM: {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    currentPrice: 174.3,
    dayChange: 0.9,
    weekChange: 2.1,
    monthChange: 3.4,
    ytdChange: 7.8,
    yearChange: 13.5,
    lastUpdated: new Date(),
    sector: 'Financial Services',
    industry: 'Banking',
    marketCap: 512000000000, // $512B
  },
  BAC: {
    symbol: 'BAC',
    name: 'Bank of America Corp.',
    currentPrice: 39.85,
    dayChange: 1.2,
    weekChange: 1.8,
    monthChange: 2.9,
    ytdChange: 6.4,
    yearChange: 11.2,
    lastUpdated: new Date(),
    sector: 'Financial Services',
    industry: 'Banking',
    marketCap: 321000000000, // $321B
  },
  V: {
    symbol: 'V',
    name: 'Visa Inc.',
    currentPrice: 273.6,
    dayChange: 0.4,
    weekChange: 0.7,
    monthChange: 2.8,
    ytdChange: 9.1,
    yearChange: 14.7,
    lastUpdated: new Date(),
    sector: 'Financial Services',
    industry: 'Payment Processing',
    marketCap: 582000000000, // $582B
  },
  MA: {
    symbol: 'MA',
    name: 'Mastercard Inc.',
    currentPrice: 456.2,
    dayChange: -0.3,
    weekChange: 1.1,
    monthChange: 3.2,
    ytdChange: 10.5,
    yearChange: 17.3,
    lastUpdated: new Date(),
    sector: 'Financial Services',
    industry: 'Payment Processing',
    marketCap: 433000000000, // $433B
  },

  // Healthcare
  JNJ: {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    currentPrice: 163.4,
    dayChange: 0.2,
    weekChange: 0.8,
    monthChange: 1.9,
    ytdChange: 4.3,
    yearChange: 8.7,
    lastUpdated: new Date(),
    sector: 'Healthcare',
    industry: 'Pharmaceuticals',
    marketCap: 431000000000, // $431B
  },
  PFE: {
    symbol: 'PFE',
    name: 'Pfizer Inc.',
    currentPrice: 29.15,
    dayChange: -0.5,
    weekChange: -1.2,
    monthChange: 0.8,
    ytdChange: 2.1,
    yearChange: 5.4,
    lastUpdated: new Date(),
    sector: 'Healthcare',
    industry: 'Pharmaceuticals',
    marketCap: 164000000000, // $164B
  },
  UNH: {
    symbol: 'UNH',
    name: 'UnitedHealth Group Inc.',
    currentPrice: 512.8,
    dayChange: 1.1,
    weekChange: 2.3,
    monthChange: 4.6,
    ytdChange: 9.8,
    yearChange: 15.2,
    lastUpdated: new Date(),
    sector: 'Healthcare',
    industry: 'Health Insurance',
    marketCap: 485000000000, // $485B
  },

  // ETFs - Diversified
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    currentPrice: 456.78,
    dayChange: 0.7,
    weekChange: 1.1,
    monthChange: 3.2,
    ytdChange: 8.9,
    yearChange: 14.6,
    lastUpdated: new Date(),
    sector: 'Diversified',
    industry: 'ETF - Large Cap',
    marketCap: 485000000000, // $485B AUM
  },
  VTI: {
    symbol: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    currentPrice: 248.95,
    dayChange: 0.8,
    weekChange: 1.0,
    monthChange: 3.4,
    ytdChange: 9.2,
    yearChange: 15.1,
    lastUpdated: new Date(),
    sector: 'Diversified',
    industry: 'ETF - Total Market',
    marketCap: 350000000000, // $350B AUM
  },
  VTSAX: {
    symbol: 'VTSAX',
    name: 'Vanguard Total Stock Market Index Fund',
    currentPrice: 118.45,
    dayChange: 0.8,
    weekChange: 1.0,
    monthChange: 3.4,
    ytdChange: 9.1,
    yearChange: 15.0,
    lastUpdated: new Date(),
    sector: 'Diversified',
    industry: 'Index Fund - Total Market',
    marketCap: 1200000000000, // $1.2T AUM
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    currentPrice: 398.25,
    dayChange: 1.2,
    weekChange: 0.4,
    monthChange: 4.8,
    ytdChange: 12.3,
    yearChange: 20.7,
    lastUpdated: new Date(),
    sector: 'Technology',
    industry: 'ETF - Technology',
    marketCap: 215000000000, // $215B AUM
  },

  // Bonds
  BND: {
    symbol: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    currentPrice: 78.92,
    dayChange: -0.1,
    weekChange: 0.2,
    monthChange: 0.4,
    ytdChange: 1.8,
    yearChange: 3.2,
    lastUpdated: new Date(),
    sector: 'Fixed Income',
    industry: 'ETF - Bonds',
    marketCap: 280000000000, // $280B AUM
  },
}

// Sector mappings for classification
export const SECTOR_MAPPINGS: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'QQQ'],
  'Financial Services': ['JPM', 'BAC', 'V', 'MA'],
  Healthcare: ['JNJ', 'PFE', 'UNH'],
  Diversified: ['SPY', 'VTI', 'VTSAX'],
  'Fixed Income': ['BND'],
}

// Generate realistic price movements (for demo purposes)
export function updateMockPrices(): void {
  const now = new Date()

  Object.values(MOCK_TICKER_DATA).forEach((ticker) => {
    // Simulate small price movements
    const volatility =
      ticker.sector === 'Technology' ? 0.03 : ticker.sector === 'Fixed Income' ? 0.005 : 0.02

    const change = (Math.random() - 0.5) * volatility
    const newPrice = ticker.currentPrice * (1 + change)
    const dayChange = ((newPrice - ticker.currentPrice) / ticker.currentPrice) * 100

    ticker.currentPrice = Math.round(newPrice * 100) / 100
    ticker.dayChange = Math.round(dayChange * 100) / 100
    ticker.lastUpdated = now
  })
}

// List of valid ticker symbols for validation
export const VALID_TICKERS = Object.keys(MOCK_TICKER_DATA)

// Get sample tickers by sector
export function getTickersBySector(sector: string): string[] {
  return SECTOR_MAPPINGS[sector] || []
}
