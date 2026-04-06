/**
 * Vista derivada de movimientos para UI y análisis.
 * Persistencia: gastosDiarios, ingresosDiarios, savingsEntries (+ deudas como entidades).
 * No incluye filas tipo "deuda" discretas: los pagos se modelan vía computeMonthBalance / deudas.
 */

import { activeGoalModel } from './calculations.js'
import { buildUnifiedMovements } from './unifiedMovements.js'

/**
 * @typedef {{ id: string, type: 'expense' | 'savings' | 'income', date: string, amount: number, categoryId?: string, note?: string }} UnifiedTransaction
 */

/**
 * @param {object} state
 * @returns {UnifiedTransaction[]}
 */
export function getUnifiedTransactions(state) {
  return buildUnifiedMovements(state).map((row) => ({
    id: row.id,
    type:
      row.kind === 'saving' ? 'savings' : row.kind === 'income' ? 'income' : 'expense',
    date: row.date,
    amount: row.amount,
    categoryId: row.categoryId,
    note: row.note,
  }))
}

/**
 * Meta activa: current = sum(savingsEntries) vía activeGoalModel.savedAmount.
 * @param {object} state
 * @returns {null | { target: number, current: number, pct: number, goalId?: string }}
 */
export function goalSummary(state) {
  const g = activeGoalModel(state)
  if (!g) return null
  const target = Math.max(0, Number(g.targetAmount) || 0)
  const current = Math.max(0, Number(g.savedAmount) || 0)
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return { target, current, pct, goalId: g.id }
}
