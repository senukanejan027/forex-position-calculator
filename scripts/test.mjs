import { calculate, pipValuePerLot, formatMoney, formatLots } from '../src/lib/calc.js'
const base = { balance: '10000', risk: '1', stopLoss: '20' }
let fail = 0
const eq = (name, got, want) => { const ok = got === want; if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', name, got, ok ? '' : `(want ${want})`) }
for (const [pair, want] of [['EURUSD', '0.50'], ['GBPUSD', '0.50'], ['USDJPY', '0.75'], ['XAUUSD', '0.50']]) {
  const r = calculate({ ...base, pair })
  eq(pair + ' risk', formatMoney(r.riskAmount), '$100.00')
  eq(pair + ' pip/lot', pipValuePerLot(pair).toFixed(2), pair === 'USDJPY' ? '6.67' : '10.00')
  eq(pair + ' size', formatLots(r.positionSize), want)
}
for (const bad of [{ balance: '' }, { risk: '0' }, { stopLoss: '-5' }, { balance: 'abc' }, { stopLoss: '0' }]) {
  eq('invalid ' + JSON.stringify(bad), calculate({ ...base, pair: 'EURUSD', ...bad }).valid, false)
}
eq('decimal risk', formatMoney(calculate({ ...base, risk: '0.25', pair: 'EURUSD' }).riskAmount), '$25.00')
process.exit(fail ? 1 : 0)
