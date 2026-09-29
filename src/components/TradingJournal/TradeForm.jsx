import { useState } from 'react'
import { PAIRS, DIRECTIONS, JOURNAL_SESSIONS, RESULTS, TIMEFRAMES, NUMERIC_FIELDS } from '../../data/journalDefaults'
import { calcRiskAmount, calcRR, calcR, toNum, localYMD } from '../../lib/journalCalculations'
import { normalizeTrade } from '../../lib/journalStorage'

const KEYS = ['date', 'time', 'pair', 'direction', 'session', 'strategy', 'timeframe', 'entry', 'sl', 'tp', 'lots', 'riskPct',
  'riskAmount', 'rr', 'result', 'exit', 'pnl', 'r', 'duration', 'reason', 'wentWell', 'wentWrong', 'lessons', 'notes']
const DERIVED = ['riskAmount', 'rr', 'r']
const str = (n) => (n === null || n === undefined ? '' : String(n))

function autoValues(f, balance) {
  const riskAmount = str(calcRiskAmount(balance, f.riskPct))
  return {
    riskAmount,
    rr: str(calcRR(f.direction, f.entry, f.sl, f.tp)),
  }
}
// Fills derived fields the user has not typed into themselves.
function applyAuto(f, touched, balance) {
  const next = { ...f }
  const auto = autoValues(next, balance)
  if (!touched.riskAmount) next.riskAmount = auto.riskAmount
  if (!touched.rr) next.rr = auto.rr
  if (!touched.r) next.r = str(calcR(next.pnl, next.riskAmount))
  return next
}

export default function TradeForm({ initial, settings, onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    const now = new Date()
    if (initial) {
      const f = {}
      KEYS.forEach((k) => { f[k] = str(initial[k]) })
      return f
    }
    return {
      ...Object.fromEntries(KEYS.map((k) => [k, ''])),
      date: localYMD(now), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      direction: 'BUY', session: 'London', result: 'Open', riskPct: '1',
      riskAmount: str(calcRiskAmount(settings.accountBalance, 1)),
    }
  })
  const [touched, setTouched] = useState(() => {
    if (!initial) return {}
    const f = {}
    KEYS.forEach((k) => { f[k] = str(initial[k]) })
    const auto = { ...autoValues(f, settings.accountBalance) }
    auto.r = str(calcR(f.pnl, f.riskAmount))
    return Object.fromEntries(DERIVED.map((k) => [k, f[k] !== '' && f[k] !== auto[k]]))
  })
  const [error, setError] = useState('')

  const set = (k, v) => {
    const t = DERIVED.includes(k) ? { ...touched, [k]: v !== '' } : touched
    if (t !== touched) setTouched(t)
    setForm(applyAuto({ ...form, [k]: v }, t, settings.accountBalance))
  }

  const submit = (e) => {
    e.preventDefault()
    if (!form.date) return setError('Enter a date.')
    if (!form.pair.trim()) return setError('Enter a currency pair.')
    const raw = { ...form }
    NUMERIC_FIELDS.forEach((k) => { raw[k] = toNum(form[k]) })
    if (initial) raw.id = initial.id
    onSave(normalizeTrade({ ...(initial || {}), ...raw }))
  }

  const text = (k, label, props = {}) => (
    <div className="field"><label htmlFor={'tf-' + k}>{label}</label>
      <div className="control"><input id={'tf-' + k} value={form[k]} onChange={(e) => set(k, e.target.value)} {...props} /></div></div>
  )
  const num = (k, label) => text(k, label, { type: 'number', step: 'any', inputMode: 'decimal' })
  const select = (k, label, opts, blank) => (
    <div className="field"><label htmlFor={'tf-' + k}>{label}</label>
      <div className="control select"><select id={'tf-' + k} value={form[k]} onChange={(e) => set(k, e.target.value)}>
        {blank && <option value="">{blank}</option>}
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}</select></div></div>
  )
  const area = (k, label) => (
    <div className="field wide"><label htmlFor={'tf-' + k}>{label}</label>
      <div className="control"><textarea id={'tf-' + k} rows="3" value={form[k]} onChange={(e) => set(k, e.target.value)} /></div></div>
  )

  return (
    <form className="card tj-form" onSubmit={submit} noValidate>
      <h3>{initial ? 'Edit Trade' : 'Add Trade'}</h3>
      <fieldset><legend>Basic information</legend>
        <div className="fgrid">
          <div className="field"><label htmlFor="tf-id">Trade ID</label>
            <div className="control"><input id="tf-id" value={initial ? initial.id : 'Assigned on save'} readOnly /></div></div>
          {text('date', 'Date', { type: 'date' })}
          {text('time', 'Time', { type: 'time' })}
          <div className="field"><label htmlFor="tf-pair">Pair</label>
            <div className="control"><input id="tf-pair" list="tj-pairs" value={form.pair} autoCapitalize="characters"
              onChange={(e) => set('pair', e.target.value.toUpperCase())} /></div>
            <datalist id="tj-pairs">{PAIRS.map((p) => <option key={p} value={p} />)}</datalist></div>
          {select('direction', 'Direction', DIRECTIONS)}
          {select('session', 'Session', JOURNAL_SESSIONS)}
        </div></fieldset>
      <fieldset><legend>Trade setup</legend>
        <div className="fgrid">
          {text('strategy', 'Strategy')}
          {select('timeframe', 'Timeframe', TIMEFRAMES, 'Not set')}
          {num('entry', 'Entry Price')}{num('sl', 'Stop Loss')}{num('tp', 'Take Profit')}
          {num('lots', 'Lot Size')}{num('riskPct', 'Risk %')}{num('riskAmount', 'Risk Amount')}{num('rr', 'R:R Ratio')}
        </div>
        <p className="hint">Risk amount ({settings.currency} {settings.accountBalance} balance x risk %) and R:R are filled in automatically until you type your own value. Change the balance under Data &amp; Backup.</p>
      </fieldset>
      <fieldset><legend>Result</legend>
        <div className="fgrid">
          {select('result', 'Result', RESULTS)}{num('exit', 'Exit Price')}{num('pnl', 'P/L')}{num('r', 'R-Multiple')}
          {text('duration', 'Trade Duration', { placeholder: 'e.g. 2h 15m' })}
        </div></fieldset>
      <fieldset><legend>Journal notes</legend>
        <div className="fgrid">
          {area('reason', 'Setup / Reason for entry')}{area('wentWell', 'What went well')}{area('wentWrong', 'What went wrong')}
          {area('lessons', 'Lessons learned')}{area('notes', 'Additional notes')}
        </div></fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{initial ? 'Save Changes' : 'Save Trade'}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
