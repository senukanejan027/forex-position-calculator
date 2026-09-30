import { useRef, useState } from 'react'
import { CircleAlert, Download, GitMerge, HardDrive, Trash2, Upload } from 'lucide-react'
import { useToast } from '../Toast'
import SyncStatus from '../SyncStatus'
import { CURRENCIES } from '../../data/journalDefaults'
import { toNum } from '../../lib/journalCalculations'
import { buildBackup, backupFilename, parseBackup, saveBackupFile } from '../../lib/journalBackup'
import { ConfirmDialog } from './Modal'

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never')

// Same wording everywhere an import finishes.
const importSummary = (r) => `Imported: ${r.imported}. Skipped duplicates: ${r.skipped}. Invalid: ${r.invalid}.`

export default function JournalBackup({ data, storage, user, sync, onRetry, legacy, onImportLocal, onReplace, onMerge, onClear, onSettings, onExported }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const modeRef = useRef('replace')
  const [msg, setMsg] = useState(null)
  const [pending, setPending] = useState(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [balance, setBalance] = useState(String(data.settings.accountBalance))

  const pick = (mode) => { modeRef.current = mode; fileRef.current.value = ''; fileRef.current.click() }

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    let text
    try { text = await file.text() } catch { return setMsg({ type: 'error', text: 'The file could not be read.' }) }
    const res = parseBackup(text)
    if (!res.ok) return setMsg({ type: 'error', text: res.error })
    if (modeRef.current === 'merge') {
      const r = await onMerge(res.backup.raw)
      setMsg(null)
      reportImport(r)
    } else setPending(res.backup)
  }

  const reportImport = (r) => {
    if (r.pending) toast.warning(`${importSummary(r)} Changes are saved on this device and will upload when SNFX Cloud is reachable.`)
    else toast.success(importSummary(r))
  }

  const doExport = async () => {
    const now = new Date()
    const r = await saveBackupFile(buildBackup(data, now), backupFilename(now))
    if (r.ok) { onExported(now.toISOString()); setMsg(null); toast.success('Backup exported') }
    else if (!r.cancelled) setMsg({ type: 'error', text: r.error || 'The backup could not be saved.' })
  }

  return (
    <>
      <section className="card cloud-card" aria-labelledby="cloud-title">
        <h3 className="card-title" id="cloud-title">Cloud Account</h3>
        <dl className="cloud-list">
          <div><dt>Connected as</dt><dd className="cloud-email">{user.email}</dd></div>
          <div><dt>Cloud Sync</dt><dd><SyncStatus status={sync.status} pending={sync.pending} message={sync.message} onRetry={onRetry} /></dd></div>
          <div><dt>Local Storage</dt><dd>{storage.ok ? 'Enabled' : 'Unavailable'}</dd></div>
        </dl>
        {legacy.count > 0 && (
          <div className="cloud-legacy">
            <HardDrive size={18} aria-hidden="true" />
            <p>{plural(legacy.count, 'trade')} from before cloud sync {legacy.count === 1 ? 'is' : 'are'} still stored in this browser{legacy.done ? ' and have been imported.' : '.'}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onImportLocal}><Upload size={15} aria-hidden="true" />{legacy.done ? 'Import again' : 'Import local trades'}</button>
          </div>
        )}
      </section>

      <section className="card">
        <h3 className="card-title">Data &amp; Backup</h3>
        <p className="muted">Your trades are saved to your SNFX Cloud account and cached in this browser. A backup file is still worth keeping: export one regularly, and import it to restore or merge trades. Backups contain only your own trades.</p>
        <div className="backup-status">
          <div><span className="stat-label">Last Backup</span><strong className="stat-figure">{fmtDate(data.settings.lastBackup)}</strong></div>
          <div><span className="stat-label">Saved Trades</span><strong className="stat-figure">{data.trades.length}</strong></div>
          <div><span className="stat-label">Local Storage</span><strong className={'stat-figure ' + (storage.ok ? 'pos' : 'neg')}>{storage.ok ? 'Enabled' : 'Unavailable'}</strong></div>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={doExport}><Download size={16} aria-hidden="true" />Export Backup</button>
          <button type="button" className="btn btn-secondary" onClick={() => pick('replace')}><Upload size={16} aria-hidden="true" />Import Backup</button>
          <button type="button" className="btn btn-secondary" onClick={() => pick('merge')}><GitMerge size={16} aria-hidden="true" />Merge Backup</button>
          <button type="button" className="btn btn-danger-ghost" onClick={() => setClearOpen(true)}><Trash2 size={16} aria-hidden="true" />Clear Journal</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
        {msg && <div className="alert alert-error" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{msg.text}</span></div>}
      </section>

      <section className="card">
        <h3 className="card-title">Journal Settings</h3>
        <div className="fgrid">
          <div className="field"><label htmlFor="set-balance">Account Balance</label>
            <div className="control"><input id="set-balance" type="number" min="0" step="any" value={balance}
              onChange={(e) => { setBalance(e.target.value); const n = toNum(e.target.value); if (n !== null && n > 0) onSettings({ accountBalance: n }) }} /></div></div>
          <div className="field"><label htmlFor="set-cur">Currency</label>
            <div className="control select"><select id="set-cur" value={data.settings.currency} onChange={(e) => onSettings({ currency: e.target.value })}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></div></div>
        </div>
        <p className="hint">The balance is used to calculate Risk Amount when you log a trade.</p>
      </section>

      {pending && (
        <ConfirmDialog title="Import Backup" confirmLabel="Import Backup"
          message={`Importing this backup will replace your current journal data. Continue? (${plural(pending.trades.length, 'trade')} in the file, ${plural(data.trades.length, 'trade')} currently saved.)`}
          onCancel={() => setPending(null)}
          onConfirm={async () => { const b = pending; setPending(null); setMsg(null); reportImport(await onReplace(b.raw, b.settings)) }} />
      )}
      {clearOpen && (
        <ConfirmDialog title="Clear Journal" danger confirmLabel="Delete Everything" requireText="DELETE"
          message="Delete all trades from your SNFX Cloud account? This action cannot be undone unless you have a backup."
          onCancel={() => setClearOpen(false)}
          onConfirm={async () => { setClearOpen(false); setMsg(null); const r = await onClear(); if (r && r.pending) toast.warning('Journal cleared on this device. The cloud copy will be cleared when SNFX Cloud is reachable.'); else toast.success('Journal cleared') }} />
      )}
    </>
  )
}
