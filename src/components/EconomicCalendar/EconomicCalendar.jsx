import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import './economicCalendar.css'

// Edit the widget here. Myfxbook's official embed, loaded straight from the browser.
const WIDGET_SRC = 'https://widget.mfbcdn.net/widget/calendar.html?lang=en&impacts=1,2,3&symbols=AUD,CAD,CHF,CNY,EUR,GBP,JPY,NZD,USD'
const MYFXBOOK_URL = 'https://www.myfxbook.com/forex-economic-calendar?utm_source=widget13&utm_medium=link&utm_campaign=copyright'
const SLOW_MS = 12000

export default function EconomicCalendar() {
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (loaded) return undefined
    const id = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(id)
  }, [loaded])

  return (
    <section className="ecal" aria-labelledby="ecal-title">
      <header className="page-head ecal-head">
        <h1 id="ecal-title">Economic Calendar</h1>
        <p><strong>Live Forex Economic Events</strong><span> Real-time market events and economic releases</span></p>
      </header>

      <div className="ecal-frame" aria-busy={!loaded}>
        <div className={'ecal-skeleton' + (loaded ? ' done' : '')} aria-hidden="true">
          <span className="sk sk-bar" />
          {Array.from({ length: 8 }, (_, i) => <span key={i} className="sk sk-row" />)}
          {slow && !loaded && (
            <p className="ecal-slow">
              Taking longer than usual. <a href={MYFXBOOK_URL} target="_blank" rel="noopener">Open the calendar on Myfxbook</a>
            </p>
          )}
        </div>
        <iframe
          className={'ecal-iframe' + (loaded ? ' ready' : '')}
          src={WIDGET_SRC}
          title="Myfxbook Economic Calendar"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
        />
      </div>

      <p className="ecal-credit">
        <a href={MYFXBOOK_URL} title="Economic Calendar" target="_blank" rel="noopener"><b>Economic Calendar</b><ExternalLink size={12} aria-hidden="true" /></a> by Myfxbook.com
      </p>
    </section>
  )
}
