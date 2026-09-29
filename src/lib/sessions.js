import { DISPLAY_TZ, SESSIONS } from '../data/sessions.js'

const partsCache = new Map()

function formatter(tz, opts) {
  const key = tz + JSON.stringify(opts)
  if (!partsCache.has(key)) partsCache.set(key, new Intl.DateTimeFormat('en-US', { timeZone: tz, ...opts }))
  return partsCache.get(key)
}

// Offset (ms) of `tz` from UTC at the instant `ts`.
function tzOffset(ts, tz) {
  const p = formatter(tz, {
    hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(ts))
  const v = Object.fromEntries(p.map((x) => [x.type, Number(x.value)]))
  const asUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second)
  return asUtc - Math.floor(ts / 1000) * 1000
}

// UTC instant for a wall-clock time in `tz` (DST-safe).
export function zonedToUtc(y, m, d, hh, mm, tz) {
  const guess = Date.UTC(y, m - 1, d, hh, mm)
  let ts = guess - tzOffset(guess, tz)
  const off2 = tzOffset(ts, tz)
  if (off2 !== tzOffset(guess, tz)) ts = guess - off2
  return ts
}

function localDate(ts, tz) {
  const p = formatter(tz, { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(ts))
  const v = Object.fromEntries(p.map((x) => [x.type, Number(x.value)]))
  return { y: v.year, m: v.month, d: v.day }
}

function windowFor(session, y, m, d) {
  const [sh, sm] = session.start.split(':').map(Number)
  const [eh, em] = session.end.split(':').map(Number)
  const start = zonedToUtc(y, m, d, sh, sm, session.tz)
  let end = zonedToUtc(y, m, d, eh, em, session.tz)
  if (end <= start) end = zonedToUtc(y, m, d + 1, eh, em, session.tz) // crosses midnight
  return { start, end }
}

export function formatTime24(ts, tz = DISPLAY_TZ) {
  return formatter(tz, { hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(new Date(ts))
}

export function formatClock12(ts, tz = DISPLAY_TZ) {
  return formatter(tz, { hour12: true, hour: 'numeric', minute: '2-digit' }).format(new Date(ts))
}

// Status of every session at instant `now` (ms). Start inclusive, end exclusive.
export function getSessionStatuses(now, sessions = SESSIONS) {
  return sessions.map((s) => {
    const { y, m, d } = localDate(now, s.tz)
    const candidates = [-1, 0].map((delta) => windowFor(s, y, m, d + delta)) // yesterday covers midnight-crossing
    const today = windowFor(s, y, m, d)
    const running = candidates.find((w) => now >= w.start && now < w.end)
    const shown = running || today
    return {
      id: s.id,
      label: s.label,
      active: Boolean(running),
      start: formatTime24(shown.start),
      end: formatTime24(shown.end),
    }
  })
}
