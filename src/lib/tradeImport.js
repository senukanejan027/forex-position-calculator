import { DIRECTIONS, NUMERIC_FIELDS } from '../data/journalDefaults.js'
import { normalizeTrade } from './journalStorage.js'
import { toNum } from './journalCalculations.js'
import { newUuid } from '../services/tradeMapper.js'

// Checks a raw record BEFORE it is normalised (normalising would silently turn junk into null).
export function validateTrade(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return 'not a record'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(t.date || '')) || Number.isNaN(new Date(`${t.date}T00:00:00`).getTime())) return 'invalid date'
  if (!String(t.pair || '').trim()) return 'missing pair'
  if (!DIRECTIONS.includes(String(t.direction).toUpperCase())) return 'invalid direction'
  for (const k of NUMERIC_FIELDS) {
    const v = t[k]
    if (v !== null && v !== undefined && v !== '' && toNum(v) === null) return `invalid ${k}`
  }
  return null
}

// Only trades that carry real prices get a signature, so blank "open" trades are never merged by accident.
export function signature(t) {
  if (t.entry === null || t.entry === undefined || t.sl === null || t.sl === undefined) return null
  return [t.date, t.time || '', t.pair, t.direction, t.entry, t.sl, t.tp, t.lots].join('|')
}

// Splits incoming trades into new / duplicate / invalid. New trades get a fresh id owned by the
// current user; the original id is kept as clientId so the same trade is never uploaded twice.
export function planImport(existing, incoming) {
  const known = new Set()
  const sigs = new Set()
  existing.forEach((t) => {
    known.add(String(t.id))
    if (t.clientId) known.add(String(t.clientId))
    const s = signature(t); if (s) sigs.add(s)
  })
  const toInsert = []
  let skipped = 0
  let invalid = 0
  const now = new Date().toISOString()
  for (const raw of incoming) {
    if (validateTrade(raw)) { invalid++; continue }
    const t = normalizeTrade(raw)
    const origin = raw.id === undefined || raw.id === null || raw.id === '' ? null : String(raw.id)
    const s = signature(t)
    if ((origin && known.has(origin)) || (s && sigs.has(s))) { skipped++; continue }
    if (origin) known.add(origin)
    if (s) sigs.add(s)
    toInsert.push({ ...t, id: newUuid(), clientId: origin || '', createdAt: t.createdAt || now, updatedAt: t.updatedAt || now })
  }
  return { toInsert, skipped, invalid }
}
