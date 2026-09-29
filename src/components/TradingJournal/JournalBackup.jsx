import { useRef, useState } from 'react'
import { CURRENCIES } from '../../data/journalDefaults'
import { toNum } from '../../lib/journalCalculations'
import { buildBackup, backupFilename, parseBackup, saveBackupFile } from '../../lib/journalBackup'
import { ConfirmDialog } from './Modal'

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never')

export default function JournalBackup({ data, storage, onReplace, onMerge, onClear, onSettings, onExported }) {
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
      const r = onMerge(res.backup.trades)
      setMsg({ type: 'ok', text: `${plural(r.imported, 'trade')} imported. ${plural(r.skipped, 'duplicate trade')} skipped.` })
    } else setPending(res.backup)
  }

  const doExport = async () => {
    const now = new Date()
    const r = await saveBackupFile(buildBackup(data, now), backupFilename(now))
    if (r.ok) { onExported(now.toISOString()); setMsg({ type: 'ok', text: 'Backup exported.' }) }
    else if (!r.cancelled) setMsg({ type: 'error', text: r.error || 'The backup could not be saved.' })
  }

  return (
    <>
      <section className="card">
        <h3 className="section-title">Data &amp; Backup</h3>
        <p className="muted">Your journal is stored locally in this browser. Export a backup regularly to keep a copy of your trading history. It is not synced to GitHub or the cloud, and clearing site data in your browser will remove it.</p>
        <div className="backup-status">
          <div><span className="stat-label">Last Backup</span><strong>{fmtDate(data.settings.lastBackup)}</strong></div>
          <div><span className="stat-label">Saved Trades</span><strong>{data.trades.length}</strong></div>
          <div><span className="stat-label">Storage</span><strong className={storage.ok ? 'pos' : 'neg'}>{storage.ok ? 'Saving locally' : 'Not saving'}</strong></div>
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={doExport}>Export Backup</button>
          <button type="button" className="btn" onClick={() => pick('replace')}>Import Backup</button>
          <button type="button" className="btn" onClick={() => pick('merge')}>Merge Backup</button>
          <button type="button" className="btn btn-danger-ghost" onClick={() => setClearOpen(true)}>Clear Journal</button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />
        {msg && <p className={msg.type === 'error' ? 'error' : 'ok-msg'} role="status">{msg.text}</p>}
      </section>

      <section className="card">
        <h3 className="section-title">Journal Settings</h3>
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
          onConfirm={() => { onReplace(pending.trades, pending.settings); setMsg({ type: 'ok', text: `${plural(pending.trades.length, 'trade')} imported.` }); setPending(null) }} />
      )}
      {clearOpen && (
        <ConfirmDialog title="Clear Journal" danger confirmLabel="Delete Everything" requireText="DELETE"
          message="Delete all trading journal data? This action cannot be undone unless you have a backup."
          onCancel={() => setClearOpen(false)}
          onConfirm={() => { onClear(); setClearOpen(false); setMsg({ type: 'ok', text: 'Journal cleared.' }) }} />
      )}
    </>
  )
}
