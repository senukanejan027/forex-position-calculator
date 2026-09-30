import { createStore, normalizeTrade } from './journalStorage.js'

// Cloud trades are cached per user in their own key. The original `fx-journal` key is never
// overwritten with cloud data, so pre-cloud local trades stay intact until the user chooses to import them.
const cacheKey = (uid) => `snfx-cache:${uid}`
const flagKey = (uid) => `snfx-migration-v1:${uid}`
const ls = () => { try { return globalThis.localStorage || null } catch { return null } }

export function loadCache(uid) {
  const empty = { trades: [], queue: [], hasData: false }
  try {
    const raw = ls()?.getItem(cacheKey(uid))
    if (!raw) return empty
    const p = JSON.parse(raw)
    return { trades: (Array.isArray(p.trades) ? p.trades : []).map(normalizeTrade), queue: Array.isArray(p.queue) ? p.queue : [], hasData: true }
  } catch { return empty }
}
export function saveCache(uid, { trades, queue }) {
  try { ls()?.setItem(cacheKey(uid), JSON.stringify({ trades, queue })) } catch { /* cache is best effort */ }
}
// On sign-out, drop the cached trades so they do not sit in a shared browser - unless
// there are unsynced changes, which must survive until the next sign-in.
export function purgeCacheIfSynced(uid) {
  try { if (!loadCache(uid).queue.length) ls()?.removeItem(cacheKey(uid)) } catch { /* ignore */ }
}

export const getMigrationFlag = (uid) => { try { return ls()?.getItem(flagKey(uid)) || null } catch { return null } }
export const setMigrationFlag = (uid, v) => { try { ls()?.setItem(flagKey(uid), v) } catch { /* ignore */ } }

// Pre-cloud data and per-device settings still live under the original key.
export function readLegacy() {
  const r = createStore().load()
  return { trades: r.blocked ? [] : r.data.trades, settings: r.data.settings }
}
export function saveSettings(settings) {
  const store = createStore()
  const r = store.load()
  if (r.blocked) return
  store.save({ ...r.data, settings })
}
