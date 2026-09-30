import { Eye, NotebookPen, Pencil, Plus, SearchX, Trash2 } from 'lucide-react'
import { fmtMoney, fmtR, fmtNum } from '../../lib/journalCalculations'
import Modal from './Modal'
import EmptyState from '../EmptyState'

export const ResultBadge = ({ result }) => <span className={'badge badge-' + result.toLowerCase()}>{result}</span>
const tone = (n) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

export default function TradeTable({ trades, total, currency, onAdd, onView, onEdit, onDelete }) {
  const rows = [...trades].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
  if (!rows.length) {
    return total === 0 ? (
      <div className="card">
        <EmptyState icon={NotebookPen} title="No trades yet"
          action={<button type="button" className="btn btn-primary btn-sm" onClick={onAdd}><Plus size={16} aria-hidden="true" />Add your first trade</button>}>
          Log a trade to start tracking your results, win rate and equity curve.
        </EmptyState>
      </div>
    ) : (
      <div className="card"><EmptyState icon={SearchX} title="No matching trades">No trades match these filters. Adjust or clear them to see more.</EmptyState></div>
    )
  }
  return (
    <div className="card table-card">
      <div className="table-scroll">
      <table className="tbl">
        <thead><tr>{['Date', 'Pair', 'Direction', 'Session', 'Strategy', 'Entry', 'SL', 'TP', 'Result', 'P/L', 'R', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td data-label="Date">{t.date}{t.time && <span className="cell-sub">{t.time}</span>}</td>
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
                <span className="row-actions">
                  <button type="button" className="icon-btn" title="View trade" aria-label={`View ${t.pair} ${t.direction} trade`} onClick={() => onView(t)}><Eye size={16} aria-hidden="true" /><span className="btn-label">View</span></button>
                  <button type="button" className="icon-btn" title="Edit trade" aria-label={`Edit ${t.pair} ${t.direction} trade`} onClick={() => onEdit(t)}><Pencil size={16} aria-hidden="true" /><span className="btn-label">Edit</span></button>
                  <button type="button" className="icon-btn icon-btn-danger" title="Delete trade" aria-label={`Delete ${t.pair} ${t.direction} trade`} onClick={() => onDelete(t)}><Trash2 size={16} aria-hidden="true" /><span className="btn-label">Delete</span></button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
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
    <Modal title={`${t.pair} ${t.direction}`} wide onClose={onClose} footer={(close) => (
      <><button type="button" className="btn btn-secondary" onClick={close}>Close</button>
        <button type="button" className="btn btn-primary" onClick={() => onEdit(t)}>Edit</button></>)}>
      <dl className="detail">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>
    </Modal>
  )
}
