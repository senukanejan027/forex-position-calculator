import { useMemo } from 'react'
import { calculateOverview, calculatePeriodStats, fmtMoney, fmtR, fmtPct } from '../../lib/journalCalculations'

const tone = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')
const Stat = ({ label, value, sub, cls }) => (
  <div className="stat"><span className="stat-label">{label}</span><span className={'stat-value ' + (cls || '')}>{value}</span>{sub && <span className="stat-sub">{sub}</span>}</div>
)
const label = (t) => (t ? `${t.pair} ${t.date}` : null)

export default function JournalStatistics({ trades, currency }) {
  const o = useMemo(() => calculateOverview(trades), [trades])
  const periods = useMemo(() => calculatePeriodStats(trades), [trades])
  const m = (n, s) => fmtMoney(n, currency, s)
  return (
    <>
      <section className="card">
        <h3 className="section-title">Overview</h3>
        <p className="muted small">Open trades are excluded from completed-trade statistics.</p>
        <div className="stats">
          <Stat label="Total Trades" value={o.total} sub={`${o.open} open`} />
          <Stat label="Winning Trades" value={o.wins} />
          <Stat label="Losing Trades" value={o.losses} />
          <Stat label="Breakeven Trades" value={o.breakeven} />
          <Stat label="Win Rate" value={fmtPct(o.winRate)} />
          <Stat label="Loss Rate" value={fmtPct(o.lossRate)} />
          <Stat label="Total P/L" value={m(o.pnl, true)} cls={tone(o.pnl)} />
          <Stat label="Average P/L" value={m(o.avgPnl, true)} cls={tone(o.avgPnl)} />
          <Stat label="Average R" value={fmtR(o.avgR)} cls={tone(o.avgR)} />
          <Stat label="Total R" value={fmtR(o.totalR)} cls={tone(o.totalR)} />
          <Stat label="Profit Factor" value={o.profitFactor === null ? '--' : o.profitFactor.toFixed(2)} sub={o.profitFactor === null ? 'Needs a losing trade' : undefined} />
          <Stat label="Average Risk" value={o.avgRisk ? m(o.avgRisk) : '--'} />
          <Stat label="Largest Win" value={o.largestWin === null ? '--' : m(o.largestWin, true)} cls="pos" />
          <Stat label="Largest Loss" value={o.largestLoss === null ? '--' : m(o.largestLoss, true)} cls="neg" />
          <Stat label="Best Trade" value={o.best ? fmtR(o.best.r) : '--'} sub={label(o.best)} cls={o.best ? 'pos' : ''} />
          <Stat label="Worst Trade" value={o.worst ? fmtR(o.worst.r) : '--'} sub={label(o.worst)} cls={o.worst ? 'neg' : ''} />
        </div>
      </section>
      <section className="card table-card">
        <h3 className="section-title pad">Recent Performance</h3>
        <table className="tbl">
          <thead><tr>{['Period', 'Trades', 'Win Rate', 'P/L', 'Total R'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']].map(([k, name]) => (
              <tr key={k}>
                <td data-label="Period"><strong>{name}</strong></td>
                <td data-label="Trades">{periods[k].trades}</td>
                <td data-label="Win Rate">{fmtPct(periods[k].winRate)}</td>
                <td data-label="P/L" className={tone(periods[k].pnl)}>{m(periods[k].pnl, true)}</td>
                <td data-label="Total R" className={tone(periods[k].totalR)}>{fmtR(periods[k].totalR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
