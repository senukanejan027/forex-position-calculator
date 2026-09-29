import { useEffect, useState } from 'react'

export default function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger, requireText, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('')
  const blocked = requireText && typed !== requireText
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="button" className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} disabled={blocked} onClick={onConfirm}>{confirmLabel}</button>
      </>
    }>
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
