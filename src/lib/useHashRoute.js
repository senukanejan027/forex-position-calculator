import { useEffect, useState } from 'react'

// Hash routing keeps refreshes working on GitHub Pages (no server rewrites needed).
export function routeFromHash(hash) {
  const h = hash.replace(/^#\/?/, '')
  if (h.startsWith('journal')) return 'journal'
  if (h.startsWith('economic-calendar')) return 'calendar'
  return 'calculator'
}
const read = () => routeFromHash(window.location.hash)

export default function useHashRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => { setRoute(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
