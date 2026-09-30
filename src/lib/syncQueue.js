// Pure helpers for the offline write queue. Ops: {type:'upsert'|'import', id, trade} | {type:'delete', id} | {type:'clear'}.
// At most one op per trade id is kept, so replaying the queue is always safe and idempotent.
export const CHUNK = 100

export function enqueue(queue, op) {
  if (op.type === 'clear') return [op]
  return [...queue.filter((o) => o.type === 'clear' || o.id !== op.id), op]
}

export function applyQueue(trades, queue) {
  let out = trades
  for (const op of queue) {
    if (op.type === 'clear') out = []
    else if (op.type === 'delete') out = out.filter((t) => t.id !== op.id)
    else if (out.some((t) => t.id === op.id)) out = out.map((t) => (t.id === op.id ? op.trade : t))
    else out = [op.trade, ...out]
  }
  return out
}

// First run of same-typed ops (ignoring blocked ones), so they can be sent as one request.
export function nextRun(queue, blocked = new Set()) {
  const live = queue.filter((o) => !blocked.has(o))
  if (!live.length) return null
  const type = live[0].type
  const ops = []
  for (const o of live) { if (o.type !== type || ops.length >= CHUNK || type === 'clear') break; ops.push(o) }
  return { type, ops }
}
