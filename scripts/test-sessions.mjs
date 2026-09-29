import { getSessionStatuses } from '../src/lib/sessions.js'
let fail = 0
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `got ${JSON.stringify(g)} want ${JSON.stringify(w)}`) }
const at = (iso) => getSessionStatuses(Date.parse(iso))
const act = (iso) => at(iso).filter((s) => s.active).map((s) => s.id)
const win = (iso, id) => { const s = at(iso).find((x) => x.id === id); return `${s.start}-${s.end}` }

// Summer: matches the requested Sri Lanka times
eq('summer asia window', win('2026-07-01T12:00:00Z', 'asia'), '05:30-09:30')
eq('summer london window', win('2026-07-01T12:00:00Z', 'london'), '11:30-14:30')
eq('summer newyork window', win('2026-07-01T12:00:00Z', 'newyork'), '16:30-19:30')
// Winter: London/NY shift one hour in Sri Lanka time
eq('winter london window', win('2026-01-15T12:00:00Z', 'london'), '12:30-15:30')
eq('winter newyork window', win('2026-01-15T12:00:00Z', 'newyork'), '17:30-20:30')
eq('winter asia window', win('2026-01-15T12:00:00Z', 'asia'), '05:30-09:30')
// Active checks (Sri Lanka = UTC+5:30)
eq('summer 11:30 LK london opens', act('2026-07-01T06:00:00Z'), ['london'])
eq('summer 11:29 LK closed', act('2026-07-01T05:59:00Z'), [])
eq('summer 14:30 LK london closes', act('2026-07-01T09:00:00Z'), [])
eq('summer 16:30 LK newyork', act('2026-07-01T11:00:00Z'), ['newyork'])
eq('summer 06:00 LK asia', act('2026-07-01T00:30:00Z'), ['asia'])
eq('winter 12:30 LK london', act('2026-01-15T07:00:00Z'), ['london'])
eq('winter 11:30 LK london closed', act('2026-01-15T06:00:00Z'), [])
// UK spring-forward 2026-03-29 (01:00 UTC): 07:00 BST = 06:00Z
eq('uk dst day 05:59Z closed', act('2026-03-29T05:59:00Z'), [])
eq('uk dst day 06:00Z open', act('2026-03-29T06:00:00Z'), ['london'])
// Mismatch window: US on EDT, UK still GMT (2026-03-15): NY 11:00-14:00Z, London 07:00-10:00Z
eq('mismatch london', act('2026-03-15T07:30:00Z'), ['london'])
eq('mismatch newyork', act('2026-03-15T11:30:00Z'), ['newyork'])
// Overlap and midnight-crossing with custom sessions
const custom = [
  { id: 'a', label: 'A', tz: 'UTC', start: '08:00', end: '12:00' },
  { id: 'b', label: 'B', tz: 'UTC', start: '10:00', end: '14:00' },
  { id: 'c', label: 'C', tz: 'UTC', start: '22:00', end: '02:00' },
]
const ids = (iso) => getSessionStatuses(Date.parse(iso), custom).filter((s) => s.active).map((s) => s.id)
eq('overlap both active', ids('2026-07-01T11:00:00Z'), ['a', 'b'])
eq('midnight-crossing late', ids('2026-07-01T23:00:00Z'), ['c'])
eq('midnight-crossing early', ids('2026-07-02T01:00:00Z'), ['c'])
process.exit(fail ? 1 : 0)
