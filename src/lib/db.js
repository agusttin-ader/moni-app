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
    ingresosDiarios: [],
    budgets: [],
    goals: [],
    savingsMonthlyGoal: 0,
    savingsEntries: [],
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
        frequency:
          g && typeof g === 'object' && g.frequency != null
            ? String(g.frequency)
            : 'mensual',
        startMonth:
          g && typeof g === 'object' && g.startMonth != null
            ? normalizeStartMonth(g.startMonth)
            : normalizeStartMonth(),
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
  const ingresosDiarios = Array.isArray(raw.ingresosDiarios)
    ? raw.ingresosDiarios
        .map((e) => {
          if (!e || typeof e !== 'object') return null
          const date = String(e.date ?? '').trim().slice(0, 10)
          return {
            id: String(e.id ?? '').trim() || `incv_${Date.now()}`,
            amount: Math.max(0, Number(e.amount) || 0),
            categoryId: String(e.categoryId ?? 'varios'),
            date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
            note: e.note != null ? String(e.note).trim() : '',
          }
        })
        .filter((e) => e && e.amount > 0 && e.date)
    : []
  const budgets = Array.isArray(raw.budgets)
    ? raw.budgets
        .map((b) => {
          if (!b || typeof b !== 'object') return null
          return {
            id: String(b.id ?? '').trim() || `budget_${String(b.categoryId ?? 'other')}`,
            categoryId: String(b.categoryId ?? 'other'),
            monthlyLimit: Math.max(0, Number(b.monthlyLimit) || 0),
          }
        })
        .filter(Boolean)
    : []
  const goals = Array.isArray(raw.goals)
    ? raw.goals
        .map((goal) => {
          if (!goal || typeof goal !== 'object') return null
          return {
            id: String(goal.id ?? '').trim() || `goal_${Date.now()}`,
            title: String(goal.title ?? '').trim(),
            targetAmount: Math.max(0, Number(goal.targetAmount) || 0),
            savedAmount: Math.max(0, Number(goal.savedAmount) || 0),
            targetMonth: normalizeStartMonth(goal.targetMonth),
            priority:
              String(goal.priority ?? 'medium') === 'high'
                ? 'high'
                : String(goal.priority ?? 'medium') === 'low'
                  ? 'low'
                  : 'medium',
            category: String(goal.category ?? 'other'),
          }
        })
        .filter(Boolean)
    : []
  const savingsMonthlyGoal = Math.max(0, Number(raw.savingsMonthlyGoal) || 0)
  const savingsEntries = Array.isArray(raw.savingsEntries)
    ? raw.savingsEntries
        .map((e) => {
          if (!e || typeof e !== 'object') return null
          const date = String(e.date ?? '').trim().slice(0, 10)
          return {
            id: String(e.id ?? '').trim() || `sav_${Date.now()}`,
            amount: Math.max(0, Number(e.amount) || 0),
            date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
            note: e.note != null ? String(e.note).trim() : '',
          }
        })
        .filter((e) => e && e.amount > 0 && e.date)
    : []
  let onboardingComplete = raw.onboardingComplete
  if (onboardingComplete !== true && onboardingComplete !== false) {
    onboardingComplete =
      ingresos.length +
        gastos.length +
        deudas.length +
        gastosDiarios.length +
        ingresosDiarios.length >
      0
  }
  return {
    ingresos,
    gastos,
    deudas,
    gastosDiarios,
    ingresosDiarios,
    budgets,
    goals,
    savingsMonthlyGoal,
    savingsEntries,
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
