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
    (payload?.gastosDiarios?.length ?? 0) +
    (payload?.ingresosDiarios?.length ?? 0)
  return n > 0
}

export function createInitialState() {
  return {
    ingresos: [],
    gastos: [],
    deudas: [],
    gastosDiarios: [],
    ingresosDiarios: [],
    budgets: [],
    goals: [],
    savingsMonthlyGoal: 0,
    savingsEntries: [],
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
        ingresosDiarios: Array.isArray(p?.ingresosDiarios)
          ? p.ingresosDiarios
          : base.ingresosDiarios,
        budgets: Array.isArray(p?.budgets) ? p.budgets : base.budgets,
        goals: Array.isArray(p?.goals) ? p.goals : base.goals,
        savingsMonthlyGoal: Math.max(
          0,
          Number(p?.savingsMonthlyGoal) || 0,
        ),
        savingsEntries: Array.isArray(p?.savingsEntries)
          ? p.savingsEntries
          : base.savingsEntries,
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
      const {
        name,
        amount,
        categoryId = 'other',
        frequency = 'mensual',
        startMonth,
      } = action.payload
      const item = {
        id: genId(),
        name: String(name),
        amount: Number(amount) || 0,
        categoryId: String(categoryId ?? 'other'),
        frequency: String(frequency ?? 'mensual'),
        startMonth: normalizeStartMonth(startMonth),
      }
      return { ...state, gastos: [...state.gastos, item] }
    }
    case 'expense/update': {
      const {
        id,
        name,
        amount,
        categoryId = 'other',
        frequency = 'mensual',
        startMonth,
      } = action.payload
      return {
        ...state,
        gastos: state.gastos.map((x) =>
          x.id === id
            ? {
                ...x,
                name: String(name),
                amount: Number(amount) || 0,
                categoryId: String(categoryId ?? 'other'),
                frequency: String(frequency ?? 'mensual'),
                startMonth: normalizeStartMonth(startMonth || x.startMonth),
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

    case 'variableIncome/add': {
      const { amount, categoryId, date, note } = action.payload
      const item = {
        id: genId(),
        amount: Number(amount) || 0,
        categoryId: String(categoryId ?? 'varios'),
        date: String(date ?? '').slice(0, 10),
        note: note != null ? String(note).trim() : '',
      }
      return { ...state, ingresosDiarios: [...state.ingresosDiarios, item] }
    }
    case 'variableIncome/update': {
      const { id, amount, categoryId, date, note } = action.payload
      return {
        ...state,
        ingresosDiarios: state.ingresosDiarios.map((x) =>
          x.id === id
            ? {
                ...x,
                amount: Number(amount) || 0,
                categoryId: String(categoryId ?? 'varios'),
                date: String(date ?? '').slice(0, 10),
                note: note != null ? String(note).trim() : '',
              }
            : x,
        ),
      }
    }
    case 'variableIncome/delete':
      return {
        ...state,
        ingresosDiarios: state.ingresosDiarios.filter(
          (x) => x.id !== action.payload.id,
        ),
      }

    case 'budget/save': {
      const id = String(action.payload?.id ?? '').trim()
      const categoryId = String(action.payload?.categoryId ?? 'other')
      const monthlyLimit = Number(action.payload?.monthlyLimit) || 0
      const byId = id
        ? state.budgets.findIndex((x) => x.id === id)
        : state.budgets.findIndex((x) => x.categoryId === categoryId)
      if (byId >= 0) {
        return {
          ...state,
          budgets: state.budgets.map((x, index) =>
            index === byId
              ? {
                  ...x,
                  categoryId,
                  monthlyLimit,
                }
              : x,
          ),
        }
      }
      return {
        ...state,
        budgets: [
          ...state.budgets,
          {
            id: genId(),
            categoryId,
            monthlyLimit,
          },
        ],
      }
    }

    case 'budget/delete':
      return {
        ...state,
        budgets: state.budgets.filter((x) => x.id !== action.payload.id),
      }

    case 'goal/save': {
      const id = String(action.payload?.id ?? '').trim()
      const nextGoal = {
        id: id || genId(),
        title: String(action.payload?.title ?? '').trim(),
        targetAmount: Math.max(0, Number(action.payload?.targetAmount) || 0),
        savedAmount: Math.max(0, Number(action.payload?.savedAmount) || 0),
        targetMonth: normalizeStartMonth(action.payload?.targetMonth),
        priority:
          String(action.payload?.priority ?? 'medium') === 'high'
            ? 'high'
            : String(action.payload?.priority ?? 'medium') === 'low'
              ? 'low'
              : 'medium',
        category: String(action.payload?.category ?? 'other'),
      }
      const existingIndex = state.goals.findIndex((goal) => goal.id === nextGoal.id)
      if (existingIndex >= 0) {
        return {
          ...state,
          goals: state.goals.map((goal, index) =>
            index === existingIndex ? { ...goal, ...nextGoal } : goal,
          ),
        }
      }
      return {
        ...state,
        goals: [...state.goals, nextGoal],
      }
    }

    case 'goal/delete':
      return {
        ...state,
        goals: state.goals.filter((goal) => goal.id !== action.payload.id),
      }

    case 'savings/setMonthlyGoal': {
      const monthlyGoal = Math.max(0, Number(action.payload?.monthlyGoal) || 0)
      return { ...state, savingsMonthlyGoal: monthlyGoal }
    }

    case 'savings/add': {
      const amount = Math.max(0, Number(action.payload?.amount) || 0)
      if (amount <= 0) return state
      let date = String(action.payload?.date ?? '').trim().slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const d = new Date()
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        date = `${y}-${m}-${day}`
      }
      const item = {
        id: genId(),
        amount,
        date,
        note:
          action.payload?.note != null ? String(action.payload.note).trim() : '',
      }
      return {
        ...state,
        savingsEntries: [...(state.savingsEntries ?? []), item],
      }
    }

    case 'savings/update': {
      const id = String(action.payload?.id ?? '').trim()
      if (!id) return state
      const list = state.savingsEntries ?? []
      const idx = list.findIndex((e) => e?.id === id)
      if (idx < 0) return state
      const cur = list[idx]
      const nextAmount =
        action.payload?.amount != null
          ? Math.max(0, Number(action.payload.amount) || 0)
          : Number(cur.amount) || 0
      let nextDate = cur.date
      if (action.payload?.date != null) {
        const d = String(action.payload.date).trim().slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return state
        nextDate = d
      }
      if (nextAmount <= 0) return state
      let nextNote = cur.note ?? ''
      if (action.payload?.note != null) {
        nextNote = String(action.payload.note).trim()
      }
      const next = { ...cur, amount: nextAmount, date: nextDate, note: nextNote }
      const savingsEntries = [...list]
      savingsEntries[idx] = next
      return { ...state, savingsEntries }
    }

    case 'savings/delete': {
      const id = String(action.payload?.id ?? '').trim()
      if (!id) return state
      return {
        ...state,
        savingsEntries: (state.savingsEntries ?? []).filter((e) => e?.id !== id),
      }
    }

    default:
      return state
  }
}
