import { instruments } from '../data/instruments.js'

export function pipValuePerLot(symbol) {
  const s = instruments[symbol]
  if (!s) return NaN
  const usdPerQuote = s.quoteCurrency === 'USD' ? 1 : 1 / s.referencePrice
  return s.contractSize * s.pipSize * usdPerQuote
}

function parse(value) {
  if (value === '' || value === null || value === undefined) return { empty: true }
  const n = Number(value)
  return Number.isFinite(n) ? { n } : { bad: true }
}

function check(name, value) {
  const p = parse(value)
  if (p.empty) return `Enter ${name}.`
  if (p.bad) return `${name[0].toUpperCase() + name.slice(1)} must be a number.`
  if (p.n <= 0) return `${name[0].toUpperCase() + name.slice(1)} must be greater than 0.`
  return null
}

export function validate({ balance, risk, stopLoss }) {
  return {
    balance: check('account balance', balance),
    risk: check('risk percentage', risk),
    stopLoss: check('stop loss', stopLoss),
  }
}

export function calculate({ balance, risk, stopLoss, pair }) {
  const errors = validate({ balance, risk, stopLoss })
  if (errors.balance || errors.risk || errors.stopLoss) return { valid: false, errors }
  const riskAmount = Number(balance) * (Number(risk) / 100)
  const positionSize = riskAmount / (Number(stopLoss) * pipValuePerLot(pair))
  if (!Number.isFinite(riskAmount) || !Number.isFinite(positionSize)) {
    return { valid: false, errors: { ...errors, stopLoss: 'Values are out of range.' } }
  }
  return { valid: true, errors, riskAmount, positionSize }
}

export function formatMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatLots(n) {
  const r = Math.round(n * 100) / 100
  // Keep one decimal minimum ("0.50", "2.00") but drop pointless digits beyond 2.
  return r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
