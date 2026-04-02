import { useEffect, useState } from 'react'

/** Breakpoint alineado con shell no-desktop (mobile/tablet). */
const QUERY = '(max-width: 1023px)'

export function useNarrowViewport() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return narrow
}
