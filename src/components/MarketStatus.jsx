import { useEffect, useState } from 'react'
import { getSessionStatuses } from '../lib/sessions'

// Compact header indicator. Uses its own slow timer so the rest of the app does not re-render.
export default function MarketStatus() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20000)
    return () => clearInterval(id)
  }, [])
  const active = getSessionStatuses(now).filter((s) => s.active)
  return (
    <span className={'status-pill' + (active.length ? ' is-live' : '')} title="Active trading sessions">
      <span className="status-dot" aria-hidden="true" />
      <span className="status-text">{active.length ? active.map((s) => s.label).join(' + ') : 'No session active'}</span>
    </span>
  )
}
