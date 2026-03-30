import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

function userDocRef(uid) {
  return doc(db, 'users', uid)
}

function emptyUserData() {
  return {
    ingresos: [],
    gastos: [],
    deudas: [],
  }
}

function requireDb() {
  if (!db) {
    throw new Error('Firestore no está disponible.')
  }
}

function normalizeUserPayload(raw) {
  return {
    ingresos: Array.isArray(raw.ingresos) ? raw.ingresos : [],
    gastos: Array.isArray(raw.gastos) ? raw.gastos : [],
    deudas: Array.isArray(raw.deudas) ? raw.deudas : [],
  }
}

/** Firma estable para comparar si hace falta persistir en Firestore. */
export function moniStatePersistenceKey(state) {
  try {
    return JSON.stringify(normalizeUserPayload(state))
  } catch {
    return ''
  }
}

/**
 * Lee el documento users/{uid}. Si no existe, devuelve listas vacías.
 * @param {string} uid
 * @returns {Promise<{ ingresos: unknown[], gastos: unknown[], deudas: unknown[] }>}
 */
export async function getUserData(uid) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('getUserData: uid inválido.')
  }

  try {
    const snap = await getDoc(userDocRef(uid))
    if (!snap.exists()) {
      return emptyUserData()
    }
    return normalizeUserPayload(snap.data())
  } catch (e) {
    console.error('getUserData:', e)
    throw e
  }
}

/**
 * Guarda ingresos, gastos y deudas en users/{uid}.
 * @param {string} uid
 * @param {{ ingresos?: unknown[], gastos?: unknown[], deudas?: unknown[] }} data
 */
export async function saveUserData(uid, data) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('saveUserData: uid inválido.')
  }
  if (!data || typeof data !== 'object') {
    throw new Error('saveUserData: data inválido.')
  }

  const payload = normalizeUserPayload(data)

  try {
    await setDoc(userDocRef(uid), payload)
  } catch (e) {
    console.error('saveUserData:', e)
    throw e
  }
}
