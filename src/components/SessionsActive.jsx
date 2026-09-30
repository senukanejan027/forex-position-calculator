import { useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'
import { getSessionStatuses, formatClock12 } from '../lib/sessions'

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function SessionsActive() {
  const now = useNow()
  const sessions = useMemo(() => getSessionStatuses(now), [Math.floor(now / 1000)]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="card sessions" aria-label="Forex sessions">
      <div className="card-head">
        <h2 className="card-title">Sessions Active</h2>
        <span className="sessions-clock"><Clock size={14} aria-hidden="true" />Sri Lanka Time: <time>{formatClock12(now)}</time></span>
      </div>
      <ul className="sessions-list">
        {sessions.map((s) => (
          <li key={s.id} className={'session' + (s.active ? ' is-active' : '')}>
            <span className="dot" aria-hidden="true" />
            <span className="session-name">{s.label}</span>
            <span className="session-time">{s.start} – {s.end}</span>
            <span className="session-status">{s.active ? 'Active' : 'Closed'}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
