/** Categorías simples para ingresos variables (registro por movimiento). */
export const VARIABLE_INCOME_CATEGORIES = [
  { id: 'varios', short: 'Varios', emoji: '💵' },
  { id: 'freelance', short: 'Freelance', emoji: '💼' },
  { id: 'ventas', short: 'Ventas', emoji: '🛒' },
]

export function variableIncomeCategoryById(id) {
  const x = VARIABLE_INCOME_CATEGORIES.find((c) => c.id === id)
  return x ?? VARIABLE_INCOME_CATEGORIES[0]
}
