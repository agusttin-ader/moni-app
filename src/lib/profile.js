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

function splitDisplayName(displayName) {
  const clean = normalizeString(displayName)
  if (!clean) return { firstName: '', lastName: '' }
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function normalizeProfilePayload(raw) {
  const allowNameUpdate = Boolean(raw?.allowNameUpdate)
  const payload = {
    avatarUrl: normalizeString(raw?.avatarUrl),
  }
  if (allowNameUpdate) {
    payload.firstName = normalizeString(raw?.firstName)
    payload.lastName = normalizeString(raw?.lastName)
  }
  return payload
}

function normalizeRemoteProfile(raw) {
  return {
    firstName: normalizeString(raw.firstName),
    lastName: normalizeString(raw.lastName),
    avatarUrl: normalizeString(raw.avatarUrl),
  }
}

export function buildEmptyProfile(user) {
  const names = splitDisplayName(user?.displayName)
  return {
    firstName: names.firstName,
    lastName: names.lastName,
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
  return normalizeRemoteProfile(snap.data())
}

/**
 * Guarda datos de perfil en profiles/{uid}.
 * @param {string} uid
 * @param {Record<string, string>} data
 */
export async function saveUserProfile(uid, data, options = {}) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('saveUserProfile: uid inválido.')
  }
  if (!data || typeof data !== 'object') {
    throw new Error('saveUserProfile: data inválido.')
  }

  const payload = {
    ...normalizeProfilePayload({
      ...data,
      allowNameUpdate: Boolean(options?.allowNameUpdate),
    }),
    updatedAt: serverTimestamp(),
  }

  await setDoc(profileDocRef(uid), payload, { merge: true })
  return payload
}
