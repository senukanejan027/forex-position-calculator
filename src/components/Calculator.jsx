import { useMemo, useState } from 'react'
import { ArrowLeftRight, Percent, RotateCcw, Ruler, Wallet } from 'lucide-react'
import InputField from './InputField'
import { instrumentKeys, DEFAULTS } from '../data/instruments'
import { calculate, formatMoney, formatLots, pipValuePerLot } from '../lib/calc'
import useCountUp from '../lib/useCountUp'

export default function Calculator({ aside }) {
  const [balance, setBalance] = useState(DEFAULTS.balance)
  const [risk, setRisk] = useState(DEFAULTS.risk)
  const [stopLoss, setStopLoss] = useState(DEFAULTS.stopLoss)
  const [pair, setPair] = useState(DEFAULTS.pair)

  const result = useMemo(() => calculate({ balance, risk, stopLoss, pair }), [balance, risk, stopLoss, pair])

  // Display-only easing of the numbers; the real values above are what is announced and calculated.
  const sizeShown = useCountUp(result.valid ? result.positionSize : null)
  const riskShown = useCountUp(result.valid ? result.riskAmount : null)
  const pipValue = useMemo(() => pipValuePerLot(pair), [pair])

  const reset = () => {
    setBalance(DEFAULTS.balance)
    setRisk(DEFAULTS.risk)
    setStopLoss(DEFAULTS.stopLoss)
    setPair(DEFAULTS.pair)
  }

  return (
    <div className="calc-grid">
      <section className="card calc-inputs" aria-labelledby="calc-inputs-title">
        <div className="card-head">
          <h2 id="calc-inputs-title" className="card-title">Trade parameters</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={15} aria-hidden="true" />Reset</button>
        </div>
        <div className="inputs">
          <InputField id="balance" label="Account Balance" value={balance} onChange={setBalance}
            error={result.errors.balance} suffix="USD" placeholder="10000" icon={Wallet} />
          <div className="row">
            <InputField id="risk" label="Risk %" value={risk} onChange={setRisk}
              error={result.errors.risk} suffix="%" placeholder="1" icon={Percent} />
            <InputField id="sl" label="Stop Loss (Pips)" value={stopLoss} onChange={setStopLoss}
              error={result.errors.stopLoss} suffix="pips" placeholder="20" icon={Ruler} />
          </div>
          <div className="field">
            <label htmlFor="pair">Currency Pair</label>
            <div className="control select has-icon">
              <ArrowLeftRight className="control-icon" size={17} aria-hidden="true" />
              <select id="pair" value={pair} onChange={(e) => setPair(e.target.value)}>
                {instrumentKeys.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      <div className="calc-side">
        <section className={'card result-card' + (result.valid ? '' : ' is-empty')} aria-label="Calculation result">
          <span className="result-label">Position Size</span>
          <div className="result-figure" aria-hidden="true">
            <span className="result-number">{result.valid ? formatLots(sizeShown) : '--'}</span>
            <span className="result-unit">{result.valid ? 'Lots' : ''}</span>
          </div>
          <span className="sr-only" role="status">
            {result.valid
              ? `Position size ${formatLots(result.positionSize)} lots. Risk amount ${formatMoney(result.riskAmount)}.`
              : 'Enter valid values to see your position size.'}
          </span>
          <dl className="result-grid">
            <div><dt>Risk Amount</dt><dd>{result.valid ? formatMoney(riskShown) : '--'}</dd></div>
            <div><dt>Stop Distance</dt><dd>{result.valid ? `${Number(stopLoss).toLocaleString('en-US', { maximumFractionDigits: 2 })} pips` : '--'}</dd></div>
            <div><dt>Pip Value / Lot</dt><dd>{Number.isFinite(pipValue) ? formatMoney(pipValue) : '--'}</dd></div>
          </dl>
          <p className="note">
            {result.valid ? `Risking ${formatMoney(result.riskAmount)} on this trade` : 'Enter valid values to see your position size.'}
          </p>
        </section>
        {aside}
      </div>
    </div>
  )
}
