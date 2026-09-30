import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useToast } from '../Toast'
import { useAuth } from '../../context/AuthContext'
import useCloudJournal from '../../hooks/useCloudJournal'
import { filterTrades } from '../../lib/journalCalculations'
import { readLegacy, getMigrationFlag, setMigrationFlag } from '../../lib/journalCache'
import { createStore } from '../../lib/journalStorage'
import SyncStatus from '../SyncStatus'
import MigrationPrompt from './MigrationPrompt'
import TradeForm from './TradeForm'
import TradeFilters, { EMPTY_FILTERS } from './TradeFilters'
import TradeTable, { TradeDetail } from './TradeTable'
import JournalStatistics from './JournalStatistics'
import PerformanceChart from './PerformanceChart'
import PerformanceBreakdown from './PerformanceBreakdown'
import JournalBackup from './JournalBackup'
import { ConfirmDialog } from './Modal'

const TABS = ['Journal', 'Statistics', 'Performance', 'Data & Backup']

const Skeleton = () => (
  <div className="card skeleton-card" role="status" aria-label="Loading your trades">
    {[0, 1, 2, 3, 4].map((i) => <span key={i} className="sk sk-row" />)}
  </div>
)

export default function TradingJournal() {
  const toast = useToast()
  const { user } = useAuth()
  const journal = useCloudJournal(user.id)
  const data = useMemo(() => ({ trades: journal.trades, settings: journal.settings }), [journal.trades, journal.settings])
  const storageOk = useMemo(() => createStore().isAvailable(), [])
  const storage = { ok: storageOk, error: null }
  const sync = { status: journal.status, pending: journal.pending, message: journal.message }
  const [tab, setTab] = useState('Journal')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [editing, setEditing] = useState(null) // null | 'new' | trade
  const [viewing, setViewing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Trades saved in this browser before cloud sync existed. Offered once per account, never deleted.
  const legacy = useMemo(() => readLegacy().trades, [])
  const [migFlag, setMigFlag] = useState(() => getMigrationFlag(user.id))
  const [migOpen, setMigOpen] = useState(false)
  const asked = useRef(false)
  useEffect(() => {
    // Only ask after the cloud list has loaded, so duplicates can be detected against it.
    if (journal.fetched && legacy.length && !migFlag && !asked.current) { asked.current = true; setMigOpen(true) }
  }, [journal.fetched, legacy.length, migFlag])
  const finishMigration = (v) => { setMigrationFlag(user.id, v); setMigFlag(v); setMigOpen(false) }

  const currency = data.settings.currency
  const shown = useMemo(() => filterTrades(data.trades, filters), [data.trades, filters])

  // Changes show instantly; the toast reports what actually happened once the sync attempt finishes.
  const report = (res, okText) => {
    if (!res.pending) toast.success(okText)
    else if (res.kind === 'network') toast.warning('Saved on this device. It will sync when SNFX Cloud is reachable.')
    else if (res.kind === 'session') toast.error(res.message)
    else toast.error(res.message || 'Unable to save this trade. Please try again.')
  }
  const saveTrade = async (t) => {
    const exists = journal.trades.some((x) => x.id === t.id)
    setEditing(null)
    report(await journal.saveTrade(t), exists ? 'Trade updated' : 'Trade saved')
  }

  return (
    <div className="journal">
      <header className="page-head journal-head">
        <div>
          <h1>Trading Journal</h1>
          <p>Log trades, review your results and track your edge.</p>
        </div>
        <div className="journal-tools">
          <SyncStatus {...sync} onRetry={journal.retry} />
          <div className="tabs" role="tablist" aria-label="Journal sections">
            {TABS.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </header>

      {tab === 'Journal' && (
        <>
          {editing ? (
            <TradeForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? null : editing}
              settings={data.settings} onSave={saveTrade} onCancel={() => setEditing(null)} />
          ) : (
            <div className="toolbar"><button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={17} aria-hidden="true" />Add Trade</button></div>
          )}
          <TradeFilters filters={filters} onChange={setFilters} trades={data.trades} shown={shown.length} />
          {journal.loading ? <Skeleton /> : <TradeTable trades={shown} total={data.trades.length} currency={currency} onAdd={() => setEditing('new')} onView={setViewing}
            onEdit={(t) => { setViewing(null); setEditing(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} onDelete={setDeleting} />}
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
        <JournalBackup data={data} storage={storage} user={user} sync={sync} onRetry={journal.retry}
          legacy={{ count: legacy.length, done: migFlag === 'done' }} onImportLocal={() => setMigOpen(true)}
          onReplace={async (trades, settings) => { journal.updateSettings(settings); return journal.importBatch(trades, { mode: 'replace' }) }}
          onMerge={(incoming) => journal.importBatch(incoming, { mode: 'merge' })}
          onClear={() => journal.clearAll()}
          onSettings={journal.updateSettings}
          onExported={(iso) => journal.updateSettings({ lastBackup: iso })} />
      )}

      {viewing && <TradeDetail trade={viewing} currency={currency} onClose={() => setViewing(null)}
        onEdit={(t) => { setViewing(null); setEditing(t); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />}
      {deleting && (
        <ConfirmDialog title="Delete Trade" danger confirmLabel="Delete Trade"
          message={`Delete the ${deleting.pair} ${deleting.direction} trade from ${deleting.date}? This cannot be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => { const id = deleting.id; setDeleting(null); report(await journal.removeTrade(id), 'Trade deleted') }} />
      )}
      {migOpen && (
        <MigrationPrompt count={legacy.length}
          onImport={async (onProgress) => { const r = await journal.importBatch(legacy, { mode: 'merge', onProgress }); if (!r.pending) setMigrationFlag(user.id, 'done'); return r }}
          onSkip={() => finishMigration('skipped')}
          onDone={() => { if (getMigrationFlag(user.id) === 'done') setMigFlag('done'); setMigOpen(false) }} />
      )}
    </div>
  )
}
