import { CircleAlert, LoaderCircle } from 'lucide-react'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-wrap">
      <section className="card auth-card" aria-labelledby="auth-title">
        <header className="auth-head">
          <h1 id="auth-title">{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {children}
        {footer && <p className="auth-foot">{footer}</p>}
      </section>
    </div>
  )
}

export const FormError = ({ children }) => (children ? <div className="alert alert-error" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{children}</span></div> : null)
export const Spinner = ({ size = 16 }) => <LoaderCircle className="spin" size={size} aria-hidden="true" />

export function CloudNotConfigured() {
  return (
    <AuthLayout title="SNFX Cloud is not set up" subtitle="Accounts need the site owner to add the Supabase settings.">
      <p className="muted">This build has no <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. See the README for setup. The calculator, sessions and economic calendar still work.</p>
    </AuthLayout>
  )
}
