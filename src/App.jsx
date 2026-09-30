import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, Calculator as CalculatorIcon } from 'lucide-react'
import Calculator from './components/Calculator'
import SessionsActive from './components/SessionsActive'
import TradingJournal from './components/TradingJournal/TradingJournal'
import EconomicCalendar from './components/EconomicCalendar/EconomicCalendar'
import ThemeToggle from './components/ThemeToggle'
import MarketStatus from './components/MarketStatus'
import useHashRoute from './lib/useHashRoute'
import useTheme from './lib/useTheme'

const NAV = [
  { key: 'calculator', href: '#/', label: 'Calculator', icon: CalculatorIcon },
  { key: 'journal', href: '#/journal', label: 'Trading Journal', icon: BookOpen },
  { key: 'calendar', href: '#economic-calendar', label: 'Economic Calendar', icon: CalendarDays },
]

function Brand() {
  return (
    <a className="brand" href="#/" aria-label="SNFX Beta home">
      <svg className="brand-glyph" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <rect width="24" height="24" rx="7" className="brand-glyph-bg" />
        <path d="M8 6v12M12 8v9M16 5v11" className="brand-glyph-stems" />
        <rect x="6.5" y="9" width="3" height="5" rx="1" className="brand-glyph-body" />
        <rect x="10.5" y="10" width="3" height="4" rx="1" className="brand-glyph-body" />
        <rect x="14.5" y="7" width="3" height="5" rx="1" className="brand-glyph-body" />
      </svg>
      <span className="brand-mark">SNFX</span>
      <span className="brand-beta">Beta</span>
    </a>
  )
}

export default function App() {
  const route = useHashRoute()
  const [theme, toggleTheme] = useTheme()
  // Once opened, the calendar stays mounted (hidden) so the widget is not reloaded on every visit.
  const [calendarSeen, setCalendarSeen] = useState(route === 'calendar')
  useEffect(() => { if (route === 'calendar') setCalendarSeen(true) }, [route])

  const links = (cls) => NAV.map(({ key, href, label, icon: Icon }) => (
    <a key={key} href={href} className={cls + (route === key ? ' active' : '')} aria-current={route === key ? 'page' : undefined}>
      <Icon size={18} aria-hidden="true" /><span>{label}</span>
    </a>
  ))
  const current = NAV.find((n) => n.key === route)

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); const m = document.getElementById('main'); if (m) m.focus() }}>Skip to content</a>

      <aside className="sidebar">
        <Brand />
        <nav className="sidenav" aria-label="Main">{links('sidenav-link')}</nav>
        <p className="sidebar-foot">Your data stays in this browser.</p>
      </aside>

      <div className="shell">
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-brand"><Brand /></span>
            <span className="topbar-title">{current.label}</span>
          </div>
          <div className="topbar-actions">
            <MarketStatus />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="content">
          {route === 'journal' && <div className="page page-enter"><TradingJournal /></div>}
          {route === 'calculator' && (
            <div className="page page-enter">
              <header className="page-head">
                <h1>Position Size Calculator</h1>
                <p>Calculate your position size based on account risk and stop loss.</p>
              </header>
              <Calculator aside={<SessionsActive />} />
            </div>
          )}
          {calendarSeen && <div className="ecal-wrap page page-enter" hidden={route !== 'calendar'}><EconomicCalendar /></div>}
          <footer className="footer">SNFX Beta</footer>
        </main>
      </div>

      <nav className="bottomnav" aria-label="Main">{links('bottomnav-link')}</nav>
    </div>
  )
}
