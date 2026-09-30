import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark mode" className="theme-toggle"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggle}>
      <Sun className="tt-track tt-track-sun" size={13} aria-hidden="true" />
      <Moon className="tt-track tt-track-moon" size={13} aria-hidden="true" />
      <span className="tt-thumb" aria-hidden="true">
        <Sun className="tt-glyph tt-glyph-sun" size={14} />
        <Moon className="tt-glyph tt-glyph-moon" size={14} />
      </span>
    </button>
  )
}
