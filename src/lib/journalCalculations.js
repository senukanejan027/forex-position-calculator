// Pure calculation helpers. No DOM, no storage.
export const toNum = (v) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const round = (n, d = 2) => { const f = 10 ** d; return Math.round(n * f) / f }
const sum = (a) => a.reduce((s, x) => s + x, 0)
const pad = (n) => String(n).padStart(2, '0')

export const isCompleted = (t) => Boolean(t) && (t.result === 'Win' || t.result === 'Loss' || t.result === 'Breakeven')
const completedOf = (trades) => (Array.isArray(trades) ? trades : []).filter(isCompleted)
const pnls = (c) => c.map((t) => toNum(t.pnl)).filter((x) => x !== null)
const rs = (c) => c.map((t) => toNum(t.r)).filter((x) => x !== null)

// ---- Auto-calculated form values ----
export function calcRiskAmount(balance, riskPct) {
  const b = toNum(balance), r = toNum(riskPct)
  if (b === null || r === null || b <= 0 || r <= 0) return null
  return round((b * r) / 100)
}
export function calcRR(direction, entry, sl, tp) {
  const e = toNum(entry), s = toNum(sl), t = toNum(tp)
  if (e === null || s === null || t === null) return null
  const buy = String(direction).toUpperCase() !== 'SELL'
  const reward = buy ? t - e : e - t
  const risk = buy ? e - s : s - e
  if (risk <= 0 || reward <= 0) return null
  return round(reward / risk)
}
export function calcR(pnl, riskAmount) {
  const p = toNum(pnl), r = toNum(riskAmount)
  if (p === null || r === null || r <= 0) return null
  return round(p / r)
}

// ---- Statistics ----
export function calculateWinRate(trades) {
  const c = completedOf(trades)
  return c.length ? round((c.filter((t) => t.result === 'Win').length / c.length) * 100, 1) : 0
}
export function calculateLossRate(trades) {
  const c = completedOf(trades)
  return c.length ? round((c.filter((t) => t.result === 'Loss').length / c.length) * 100, 1) : 0
}
export const calculateTotalPnL = (trades) => round(sum(pnls(completedOf(trades))))
export const calculateTotalR = (trades) => round(sum(rs(completedOf(trades))))
export function calculateAverageR(trades) {
  const v = rs(completedOf(trades))
  return v.length ? round(sum(v) / v.length) : 0
}
// Returns null when it cannot be expressed (no losses, or no completed P/L).
export function calculateProfitFactor(trades) {
  const p = pnls(completedOf(trades))
  const gp = sum(p.filter((x) => x > 0))
  const gl = Math.abs(sum(p.filter((x) => x < 0)))
  if (gl === 0) return null
  return round(gp / gl)
}

export function summarize(trades) {
  const c = completedOf(trades)
  const p = pnls(c)
  return {
    trades: c.length,
    wins: c.filter((t) => t.result === 'Win').length,
    losses: c.filter((t) => t.result === 'Loss').length,
    breakeven: c.filter((t) => t.result === 'Breakeven').length,
    winRate: calculateWinRate(c),
    lossRate: calculateLossRate(c),
    pnl: calculateTotalPnL(c),
    avgPnl: p.length ? round(sum(p) / p.length) : 0,
    totalR: calculateTotalR(c),
    avgR: calculateAverageR(c),
    profitFactor: calculateProfitFactor(c),
  }
}

function groupStats(trades, keyFn, order) {
  const map = new Map((order || []).map((k) => [k, []]))
  completedOf(trades).forEach((t) => {
    const k = keyFn(t)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(t)
  })
  const rows = [...map].map(([name, list]) => ({ name, ...summarize(list) }))
  return order ? rows : rows.sort((a, b) => b.trades - a.trades || a.name.localeCompare(b.name))
}
export const calculatePairStatistics = (trades) => groupStats(trades, (t) => t.pair || 'Unknown')
export const calculateSessionStatistics = (trades, order) => groupStats(trades, (t) => t.session || 'Other', order)
export const calculateStrategyStatistics = (trades) => groupStats(trades, (t) => (t.strategy || '').trim() || 'Unspecified')

export function calculateOverview(trades) {
  const all = Array.isArray(trades) ? trades : []
  const c = completedOf(all)
  const s = summarize(c)
  const p = pnls(c)
  const risks = all.map((t) => toNum(t.riskAmount)).filter((x) => x !== null && x > 0)
  const withR = c.filter((t) => toNum(t.r) !== null)
  const pick = (list, cmp) => (list.length ? list.reduce((a, b) => (cmp(b, a) ? b : a)) : null)
  return {
    ...s,
    total: all.length,
    open: all.filter((t) => t.result === 'Open').length,
    avgRisk: risks.length ? round(sum(risks) / risks.length) : 0,
    largestWin: p.some((x) => x > 0) ? Math.max(...p) : null,
    largestLoss: p.some((x) => x < 0) ? Math.min(...p) : null,
    best: pick(withR, (b, a) => toNum(b.r) > toNum(a.r)),
    worst: pick(withR, (b, a) => toNum(b.r) < toNum(a.r)),
  }
}

export function calculateEquityCurve(trades, mode = 'pnl') {
  const key = mode === 'r' ? 'r' : 'pnl'
  const sorted = completedOf(trades)
    .filter((t) => toNum(t[key]) !== null)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  let acc = 0
  const pts = [{ i: 0, label: 'Start', value: 0 }]
  sorted.forEach((t, i) => {
    acc = round(acc + toNum(t[key]))
    pts.push({ i: i + 1, label: `${t.date} ${t.pair}`, value: acc })
  })
  return pts
}

export const localYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export function calculatePeriodStats(trades, now = new Date()) {
  const today = localYMD(now)
  const w = new Date(now)
  w.setDate(w.getDate() - ((w.getDay() + 6) % 7)) // week starts Monday
  const starts = { today, week: localYMD(w), month: `${today.slice(0, 8)}01`, all: '' }
  const out = {}
  Object.entries(starts).forEach(([k, start]) => {
    out[k] = summarize((trades || []).filter((t) => !start || (t.date >= start)))
  })
  return out
}

export function filterTrades(trades, f = {}) {
  const q = (f.search || '').trim().toLowerCase()
  return (trades || []).filter((t) => {
    if (f.pair && t.pair !== f.pair) return false
    if (f.direction && t.direction !== f.direction) return false
    if (f.session && t.session !== f.session) return false
    if (f.result && t.result !== f.result) return false
    if (f.strategy && (t.strategy || '') !== f.strategy) return false
    if (f.from && t.date < f.from) return false
    if (f.to && t.date > f.to) return false
    if (q) {
      const hay = [t.pair, t.strategy, t.reason, t.wentWell, t.wentWrong, t.lessons, t.notes].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

// ---- Formatting ----
export function fmtMoney(n, currency = 'USD', signed = false) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '--'
  let s
  try { s = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(n)) }
  catch { s = `${currency} ${Math.abs(n).toFixed(2)}` }
  return (n < 0 ? '-' : signed && n > 0 ? '+' : '') + s
}
export const fmtR = (n) => (n === null || n === undefined || !Number.isFinite(n) ? '--' : `${n > 0 ? '+' : ''}${n.toFixed(2)}R`)
export const fmtPct = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}%` : '--')
export const fmtNum = (n, d = 2) => (n === null || n === undefined || !Number.isFinite(n) ? '--' : n.toFixed(d))
