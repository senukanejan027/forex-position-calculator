import { useEffect, useState } from 'react'
import Calculator from './components/Calculator'
import SessionsActive from './components/SessionsActive'
import TradingJournal from './components/TradingJournal/TradingJournal'
import EconomicCalendar from './components/EconomicCalendar/EconomicCalendar'
import useHashRoute from './lib/useHashRoute'

export default function App() {
  const route = useHashRoute()
  // Once opened, the calendar stays mounted (hidden) so the widget is not reloaded on every visit.
  const [calendarSeen, setCalendarSeen] = useState(route === 'calendar')
  useEffect(() => { if (route === 'calendar') setCalendarSeen(true) }, [route])

  const link = (href, name, key) => (
    <a href={href} className={route === key ? 'active' : ''} aria-current={route === key ? 'page' : undefined}>{name}</a>
  )
  return (
    <div className="page">
      <div className="topbar">
        <a className="brand" href="#/" aria-label="SNFX Beta home">
          <span className="brand-mark">SNFX</span>
          <span className="brand-beta">Beta</span>
        </a>
        <nav className="topnav" aria-label="Main">
          {link('#/', 'Calculator', 'calculator')}
          {link('#/journal', 'Trading Journal', 'journal')}
          {link('#economic-calendar', 'Economic Calendar', 'calendar')}
        </nav>
      </div>
      {route === 'journal' && <TradingJournal />}
      {route === 'calculator' && (
        <>
          <header className="header">
            <h1>Position Size Calculator</h1>
            <p>Calculate your position size based on account risk and stop loss.</p>
          </header>
          <SessionsActive />
          <main><Calculator /></main>
        </>
      )}
      {calendarSeen && <div className="ecal-wrap" hidden={route !== 'calendar'}><EconomicCalendar /></div>}
      <footer className="footer">SNFX Beta</footer>
    </div>
  )
}
