/**
 * Lista unificada gastos variables + ahorros (para pantalla Movimientos).
 * Orden: fecha descendente, luego tipo.
 */

/** @typedef {{ id: string, kind: 'expense' | 'saving' | 'income', date: string, amount: number, categoryId?: string, note?: string }} UnifiedMovement */

/** @param {object} state */
export function buildUnifiedMovements(state) {
  /** @type {UnifiedMovement[]} */
  const out = []
  for (const g of state?.ingresosDiarios ?? []) {
    if (!g?.id) continue
    out.push({
      id: g.id,
      kind: 'income',
      date: String(g.date ?? '').slice(0, 10),
      amount: Math.max(0, Number(g.amount) || 0),
      categoryId: String(g.categoryId ?? 'varios'),
      note: g.note != null ? String(g.note).trim() : '',
    })
  }
  for (const g of state?.gastosDiarios ?? []) {
    if (!g?.id) continue
    out.push({
      id: g.id,
      kind: 'expense',
      date: String(g.date ?? '').slice(0, 10),
      amount: Math.max(0, Number(g.amount) || 0),
      categoryId: String(g.categoryId ?? 'other'),
      note: g.note != null ? String(g.note).trim() : '',
    })
  }
  for (const s of state?.savingsEntries ?? []) {
    if (!s?.id) continue
    out.push({
      id: s.id,
      kind: 'saving',
      date: String(s.date ?? '').slice(0, 10),
      amount: Math.max(0, Number(s.amount) || 0),
      note: s.note != null ? String(s.note).trim() : '',
    })
  }
  return out.sort((a, b) => {
    const c = String(b.date).localeCompare(String(a.date))
    if (c !== 0) return c
    const order = { income: 0, expense: 1, saving: 2 }
    return (order[a.kind] ?? 9) - (order[b.kind] ?? 9)
  })
}
