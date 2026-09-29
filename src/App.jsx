import Calculator from './components/Calculator'
import SessionsActive from './components/SessionsActive'
import TradingJournal from './components/TradingJournal/TradingJournal'
import useHashRoute from './lib/useHashRoute'

export default function App() {
  const route = useHashRoute()
  const link = (href, name, key) => (
    <a href={href} className={route === key ? 'active' : ''} aria-current={route === key ? 'page' : undefined}>{name}</a>
  )
  return (
    <div className="page">
      <nav className="topnav" aria-label="Main">
        {link('#/', 'Calculator', 'calculator')}
        {link('#/journal', 'Trading Journal', 'journal')}
      </nav>
      {route === 'journal' ? (
        <TradingJournal />
      ) : (
        <>
          <header className="header">
            <h1>Position Size Calculator</h1>
            <p>Calculate your position size based on account risk and stop loss.</p>
          </header>
          <SessionsActive />
          <main><Calculator /></main>
        </>
      )}
      <footer className="footer">Position Size Calculator</footer>
    </div>
  )
}
