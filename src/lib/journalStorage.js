import { STORAGE_KEY, SCHEMA_VERSION, DEFAULT_SETTINGS, emptyTrade, NUMERIC_FIELDS, DIRECTIONS, RESULTS } from '../data/journalDefaults.js'
import { toNum } from './journalCalculations.js'

export const newTradeId = () => 'T-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function normalizeTrade(raw) {
  const t = { ...emptyTrade(), ...raw }
  t.id = t.id ? String(t.id) : newTradeId()
  t.pair = String(t.pair || '').trim().toUpperCase()
  t.direction = DIRECTIONS.includes(String(t.direction).toUpperCase()) ? String(t.direction).toUpperCase() : 'BUY'
  if (!RESULTS.includes(t.result)) t.result = 'Open'
  NUMERIC_FIELDS.forEach((k) => { t[k] = toNum(t[k]) })
  return t
}

// Pure CRUD helpers: each returns a new array.
export function addTrade(trades, raw) {
  const now = new Date().toISOString()
  let id = raw.id || newTradeId()
  while (trades.some((t) => t.id === id)) id = newTradeId()
  return [normalizeTrade({ ...raw, id, createdAt: now, updatedAt: now }), ...trades]
}
export const updateTrade = (trades, id, patch) =>
  trades.map((t) => (t.id === id ? normalizeTrade({ ...t, ...patch, id, updatedAt: new Date().toISOString() }) : t))
export const deleteTrade = (trades, id) => trades.filter((t) => t.id !== id)

const emptyData = () => ({ version: SCHEMA_VERSION, trades: [], settings: { ...DEFAULT_SETTINGS } })
const defaultAdapter = () => { try { return globalThis.localStorage || null } catch { return null } }
const errText = (e) => (e && (e.name === 'QuotaExceededError' || e.code === 22)
  ? 'Browser storage is full. Export a backup and free some space.'
  : 'Could not save to browser storage.')

// `adapter` is anything with getItem/setItem/removeItem (localStorage by default).
export function createStore(adapter = defaultAdapter()) {
  const store = {
    isAvailable() {
      if (!adapter) return false
      try { adapter.setItem('__fx_probe', '1'); adapter.removeItem('__fx_probe'); return true } catch { return false }
    },
    load() {
      if (!store.isAvailable()) {
        return { data: emptyData(), blocked: true, error: 'Browser storage is unavailable, so trades cannot be saved. Check that cookies and site data are allowed.' }
      }
      const raw = adapter.getItem(STORAGE_KEY)
      if (!raw) return { data: emptyData(), blocked: false, error: null }
      let parsed
      try { parsed = JSON.parse(raw) } catch {
        let kept = true
        try { adapter.setItem(`${STORAGE_KEY}-corrupt`, raw) } catch { kept = false }
        return { data: emptyData(), blocked: !kept, error: 'Saved journal data could not be read. The unreadable copy was kept under a separate storage key.' }
      }
      const v = Number(parsed && parsed.version) || 0
      if (v > SCHEMA_VERSION) {
        return { data: emptyData(), blocked: true, error: 'Saved data comes from a newer version of this app. It was left untouched and saving is disabled.' }
      }
      if (v < SCHEMA_VERSION) { try { adapter.setItem(`${STORAGE_KEY}-premigration-v${v}`, raw) } catch { /* best effort */ } }
      return {
        blocked: false, error: null,
        data: {
          version: SCHEMA_VERSION,
          trades: (Array.isArray(parsed.trades) ? parsed.trades : []).map(normalizeTrade),
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        },
      }
    },
    save(data) {
      try {
        adapter.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, trades: data.trades, settings: data.settings }))
        return { ok: true }
      } catch (e) { return { ok: false, error: errText(e) } }
    },
    clear() {
      try { adapter.removeItem(STORAGE_KEY); return { ok: true } } catch (e) { return { ok: false, error: errText(e) } }
    },
  }
  return store
}
