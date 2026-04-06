import {
  currentYearMonthString,
  variableSpendByCategoryForMonthKey,
} from './calculations.js'
import { expenseCategoryById } from './expenseCategories.js'

/**
 * Gastos variables por categoría en un mes (para torta / barras).
 * @returns {{ name: string, value: number, categoryId: string }[]}
 */
export function buildCategoryDistributionForMonth(state, yearMonth = currentYearMonthString()) {
  const ym = String(yearMonth ?? '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(ym)) return []
  const map = variableSpendByCategoryForMonthKey(state?.gastosDiarios, ym)
  const rows = []
  for (const [categoryId, value] of map.entries()) {
    if (value <= 0) continue
    const cat = expenseCategoryById(categoryId)
    rows.push({
      categoryId,
      name: cat.short,
      value,
    })
  }
  return rows.sort((a, b) => b.value - a.value)
}

/**
 * Ahorro acumulado en el tiempo (orden por fecha).
 * @returns {{ date: string, cumulative: number, label: string }[]}
 */
export function buildSavingsCumulativeSeries(state) {
  const entries = [...(state?.savingsEntries ?? [])].filter((x) => x?.id)
  entries.sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? '')))
  let sum = 0
  const out = []
  for (const e of entries) {
    const amt = Math.max(0, Number(e.amount) || 0)
    if (amt <= 0) continue
    sum += amt
    const d = String(e.date ?? '').slice(0, 10)
    out.push({
      date: d,
      cumulative: sum,
      label: d,
    })
  }
  return out
}
