import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase.js'
import { storeRedirectAuthError } from '../lib/auth.js'

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

    // No marcamos loading=false hasta que estén:
    // 1) terminado getRedirectResult y 2) recibido el primer onAuthStateChanged.
    let redirectDone = false
    let firstAuthEvent = false
    const finishIfReady = () => {
      if (redirectDone && firstAuthEvent) setLoading(false)
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      firstAuthEvent = true
      finishIfReady()
    })

    void getRedirectResult(auth)
      .catch((e) => {
        console.error(e)
        storeRedirectAuthError(e)
      })
      .finally(() => {
        redirectDone = true
        finishIfReady()
      })

    return () => unsub()
  }, [])

  return { user, loading }
}
