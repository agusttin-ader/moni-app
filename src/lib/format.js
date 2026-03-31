import { yearMonthToIndex } from './calculations.js'

/**
 * @param {string} ym YYYY-MM
 * @returns {string} ej. "marzo de 2026"
 */
export function formatYearMonth(ym) {
  const s = String(ym ?? '').trim()
  const idx = yearMonthToIndex(s)
  if (idx == null) return s || '—'
  const y = Math.floor(idx / 12)
  const m = idx % 12
  try {
    const d = new Date(y, m, 1)
    const t = new Intl.DateTimeFormat('es-AR', {
      month: 'long',
      year: 'numeric',
    }).format(d)
    return t.charAt(0).toUpperCase() + t.slice(1)
  } catch {
    return s
  }
}

export function formatMoney(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '$ —'
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `$${Math.round(n).toLocaleString('es-AR')}`
  }
}
