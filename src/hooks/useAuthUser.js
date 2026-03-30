import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase.js'

export function useAuthUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      const t = window.setTimeout(() => {
        setUser(null)
        setLoading(false)
      }, 0)
      return () => clearTimeout(t)
    }

    let cancelled = false
    let unsub = () => {}

    ;(async () => {
      try {
        await getRedirectResult(auth)
      } catch (e) {
        console.error(e)
      }
      if (cancelled) return
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
    })()

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  return { user, loading }
}
