/** Categorías unificadas (fijo + variable). ids estables para persistencia. */
export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Alimentación', short: 'Comida', emoji: '🛒' },
  { id: 'transport', label: 'Transporte', short: 'Movilidad', emoji: '🚗' },
  { id: 'home', label: 'Hogar y servicios', short: 'Hogar', emoji: '🏠' },
  { id: 'tech', label: 'Tecnología y suscripciones', short: 'Tech', emoji: '💻' },
  { id: 'health', label: 'Salud y bienestar', short: 'Salud', emoji: '💊' },
  { id: 'leisure', label: 'Ocio y salidas', short: 'Ocio', emoji: '🎬' },
  { id: 'education', label: 'Educación', short: 'Estudio', emoji: '📚' },
  { id: 'other', label: 'Otros', short: 'Otros', emoji: '📌' },
]

export function expenseCategoryById(id) {
  return (
    EXPENSE_CATEGORIES.find((c) => c.id === id) ?? EXPENSE_CATEGORIES.at(-1)
  )
}

export function expenseCategoryLabel(id) {
  return expenseCategoryById(id).label
}

/** Etiqueta con emoji para listas y dona. */
export function expenseCategoryWithEmoji(id) {
  const c = expenseCategoryById(id)
  return `${c.emoji} ${c.label}`
}
