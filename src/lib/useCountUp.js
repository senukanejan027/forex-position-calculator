import { useEffect, useRef, useState } from 'react'

const prefersReduced = () => typeof window !== 'undefined' && Boolean(window.matchMedia) && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Eases a displayed number toward `target` (short, ~280ms). Jumps straight there for
// reduced motion, or when there is no valid number to animate from/to.
export default function useCountUp(target, duration = 280) {
  const [value, setValue] = useState(target)
  const shown = useRef(target)
  useEffect(() => {
    const ok = (n) => typeof n === 'number' && Number.isFinite(n)
    if (!ok(target) || !ok(shown.current) || prefersReduced()) { shown.current = target; setValue(target); return undefined }
    const from = shown.current
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const v = p === 1 ? target : from + (target - from) * (1 - Math.pow(1 - p, 3))
      shown.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  // On the render right after coming back from an invalid state, `value` is still null: show the real target.
  return Number.isFinite(target) && !Number.isFinite(value) ? target : value
}
