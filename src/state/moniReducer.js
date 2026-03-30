import {
  clampPaidInstallments,
  normalizeStartMonth,
} from '../lib/calculations.js'

export function createInitialState() {
  return { ingresos: [], gastos: [], deudas: [] }
}

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function moniReducer(state, action) {
  switch (action.type) {
    case 'state/replace': {
      const base = createInitialState()
      const p = action.payload
      return {
        ingresos: Array.isArray(p?.ingresos) ? p.ingresos : base.ingresos,
        gastos: Array.isArray(p?.gastos) ? p.gastos : base.gastos,
        deudas: Array.isArray(p?.deudas) ? p.deudas : base.deudas,
      }
    }
    case 'income/add': {
      const { name, amount, frequency = 'mensual' } = action.payload
      const item = {
        id: genId(),
        name: String(name),
        amount: Number(amount) || 0,
        frequency: String(frequency),
      }
      return { ...state, ingresos: [...state.ingresos, item] }
    }
    case 'income/update': {
      const { id, name, amount, frequency = 'mensual' } = action.payload
      return {
        ...state,
        ingresos: state.ingresos.map((x) =>
          x.id === id
            ? {
                ...x,
                name: String(name),
                amount: Number(amount) || 0,
                frequency: String(frequency),
              }
            : x,
        ),
      }
    }
    case 'income/delete':
      return {
        ...state,
        ingresos: state.ingresos.filter((x) => x.id !== action.payload.id),
      }

    case 'expense/add': {
      const { name, amount } = action.payload
      const item = {
        id: genId(),
        name: String(name),
        amount: Number(amount) || 0,
      }
      return { ...state, gastos: [...state.gastos, item] }
    }
    case 'expense/update': {
      const { id, name, amount } = action.payload
      return {
        ...state,
        gastos: state.gastos.map((x) =>
          x.id === id
            ? { ...x, name: String(name), amount: Number(amount) || 0 }
            : x,
        ),
      }
    }
    case 'expense/delete':
      return {
        ...state,
        gastos: state.gastos.filter((x) => x.id !== action.payload.id),
      }

    case 'debt/add': {
      const {
        name,
        totalAmount,
        installmentCount,
        startMonth,
        paidInstallments = 0,
      } = action.payload
      const count = Math.max(1, Math.floor(Number(installmentCount) || 1))
      const item = {
        id: genId(),
        name: String(name),
        totalAmount: Number(totalAmount) || 0,
        installmentCount: count,
        startMonth: normalizeStartMonth(startMonth),
        paidInstallments: clampPaidInstallments(paidInstallments, count),
      }
      return { ...state, deudas: [...state.deudas, item] }
    }
    case 'debt/update': {
      const {
        id,
        name,
        totalAmount,
        installmentCount,
        startMonth,
        paidInstallments = 0,
      } = action.payload
      return {
        ...state,
        deudas: state.deudas.map((x) => {
          if (x.id !== id) return x
          const count = Math.max(1, Math.floor(Number(installmentCount) || 1))
          return {
            ...x,
            name: String(name),
            totalAmount: Number(totalAmount) || 0,
            installmentCount: count,
            startMonth: normalizeStartMonth(startMonth),
            paidInstallments: clampPaidInstallments(paidInstallments, count),
          }
        }),
      }
    }
    case 'debt/delete':
      return {
        ...state,
        deudas: state.deudas.filter((x) => x.id !== action.payload.id),
      }

    default:
      return state
  }
}
