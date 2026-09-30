import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'

const EXIT_MS = 160
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

// `footer` may be a node or a function receiving `close`, so footer buttons get the same exit animation.
export default function Modal({ title, onClose, children, footer, wide, dismissible = true }) {
  const titleId = useId()
  const [closing, setClosing] = useState(false)
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const timer = useRef(null)
  const dismissRef = useRef(dismissible)
  onCloseRef.current = onClose
  dismissRef.current = dismissible

  const close = useCallback(() => {
    if (timer.current || !dismissRef.current) return
    setClosing(true)
    timer.current = setTimeout(() => onCloseRef.current(), EXIT_MS)
  }, [])

  useEffect(() => {
    const opener = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (dialogRef.current) dialogRef.current.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return }
      if (e.key !== 'Tab' || !dialogRef.current) return
      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (!items.length) { e.preventDefault(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === dialogRef.current)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
      timer.current = null
      document.body.style.overflow = prevOverflow
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus()
    }
  }, [close])

  return (
    <div className={'modal-overlay' + (closing ? ' is-closing' : '')} onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div ref={dialogRef} tabIndex={-1} className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          {dismissible && <button type="button" className="icon-btn" aria-label="Close dialog" onClick={close}><X size={18} aria-hidden="true" /></button>}
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{typeof footer === 'function' ? footer(close) : footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, requireText, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('')
  const blocked = requireText && typed !== requireText
  return (
    <Modal title={title} onClose={onCancel} footer={(close) => (
      <>
        <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
        <button type="button" className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} disabled={blocked} onClick={onConfirm}>{confirmLabel}</button>
      </>
    )}>
      <p className="modal-text">{message}</p>
      {requireText && (
        <div className="field">
          <label htmlFor="confirm-text">Type {requireText} to confirm</label>
          <div className="control"><input id="confirm-text" type="text" value={typed} autoComplete="off" onChange={(e) => setTyped(e.target.value)} /></div>
        </div>
      )}
    </Modal>
  )
}
