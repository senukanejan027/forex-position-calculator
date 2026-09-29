import Calculator from './components/Calculator'
import SessionsActive from './components/SessionsActive'

export default function App() {
  return (
    <div className="page">
      <header className="header">
        <h1>Position Size Calculator</h1>
        <p>Calculate your position size based on account risk and stop loss.</p>
      </header>
      <SessionsActive />
      <main><Calculator /></main>
      <footer className="footer">Position Size Calculator</footer>
    </div>
  )
}
