import { normalizeTrade } from '../lib/journalStorage.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const isUuid = (v) => typeof v === 'string' && UUID.test(v)

export function newUuid() {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const b = new Uint8Array(16)
  if (c && c.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

const pad = (n) => String(n).padStart(2, '0')

// The app keeps a local date + time; the database keeps one timestamptz.
export function toTradeDate(date, time) {
  const d = new Date(`${date}T${/^\d{2}:\d{2}$/.test(time || '') ? time : '00:00'}:00`)
  if (Number.isNaN(d.getTime())) throw new Error('Trade has an invalid date.')
  return d.toISOString()
}
function fromTradeDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: time === '00:00' ? '' : time }
}

// `userId` is always supplied by the service from the signed-in session. Any user_id on the
// incoming trade is ignored on purpose, so a trade can never be assigned to another user.
export function toRow(trade, userId) {
  if (!userId) throw new Error('A signed-in user is required.')
  if (!isUuid(trade.id)) throw new Error('Trade id must be a UUID.')
  return {
    id: trade.id,
    user_id: userId,
    trade_date: toTradeDate(trade.date, trade.time),
    pair: trade.pair,
    direction: trade.direction,
    session: trade.session,
    strategy: trade.strategy || '',
    timeframe: trade.timeframe || '',
    entry: trade.entry,
    stop_loss: trade.sl,
    take_profit: trade.tp,
    lot_size: trade.lots,
    risk_percent: trade.riskPct,
    risk_amount: trade.riskAmount,
    result: trade.result,
    exit_price: trade.exit,
    pnl: trade.pnl,
    r_multiple: trade.r,
    notes: trade.notes || '',
    rr: trade.rr,
    duration: trade.duration || '',
    reason: trade.reason || '',
    went_well: trade.wentWell || '',
    went_wrong: trade.wentWrong || '',
    lessons: trade.lessons || '',
    client_id: trade.clientId ? String(trade.clientId) : null,
    created_at: trade.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export function fromRow(row) {
  const { date, time } = fromTradeDate(row.trade_date)
  return normalizeTrade({
    id: row.id, date, time, pair: row.pair, direction: row.direction, session: row.session || 'Other',
    strategy: row.strategy || '', timeframe: row.timeframe || '',
    entry: row.entry, sl: row.stop_loss, tp: row.take_profit, lots: row.lot_size,
    riskPct: row.risk_percent, riskAmount: row.risk_amount, rr: row.rr,
    result: row.result, exit: row.exit_price, pnl: row.pnl, r: row.r_multiple,
    duration: row.duration || '', reason: row.reason || '', wentWell: row.went_well || '',
    wentWrong: row.went_wrong || '', lessons: row.lessons || '', notes: row.notes || '',
    createdAt: row.created_at || '', updatedAt: row.updated_at || '',
    clientId: row.client_id || '',
  })
}
