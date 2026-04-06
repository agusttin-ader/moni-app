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

/** Fecha ISO YYYY-MM-DD → texto corto local (ej. 2 abr 2026). */
export function formatISODateShort(iso) {
  const s = String(iso ?? '').trim().slice(0, 10)
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return s || '—'
  try {
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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

/**
 * Importe abreviado para leyendas angostas (p. ej. gráfico de proyección en ~320px).
 * El detalle completo sigue en la lista desplegable debajo.
 */
export function formatMoneyCompact(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(n)
  } catch {
    const abs = Math.abs(n)
    const sign = n < 0 ? '-' : ''
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
    if (abs >= 1000) return `${sign}$${Math.round(abs / 1000)}k`
    return formatMoney(n)
  }
}
