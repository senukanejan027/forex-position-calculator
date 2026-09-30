import { toRow, fromRow, newUuid, isUuid, toTradeDate } from '../src/services/tradeMapper.js'
import { planImport, validateTrade, signature } from '../src/lib/tradeImport.js'
import { enqueue, applyQueue, nextRun } from '../src/lib/syncQueue.js'
import { routeFromHash } from '../src/lib/useHashRoute.js'
import { normalizeTrade } from '../src/lib/journalStorage.js'
import { parseBackup } from '../src/lib/journalBackup.js'

let fail = 0
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `got ${JSON.stringify(g)} want ${JSON.stringify(w)}`) }
const throws = (n, f) => { let t = false; try { f() } catch { t = true } eq(n, t, true) }

const trade = (o = {}) => normalizeTrade({ id: newUuid(), date: '2026-09-10', time: '09:30', pair: 'eurusd', direction: 'sell', session: 'London', strategy: 'Breakout', timeframe: 'H1',
  entry: 1.1, sl: 1.11, tp: 1.08, lots: 0.5, riskPct: 1, riskAmount: 100, rr: 2, result: 'Win', exit: 1.08, pnl: 200, r: 2,
  duration: '2h', reason: 'r', wentWell: 'w', wentWrong: 'x', lessons: 'l', notes: 'n', createdAt: '2026-09-10T03:00:00.000Z', ...o })

// ---- uuid
const u = newUuid(); eq('newUuid is a uuid', isUuid(u), true); eq('uuids differ', u !== newUuid(), true); eq('local id is not uuid', isUuid('T-abc123'), false)

// ---- mapper
const UID = '11111111-1111-4111-8111-111111111111'
const t = trade()
const row = toRow(t, UID)
eq('row.user_id is the signed-in user', row.user_id, UID)
eq('row maps columns', [row.pair, row.direction, row.stop_loss, row.take_profit, row.lot_size, row.risk_percent, row.exit_price, row.r_multiple, row.went_well], ['EURUSD', 'SELL', 1.11, 1.08, 0.5, 1, 1.08, 2, 'w'])
eq('trade_date is ISO', /^\d{4}-\d\d-\d\dT/.test(row.trade_date), true)
const spoofed = toRow({ ...t, user_id: '99999999-9999-4999-8999-999999999999' }, UID)
eq('incoming user_id cannot override owner', spoofed.user_id, UID)
throws('toRow needs a user', () => toRow(t, ''))
throws('toRow needs a uuid id', () => toRow({ ...t, id: 'T-local' }, UID))
throws('bad date rejected', () => toTradeDate('nope', ''))
eq('empty clientId -> null (so unique index ignores it)', toRow(t, UID).client_id, null)
const back = fromRow({ ...row })
eq('round trip keeps fields', [back.id, back.date, back.time, back.pair, back.direction, back.entry, back.sl, back.tp, back.lots, back.pnl, back.r, back.rr, back.wentWell, back.lessons, back.notes, back.duration, back.reason],
  [t.id, '2026-09-10', '09:30', 'EURUSD', 'SELL', 1.1, 1.11, 1.08, 0.5, 200, 2, 2, 'w', 'l', 'n', '2h', 'r'])
eq('no time round-trips to empty time', fromRow(toRow(trade({ time: '' }), UID)).time, '')
eq('numeric strings from db normalise', fromRow({ ...row, entry: '1.1', pnl: '200.50' }).pnl, 200.5)
eq('null numbers stay null', fromRow(toRow(trade({ entry: null, pnl: null, result: 'Open' }), UID)).entry, null)

// ---- validation
eq('valid trade', validateTrade({ date: '2026-01-02', pair: 'EURUSD', direction: 'BUY', entry: 1 }), null)
eq('bad date', validateTrade({ date: '02/01/2026', pair: 'EURUSD', direction: 'BUY' }), 'invalid date')
eq('missing pair', validateTrade({ date: '2026-01-02', pair: ' ', direction: 'BUY' }), 'missing pair')
eq('bad direction', validateTrade({ date: '2026-01-02', pair: 'X', direction: 'LONG' }), 'invalid direction')
eq('non-numeric price', validateTrade({ date: '2026-01-02', pair: 'X', direction: 'BUY', entry: 'abc' }), 'invalid entry')
eq('blank numbers are fine', validateTrade({ date: '2026-01-02', pair: 'X', direction: 'BUY', entry: '', pnl: null }), null)
eq('non-object', validateTrade('x'), 'not a record')
eq('no signature without prices', signature(normalizeTrade({ date: '2026-01-02', pair: 'X', direction: 'BUY' })), null)

// ---- import planning (duplicates, ownership, invalid)
const cloud = [trade({ id: newUuid(), clientId: 'T-old1' })]
const inc = [
  { id: 'T-old1', date: '2026-09-01', pair: 'GBPUSD', direction: 'BUY' },                 // same client id -> duplicate
  { id: cloud[0].id, date: '2026-09-02', pair: 'GBPUSD', direction: 'BUY' },               // same cloud id -> duplicate
  { id: 'T-new1', date: '2026-09-03', pair: 'USDJPY', direction: 'BUY', entry: 150, sl: 149 }, // new
  { id: 'T-new1', date: '2026-09-03', pair: 'USDJPY', direction: 'BUY', entry: 150, sl: 149 }, // repeated in file -> duplicate
  { id: 'T-x', date: '2026-09-10', time: '09:30', pair: 'EURUSD', direction: 'SELL', entry: 1.1, sl: 1.11, tp: 1.08, lots: 0.5 }, // same signature as existing
  { id: 'T-bad', date: 'garbage', pair: 'EURUSD', direction: 'BUY' },                     // invalid
  { id: 'T-new2', date: '2026-09-04', pair: 'XAUUSD', direction: 'SELL' },                 // new
]
const plan = planImport(cloud, inc)
eq('plan counts', [plan.toInsert.length, plan.skipped, plan.invalid], [2, 4, 1])
eq('new trades get fresh uuids', plan.toInsert.every((x) => isUuid(x.id)), true)
eq('original id kept as clientId', plan.toInsert.map((x) => x.clientId), ['T-new1', 'T-new2'])
eq('re-running the same import adds nothing', planImport([...cloud, ...plan.toInsert], inc).toInsert.length, 0)
eq('replace-mode style plan (empty existing) keeps all valid distinct', planImport([], inc).toInsert.length, 5)

// ---- backup file -> import: bad numbers must count as invalid, not silently become blank
const file = JSON.stringify({ app: 'x', backupType: 'trading-journal', version: 1, trades: [
  { id: 'a', date: '2026-01-01', pair: 'EURUSD', direction: 'BUY', entry: 1.1, sl: 1.09 },
  { id: 'b', date: '2026-01-02', pair: 'EURUSD', direction: 'BUY', entry: 'abc' },
  { id: 'c', date: 'not-a-date', pair: 'EURUSD', direction: 'BUY' }] })
const parsed = parseBackup(file)
eq('parseBackup still returns normalised trades', parsed.backup.trades.length, 3)
const fromFile = planImport([], parsed.backup.raw)
eq('backup import: 1 valid, 2 invalid (bad number + bad date)', [fromFile.toInsert.length, fromFile.invalid], [1, 2])

// ---- queue
const A = trade(), B = trade()
let q = []
q = enqueue(q, { type: 'upsert', id: A.id, trade: A })
q = enqueue(q, { type: 'upsert', id: B.id, trade: B })
q = enqueue(q, { type: 'upsert', id: A.id, trade: { ...A, pnl: 5 } })
eq('same id collapses to latest op, in order', q.map((o) => o.id), [B.id, A.id])
q = enqueue(q, { type: 'delete', id: A.id })
eq('delete replaces earlier upsert', q.map((o) => o.type), ['upsert', 'delete'])
eq('clear wipes the queue', enqueue(q, { type: 'clear' }).map((o) => o.type), ['clear'])
eq('applyQueue upsert/delete over server list', applyQueue([A], [{ type: 'upsert', id: B.id, trade: B }, { type: 'delete', id: A.id }]).map((x) => x.id), [B.id])
eq('applyQueue replaces existing', applyQueue([A], [{ type: 'upsert', id: A.id, trade: { ...A, pnl: 9 } }])[0].pnl, 9)
eq('applyQueue clear then upsert', applyQueue([A, B], [{ type: 'clear' }, { type: 'upsert', id: A.id, trade: A }]).map((x) => x.id), [A.id])
const many = Array.from({ length: 250 }, () => { const x = trade(); return { type: 'upsert', id: x.id, trade: x } })
eq('runs are batched to 100', nextRun(many).ops.length, 100)
eq('runs stop at a different type', nextRun([...many.slice(0, 3), { type: 'delete', id: 'z' }]).ops.length, 3)
eq('blocked ops are skipped', nextRun(many.slice(0, 3), new Set([many[0]])).ops.length, 2)
eq('empty queue', nextRun([]), null)

// ---- routes
eq('login route', routeFromHash('#/login'), 'login')
eq('signup route', routeFromHash('#/signup'), 'signup')
eq('reset route', routeFromHash('#/reset'), 'reset')
eq('journal route unchanged', routeFromHash('#/journal'), 'journal')
process.exit(fail ? 1 : 0)
