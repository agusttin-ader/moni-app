import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth, firebaseInitError } from './firebase.js'

const REDIRECT_AUTH_ERROR_KEY = 'moni_auth_redirect_error'

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

function shouldUseGoogleRedirect() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isiOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (window.navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua))
  if (isiOS) return true
  const isSafari =
    /Safari/i.test(ua) &&
    !/Chromium|Chrome|Edg|CriOS|FxiOS|OPiOS|DuckDuckGo|GSA|YaBrowser/i.test(
      ua,
    )
  return isSafari
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

    if (shouldUseGoogleRedirect()) {
      await signInWithRedirect(auth, provider)
      return { user: null, error: null }
    }

    try {
      const credential = await signInWithPopup(auth, provider)
      return { user: credential.user, error: null }
    } catch (error) {
      const code = error?.code ?? ''
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        await signInWithRedirect(auth, provider)
        return { user: null, error: null }
      }
      throw error
    }
  } catch (error) {
    return { user: null, error: mapAuthError(error, 'Error con Google') }
  }
}
