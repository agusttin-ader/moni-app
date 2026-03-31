import {
  clampPaidInstallments,
  normalizeStartMonth,
} from '../lib/calculations.js'

function deriveOnboardingComplete(payload) {
  if (payload?.onboardingComplete === true) return true
  if (payload?.onboardingComplete === false) return false
  const n =
    (payload?.ingresos?.length ?? 0) +
    (payload?.gastos?.length ?? 0) +
    (payload?.deudas?.length ?? 0) +
    (payload?.gastosDiarios?.length ?? 0)
  return n > 0
}

export function createInitialState() {
  return {
    ingresos: [],
    gastos: [],
    deudas: [],
    gastosDiarios: [],
    onboardingComplete: false,
  }
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
        gastosDiarios: Array.isArray(p?.gastosDiarios)
          ? p.gastosDiarios
          : base.gastosDiarios,
        onboardingComplete: deriveOnboardingComplete(p),
      }
    }
    case 'onboarding/complete':
      return { ...state, onboardingComplete: true }
    case 'income/add': {
      const { name, amount, frequency = 'mensual', effectiveFromMonth } =
        action.payload
      const eff =
        effectiveFromMonth != null && String(effectiveFromMonth).trim() !== ''
          ? normalizeStartMonth(effectiveFromMonth)
          : ''
      const item = {
        id: genId(),
        name: String(name),
        amount: Number(amount) || 0,
        frequency: String(frequency),
        ...(eff ? { effectiveFromMonth: eff } : {}),
      }
      return { ...state, ingresos: [...state.ingresos, item] }
    }
    case 'income/update': {
      const { id, name, amount, frequency = 'mensual', effectiveFromMonth } =
        action.payload
      const eff =
        effectiveFromMonth != null && String(effectiveFromMonth).trim() !== ''
          ? normalizeStartMonth(effectiveFromMonth)
          : ''
      return {
        ...state,
        ingresos: state.ingresos.map((x) => {
          if (x.id !== id) return x
          const next = {
            ...x,
            name: String(name),
            amount: Number(amount) || 0,
            frequency: String(frequency),
          }
          if (eff) next.effectiveFromMonth = eff
          else delete next.effectiveFromMonth
          return next
        }),
      }
    }
    case 'income/delete':
      return {
        ...state,
        ingresos: state.ingresos.filter((x) => x.id !== action.payload.id),
      }

    case 'expense/add': {
      const { name, amount, categoryId = 'other' } = action.payload
      const item = {
        id: genId(),
        name: String(name),
        amount: Number(amount) || 0,
        categoryId: String(categoryId ?? 'other'),
      }
      return { ...state, gastos: [...state.gastos, item] }
    }
    case 'expense/update': {
      const { id, name, amount, categoryId = 'other' } = action.payload
      return {
        ...state,
        gastos: state.gastos.map((x) =>
          x.id === id
            ? {
                ...x,
                name: String(name),
                amount: Number(amount) || 0,
                categoryId: String(categoryId ?? 'other'),
              }
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
        debtKind = 'loan',
      } = action.payload
      const count = Math.max(1, Math.floor(Number(installmentCount) || 1))
      const kind =
        debtKind === 'credit_card' || debtKind === 'loan' ? debtKind : 'loan'
      const item = {
        id: genId(),
        name: String(name),
        totalAmount: Number(totalAmount) || 0,
        installmentCount: count,
        startMonth: normalizeStartMonth(startMonth),
        paidInstallments: clampPaidInstallments(paidInstallments, count),
        debtKind: kind,
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
        debtKind = 'loan',
      } = action.payload
      const kind =
        debtKind === 'credit_card' || debtKind === 'loan' ? debtKind : 'loan'
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
            debtKind: kind,
          }
        }),
      }
    }
    case 'debt/delete':
      return {
        ...state,
        deudas: state.deudas.filter((x) => x.id !== action.payload.id),
      }

    case 'dailyExpense/add': {
      const { amount, categoryId, date, note } = action.payload
      const item = {
        id: genId(),
        amount: Number(amount) || 0,
        categoryId: String(categoryId ?? 'other'),
        date: String(date ?? '').slice(0, 10),
        note: note != null ? String(note).trim() : '',
      }
      return { ...state, gastosDiarios: [...state.gastosDiarios, item] }
    }
    case 'dailyExpense/update': {
      const { id, amount, categoryId, date, note } = action.payload
      return {
        ...state,
        gastosDiarios: state.gastosDiarios.map((x) =>
          x.id === id
            ? {
                ...x,
                amount: Number(amount) || 0,
                categoryId: String(categoryId ?? 'other'),
                date: String(date ?? '').slice(0, 10),
                note: note != null ? String(note).trim() : '',
              }
            : x,
        ),
      }
    }
    case 'dailyExpense/delete':
      return {
        ...state,
        gastosDiarios: state.gastosDiarios.filter(
          (x) => x.id !== action.payload.id,
        ),
      }

    default:
      return state
  }
}
