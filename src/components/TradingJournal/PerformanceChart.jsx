import { useMemo, useState } from 'react'
import { LineChart as ChartIcon } from 'lucide-react'
import EmptyState from '../EmptyState'
import { calculateEquityCurve, fmtMoney, fmtR } from '../../lib/journalCalculations'

const W = 640, H = 240, P = { l: 56, r: 16, t: 16, b: 26 }

export default function PerformanceChart({ trades, currency }) {
  const [mode, setMode] = useState('pnl')
  const pts = useMemo(() => calculateEquityCurve(trades, mode), [trades, mode])
  const fmt = (v) => (mode === 'r' ? fmtR(v) : fmtMoney(v, currency))
  const vals = pts.map((p) => p.value)
  const max0 = Math.max(0, ...vals)
  const min = Math.min(0, ...vals)
  const max = max0 === min ? min + 1 : max0
  const x = (i) => P.l + (pts.length > 1 ? (i / (pts.length - 1)) * (W - P.l - P.r) : 0)
  const y = (v) => P.t + ((max - v) / (max - min)) * (H - P.t - P.b)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`
  const last = pts[pts.length - 1].value

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">Equity Curve</h3>
        <div className="seg" role="group" aria-label="Chart metric">
          <button type="button" className={mode === 'pnl' ? 'on' : ''} aria-pressed={mode === 'pnl'} onClick={() => setMode('pnl')}>P/L</button>
          <button type="button" className={mode === 'r' ? 'on' : ''} aria-pressed={mode === 'r'} onClick={() => setMode('r')}>R-Multiple</button>
        </div>
      </div>
      {pts.length < 2 ? (
        <EmptyState icon={ChartIcon} title="Not enough data yet" compact>Completed trades with {mode === 'r' ? 'an R-multiple' : 'a P/L value'} will appear here.</EmptyState>
      ) : (
        <>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumulative ${mode === 'r' ? 'R' : 'P/L'} over ${pts.length - 1} trades, ending at ${fmt(last)}`}>
            {[max, 0, min].map((v, i) => (
              <g key={i}>
                <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className={v === 0 ? 'zero' : 'grid'} />
                <text x={P.l - 8} y={y(v) + 4} textAnchor="end" className="axis">{mode === 'r' ? v.toFixed(1) : Math.round(v)}</text>
              </g>
            ))}
            <path d={area} className="area" />
            <path d={line} className="curve" />
            {pts.length <= 150 && pts.slice(1).map((p, i) => (
              <circle key={i} cx={x(i + 1)} cy={y(p.value)} r="3" className="pt"><title>{`${p.label}: ${fmt(p.value)}`}</title></circle>
            ))}
            <text x={P.l} y={H - 6} className="axis">Start</text>
            <text x={W - P.r} y={H - 6} textAnchor="end" className="axis">Trade {pts.length - 1}</text>
          </svg>
          <p className="muted small">Cumulative result: <strong className={last >= 0 ? 'pos' : 'neg'}>{fmt(last)}</strong></p>
        </>
      )}
    </section>
  )
}
