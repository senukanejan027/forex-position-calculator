import { useCallback, useEffect, useState } from 'react'

export const THEME_KEY = 'snfx-theme'
const META_COLOR = { dark: '#0a0e13', light: '#f2f5f9' }

const systemTheme = () => (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
function stored() {
  try { const v = localStorage.getItem(THEME_KEY); return v === 'light' || v === 'dark' ? v : null } catch { return null }
}

let animTimer
function apply(theme, animate) {
  const root = document.documentElement
  if (animate) {
    root.classList.add('theme-anim')
    clearTimeout(animTimer)
    animTimer = setTimeout(() => root.classList.remove('theme-anim'), 320)
  }
  root.setAttribute('data-theme', theme)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', META_COLOR[theme])
}

// The inline script in index.html has already set data-theme, so state starts in sync with the page.
export default function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || stored() || systemTheme())

  // Follow the OS setting live, but only until the person picks a theme themselves.
  useEffect(() => {
    if (!window.matchMedia) return undefined
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e) => {
      if (stored()) return
      const next = e.matches ? 'light' : 'dark'
      apply(next, true)
      setTheme(next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    apply(next, true)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* private mode: theme still applies for this visit */ }
    setTheme(next)
  }, [theme])

  return [theme, toggle]
}
