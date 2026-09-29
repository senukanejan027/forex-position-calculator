export const STORAGE_KEY = 'fx-journal'
export const SCHEMA_VERSION = 1
export const DEFAULT_SETTINGS = { accountBalance: 10000, currency: 'USD', lastBackup: null }
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'LKR']

export const PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30', 'GBPJPY', 'EURJPY', 'AUDUSD', 'USDCAD']
export const DIRECTIONS = ['BUY', 'SELL']
export const JOURNAL_SESSIONS = ['Asia', 'London', 'New York', 'London + New York', 'Other']
export const RESULTS = ['Win', 'Loss', 'Breakeven', 'Open']
export const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1']
export const NUMERIC_FIELDS = ['entry', 'sl', 'tp', 'lots', 'riskPct', 'riskAmount', 'rr', 'exit', 'pnl', 'r']

export const emptyTrade = () => ({
  id: '', date: '', time: '', pair: '', direction: 'BUY', session: 'Other',
  strategy: '', timeframe: '', entry: null, sl: null, tp: null, lots: null,
  riskPct: null, riskAmount: null, rr: null, result: 'Open', exit: null, pnl: null, r: null,
  duration: '', reason: '', wentWell: '', wentWrong: '', lessons: '', notes: '',
  createdAt: '', updatedAt: '',
})
