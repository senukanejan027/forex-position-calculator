import { routeFromHash } from '../src/lib/useHashRoute.js'
let fail = 0
const eq = (n, g, w) => { const ok = g === w; if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `got ${g} want ${w}`) }
eq('empty hash', routeFromHash(''), 'calculator')
eq('root hash', routeFromHash('#/'), 'calculator')
eq('journal', routeFromHash('#/journal'), 'journal')
eq('calendar', routeFromHash('#economic-calendar'), 'calendar')
eq('calendar slash form', routeFromHash('#/economic-calendar'), 'calendar')
eq('unknown falls back', routeFromHash('#/nope'), 'calculator')
process.exit(fail ? 1 : 0)
