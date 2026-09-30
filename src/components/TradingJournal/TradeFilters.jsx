import { FilterX, Search } from 'lucide-react'
import { DIRECTIONS, JOURNAL_SESSIONS, RESULTS } from '../../data/journalDefaults'

export const EMPTY_FILTERS = { search: '', from: '', to: '', pair: '', direction: '', session: '', strategy: '', result: '' }

export default function TradeFilters({ filters, onChange, trades, shown }) {
  const pairs = [...new Set(trades.map((t) => t.pair))].sort()
  const strategies = [...new Set(trades.map((t) => (t.strategy || '').trim()).filter(Boolean))].sort()
  const set = (k, v) => onChange({ ...filters, [k]: v })
  const active = Object.values(filters).some(Boolean)
  const sel = (k, label, opts) => (
    <div className="field"><label htmlFor={'flt-' + k}>{label}</label>
      <div className="control select compact"><select id={'flt-' + k} value={filters[k]} onChange={(e) => set(k, e.target.value)}>
        <option value="">All</option>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select></div></div>
  )
  return (
    <div className="card tj-filters">
      <div className="fgrid filters">
        <div className="field search"><label htmlFor="flt-search">Search</label>
          <div className="control compact has-icon"><Search className="control-icon" size={16} aria-hidden="true" /><input id="flt-search" type="search" placeholder="Pair, strategy or notes" value={filters.search} onChange={(e) => set('search', e.target.value)} /></div></div>
        <div className="field"><label htmlFor="flt-from">From</label><div className="control compact"><input id="flt-from" type="date" value={filters.from} onChange={(e) => set('from', e.target.value)} /></div></div>
        <div className="field"><label htmlFor="flt-to">To</label><div className="control compact"><input id="flt-to" type="date" value={filters.to} onChange={(e) => set('to', e.target.value)} /></div></div>
        {sel('pair', 'Pair', pairs)}{sel('direction', 'Direction', DIRECTIONS)}{sel('session', 'Session', JOURNAL_SESSIONS)}
        {sel('strategy', 'Strategy', strategies)}{sel('result', 'Result', RESULTS)}
      </div>
      <div className="filter-foot">
        <span className="muted">Showing {shown} of {trades.length} trades</span>
        <button type="button" className="btn btn-secondary btn-sm" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}><FilterX size={15} aria-hidden="true" />Clear Filters</button>
      </div>
    </div>
  )
}
