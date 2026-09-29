// Session definitions. Edit here.
//
// Each session is anchored to LOCAL wall-clock hours in its own IANA timezone,
// so daylight-saving changes (London, New York) are handled automatically.
// The Sri Lanka (Asia/Colombo) times shown in the UI are derived from these.
//
// Today's anchors reproduce the Sri Lanka times 05:30-09:30, 11:30-14:30 and
// 16:30-19:30 while London (BST) and New York (EDT) are on summer time. When a
// region is on winter time, its displayed Sri Lanka window moves by one hour.

export const DISPLAY_TZ = 'Asia/Colombo'

export const SESSIONS = [
  { id: 'asia', label: 'Asia', tz: 'Asia/Tokyo', start: '09:00', end: '13:00' },
  { id: 'london', label: 'London', tz: 'Europe/London', start: '07:00', end: '10:00' },
  { id: 'newyork', label: 'New York', tz: 'America/New_York', start: '07:00', end: '10:00' },
]
