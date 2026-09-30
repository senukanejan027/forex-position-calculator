import { CircleAlert } from 'lucide-react'

export default function InputField({ id, label, value, onChange, error, suffix, placeholder, icon: Icon, step = 'any' }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={'control' + (error ? ' has-error' : '') + (Icon ? ' has-icon' : '')}>
        {Icon && <Icon className="control-icon" size={17} aria-hidden="true" />}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? id + '-err' : undefined}
          onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') e.preventDefault() }}
          onChange={(e) => onChange(e.target.value.replace('-', ''))}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
      {error && <p className="error" id={id + '-err'} role="alert"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
    </div>
  )
}
