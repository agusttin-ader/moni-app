import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1023px)'

/** true = layout app móvil (tabs, pantallas simples); false = web escritorio (overview clásico). */
export function useMobileLayout() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return mobile
}
