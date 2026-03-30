import { getRedirectResult, onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from '../lib/firebase.js'
import {
  consumeRedirectAuthPending,
  storeRedirectAuthError,
} from '../lib/auth.js'

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

    const hadRedirectPending = consumeRedirectAuthPending()

    // En algunos navegadores móviles el evento de auth puede retrasarse
    // después de redirect/popup. Usamos fallback con auth.currentUser.
    let redirectDone = false
    let firstAuthEvent = false
    let fallbackTimer = 0
    const finishIfReady = () => {
      if (redirectDone && firstAuthEvent) setLoading(false)
    }
    const syncFromCurrentUser = () => {
      const u = auth.currentUser
      if (u) setUser(u)
      if (redirectDone) setLoading(false)
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      firstAuthEvent = true
      finishIfReady()
    })

    void getRedirectResult(auth)
      .then((res) => {
        if (res?.user) setUser(res.user)
      })
      .catch((e) => {
        console.error(e)
        storeRedirectAuthError(e)
      })
      .finally(() => {
        if (hadRedirectPending && !auth.currentUser) {
          storeRedirectAuthError({
            code: 'auth/redirect-without-session',
            message:
              'Google no pudo completar la sesión en este navegador móvil. Revisá Cookies/Sitios cruzados y que el authDomain de Firebase esté configurado para tu dominio.',
          })
        }
        redirectDone = true
        finishIfReady()
      })

    // Fallback defensivo para mobile: si no llega evento a tiempo, usamos currentUser.
    fallbackTimer = window.setTimeout(() => {
      syncFromCurrentUser()
    }, 2200)

    const onFocus = () => syncFromCurrentUser()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)

    return () => {
      if (fallbackTimer) window.clearTimeout(fallbackTimer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
      unsub()
    }
  }, [])

  return { user, loading }
}
