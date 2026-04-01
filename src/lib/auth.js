import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, firebaseInitError } from './firebase.js'
import { saveUserProfile } from './profile.js'

function authUnavailableMessage() {
  return (
    firebaseInitError ??
    'Firebase no está disponible. Revisá la configuración en .env y reiniciá el servidor de desarrollo.'
  )
}

function normalizeName(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function register(email, password, profileData = {}) {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )
    const firstName = normalizeName(profileData.firstName)
    const lastName = normalizeName(profileData.lastName)
    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim()
    if (displayName) {
      await updateProfile(credential.user, { displayName })
    }
    if (firstName || lastName) {
      try {
        await saveUserProfile(
          credential.user.uid,
          { firstName, lastName },
          { allowNameUpdate: true },
        )
      } catch {
        // Non-blocking: auth account is already created.
      }
    }
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: error?.message ?? 'Error al registrarse' }
  }
}

export async function login(email, password) {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: error?.message ?? 'Error al iniciar sesión' }
  }
}

export async function logout() {
  if (!auth) return { error: authUnavailableMessage() }
  try {
    await signOut(auth)
    return { error: null }
  } catch (error) {
    return { error: error?.message ?? 'Error al cerrar sesión' }
  }
}

export async function loginWithGoogle() {
  if (!auth) return { user: null, error: authUnavailableMessage() }
  try {
    const provider = new GoogleAuthProvider()
    const credential = await signInWithPopup(auth, provider)
    return { user: credential.user, error: null }
  } catch (error) {
    return { user: null, error: error?.message ?? 'Error con Google' }
  }
}
