import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import Modal from './Modal'
import { FormError } from '../AuthLayout'

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`

// One-time offer to copy pre-cloud browser trades into the signed-in account.
// Nothing is deleted locally whatever the answer.
export default function MigrationPrompt({ count, onImport, onSkip, onDone }) {
  const [phase, setPhase] = useState('ask') // ask | running | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const run = async () => {
    setPhase('running')
    setError('')
    const r = await onImport((done, total) => setProgress({ done, total }))
    setResult(r)
    if (r.pending) { setError(r.message || 'Unable to connect to SNFX Cloud. Your local data is preserved.'); setPhase('error') } else setPhase('done')
  }
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <Modal title="Import local trades" dismissible={phase !== 'running'} onClose={phase === 'ask' ? onSkip : onDone} footer={(close) => {
      if (phase === 'ask') return (<><button type="button" className="btn btn-secondary" onClick={close}>Skip</button><button type="button" className="btn btn-primary" onClick={run}>Import</button></>)
      if (phase === 'error') return (<><button type="button" className="btn btn-secondary" onClick={close}>Close</button><button type="button" className="btn btn-primary" onClick={run}>Try again</button></>)
      if (phase === 'done') return <button type="button" className="btn btn-primary" onClick={close}>Done</button>
      return <button type="button" className="btn btn-secondary" disabled>Importing</button>
    }}>
      {phase === 'ask' && <p className="modal-text">Import your existing local trades to your SNFX cloud account? We found {plural(count, 'trade')} saved in this browser. Your local copy is kept as a backup either way.</p>}
      {phase === 'running' && (
        <div role="status">
          <p className="modal-text">Uploading {plural(count, 'trade')}...</p>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
        </div>
      )}
      {phase === 'error' && <FormError>{error}</FormError>}
      {phase === 'done' && result && (
        <div className="auth-success" role="status">
          <CircleCheck size={22} aria-hidden="true" />
          <p>Imported: <strong>{result.imported}</strong><br />Skipped duplicates: <strong>{result.skipped}</strong><br />Invalid: <strong>{result.invalid}</strong></p>
        </div>
      )}
    </Modal>
  )
}
