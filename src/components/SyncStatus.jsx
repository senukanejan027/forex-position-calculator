import { CloudCheck, CloudOff, LoaderCircle, TriangleAlert } from 'lucide-react'

const VIEW = {
  synced: { label: 'Cloud Synced', Icon: CloudCheck },
  syncing: { label: 'Syncing...', Icon: LoaderCircle },
  loading: { label: 'Syncing...', Icon: LoaderCircle },
  offline: { label: 'Offline', Icon: CloudOff },
  error: { label: 'Sync Error', Icon: TriangleAlert },
}

// Only says "Cloud Synced" when nothing is waiting in the queue.
export default function SyncStatus({ status, pending, message, onRetry }) {
  const effective = status === 'synced' && pending > 0 ? 'syncing' : status
  const { label, Icon } = VIEW[effective] || VIEW.error
  return (
    <div className={`sync sync-${effective}`} role="status" title={message || undefined}>
      <Icon size={15} aria-hidden="true" className={effective === 'syncing' || effective === 'loading' ? 'spin' : undefined} />
      <span>{label}</span>
      {pending > 0 && effective !== 'synced' && <span className="sync-count">{pending} pending</span>}
      {(effective === 'offline' || effective === 'error') && onRetry && <button type="button" className="sync-retry" onClick={onRetry}>Retry</button>}
    </div>
  )
}
