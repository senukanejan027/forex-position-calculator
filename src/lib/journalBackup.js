import { SCHEMA_VERSION, DIRECTIONS, RESULTS, DEFAULT_SETTINGS } from '../data/journalDefaults.js'
import { normalizeTrade } from './journalStorage.js'
import { toNum } from './journalCalculations.js'

export const BACKUP_APP = 'Forex Position Size Calculator'
export const BACKUP_TYPE = 'trading-journal'
const pad = (n) => String(n).padStart(2, '0')

export const backupFilename = (now = new Date()) =>
  `trading-journal-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`

export function buildBackup({ trades, settings }, now = new Date()) {
  return {
    app: BACKUP_APP,
    backupType: BACKUP_TYPE,
    version: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    trades,
    settings: { accountBalance: settings.accountBalance, currency: settings.currency },
  }
}

const fail = (error) => ({ ok: false, error })

export function parseBackup(text) {
  let obj
  try { obj = JSON.parse(text) } catch { return fail('This file is not valid JSON.') }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return fail('This file is not a trading journal backup.')
  if (obj.backupType !== BACKUP_TYPE) return fail('This file is not a trading journal backup.')
  if (typeof obj.version !== 'number') return fail('The backup has no version number.')
  if (obj.version > SCHEMA_VERSION) return fail('This backup was created by a newer version of the app and cannot be imported.')
  if (obj.version < 1) return fail('Unsupported backup version.')
  if (!Array.isArray(obj.trades)) return fail('The backup does not contain a trades list.')
  for (let i = 0; i < obj.trades.length; i++) {
    const t = obj.trades[i]
    const n = i + 1
    if (!t || typeof t !== 'object') return fail(`Trade ${n} is not a valid record.`)
    if (t.id === undefined || t.id === null || String(t.id) === '') return fail(`Trade ${n} has no ID.`)
    if (!t.pair || typeof t.pair !== 'string') return fail(`Trade ${n} has no pair.`)
    if (!t.date || typeof t.date !== 'string') return fail(`Trade ${n} has no date.`)
    if (!DIRECTIONS.includes(String(t.direction).toUpperCase())) return fail(`Trade ${n} has an invalid direction.`)
    if (t.result !== undefined && !RESULTS.includes(t.result)) return fail(`Trade ${n} has an invalid result.`)
  }
  const s = obj.settings && typeof obj.settings === 'object' ? obj.settings : {}
  const bal = toNum(s.accountBalance)
  const settings = {
    accountBalance: bal !== null && bal > 0 ? bal : DEFAULT_SETTINGS.accountBalance,
    currency: typeof s.currency === 'string' && /^[A-Za-z]{3}$/.test(s.currency) ? s.currency.toUpperCase() : DEFAULT_SETTINGS.currency,
  }
  return { ok: true, backup: { trades: obj.trades.map(normalizeTrade), settings } }
}

// Adds incoming trades whose ID is not already present. Never removes anything.
export function mergeTrades(current, incoming) {
  const seen = new Set(current.map((t) => t.id))
  const added = []
  let skipped = 0
  incoming.forEach((t) => {
    if (seen.has(t.id)) { skipped++; return }
    seen.add(t.id)
    added.push(t)
  })
  return { trades: [...current, ...added], imported: added.length, skipped }
}

// Uses the save dialog where the browser supports it (choose your own folder),
// otherwise falls back to a normal download.
export async function saveBackupFile(backup, filename) {
  const text = JSON.stringify(backup, null, 2)
  if (typeof window !== 'undefined' && window.showSaveFilePicker) {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'JSON backup', accept: { 'application/json': ['.json'] } }] })
      const w = await h.createWritable()
      await w.write(text)
      await w.close()
      return { ok: true }
    } catch (e) {
      if (e && e.name === 'AbortError') return { ok: false, cancelled: true }
    }
  }
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return { ok: true }
  } catch {
    return { ok: false, error: 'The backup file could not be created.' }
  }
}
