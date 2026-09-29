// Edit instrument specifications here. Everything else reads from this file.
//
// contractSize   units (or ounces) in one standard lot
// pipSize        price movement that counts as one pip
// quoteCurrency  currency the P&L is denominated in
// usdPerQuote    USD value of 1 unit of the quote currency. Use 1 for USD-quoted
//                symbols. For USDJPY this is 1 / USDJPY price, so update
//                referencePrice to a recent rate (no live data is fetched).
//
// Pip value per lot in USD = contractSize * pipSize * usdPerQuote

export const instruments = {
  EURUSD: {
    label: 'EURUSD',
    contractSize: 100000,
    pipSize: 0.0001,
    quoteCurrency: 'USD',
    referencePrice: null,
  },
  GBPUSD: {
    label: 'GBPUSD',
    contractSize: 100000,
    pipSize: 0.0001,
    quoteCurrency: 'USD',
    referencePrice: null,
  },
  USDJPY: {
    label: 'USDJPY',
    contractSize: 100000,
    pipSize: 0.01,
    quoteCurrency: 'JPY',
    // Approximate USDJPY rate used to convert JPY pip value into USD.
    referencePrice: 150,
  },
  XAUUSD: {
    // Convention: 1 lot = 100 oz, 1 pip = 0.10 (ten cents), so 1 pip = $10 per lot.
    label: 'XAUUSD',
    contractSize: 100,
    pipSize: 0.1,
    quoteCurrency: 'USD',
    referencePrice: null,
  },
}

export const instrumentKeys = Object.keys(instruments)

export const DEFAULTS = {
  balance: '10000',
  risk: '1',
  stopLoss: '20',
  pair: 'EURUSD',
}
