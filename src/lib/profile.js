import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'

function requireDb() {
  if (!db) {
    throw new Error('Firestore no está disponible.')
  }
}

function profileDocRef(uid) {
  return doc(db, 'profiles', uid)
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeProfilePayload(raw) {
  return {
    firstName: normalizeString(raw.firstName),
    lastName: normalizeString(raw.lastName),
    avatarUrl: normalizeString(raw.avatarUrl),
  }
}

export function buildEmptyProfile(user) {
  return {
    firstName: '',
    lastName: '',
    avatarUrl: normalizeString(user?.photoURL),
  }
}

/**
 * Lee el documento profiles/{uid}. Si no existe, devuelve null.
 * @param {string} uid
 * @returns {Promise<null | Record<string, string>>}
 */
export async function getUserProfile(uid) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('getUserProfile: uid inválido.')
  }

  const snap = await getDoc(profileDocRef(uid))
  if (!snap.exists()) return null
  return normalizeProfilePayload(snap.data())
}

/**
 * Guarda datos de perfil en profiles/{uid}.
 * @param {string} uid
 * @param {Record<string, string>} data
 */
export async function saveUserProfile(uid, data) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('saveUserProfile: uid inválido.')
  }
  if (!data || typeof data !== 'object') {
    throw new Error('saveUserProfile: data inválido.')
  }

  const payload = {
    ...normalizeProfilePayload(data),
    updatedAt: serverTimestamp(),
  }

  await setDoc(profileDocRef(uid), payload, { merge: true })
  return payload
}
