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
