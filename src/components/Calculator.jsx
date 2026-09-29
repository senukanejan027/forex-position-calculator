import { useMemo, useState } from 'react'
import InputField from './InputField'
import ResultCard from './ResultCard'
import { instrumentKeys, DEFAULTS } from '../data/instruments'
import { calculate, formatMoney, formatLots } from '../lib/calc'

export default function Calculator() {
  const [balance, setBalance] = useState(DEFAULTS.balance)
  const [risk, setRisk] = useState(DEFAULTS.risk)
  const [stopLoss, setStopLoss] = useState(DEFAULTS.stopLoss)
  const [pair, setPair] = useState(DEFAULTS.pair)

  const result = useMemo(() => calculate({ balance, risk, stopLoss, pair }), [balance, risk, stopLoss, pair])

  const reset = () => {
    setBalance(DEFAULTS.balance)
    setRisk(DEFAULTS.risk)
    setStopLoss(DEFAULTS.stopLoss)
    setPair(DEFAULTS.pair)
  }

  return (
    <section className="card" aria-label="Position size calculator">
      <div className="inputs">
        <InputField id="balance" label="Account Balance" value={balance} onChange={setBalance}
          error={result.errors.balance} suffix="USD" placeholder="10000" />
        <div className="row">
          <InputField id="risk" label="Risk %" value={risk} onChange={setRisk}
            error={result.errors.risk} suffix="%" placeholder="1" />
          <InputField id="sl" label="Stop Loss (Pips)" value={stopLoss} onChange={setStopLoss}
            error={result.errors.stopLoss} suffix="pips" placeholder="20" />
        </div>
        <div className="field">
          <label htmlFor="pair">Currency Pair</label>
          <div className="control select">
            <select id="pair" value={pair} onChange={(e) => setPair(e.target.value)}>
              {instrumentKeys.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="results">
        <ResultCard label="Risk Amount" value={result.valid ? formatMoney(result.riskAmount) : '--'} />
        <ResultCard primary label="Position Size"
          value={result.valid ? formatLots(result.positionSize) : '--'}
          unit={result.valid ? 'Lots' : ''} />
        <p className="note">
          {result.valid ? `Risking ${formatMoney(result.riskAmount)} on this trade` : 'Enter valid values to see your position size.'}
        </p>
      </div>

      <button type="button" className="reset" onClick={reset}>Reset</button>
    </section>
  )
}
