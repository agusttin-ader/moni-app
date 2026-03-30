import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth, firebaseInitError } from './firebase.js'

const REDIRECT_AUTH_ERROR_KEY = 'moni_auth_redirect_error'
const REDIRECT_AUTH_PENDING_KEY = 'moni_auth_redirect_pending'
let persistenceReadyPromise = null

function authUnavailableMessage() {
  return (
    firebaseInitError ??
    'Firebase no está disponible. Revisá la configuración en .env y reiniciá el servidor de desarrollo.'
  )
}

export function mapAuthError(error, fallback) {
  const code = error?.code ?? ''
  if (code === 'auth/unauthorized-domain') {
    return 'Dominio no autorizado en Firebase Auth. Agregá tu dominio de Vercel y localhost en Authentication > Settings > Authorized domains.'
  }
  if (code === 'auth/popup-blocked') {
    return 'El navegador bloqueó la ventana de Google. Probá nuevamente o usá el ingreso por email.'
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Cerraste la ventana de Google antes de terminar el inicio de sesión.'
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Se canceló el intento de acceso con Google. Probá de nuevo.'
  }
  return error?.message ?? fallback
}

export function storeRedirectAuthError(error) {
  if (typeof window === 'undefined') return
  try {
    const msg = mapAuthError(error, 'No se pudo iniciar sesión con Google.')
    window.sessionStorage.setItem(REDIRECT_AUTH_ERROR_KEY, msg)
  } catch {
    // No-op: si sessionStorage falla, no rompemos el flujo.
  }
}

export function consumeRedirectAuthError() {
  if (typeof window === 'undefined') return null
  try {
    const value = window.sessionStorage.getItem(REDIRECT_AUTH_ERROR_KEY)
    if (value) window.sessionStorage.removeItem(REDIRECT_AUTH_ERROR_KEY)
    return value
  } catch {
    return null
  }
}

export function markRedirectAuthPending() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(REDIRECT_AUTH_PENDING_KEY, '1')
  } catch {
    // No-op
  }
}

export function consumeRedirectAuthPending() {
  if (typeof window === 'undefined') return false
  try {
    const hadPending =
      window.sessionStorage.getItem(REDIRECT_AUTH_PENDING_KEY) === '1'
    if (hadPending) window.sessionStorage.removeItem(REDIRECT_AUTH_PENDING_KEY)
    return hadPending
  } catch {
    return false
  }
}

async function ensureAuthPersistence() {
  if (!auth) return false
  if (persistenceReadyPromise) return persistenceReadyPromise
  persistenceReadyPromise = (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      return true
    } catch {
      // iOS/Safari a veces bloquea local persistence; intentamos session.
    }
    try {
      await setPersistence(auth, browserSessionPersistence)
      return true
    } catch {
      // Último fallback: dejamos el comportamiento por defecto.
    }
    return false
  })()
  return persistenceReadyPromise
}

export function isIOSStandalone() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isiOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (window.navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone === true
  return Boolean(isiOS && standalone)
}

export async function register(email, password) {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    await ensureAuthPersistence()
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: mapAuthError(error, 'Error al registrarse') }
  }
}

export async function login(email, password) {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    await ensureAuthPersistence()
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: mapAuthError(error, 'Error al iniciar sesión') }
  }
}

export async function logout() {
  if (!auth) return { error: authUnavailableMessage() }
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: mapAuthError(error, 'Error al cerrar sesión') }
  }
}

export async function loginWithGoogle() {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    if (isIOSStandalone()) {
      return {
        user: null,
        error:
          'Google en la app instalada de iPhone no es compatible. Abrí Moni en Safari y tocá "Continuar con Google".',
      }
    }

    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const hasPersistence = await ensureAuthPersistence()
    try {
      const credential = await signInWithPopup(auth, provider)
      return { user: credential.user, error: null }
    } catch (error) {
      const code = error?.code ?? ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        if (!hasPersistence) {
          return {
            user: null,
            error:
              'Este navegador móvil bloquea la persistencia de sesión para Google. Probá con email/contraseña o habilitá cookies y abrí de nuevo.',
          }
        }
        markRedirectAuthPending()
        await signInWithRedirect(auth, provider)
        return { user: null, error: null }
      }
      throw error
    }
  } catch (error) {
    return { user: null, error: mapAuthError(error, 'Error con Google') }
  }
}
