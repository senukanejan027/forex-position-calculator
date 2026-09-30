import { useCallback, useEffect, useRef, useState } from 'react'
import { getTrades, upsertTrades, importTrades, deleteTradesByIds, deleteAllTrades } from '../services/tradeService'
import { newUuid } from '../services/tradeMapper'
import { normalizeTrade } from '../lib/journalStorage'
import { planImport } from '../lib/tradeImport'
import { enqueue, applyQueue, nextRun } from '../lib/syncQueue'
import { loadCache, saveCache, readLegacy, saveSettings } from '../lib/journalCache'
import { toCloudError } from '../lib/errors'

const RETRY_MS = 30000

// Local-first journal: every change updates the screen and a per-user cache immediately, then a
// queue sends it to Supabase. If the network drops, changes wait in the queue and are retried.
// status: loading | synced | syncing | offline | error
export default function useCloudJournal(userId) {
  const [trades, setTrades] = useState([])
  const [settings, setSettings] = useState(() => readLegacy().settings)
  const [status, setStatus] = useState('loading')
  const [loading, setLoading] = useState(true)
  const [fetched, setFetched] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(0)
  const R = useRef({ uid: null, trades: [], queue: [], chain: Promise.resolve() })

  const persist = useCallback(() => {
    const r = R.current
    saveCache(r.uid, { trades: r.trades, queue: r.queue })
    setTrades(r.trades)
    setPending(r.queue.length)
  }, [])

  const apply = async (run) => {
    if (run.type === 'clear') return deleteAllTrades()
    if (run.type === 'delete') return deleteTradesByIds(run.ops.map((o) => o.id))
    if (run.type === 'import') return importTrades(run.ops.map((o) => o.trade))
    return upsertTrades(run.ops.map((o) => o.trade))
  }

  const runFlush = useCallback(async (opts = {}) => {
    const r = R.current
    const uid = r.uid
    if (!r.queue.length) return { pending: 0 }
    setStatus('syncing')
    const total = r.queue.length
    const blocked = new Set()
    let done = 0
    let fail = null
    while (r.uid === uid) {
      const run = nextRun(r.queue, blocked)
      if (!run) break
      const finish = (ops) => { r.queue = r.queue.filter((o) => !ops.includes(o)); done += ops.length; persist(); if (opts.onProgress) opts.onProgress(done, total) }
      try { await apply(run); finish(run.ops) } catch (e) {
        const ce = toCloudError(e, 'save')
        if (ce.kind === 'network' || ce.kind === 'session' || run.type === 'clear') { fail = ce; break }
        // A database error: retry the batch one by one so one bad row cannot block the others.
        for (const op of run.ops) {
          try { await apply({ type: run.type, ops: [op] }); finish([op]) } catch (e2) { blocked.add(op); fail = toCloudError(e2, 'save') }
        }
      }
    }
    if (r.uid !== uid) return { pending: r.queue.length }
    if (fail) {
      setMessage(fail.message)
      setStatus(fail.kind === 'network' ? 'offline' : 'error')
    } else { setMessage(''); setStatus('synced') }
    return { pending: r.queue.length, kind: fail ? fail.kind : null, message: fail ? fail.message : '' }
  }, [persist])

  // Serialised so two flushes never overlap.
  const flush = useCallback((opts) => {
    const r = R.current
    const next = r.chain.then(() => runFlush(opts))
    r.chain = next.catch(() => {})
    return next
  }, [runFlush])

  const refresh = useCallback(async () => {
    const r = R.current
    const uid = r.uid
    if (!uid) return
    try {
      const res = await flush()
      if (res.pending && (res.kind === 'network' || res.kind === 'session')) { setLoading(false); return }
      const cloud = await getTrades()
      if (r.uid !== uid) return
      r.trades = applyQueue(cloud, r.queue)
      persist()
      setLoading(false)
      setFetched(true)
      if (r.queue.length) setStatus('error'); else { setStatus('synced'); setMessage('') }
    } catch (e) {
      if (r.uid !== uid) return
      const ce = toCloudError(e, 'load')
      setLoading(false)
      setMessage(ce.message)
      setStatus(ce.kind === 'network' ? 'offline' : 'error')
    }
  }, [flush, persist])

  useEffect(() => {
    const r = R.current
    r.uid = userId || null
    r.chain = Promise.resolve()
    setFetched(false)
    if (!userId) { r.trades = []; r.queue = []; setTrades([]); setPending(0); setLoading(false); setStatus('loading'); return undefined }
    const cache = loadCache(userId)
    r.trades = cache.trades
    r.queue = cache.queue
    setTrades(r.trades)
    setPending(r.queue.length)
    setLoading(!cache.hasData)
    setStatus('syncing')
    refresh()
    const onOnline = () => refresh()
    const onOffline = () => setStatus('offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    const timer = setInterval(() => { if (R.current.queue.length || navigator.onLine === false) refresh() }, RETRY_MS)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); clearInterval(timer); r.uid = null }
  }, [userId, refresh])

  const mutate = (nextTrades, ...ops) => {
    const r = R.current
    r.trades = nextTrades
    ops.forEach((op) => { r.queue = enqueue(r.queue, op) })
    persist()
    setStatus('syncing')
  }

  const saveTrade = (t) => {
    const r = R.current
    const now = new Date().toISOString()
    const old = r.trades.find((x) => x.id === t.id)
    const trade = normalizeTrade(old
      ? { ...old, ...t, id: old.id, updatedAt: now }
      : { ...t, id: newUuid(), clientId: '', createdAt: now, updatedAt: now })
    mutate(old ? r.trades.map((x) => (x.id === trade.id ? trade : x)) : [trade, ...r.trades], { type: 'upsert', id: trade.id, trade })
    return flush()
  }

  const removeTrade = (id) => {
    mutate(R.current.trades.filter((t) => t.id !== id), { type: 'delete', id })
    return flush()
  }

  const clearAll = () => { mutate([], { type: 'clear' }); return flush() }

  // mode 'merge' keeps existing trades; 'replace' removes them after the new ones are queued.
  const importBatch = async (incoming, { mode = 'merge', onProgress } = {}) => {
    const r = R.current
    const old = r.trades
    const { toInsert, skipped, invalid } = planImport(mode === 'replace' ? [] : old, incoming)
    const ops = toInsert.map((trade) => ({ type: 'import', id: trade.id, trade }))
    if (mode === 'replace') old.forEach((t) => ops.push({ type: 'delete', id: t.id }))
    if (ops.length) mutate(mode === 'replace' ? toInsert : [...toInsert, ...old], ...ops)
    const res = ops.length ? await flush({ onProgress }) : { pending: R.current.queue.length }
    return { imported: toInsert.length, skipped, invalid, pending: res.pending, kind: res.kind || null, message: res.message || '' }
  }

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
  }

  return { trades, settings, status, loading, fetched, message, pending, saveTrade, removeTrade, clearAll, importBatch, updateSettings, retry: refresh }
}
