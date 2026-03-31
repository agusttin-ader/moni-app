import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 520

export function useAnimatedNumber(value) {
  const target = Number(value)
  const [display, setDisplay] = useState(() =>
    Number.isFinite(target) ? target : 0,
  )
  const startRef = useRef(null)
  const fromRef = useRef(display)
  const rafRef = useRef(null)

  useEffect(() => {
    const end = Number(value)
    if (!Number.isFinite(end)) {
      requestAnimationFrame(() => setDisplay(0))
      return
    }
    const from = fromRef.current
    if (!Number.isFinite(from) || from === end) {
      requestAnimationFrame(() => setDisplay(end))
      fromRef.current = end
      return
    }
    startRef.current = null
    const step = (t) => {
      if (startRef.current == null) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / DURATION_MS)
      const eased = 1 - (1 - p) ** 3
      const next = from + (end - from) * eased
      if (p >= 1) {
        fromRef.current = end
        setDisplay(end)
        return
      }
      setDisplay((prev) => {
        const nextR = Math.round(next)
        const prevR = Math.round(prev)
        if (prevR === nextR) return prev
        return next
      })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  return display
}
