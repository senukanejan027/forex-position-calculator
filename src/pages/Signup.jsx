import { useState } from 'react'
import { CircleCheck, Lock, Mail, UserPlus, UserRound } from 'lucide-react'
import AuthLayout, { CloudNotConfigured, FormError, Spinner } from '../components/AuthLayout'
import AuthField, { EMAIL_RE, passwordProblems } from '../components/AuthField'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const { signUp, configured } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  if (!configured) return <CloudNotConfigured />
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const problems = passwordProblems(form.password)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    const next = {}
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.password) next.password = 'Create a password.'
    else if (problems.length) next.password = 'Password needs: ' + problems.join(', ').toLowerCase() + '.'
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    setFormError('')
    if (Object.keys(next).length) return
    setBusy(true)
    const r = await signUp(form)
    setBusy(false)
    if (!r.ok) { setFormError(r.message); return }
    if (r.status === 'signed-in') window.location.hash = '#/journal'
    else setDone(true)
  }

  if (done) {
    return (
      <AuthLayout title="Check your email" footer={<a href="#/login">Back to sign in</a>}>
        <div className="auth-success" role="status">
          <CircleCheck size={22} aria-hidden="true" />
          <p>We sent a confirmation link to <strong>{form.email.trim()}</strong>. Open it to verify your address, then sign in.</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Save your trading journal to the cloud and open it on any device."
      footer={<>Already have an account? <a href="#/login">Sign in</a></>}>
      <form className="auth-form" onSubmit={submit} noValidate>
        <FormError>{formError}</FormError>
        <AuthField id="su-name" label="Name" icon={UserRound} value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" autoFocus />
        <AuthField id="su-email" label="Email" type="email" icon={Mail} value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="you@example.com" />
        <AuthField id="su-password" label="Password" type="password" icon={Lock} value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password"
          hint="Use at least 8 characters with a letter and a number." />
        <AuthField id="su-confirm" label="Confirm password" type="password" icon={Lock} value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>{busy ? <Spinner /> : <UserPlus size={17} aria-hidden="true" />}{busy ? 'Creating account' : 'Create account'}</button>
      </form>
    </AuthLayout>
  )
}
