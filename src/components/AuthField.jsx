import { useState } from 'react'
import { CircleAlert, Eye, EyeOff } from 'lucide-react'

// Text/email/password field in the same style as the calculator inputs.
export default function AuthField({ id, label, type = 'text', value, onChange, error, icon: Icon, autoComplete, placeholder, hint, autoFocus }) {
  const [shown, setShown] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={'control' + (error ? ' has-error' : '') + (Icon ? ' has-icon' : '')}>
        {Icon && <Icon className="control-icon" size={17} aria-hidden="true" />}
        <input id={id} type={isPassword && shown ? 'text' : type} value={value} autoComplete={autoComplete} placeholder={placeholder} autoFocus={autoFocus}
          aria-invalid={error ? 'true' : 'false'} aria-describedby={error ? id + '-err' : hint ? id + '-hint' : undefined}
          onChange={(e) => onChange(e.target.value)} />
        {isPassword && (
          <button type="button" className="icon-btn control-toggle" aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} onClick={() => setShown((s) => !s)}>
            {shown ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p className="error" id={id + '-err'} role="alert"><CircleAlert size={14} aria-hidden="true" />{error}</p>}
      {!error && hint && <p className="hint" id={id + '-hint'}>{hint}</p>}
    </div>
  )
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export function passwordProblems(pw) {
  const p = []
  if (pw.length < 8) p.push('At least 8 characters')
  if (!/[A-Za-z]/.test(pw)) p.push('At least one letter')
  if (!/\d/.test(pw)) p.push('At least one number')
  return p
}
