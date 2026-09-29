export default function ResultCard({ label, value, unit, primary }) {
  return (
    <div className={'result' + (primary ? ' primary' : '')}>
      <span className="result-label">{label}</span>
      <span className="result-value" aria-live="polite">
        {value}
        {unit && <span className="result-unit">{unit}</span>}
      </span>
    </div>
  )
}
