import { useMemo } from 'react'
import { Layers } from 'lucide-react'
import EmptyState from '../EmptyState'
import { calculatePairStatistics, calculateSessionStatistics, calculateStrategyStatistics, fmtMoney, fmtR, fmtPct } from '../../lib/journalCalculations'
import { JOURNAL_SESSIONS } from '../../data/journalDefaults'

const tone = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

function Breakdown({ title, first, rows, currency, avgR }) {
  return (
    <section className="card table-card">
      <h3 className="card-title pad">{title}</h3>
      {rows.length === 0 ? <EmptyState icon={Layers} title="No completed trades yet" compact>Results will be broken down here once trades are closed.</EmptyState> : (
        <div className="table-scroll"><table className="tbl">
          <thead><tr>{[first, 'Trades', 'Wins', 'Losses', 'Win Rate', 'P/L', ...(avgR ? ['Average R'] : []), 'Total R'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td data-label={first}><strong>{r.name}</strong></td>
                <td data-label="Trades">{r.trades}</td><td data-label="Wins">{r.wins}</td><td data-label="Losses">{r.losses}</td>
                <td data-label="Win Rate">{r.trades ? fmtPct(r.winRate) : '--'}</td>
                <td data-label="P/L" className={tone(r.pnl)}>{fmtMoney(r.pnl, currency, true)}</td>
                {avgR && <td data-label="Average R" className={tone(r.avgR)}>{fmtR(r.avgR)}</td>}
                <td data-label="Total R" className={tone(r.totalR)}>{fmtR(r.totalR)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  )
}

export default function PerformanceBreakdown({ trades, currency }) {
  const pairs = useMemo(() => calculatePairStatistics(trades), [trades])
  const sessions = useMemo(() => calculateSessionStatistics(trades, JOURNAL_SESSIONS), [trades])
  const strategies = useMemo(() => calculateStrategyStatistics(trades), [trades])
  return (
    <>
      <Breakdown title="Performance by Pair" first="Pair" rows={pairs} currency={currency} />
      <Breakdown title="Performance by Session" first="Session" rows={sessions} currency={currency} />
      <Breakdown title="Performance by Strategy" first="Strategy" rows={strategies} currency={currency} avgR />
    </>
  )
}
