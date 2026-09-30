import { useState } from 'react'
import { Lock, LogIn, Mail } from 'lucide-react'
import AuthLayout, { CloudNotConfigured, FormError, Spinner } from '../components/AuthLayout'
import AuthField, { EMAIL_RE } from '../components/AuthField'
import { useAuth } from '../context/AuthContext'

export default function Login({ reason }) {
  const { signIn, configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  if (!configured) return <CloudNotConfigured />

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    const next = {}
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setBusy(true)
    const r = await signIn({ email, password })
    setBusy(false)
    if (!r.ok) { setFormError(r.message); return }
    window.location.hash = '#/journal'
  }

  return (
    <AuthLayout title="Sign in" subtitle={reason || 'Welcome back to SNFX.'}
      footer={<>New to SNFX? <a href="#/signup">Create an account</a></>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormError>{formError}</FormError>
        <AuthField id="login-email" label="Email" type="email" icon={Mail} value={email} onChange={setEmail} error={errors.email} autoComplete="email" placeholder="you@example.com" autoFocus />
        <AuthField id="login-password" label="Password" type="password" icon={Lock} value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
        <div className="auth-row"><a href="#/reset">Forgot password?</a></div>
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? <Spinner /> : <LogIn size={17} aria-hidden="true" />}{busy ? 'Signing in' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  )
}
