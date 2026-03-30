import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth, firebaseInitError } from './firebase.js'

function authUnavailableMessage() {
  return (
    firebaseInitError ??
    'Firebase no está disponible. Revisá la configuración en .env y reiniciá el servidor de desarrollo.'
  )
}

function mapAuthError(error, fallback) {
  const code = error?.code ?? ''
  if (code === 'auth/unauthorized-domain') {
    return 'Dominio no autorizado en Firebase Auth. Agregá tu dominio de Vercel y localhost en Authentication > Settings > Authorized domains.'
  }
  return error?.message ?? fallback
}

function shouldUseGoogleRedirect() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent || ''
  const isiOS = /iPad|iPhone|iPod/.test(ua)
  const isSafari =
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|YaBrowser/i.test(ua)
  return isiOS || isSafari
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
    const provider = new GoogleAuthProvider()
    if (shouldUseGoogleRedirect()) {
      await signInWithRedirect(auth, provider)
      return { user: null, error: null }
    }
    const credential = await signInWithPopup(auth, provider)
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: mapAuthError(error, 'Error con Google') }
  }
}
