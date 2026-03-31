import { doc, getDoc, setDoc } from 'firebase/firestore'
import { normalizeStartMonth } from './calculations.js'
import { db } from './firebase.js'

function userDocRef(uid) {
  return doc(db, 'users', uid)
}

function emptyUserData() {
  return {
    ingresos: [],
    gastos: [],
    deudas: [],
    gastosDiarios: [],
    onboardingComplete: false,
  }
}

function requireDb() {
  if (!db) {
    throw new Error('Firestore no está disponible.')
  }
}

function normalizeUserPayload(raw) {
  const ingresos = Array.isArray(raw.ingresos)
    ? raw.ingresos.map((inc) => {
        if (!inc || typeof inc !== 'object') return inc
        const eff = inc.effectiveFromMonth
        if (eff == null || String(eff).trim() === '') return inc
        return {
          ...inc,
          effectiveFromMonth: normalizeStartMonth(eff),
        }
      })
    : []
  const gastos = Array.isArray(raw.gastos)
    ? raw.gastos.map((g) => ({
        ...g,
        categoryId:
          g && typeof g === 'object' && g.categoryId != null
            ? String(g.categoryId)
            : 'other',
      }))
    : []
  const deudas = Array.isArray(raw.deudas)
    ? raw.deudas.map((d) => ({
        ...d,
        debtKind:
          d && typeof d === 'object' && d.debtKind === 'credit_card'
            ? 'credit_card'
            : 'loan',
      }))
    : []
  const gastosDiarios = Array.isArray(raw.gastosDiarios)
    ? raw.gastosDiarios
    : []
  let onboardingComplete = raw.onboardingComplete
  if (onboardingComplete !== true && onboardingComplete !== false) {
    onboardingComplete =
      ingresos.length + gastos.length + deudas.length + gastosDiarios.length > 0
  }
  return {
    ingresos,
    gastos,
    deudas,
    gastosDiarios,
    onboardingComplete,
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
 * @returns {Promise<ReturnType<typeof normalizeUserPayload>>}
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
