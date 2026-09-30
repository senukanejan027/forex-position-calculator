import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AccountMenu() {
  const { user, displayName, signOut, loading, configured } = useAuth()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  if (!configured) return null
  if (loading) return <span className="sk account-sk" aria-hidden="true" />
  if (!user) {
    return (
      <div className="auth-links">
        <a className="btn btn-ghost btn-sm" href="#/login">Sign in</a>
        <a className="btn btn-primary btn-sm auth-create" href="#/signup">Create account</a>
      </div>
    )
  }
  return (
    <div className="account" ref={box}>
      <button type="button" className="account-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${user.email}`} onClick={() => setOpen((o) => !o)}>
        <UserRound size={17} aria-hidden="true" />
        <span className="account-email">{user.email}</span>
        <ChevronDown size={15} aria-hidden="true" className="account-chev" />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head"><span className="menu-name">{displayName || 'Signed in'}</span><span className="menu-email">{user.email}</span></div>
          <button type="button" role="menuitem" className="menu-item" onClick={() => { setOpen(false); signOut() }}><LogOut size={16} aria-hidden="true" />Sign out</button>
        </div>
      )}
    </div>
  )
}
