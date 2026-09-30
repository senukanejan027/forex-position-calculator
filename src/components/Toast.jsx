import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info }
const NOOP = { success() {}, error() {}, warning() {}, info() {} }
const ToastContext = createContext(NOOP)
const LEAVE_MS = 200

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), LEAVE_MS)
  }, [])

  const push = useCallback((type, text, ms) => {
    const id = ++nextId.current
    setItems((list) => [...list.slice(-2), { id, type, text }])
    setTimeout(() => dismiss(id), ms)
  }, [dismiss])

  const api = useMemo(() => ({
    success: (t) => push('success', t, 3600),
    info: (t) => push('info', t, 3600),
    warning: (t) => push('warning', t, 5500),
    error: (t) => push('error', t, 7000),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" aria-label="Notifications">
        {items.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <div key={t.id} className={`toast toast-${t.type}${t.leaving ? ' is-leaving' : ''}`} role={t.type === 'error' ? 'alert' : 'status'}>
              <Icon size={18} aria-hidden="true" className="toast-icon" />
              <span className="toast-text">{t.text}</span>
              <button type="button" className="icon-btn" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}><X size={14} aria-hidden="true" /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
