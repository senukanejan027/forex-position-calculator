import { useState } from 'react'
import { CircleCheck, KeyRound, Lock, Mail } from 'lucide-react'
import AuthLayout, { CloudNotConfigured, FormError, Spinner } from '../components/AuthLayout'
import AuthField, { EMAIL_RE, passwordProblems } from '../components/AuthField'
import { useAuth } from '../context/AuthContext'

// Two steps in one page: ask for the reset email, then (after the emailed link) choose a new password.
export default function ResetPassword() {
  const { resetPassword, updatePassword, recovery, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  if (!configured) return <CloudNotConfigured />

  const request = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    if (!EMAIL_RE.test(email.trim())) { setFieldErr({ email: 'Enter a valid email address.' }); return }
    setFieldErr({})
    setBusy(true)
    const r = await resetPassword(email)
    setBusy(false)
    if (r.ok) setSent(true); else setError(r.message)
  }

  const update = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    const next = {}
    const problems = passwordProblems(password)
    if (problems.length) next.password = 'Password needs: ' + problems.join(', ').toLowerCase() + '.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setFieldErr(next)
    if (Object.keys(next).length) return
    setBusy(true)
    const r = await updatePassword(password)
    setBusy(false)
    if (r.ok) window.location.hash = '#/journal'; else setError(r.message)
  }

  if (recovery) {
    return (
      <AuthLayout title="Choose a new password">
        <form className="auth-form" onSubmit={update} noValidate>
          <FormError>{error}</FormError>
          <AuthField id="rp-password" label="New password" type="password" icon={Lock} value={password} onChange={setPassword} error={fieldErr.password} autoComplete="new-password" autoFocus
            hint="Use at least 8 characters with a letter and a number." />
          <AuthField id="rp-confirm" label="Confirm new password" type="password" icon={Lock} value={confirm} onChange={setConfirm} error={fieldErr.confirm} autoComplete="new-password" />
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? <Spinner /> : <KeyRound size={17} aria-hidden="true" />}{busy ? 'Saving' : 'Update password'}</button>
        </form>
      </AuthLayout>
    )
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" footer={<a href="#/login">Back to sign in</a>}>
        <div className="auth-success" role="status">
          <CircleCheck size={22} aria-hidden="true" />
          <p>If an account exists for <strong>{email.trim()}</strong>, a password reset link is on its way.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter your email and we will send you a reset link." footer={<a href="#/login">Back to sign in</a>}>
      <form className="auth-form" onSubmit={request} noValidate>
        <FormError>{error}</FormError>
        <AuthField id="rp-email" label="Email" type="email" icon={Mail} value={email} onChange={setEmail} error={fieldErr.email} autoComplete="email" placeholder="you@example.com" autoFocus />
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? <Spinner /> : <Mail size={17} aria-hidden="true" />}{busy ? 'Sending' : 'Send reset link'}</button>
      </form>
    </AuthLayout>
  )
}
