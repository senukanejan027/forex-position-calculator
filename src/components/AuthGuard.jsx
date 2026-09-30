import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'

// Wraps areas that need an account. Public pages (calculator, calendar) are not wrapped.
export default function AuthGuard({ children, reason }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="auth-loading" role="status" aria-label="Checking your session">
        <span className="sk sk-title" /><span className="sk sk-row" /><span className="sk sk-row" />
      </div>
    )
  }
  if (!user) return <Login reason={reason} />
  return children
}
