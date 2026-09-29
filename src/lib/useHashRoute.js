import { useEffect, useState } from 'react'

// Hash routing keeps refreshes working on GitHub Pages (no server rewrites needed).
const read = () => (window.location.hash.startsWith('#/journal') ? 'journal' : 'calculator')

export default function useHashRoute() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => { setRoute(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
