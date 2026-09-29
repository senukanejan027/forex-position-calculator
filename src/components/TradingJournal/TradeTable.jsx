import { fmtMoney, fmtR, fmtNum } from '../../lib/journalCalculations'
import Modal from './Modal'

export const ResultBadge = ({ result }) => <span className={'badge badge-' + result.toLowerCase()}>{result}</span>
const tone = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

export default function TradeTable({ trades, currency, onView, onEdit, onDelete }) {
  const rows = [...trades].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  if (!rows.length) return <div className="card empty">No trades to show. Add a trade or adjust your filters.</div>
  return (
    <div className="card table-card">
      <table className="tbl">
        <thead><tr>{['Date', 'Pair', 'Direction', 'Session', 'Strategy', 'Entry', 'SL', 'TP', 'Result', 'P/L', 'R', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td data-label="Date">{t.date}</td>
              <td data-label="Pair"><strong>{t.pair}</strong></td>
              <td data-label="Direction"><span className={'dir dir-' + t.direction.toLowerCase()}>{t.direction}</span></td>
              <td data-label="Session">{t.session}</td>
              <td data-label="Strategy">{t.strategy || '--'}</td>
              <td data-label="Entry">{fmtNum(t.entry, 5).replace(/0+$/, '').replace(/\.$/, '')}</td>
              <td data-label="SL">{fmtNum(t.sl, 5).replace(/0+$/, '').replace(/\.$/, '')}</td>
              <td data-label="TP">{fmtNum(t.tp, 5).replace(/0+$/, '').replace(/\.$/, '')}</td>
              <td data-label="Result"><ResultBadge result={t.result} /></td>
              <td data-label="P/L" className={tone(t.pnl)}>{fmtMoney(t.pnl, currency, true)}</td>
              <td data-label="R" className={tone(t.r)}>{fmtR(t.r)}</td>
              <td data-label="Actions" className="actions">
                <button type="button" className="link" onClick={() => onView(t)}>View</button>
                <button type="button" className="link" onClick={() => onEdit(t)}>Edit</button>
                <button type="button" className="link danger" onClick={() => onDelete(t)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TradeDetail({ trade: t, currency, onClose, onEdit }) {
  const rows = [
    ['Trade ID', t.id], ['Date', `${t.date} ${t.time || ''}`], ['Pair', t.pair], ['Direction', t.direction], ['Session', t.session],
    ['Strategy', t.strategy], ['Timeframe', t.timeframe], ['Entry', t.entry], ['Stop Loss', t.sl], ['Take Profit', t.tp],
    ['Lot Size', t.lots], ['Risk %', t.riskPct], ['Risk Amount', t.riskAmount === null ? null : fmtMoney(t.riskAmount, currency)],
    ['R:R', t.rr], ['Result', t.result], ['Exit Price', t.exit], ['P/L', t.pnl === null ? null : fmtMoney(t.pnl, currency, true)],
    ['R-Multiple', t.r === null ? null : fmtR(t.r)], ['Duration', t.duration],
    ['Setup / Reason', t.reason], ['What went well', t.wentWell], ['What went wrong', t.wentWrong], ['Lessons learned', t.lessons], ['Notes', t.notes],
  ].filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
  return (
    <Modal title={`${t.pair} ${t.direction}`} wide onClose={onClose} footer={
      <><button type="button" className="btn" onClick={onClose}>Close</button>
        <button type="button" className="btn btn-primary" onClick={() => onEdit(t)}>Edit</button></>}>
      <dl className="detail">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>
    </Modal>
  )
}
