export default function EmptyState({ icon: Icon, title, children, action, compact }) {
  return (
    <div className={'empty-state' + (compact ? ' compact' : '')}>
      {Icon && <span className="empty-icon" aria-hidden="true"><Icon size={compact ? 20 : 24} /></span>}
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  )
}
