import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'
import {
  computeMonthBalance,
  currentYearMonthString,
  projectionDetailRows,
} from './calculations.js'

function requireDb() {
  if (!db) {
    throw new Error('Firestore no está disponible.')
  }
}

function historyCollection(uid) {
  return collection(doc(db, 'users', uid), 'projectionHistory')
}

export function buildProjectionSnapshot(state) {
  const monthKey = currentYearMonthString()
  const month = computeMonthBalance(state, 0)
  const rows = projectionDetailRows(state, 3).map((row) => ({
    monthKey: row.monthKey,
    title: row.title,
    balance: row.balance,
    incomes: row.incomes,
    outflow: row.fixed + row.debts,
  }))
  return {
    monthKey,
    incomes: month.incomes,
    fixed: month.fixed,
    debts: month.debts,
    remaining: month.remaining,
    projection: rows,
  }
}

export async function saveProjectionSnapshot(uid, snapshot) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('saveProjectionSnapshot: uid inválido.')
  }
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('saveProjectionSnapshot: snapshot inválido.')
  }
  const monthKey = String(snapshot.monthKey ?? '').trim()
  if (!monthKey) {
    throw new Error('saveProjectionSnapshot: monthKey inválido.')
  }

  const payload = {
    ...snapshot,
    updatedAt: serverTimestamp(),
  }
  await setDoc(doc(historyCollection(uid), monthKey), payload, { merge: true })
  return payload
}

export async function getProjectionHistory(uid, months = 24) {
  requireDb()
  if (!uid || typeof uid !== 'string') {
    throw new Error('getProjectionHistory: uid inválido.')
  }
  const q = query(
    historyCollection(uid),
    orderBy('monthKey', 'desc'),
    limit(Math.max(1, months)),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data())
}
