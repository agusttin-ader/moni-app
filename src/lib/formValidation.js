export function nameFieldError(value) {
  const v = String(value ?? '').trim()
  if (!v) return 'El nombre no puede estar vacío.'
  return null
}

export function amountFieldError(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return 'Ingresá un monto.'
  const n = Number(raw.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return 'El monto debe ser un número positivo.'
  return null
}

export function intFieldError(value, label = 'cantidad') {
  const raw = String(value ?? '').trim()
  if (!raw) return `Ingresá ${label}.`
  const n = Number(raw.replace(',', '.'))
  if (!Number.isInteger(n) || n < 1)
    return `${label.charAt(0).toUpperCase() + label.slice(1)} debe ser un entero mayor o igual a 1.`
  return null
}

export function emailFieldError(value) {
  const v = String(value ?? '').trim()
  if (!v) return 'Ingresá tu email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Email inválido.'
  return null
}

export function passwordFieldError(value, min = 6) {
  const v = String(value ?? '')
  if (!v) return 'Ingresá una contraseña.'
  if (v.length < min) return `La contraseña debe tener al menos ${min} caracteres.`
  return null
}
