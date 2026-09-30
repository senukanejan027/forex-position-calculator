import { useMemo, useRef, useState } from 'react'
import { CircleAlert, Plus } from 'lucide-react'
import { useToast } from '../Toast'
import { createStore, addTrade, updateTrade, deleteTrade } from '../../lib/journalStorage'
import { filterTrades } from '../../lib/journalCalculations'
import { mergeTrades } from '../../lib/journalBackup'
import { DEFAULT_SETTINGS } from '../../data/journalDefaults'
import TradeForm from './TradeForm'
import TradeFilters, { EMPTY_FILTERS } from './TradeFilters'
import TradeTable, { TradeDetail } from './TradeTable'
import JournalStatistics from './JournalStatistics'
import PerformanceChart from './PerformanceChart'
import PerformanceBreakdown from './PerformanceBreakdown'
import JournalBackup from './JournalBackup'
import { ConfirmDialog } from './Modal'

const TABS = ['Journal', 'Statistics', 'Performance', 'Data & Backup']

export default function TradingJournal() {
  const toast = useToast()
  const store = useMemo(() => createStore(), [])
  const initial = useMemo(() => store.load(), [store])
  const [data, setData] = useState(initial.data)
  const [storage, setStorage] = useState({ ok: !initial.blocked, error: initial.error })
  const dataRef = useRef(initial.data)
  const [tab, setTab] = useState('Journal')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [editing, setEditing] = useState(null) // null | 'new' | trade
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Single write path: update state, then persist. Never persists when storage is blocked.
  const commit = (next) => {
    dataRef.current = next
    setData(next)
    if (initial.blocked) return
    const r = store.save(next)
    setStorage({ ok: r.ok, error: r.ok ? null : r.error })
  }
  const currency = data.settings.currency
  const shown = useMemo(() => filterTrades(data.trades, filters), [data.trades, filters])

  const saveTrade = (t) => {
    const cur = dataRef.current
    const exists = cur.trades.some((x) => x.id === t.id)
    commit({ ...cur, trades: exists ? updateTrade(cur.trades, t.id, t) : addTrade(cur.trades, t) })
    setEditing(null)
    toast.success(exists ? 'Trade updated' : 'Trade saved')
  }

  return (
    <div className="journal">
      <header className="page-head journal-head">
        <div>
          <h1>Trading Journal</h1>
          <p>Log trades, review your results and track your edge.</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Journal sections">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </header>

      {storage.error && <div className="alert alert-error" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{storage.error}</span></div>}

      {tab === 'Journal' && (
        <>
          {editing ? (
            <TradeForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing}
              settings={data.settings} onSave={saveTrade} onCancel={() => setEditing(null)} />
          ) : (
            <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} aria-hidden="true" />Add Trade</button></div>
          )}
          <TradeFilters filters={filters} onChange={setFilters} trades={data.trades} shown={shown.length} />
          <TradeTable trades={shown} total={data.trades.length} currency={currency} onAdd={() => setEditing('new')} onView={setViewing}
            onEdit={(t) => { setViewing(null); setEditing(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} onDelete={setDeleting} />
        </>
      )}
      {tab === 'Statistics' && <JournalStatistics trades={data.trades} currency={currency} />}
      {tab === 'Performance' && (
        <>
          <PerformanceChart trades={data.trades} currency={currency} />
          <PerformanceBreakdown trades={data.trades} currency={currency} />
        </>
      )}
      {tab === 'Data & Backup' && (
        <JournalBackup data={data} storage={storage}
          onReplace={(trades, settings) => commit({ ...dataRef.current, trades, settings: { ...dataRef.current.settings, ...settings } })}
          onMerge={(incoming) => { const r = mergeTrades(dataRef.current.trades, incoming); commit({ ...dataRef.current, trades: r.trades }); return r }}
          onClear={() => commit({ ...dataRef.current, trades: [], settings: { ...DEFAULT_SETTINGS, ...dataRef.current.settings } })}
          onSettings={(patch) => commit({ ...dataRef.current, settings: { ...dataRef.current.settings, ...patch } })}
          onExported={(iso) => commit({ ...dataRef.current, settings: { ...dataRef.current.settings, lastBackup: iso } })} />
      )}

      {viewing && <TradeDetail trade={viewing} currency={currency} onClose={() => setViewing(null)}
        onEdit={(t) => { setViewing(null); setEditing(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
      {deleting && (
        <ConfirmDialog title="Delete Trade" danger confirmLabel="Delete Trade"
          message={`Delete the ${deleting.pair} ${deleting.direction} trade from ${deleting.date}? This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => { commit({ ...dataRef.current, trades: deleteTrade(dataRef.current.trades, deleting.id) }); setDeleting(null); toast.success('Trade deleted') }} />
      )}
    </div>
  )
}
