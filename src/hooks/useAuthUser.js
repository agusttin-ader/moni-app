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

    // Completar redirect de Google (no bloquear el listener: en StrictMode un await
    // previo impedía registrar onAuthStateChanged y la sesión parecía “perderse”).
    void getRedirectResult(auth).catch((e) => {
      console.error(e)
      storeRedirectAuthError(e)
    })

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { user, loading }
}
