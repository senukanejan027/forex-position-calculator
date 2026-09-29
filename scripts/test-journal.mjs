import * as C from '../src/lib/journalCalculations.js'
import * as S from '../src/lib/journalStorage.js'
import * as B from '../src/lib/journalBackup.js'
let fail = 0
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `got ${JSON.stringify(g)} want ${JSON.stringify(w)}`) }
const mem = () => { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v) }, removeItem: (k) => { delete m[k] }, _m: m } }
const base = { date: '2026-09-01', time: '10:00', direction: 'BUY' }
const mk = (o) => ({ ...base, ...o })

// CRUD
let trades = []
trades = S.addTrade(trades, mk({ id: 'a', pair: 'eurusd', session: 'London', strategy: 'A', result: 'Win', pnl: 100, riskAmount: 50, r: 2 }))
trades = S.addTrade(trades, mk({ id: 'b', pair: 'EURUSD', direction: 'SELL', session: 'London', strategy: 'A', result: 'Loss', pnl: -50, riskAmount: 50, r: -1 }))
trades = S.addTrade(trades, mk({ id: 'c', pair: 'GBPUSD', session: 'New York', strategy: 'B', result: 'Breakeven', pnl: 0, r: 0 }))
trades = S.addTrade(trades, mk({ id: 'd', pair: 'XAUUSD', session: 'Asia', strategy: 'B', result: 'Win', pnl: 200, r: 4 }))
trades = S.addTrade(trades, mk({ id: 'e', pair: 'EURUSD', result: 'Open' }))
eq('add trade count', trades.length, 5)
eq('add normalizes pair', trades.find((t) => t.id === 'a').pair, 'EURUSD')
eq('duplicate id on add gets new id', S.addTrade(trades, mk({ id: 'a', pair: 'EURUSD' })).length, 6)
trades = S.updateTrade(trades, 'e', { result: 'Loss', pnl: -25, r: -0.5 })
eq('edit trade', trades.find((t) => t.id === 'e').result, 'Loss')
trades = S.updateTrade(trades, 'e', { result: 'Open', pnl: null, r: null })
trades = S.deleteTrade(trades, 'e')
eq('delete trade', trades.map((t) => t.id).sort(), ['a', 'b', 'c', 'd'])
trades = S.addTrade(trades, mk({ id: 'e', pair: 'EURUSD', result: 'Open' }))

// Stats
eq('win rate excludes open/BE as wins', C.calculateWinRate(trades), 50)
eq('loss rate', C.calculateLossRate(trades), 25)
eq('profit factor', C.calculateProfitFactor(trades), 6)
eq('profit factor no losses is null', C.calculateProfitFactor([trades[0]].filter((t) => t.result === 'Win')), null)
eq('total pnl', C.calculateTotalPnL(trades), 250)
eq('total R', C.calculateTotalR(trades), 5)
eq('avg R', C.calculateAverageR(trades), 1.25)
const pair = C.calculatePairStatistics(trades).find((p) => p.name === 'EURUSD')
eq('pair stats', [pair.trades, pair.wins, pair.losses, pair.winRate, pair.pnl, pair.totalR], [2, 1, 1, 50, 50, 1])
eq('pair stats only existing pairs', C.calculatePairStatistics(trades).map((p) => p.name).sort(), ['EURUSD', 'GBPUSD', 'XAUUSD'])
const sess = C.calculateSessionStatistics(trades, ['Asia', 'London', 'New York', 'London + New York', 'Other'])
eq('session stats all sessions', sess.map((s) => s.trades), [1, 2, 1, 0, 0])
eq('session zero row safe', [sess[3].winRate, sess[3].profitFactor], [0, null])
const strat = C.calculateStrategyStatistics(trades).find((s) => s.name === 'A')
eq('strategy stats', [strat.trades, strat.avgR, strat.totalR], [2, 0.5, 1])
eq('overview', (({ total, open, largestWin, largestLoss, avgRisk }) => ({ total, open, largestWin, largestLoss, avgRisk }))(C.calculateOverview(trades)), { total: 5, open: 1, largestWin: 200, largestLoss: -50, avgRisk: 50 })
const timed = ['a', 'b', 'c', 'd'].map((id, i) => ({ ...trades.find((t) => t.id === id), time: `0${i + 1}:00` }))
eq('equity curve pnl', C.calculateEquityCurve(timed, 'pnl').map((p) => p.value), [0, 100, 50, 50, 250])
eq('equity curve r', C.calculateEquityCurve(trades, 'r').map((p) => p.value).pop(), 5)

// Calculations
eq('risk amount', C.calcRiskAmount(10000, 1.5), 150)
eq('R:R buy', C.calcRR('BUY', 1.1, 1.09, 1.13), 3)
eq('R:R sell', C.calcRR('SELL', 1.1, 1.11, 1.07), 3)
eq('R:R invalid', C.calcRR('BUY', 1.1, 1.12, 1.13), null)
eq('R multiple', C.calcR(150, 100), 1.5)
eq('R zero risk', C.calcR(150, 0), null)

// Empty / odd data
const emptyO = C.calculateOverview([])
eq('empty journal overview', [emptyO.total, emptyO.winRate, emptyO.profitFactor, emptyO.largestWin, emptyO.best], [0, 0, null, null, null])
eq('empty equity', C.calculateEquityCurve([]).length, 1)
eq('only open trades', C.summarize([{ result: 'Open' }]).trades, 0)
eq('missing pnl and R', C.summarize([{ result: 'Win', pnl: null, r: 'abc' }]).totalR, 0)
eq('no NaN in any stat', JSON.stringify(C.summarize([{ result: 'Loss', pnl: 'x' }])).includes('NaN'), false)
eq('period stats all', C.calculatePeriodStats(trades, new Date(2026, 8, 30)).all.trades, 4)
eq('period stats month', C.calculatePeriodStats(trades, new Date(2026, 9, 5)).month.trades, 0)
eq('filter search notes', C.filterTrades([{ ...trades[0], notes: 'Breakout retest' }], { search: 'retest' }).length, 1)
eq('filter combined', C.filterTrades(trades, { pair: 'EURUSD', result: 'Win' }).length, 1)
eq('filter date range', C.filterTrades(trades, { from: '2026-09-02' }).length, 0)

// Storage
const ad = mem(); const st = S.createStore(ad)
eq('empty load', st.load().data.trades.length, 0)
st.save({ trades, settings: { accountBalance: 5000, currency: 'EUR', lastBackup: null } })
const re = st.load()
eq('save then load', [re.data.trades.length, re.data.settings.accountBalance], [4 + 1, 5000])
eq('storage unavailable', S.createStore(null).load().blocked, true)
eq('storage full error', S.createStore({ getItem: () => null, setItem: (k) => { if (k === 'fx-journal') { const e = new Error('q'); e.name = 'QuotaExceededError'; throw e } }, removeItem() {} }).save({ trades: [], settings: {} }).ok, false)
ad.setItem('fx-journal', '{oops')
eq('corrupt data preserved', [st.load().error !== null, ad.getItem('fx-journal-corrupt')], [true, '{oops'])
ad.setItem('fx-journal', JSON.stringify({ version: 99, trades: [] }))
eq('newer version blocks saving', st.load().blocked, true)
ad.setItem('fx-journal', JSON.stringify({ trades: [mk({ id: 'z', pair: 'EURUSD' })] }))
eq('migration keeps old copy', [st.load().data.trades.length, ad.getItem('fx-journal-premigration-v0') !== null], [1, true])

// Backup
const now = new Date(2026, 8, 30, 18, 0, 0)
const backup = B.buildBackup({ trades, settings: { accountBalance: 10000, currency: 'USD', lastBackup: 'x' } }, now)
eq('backup filename', B.backupFilename(now), 'trading-journal-backup-2026-09-30.json')
eq('backup shape', [backup.app, backup.backupType, backup.version, backup.trades.length, 'lastBackup' in backup.settings], ['Forex Position Size Calculator', 'trading-journal', 1, 5, false])
const parsed = B.parseBackup(JSON.stringify(backup))
eq('import valid', [parsed.ok, parsed.ok && parsed.backup.trades.length], [true, 5])
eq('import invalid json', B.parseBackup('nope').ok, false)
eq('import wrong type', B.parseBackup('{"backupType":"x","version":1,"trades":[]}').ok, false)
eq('import newer version', B.parseBackup(JSON.stringify({ ...backup, version: 2 })).ok, false)
eq('import bad trade', B.parseBackup(JSON.stringify({ ...backup, trades: [{ id: 'q' }] })).ok, false)
eq('import empty trades ok', B.parseBackup(JSON.stringify({ ...backup, trades: [] })).ok, true)
const m1 = B.mergeTrades(trades.slice(0, 3), parsed.backup.trades)
eq('merge counts', [m1.imported, m1.skipped, m1.trades.length], [2, 3, 5])
const m2 = B.mergeTrades(trades, parsed.backup.trades)
eq('merge all duplicates', [m2.imported, m2.skipped, m2.trades.length], [0, 5, 5])
eq('merge into empty', B.mergeTrades([], parsed.backup.trades).imported, 5)
process.exit(fail ? 1 : 0)
