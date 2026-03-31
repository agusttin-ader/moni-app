import { expenseCategoryById } from './expenseCategories.js'

/** @typedef {{ id: string, name: string, amount: number, frequency: string, effectiveFromMonth?: string }} Income */
/** @typedef {{ id: string, name: string, amount: number }} Expense */
/** @typedef {{ id: string, name: string, totalAmount: number, installmentCount: number, startMonth: string, paidInstallments: number }} Debt */

export function currentYearMonthString(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

export function yearMonthToIndex(ym) {
  const s = String(ym ?? '').trim()
  const m = /^(\d{4})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  if (mo < 1 || mo > 12) return null
  return y * 12 + (mo - 1)
}

export function normalizeStartMonth(value) {
  const idx = yearMonthToIndex(value)
  if (idx == null) return currentYearMonthString()
  const y = Math.floor(idx / 12)
  const mo = (idx % 12) + 1
  return `${y}-${String(mo).padStart(2, '0')}`
}

export function clampPaidInstallments(paid, count) {
  const c = Math.max(0, Math.floor(Number(count) || 0))
  let p = Math.floor(Number(paid) || 0)
  if (p < 0) p = 0
  if (c > 0 && p > c) p = c
  return p
}

export function monthlyInstallmentAmount(debt) {
  const total = Number(debt.totalAmount) || 0
  const n = Math.max(1, Math.floor(Number(debt.installmentCount) || 1))
  return total / n
}

export function debtIsFinished(debt) {
  const c = Math.max(0, Math.floor(Number(debt.installmentCount) || 0))
  const p = clampPaidInstallments(debt.paidInstallments, c)
  return c > 0 && p >= c
}

export function remainingInstallments(debt) {
  const c = Math.max(0, Math.floor(Number(debt.installmentCount) || 0))
  const p = clampPaidInstallments(debt.paidInstallments, c)
  return Math.max(0, c - p)
}

/** @param {Debt} debt */
export function debtPaysInMonth(debt, targetMonthIndex) {
  if (!debt || typeof debt !== 'object') return false
  if (debtIsFinished(debt)) return false
  const M0 = yearMonthToIndex(normalizeStartMonth(debt.startMonth))
  if (M0 == null) return false
  const N = Math.max(0, Math.floor(Number(debt.installmentCount) || 0))
  const P = clampPaidInstallments(debt.paidInstallments, N)
  if (N <= 0) return false
  return targetMonthIndex >= M0 + P && targetMonthIndex <= M0 + N - 1
}

/**
 * Suma ingresos mensuales que aplican al mes calendario `targetMonthIndex`
 * (índice absoluto año×12+m como en yearMonthToIndex).
 * Si un ingreso tiene `effectiveFromMonth` (YYYY-MM), solo cuenta desde ese mes inclusive.
 * Si `targetMonthIndex` es null/undefined, no se aplica el filtro de fecha (compatibilidad).
 */
export function totalMonthlyIncome(incomes, targetMonthIndex) {
  return (incomes ?? []).reduce((sum, i) => {
    if (!i || typeof i !== 'object') return sum
    const amt = Number(i.amount) || 0
    const freq = String(i.frequency ?? 'mensual').toLowerCase()
    if (freq !== 'mensual') return sum
    const raw = i.effectiveFromMonth
    if (
      raw != null &&
      String(raw).trim() !== '' &&
      targetMonthIndex != null &&
      Number.isFinite(targetMonthIndex)
    ) {
      const fromIdx = yearMonthToIndex(normalizeStartMonth(raw))
      if (fromIdx != null && targetMonthIndex < fromIdx) return sum
    }
    return sum + amt
  }, 0)
}

/** Desplaza YYYY-MM por `delta` meses (delta negativo = meses atrás). */
export function addMonthsToYearMonth(ym, delta) {
  const idx = yearMonthToIndex(normalizeStartMonth(ym))
  if (idx == null || !Number.isFinite(delta)) return currentYearMonthString()
  const t = idx + Math.trunc(delta)
  if (t < 0) return '1970-01'
  const y = Math.floor(t / 12)
  const mo = (t % 12) + 1
  return `${y}-${String(mo).padStart(2, '0')}`
}

export function totalFixedExpenses(expenses) {
  return (expenses ?? []).reduce((sum, e) => {
    if (!e || typeof e !== 'object') return sum
    return sum + (Number(e.amount) || 0)
  }, 0)
}

export function totalDebtPaymentsForMonth(debts, monthOffset) {
  const base = yearMonthToIndex(currentYearMonthString())
  if (base == null) return 0
  const target = base + monthOffset
  let sum = 0
  for (const d of debts ?? []) {
    if (debtPaysInMonth(d, target)) sum += monthlyInstallmentAmount(d)
  }
  return sum
}

/** Mes calendario YYYY-MM para el desfase respecto del mes actual (0 = este mes). */
export function monthKeyForOffset(monthOffset) {
  const base = yearMonthToIndex(currentYearMonthString())
  if (base == null) return null
  const target = base + monthOffset
  const y = Math.floor(target / 12)
  const mo = (target % 12) + 1
  return `${y}-${String(mo).padStart(2, '0')}`
}

export function totalDailyExpensesForMonthKey(gastosDiarios, yearMonth) {
  if (!yearMonth) return 0
  return (gastosDiarios ?? []).reduce((sum, g) => {
    if (!g || typeof g !== 'object') return sum
    const d = String(g.date ?? '').slice(0, 7)
    if (d !== yearMonth) return sum
    return sum + (Number(g.amount) || 0)
  }, 0)
}

export function totalBudgetLimit(budgets) {
  return (budgets ?? []).reduce(
    (sum, item) => sum + Math.max(0, Number(item?.monthlyLimit) || 0),
    0,
  )
}

function variableSpendByCategoryForMonthKey(gastosDiarios, yearMonth) {
  const out = new Map()
  for (const item of gastosDiarios ?? []) {
    if (!item || typeof item !== 'object') continue
    if (String(item.date ?? '').slice(0, 7) !== yearMonth) continue
    const amount = Math.max(0, Number(item.amount) || 0)
    if (amount <= 0) continue
    const categoryId = String(item.categoryId ?? 'other')
    out.set(categoryId, (out.get(categoryId) ?? 0) + amount)
  }
  return out
}

function recentVariableMonthTotals(gastosDiarios) {
  const monthMap = new Map()
  for (const item of gastosDiarios ?? []) {
    if (!item || typeof item !== 'object') continue
    const ym = String(item.date ?? '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(ym)) continue
    const amount = Math.max(0, Number(item.amount) || 0)
    if (amount <= 0) continue
    monthMap.set(ym, (monthMap.get(ym) ?? 0) + amount)
  }
  return [...monthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export function averageVariableExpenses(gastosDiarios, sampleSize = 3) {
  const series = recentVariableMonthTotals(gastosDiarios)
  if (!series.length) return 0
  const recent = series.slice(-Math.max(1, sampleSize))
  const total = recent.reduce((sum, [, amount]) => sum + amount, 0)
  return total / recent.length
}

export function projectedVariableExpensesInfo(state, monthOffset) {
  const ym = monthKeyForOffset(monthOffset)
  const actual = ym ? totalDailyExpensesForMonthKey(state?.gastosDiarios, ym) : 0
  if (monthOffset <= 0) return { amount: actual, source: 'actual' }
  if (actual > 0) return { amount: actual, source: 'planned' }
  const budgetLimit = totalBudgetLimit(state?.budgets)
  if (budgetLimit > 0) return { amount: budgetLimit, source: 'budget' }
  const average = averageVariableExpenses(state?.gastosDiarios, 3)
  if (average > 0) return { amount: average, source: 'average' }
  return { amount: 0, source: 'none' }
}

export function projectedVariableSourceLabel(source) {
  switch (source) {
    case 'actual':
      return 'real'
    case 'planned':
      return 'cargado'
    case 'budget':
      return 'presupuesto'
    case 'average':
      return 'promedio'
    default:
      return 'sin referencia'
  }
}

function daysRemainingInMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return Math.max(1, lastDay - date.getDate() + 1)
}

export function budgetProgressRows(state, yearMonth = currentYearMonthString()) {
  const spentByCategory = variableSpendByCategoryForMonthKey(
    state?.gastosDiarios,
    yearMonth,
  )
  const daysLeft = daysRemainingInMonth()
  return (state?.budgets ?? [])
    .map((budget) => {
      const categoryId = String(budget?.categoryId ?? 'other')
      const limit = Math.max(0, Number(budget?.monthlyLimit) || 0)
      const spent = spentByCategory.get(categoryId) ?? 0
      const remaining = limit - spent
      const ratio = limit > 0 ? spent / limit : 0
      const category = expenseCategoryById(categoryId)
      return {
        id: String(budget?.id ?? categoryId),
        categoryId,
        label: category.label,
        short: category.short,
        emoji: category.emoji,
        limit,
        spent,
        remaining,
        ratio,
        progress: Math.max(0, Math.min(1.25, ratio)),
        safeToSpend: daysLeft > 0 ? remaining / daysLeft : remaining,
        tone:
          ratio >= 1 ? 'danger' : ratio >= 0.85 ? 'warning' : 'healthy',
      }
    })
    .sort((a, b) => {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio
      return b.limit - a.limit
    })
}

export function budgetOverviewModel(state) {
  const rows = budgetProgressRows(state)
  const totalLimit = rows.reduce((sum, row) => sum + row.limit, 0)
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0)
  const remaining = totalLimit - totalSpent
  const daysLeft = daysRemainingInMonth()
  const safeToSpend = daysLeft > 0 ? remaining / daysLeft : remaining
  const alertRow =
    rows.find((row) => row.ratio >= 1) ??
    rows.find((row) => row.ratio >= 0.85) ??
    rows[0] ??
    null
  return {
    rows,
    totalLimit,
    totalSpent,
    remaining,
    daysLeft,
    safeToSpend,
    usageRatio: totalLimit > 0 ? totalSpent / totalLimit : 0,
    alertRow,
    hasBudget: totalLimit > 0,
  }
}

const GOAL_PRIORITY_SCORE = {
  high: 3,
  medium: 2,
  low: 1,
}

export function goalMonthsUntil(targetMonth, fromYearMonth = currentYearMonthString()) {
  const base = yearMonthToIndex(normalizeStartMonth(fromYearMonth))
  const target = yearMonthToIndex(normalizeStartMonth(targetMonth))
  if (base == null || target == null) return 1
  return Math.max(1, target - base + 1)
}

function sortGoals(goals) {
  return [...(goals ?? [])].sort((a, b) => {
    const pa = GOAL_PRIORITY_SCORE[String(a?.priority ?? 'medium')] ?? 2
    const pb = GOAL_PRIORITY_SCORE[String(b?.priority ?? 'medium')] ?? 2
    if (pb !== pa) return pb - pa
    const ta = yearMonthToIndex(normalizeStartMonth(a?.targetMonth))
    const tb = yearMonthToIndex(normalizeStartMonth(b?.targetMonth))
    if (ta != null && tb != null && ta !== tb) return ta - tb
    return String(a?.title ?? '').localeCompare(String(b?.title ?? ''))
  })
}

export function activeGoalModel(state) {
  const active = sortGoals(state?.goals)[0]
  if (!active) return null
  const monthsLeft = goalMonthsUntil(active.targetMonth)
  const targetAmount = Math.max(0, Number(active.targetAmount) || 0)
  const savedAmount = Math.max(0, Number(active.savedAmount) || 0)
  const remainingNeeded = Math.max(0, targetAmount - savedAmount)
  let projectedContribution = 0
  const balanceSeries = []
  for (let i = 0; i < monthsLeft; i++) {
    const balance = computeMonthBalance(state, i).remaining
    const contribution = Math.max(0, balance)
    projectedContribution += contribution
    balanceSeries.push({
      monthOffset: i,
      monthKey: monthKeyForOffset(i),
      balance,
      contribution,
    })
  }
  const projectedByTarget = savedAmount + projectedContribution
  const shortfall = Math.max(0, targetAmount - projectedByTarget)
  const requiredPerMonth = monthsLeft > 0 ? remainingNeeded / monthsLeft : remainingNeeded
  const projectedPerMonth = monthsLeft > 0 ? projectedContribution / monthsLeft : projectedContribution
  const progress = targetAmount > 0 ? Math.min(1, savedAmount / targetAmount) : 0
  const viability =
    shortfall <= 0 ? 'viable' : projectedPerMonth >= requiredPerMonth * 0.82 ? 'tight' : 'at_risk'
  return {
    ...active,
    monthsLeft,
    targetAmount,
    savedAmount,
    remainingNeeded,
    projectedContribution,
    projectedByTarget,
    shortfall,
    requiredPerMonth,
    projectedPerMonth,
    progress,
    viability,
    balanceSeries,
  }
}

export function goalCategoryLabel(category) {
  switch (String(category ?? 'other')) {
    case 'relocation':
      return 'Mudanza'
    case 'emergency':
      return 'Fondo de emergencia'
    case 'travel':
      return 'Viaje'
    case 'education':
      return 'Formación'
    case 'home':
      return 'Hogar'
    default:
      return 'Meta personal'
  }
}

export function goalAdviceItems(state) {
  const goal = activeGoalModel(state)
  if (!goal) return []

  const items = []
  const overview = budgetOverviewModel(state)
  const current = computeMonthBalance(state, 0)
  const fixedShare = current.incomes > 0 ? (current.fixed + current.debts) / current.incomes : 0
  const topDebt = [...(state?.deudas ?? [])]
    .filter((item) => !debtIsFinished(item))
    .sort((a, b) => monthlyInstallmentAmount(b) - monthlyInstallmentAmount(a))[0]
  const stressedCategory = overview.rows.find((row) => row.ratio >= 0.9) ?? overview.rows[0]

  if (goal.shortfall > 0) {
    items.push({
      id: 'goal-gap',
      tone: goal.viability === 'tight' ? 'warning' : 'danger',
      title: 'Te falta liberar margen mensual',
      priority: 100,
      monthlyGap: Math.max(0, goal.requiredPerMonth - goal.projectedPerMonth),
      shortfall: goal.shortfall,
    })
  } else {
    items.push({
      id: 'goal-track',
      tone: 'positive',
      title: 'La meta es viable con tu escenario actual',
      priority: 95,
      reservePerMonth: goal.requiredPerMonth,
    })
  }

  if (stressedCategory && overview.hasBudget) {
    items.push({
      id: 'category-pressure',
      tone: stressedCategory.ratio >= 1 ? 'danger' : 'warning',
      title: 'Tu gasto flexible necesita foco',
      priority: stressedCategory.ratio >= 1 ? 90 : 72,
      categoryLabel: stressedCategory.label,
      categoryEmoji: stressedCategory.emoji,
      categorySpent: stressedCategory.spent,
      categoryLimit: stressedCategory.limit,
      categoryRemaining: stressedCategory.remaining,
    })
  } else if (!overview.hasBudget) {
    items.push({
      id: 'setup-budget',
      tone: 'neutral',
      title: 'Todavía te falta una referencia mensual',
      priority: 65,
    })
  }

  if (topDebt) {
    items.push({
      id: 'debt-pressure',
      tone: 'warning',
      title: 'Hay una cuota que pesa más que el resto',
      priority: 78,
      debtName: String(topDebt.name ?? 'Cuota'),
      debtMonthly: monthlyInstallmentAmount(topDebt),
    })
  }

  const discretionaryKeywords = [
    'netflix',
    'spotify',
    'disney',
    'hbo',
    'prime',
    'youtube',
    'icloud',
    'game pass',
    'suscrip',
  ]
  const optionalServices = (state?.gastos ?? [])
    .map((expense) => ({
      name: String(expense?.name ?? '').trim(),
      amount: Math.max(0, Number(expense?.amount) || 0),
    }))
    .filter(
      (expense) =>
        expense.amount > 0 &&
        discretionaryKeywords.some((keyword) =>
          expense.name.toLowerCase().includes(keyword),
        ),
    )
  const optionalServicesTotal = optionalServices.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  )
  if (optionalServicesTotal > 0) {
    items.push({
      id: 'optional-services',
      tone: goal.shortfall > 0 ? 'warning' : 'neutral',
      title: 'Tenés servicios que podrían recortarse',
      priority: goal.shortfall > 0 ? 76 : 52,
      optionalServicesTotal,
      optionalServices: optionalServices.slice(0, 3).map((item) => item.name),
    })
  }

  if (fixedShare >= 0.72) {
    items.push({
      id: 'fixed-load',
      tone: 'warning',
      title: 'Tus compromisos fijos consumen gran parte del ingreso',
      priority: 70,
      fixedShare,
    })
  } else if (current.remaining > 0) {
    items.push({
      id: 'save-now',
      tone: 'positive',
      title: 'Podés separar ahorro desde este mes',
      priority: 60,
      reservePerMonth: Math.min(current.remaining, goal.requiredPerMonth || current.remaining),
    })
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 4)
}

export function goalAdviceSummary(goal, items, formatMoneyFn) {
  if (!goal) {
    return 'Definí una meta concreta para que MONI te ayude a priorizar y proyectar.'
  }
  const lead =
    goal.viability === 'viable'
      ? `Tu meta ${goal.title} se ve alcanzable en ${goal.monthsLeft} meses.`
      : goal.viability === 'tight'
        ? `Tu meta ${goal.title} está cerca, pero necesita más disciplina mensual.`
        : `Con tu escenario actual, ${goal.title} no llega cómodo al plazo que elegiste.`
  const first = items[0]
  if (!first) return lead
  switch (first.id) {
    case 'goal-gap':
      return `${lead} Hoy necesitás liberar alrededor de ${formatMoneyFn(first.monthlyGap)} por mes para cerrar la brecha.`
    case 'goal-track':
      return `${lead} Si reservás ${formatMoneyFn(first.reservePerMonth)} por mes, mantenés el plan bajo control.`
    case 'category-pressure':
      return `${lead} La categoría ${first.categoryLabel} es la que más tensión le mete a tu objetivo.`
    case 'optional-services':
      return `${lead} Revisar servicios opcionales puede liberar hasta ${formatMoneyFn(first.optionalServicesTotal)} por mes para tu meta.`
    default:
      return lead
  }
}

export function goalMotivationMessage(goal, items) {
  if (!goal) {
    return 'Tu próxima gran decisión financiera empieza cuando definís una meta clara.'
  }
  if (goal.viability === 'viable') {
    return 'Tu plan ya funciona: cada peso que priorizás hoy acelera el proyecto que más te importa.'
  }
  if (items.some((item) => item.id === 'goal-gap')) {
    return 'Decirle que no a un gasto impulsivo hoy puede acercarte un mes entero a tu meta.'
  }
  if (items.some((item) => item.id === 'optional-services')) {
    return 'Recortar lo que no suma valor real es una forma concreta de invertir en tu futuro.'
  }
  return 'La constancia pesa más que la perfección: pequeñas decisiones repetidas cambian el resultado.'
}

export function variableCategorySpendingRows(state, yearMonth = currentYearMonthString()) {
  const spentByCategory = variableSpendByCategoryForMonthKey(
    state?.gastosDiarios,
    yearMonth,
  )
  const budgetByCategory = new Map(
    (state?.budgets ?? []).map((item) => [
      String(item?.categoryId ?? 'other'),
      Math.max(0, Number(item?.monthlyLimit) || 0),
    ]),
  )
  const totalSpent = [...spentByCategory.values()].reduce((sum, value) => sum + value, 0)
  return [...spentByCategory.entries()]
    .map(([categoryId, spent]) => {
      const category = expenseCategoryById(categoryId)
      const limit = budgetByCategory.get(categoryId) ?? 0
      return {
        categoryId,
        label: category.label,
        short: category.short,
        emoji: category.emoji,
        spent,
        limit,
        share: totalSpent > 0 ? spent / totalSpent : 0,
        ratio: limit > 0 ? spent / limit : 0,
      }
    })
    .sort((a, b) => b.spent - a.spent)
}

export function computeMonthBalance(state, monthOffset) {
  const base = yearMonthToIndex(currentYearMonthString())
  if (base == null) {
    return { incomes: 0, fixed: 0, debts: 0, daily: 0, remaining: 0 }
  }
  const targetIdx = base + monthOffset
  const incomes = totalMonthlyIncome(state?.ingresos, targetIdx)
  const fixed = totalFixedExpenses(state?.gastos)
  const debts = totalDebtPaymentsForMonth(state?.deudas, monthOffset)
  const variable = projectedVariableExpensesInfo(state, monthOffset)
  const daily = variable.amount
  const remaining = incomes - fixed - debts - daily
  return { incomes, fixed, debts, daily, dailySource: variable.source, remaining }
}

const PROJECTION_KEYS = ['actual', 'siguiente', 'siguiente+1']

/** Coincide con los gráficos de proyección en la UI. */
export const PROJECTION_HORIZON_MONTHS = 6

export function projectMonths(state, count = PROJECTION_HORIZON_MONTHS) {
  const out = []
  for (let i = 0; i < count; i++) {
    const { remaining } = computeMonthBalance(state, i)
    const key =
      PROJECTION_KEYS[i] ?? (i === 0 ? 'actual' : `siguiente+${i - 1}`)
    out.push({ month: key, balance: remaining })
  }
  return out
}

export function monthNetBalance(state, monthOffset) {
  return computeMonthBalance(state, monthOffset).remaining
}

/** @returns {string|null} */
export function deficitAlertText(state, horizonMonths = PROJECTION_HORIZON_MONTHS) {
  const proj = projectMonths(state, horizonMonths)
  for (let i = 1; i < proj.length; i++) {
    if (proj[i].balance < 0) {
      if (i === 1) return 'El mes que viene podrías entrar en déficit.'
      return `En ${i} meses podrías entrar en déficit.`
    }
  }
  return null
}

export function projectionRelativeTitle(projectionMonthKey) {
  switch (projectionMonthKey) {
    case 'actual':
      return 'Mes actual'
    case 'siguiente':
      return 'Próximo mes'
    case 'siguiente+1':
      return 'En dos meses'
    default:
      break
  }

  const m = /^siguiente\+(\d+)$/.exec(String(projectionMonthKey ?? ''))
  if (!m) return projectionMonthKey
  const n = Number(m[1]) + 1
  if (!Number.isFinite(n) || n < 1) return projectionMonthKey
  return `En ${n} meses`
}

/** Etiqueta corta para leyendas densas (p. ej. 6 meses en una fila). */
export function projectionShortLabel(title) {
  const t = String(title ?? '')
  if (t === 'Mes actual') return 'Ahora'
  if (t === 'Próximo mes') return '+1'
  if (t === 'En dos meses') return '+2'
  const m = /^En (\d+) meses$/.exec(t)
  if (m) return `+${m[1]}`
  return t
}

export function projectionBalanceClassSuffix(balance) {
  if (!Number.isFinite(balance) || balance === 0) return 'neutral'
  return balance > 0 ? 'positive' : 'negative'
}

export function projectionDetailRows(state, count = PROJECTION_HORIZON_MONTHS) {
  const proj = projectMonths(state, count)
  const rows = []
  let maxFlow = 0
  for (let i = 0; i < count; i++) {
    const b = computeMonthBalance(state, i)
    const outM = b.fixed + b.debts + b.daily
    const flow = Math.max(b.incomes, outM, Math.abs(b.remaining))
    maxFlow = Math.max(maxFlow, flow)
    const p = proj[i]
    rows.push({
      monthKey: p.month,
      title: projectionRelativeTitle(p.month),
      balance: p.balance,
      incomes: b.incomes,
      fixed: b.fixed,
      debts: b.debts,
      daily: b.daily,
      dailySource: b.dailySource ?? 'actual',
      flowWeight: 0,
    })
  }
  for (const row of rows) {
    const flow = Math.max(
      row.incomes,
      row.fixed + row.debts + row.daily,
      Math.abs(row.balance),
    )
    row.flowWeight = maxFlow > 0 ? Math.max(0.08, flow / maxFlow) : 0.08
  }
  return rows
}

export function currentMonthHeroModel(remaining) {
  const r = Number(remaining) || 0
  if (r > 0) return { tone: 'positive', absAmount: r }
  if (r < 0) return { tone: 'negative', absAmount: -r }
  return { tone: 'neutral', absAmount: 0 }
}

export function currentMonthHeroMessage(model, formattedAmount) {
  if (model.tone === 'positive')
    return `Te sobran ${formattedAmount} este mes`
  if (model.tone === 'negative')
    return `Te faltan ${formattedAmount} este mes`
  return `Este mes cerrás en cero (${formattedAmount})`
}

export function currentMonthHeroClassSuffix(tone) {
  return tone
}

export function buildCurrentMonthHeroView(remaining, formatMoneyFn) {
  const model = currentMonthHeroModel(remaining)
  const fmt =
    model.tone === 'neutral'
      ? formatMoneyFn(0)
      : formatMoneyFn(model.absAmount)
  return {
    model,
    amountDisplay: fmt,
    message: currentMonthHeroMessage(model, fmt),
    caption:
      model.tone === 'positive'
        ? 'Buen margen para ahorrar o invertir.'
        : model.tone === 'negative'
          ? 'Revisá gastos o ingresos para equilibrar.'
          : 'Ingresos y egresos se compensan.',
  }
}

export function currentMonthHeroMeta(state, formatMoneyFn) {
  const goal = activeGoalModel(state)
  if (goal) {
    return {
      label: goal.viability === 'viable' ? 'Meta activa' : 'Meta bajo presión',
      value: formatMoneyFn(goal.requiredPerMonth),
      tone:
        goal.viability === 'viable'
          ? 'positive'
          : goal.viability === 'tight'
            ? 'warning'
            : 'negative',
    }
  }
  const budget = budgetOverviewModel(state)
  if (!budget.hasBudget) {
    return {
      label: 'Variables del mes',
      value: formatMoneyFn(computeMonthBalance(state, 0).daily),
      tone: 'neutral',
    }
  }
  return {
    label: 'Presupuesto flexible',
    value: formatMoneyFn(budget.remaining),
    tone:
      budget.remaining < 0
        ? 'negative'
        : budget.usageRatio >= 0.85
          ? 'warning'
          : 'positive',
  }
}

export function currentMonthBreakdown(state) {
  return computeMonthBalance(state, 0)
}

const DONUT_EXPENSE_PALETTE = [
  '#22d3ee',
  '#a78bfa',
  '#fbbf24',
  '#fde047',
  '#4ade80',
  '#60a5fa',
  '#fb923c',
  '#2dd4bf',
  '#e879f9',
  '#38bdf8',
]

const DONUT_REST_COLOR = '#34d399'
const DONUT_MUTED = 'rgba(255, 255, 255, 0.14)'

function mkDonutPctLabel(fraction) {
  if (fraction <= 1e-9) return '0%'
  const r = Math.round(fraction * 100)
  return r === 0 ? '<1%' : `${r}%`
}

function refreshDonutPctLabels(parts) {
  for (const p of parts) p.pctLabel = mkDonutPctLabel(p.fraction)
}

function normalizeDonutFractions(parts) {
  const sum = parts.reduce((a, p) => a + p.fraction, 0)
  if (sum <= 0 || !Number.isFinite(sum)) return
  if (Math.abs(sum - 1) < 0.002) return
  for (const p of parts) p.fraction /= sum
  refreshDonutPctLabels(parts)
}

/** Rojos en familia: más oscuro = deuda “pesada” (más cuotas / monto). */
function hslDebtRed(severity) {
  const s = Math.min(1, Math.max(0, severity))
  const L = 71 - s * 36
  const S = 74 + s * 20
  return `hsl(358, ${S}%, ${L}%)`
}

function debtPaletteStats(items) {
  if (items.length === 0)
    return { count: 0, maxN: 1, maxTotal: 1, maxPer: 1 }
  return {
    count: items.length,
    maxN: Math.max(1, ...items.map((d) => d.installmentCount)),
    maxTotal: Math.max(1, ...items.map((d) => d.totalAmount)),
    maxPer: Math.max(1, ...items.map((d) => d.amount)),
  }
}

function debtSeverityForColor(di, stats) {
  if (stats.count <= 1) {
    return Math.min(
      1,
      (di.installmentCount / 48) * 0.58 +
        Math.min(1, di.totalAmount / 450_000) * 0.42,
    )
  }
  return Math.min(
    1,
    (di.installmentCount / stats.maxN) * 0.52 +
      (di.totalAmount / stats.maxTotal) * 0.33 +
      (di.amount / stats.maxPer) * 0.15,
  )
}

function dailyAggregatesForMonth(state, yearMonth) {
  const map = new Map()
  for (const g of state?.gastosDiarios ?? []) {
    if (!g || typeof g !== 'object') continue
    if (String(g.date ?? '').slice(0, 7) !== yearMonth) continue
    const amt = Number(g.amount) || 0
    if (amt <= 0) continue
    const cid = String(g.categoryId ?? 'other')
    const prev = map.get(cid) ?? { amount: 0, categoryId: cid }
    prev.amount += amt
    map.set(cid, prev)
  }
  return [...map.values()].map((x) => {
    const cat = expenseCategoryById(x.categoryId)
    return {
      id: `daily-${x.categoryId}`,
      label: `Variable · ${cat.emoji} ${cat.short}`,
      amount: x.amount,
    }
  })
}

/**
 * @returns {{ segments: Array<{ id: string, kind: string, label: string, amount: number, fraction: number, pctLabel: string, color: string }>, centerLabel: string, centerAmount: number, variant: string, hint: string | null, percentContext: 'ingreso' | 'egreso' }}
 */
function monthFlowDonutFromState(state) {
  const b = computeMonthBalance(state, 0)
  const { incomes, fixed, debts: debtsSum, remaining, daily } = b
  const ymNow = currentYearMonthString()
  const dailyItems = dailyAggregatesForMonth(state, ymNow)
  const outflow = fixed + debtsSum + daily
  const baseIdx = yearMonthToIndex(ymNow)

  const expenseItems = []
  for (const e of state?.gastos ?? []) {
    if (!e || typeof e !== 'object') continue
    const amt = Number(e.amount) || 0
    if (amt <= 0) continue
    const cat = expenseCategoryById(String(e.categoryId ?? 'other'))
    const nm = String(e.name ?? 'Gasto').trim() || 'Gasto'
    expenseItems.push({
      id: `exp-${e.id}`,
      label: `${cat.emoji} ${nm}`,
      amount: amt,
    })
  }

  const debtItems = []
  for (const d of state?.deudas ?? []) {
    if (!d || typeof d !== 'object') continue
    if (debtIsFinished(d)) continue
    if (baseIdx == null || !debtPaysInMonth(d, baseIdx)) continue
    const per = monthlyInstallmentAmount(d)
    if (per <= 0) continue
    const n = Math.max(1, Math.floor(Number(d.installmentCount) || 1))
    const totalAmt = Number(d.totalAmount) || 0
    const isCard = String(d.debtKind ?? 'loan') === 'credit_card'
    const nm = String(d.name ?? 'Deuda').trim() || 'Deuda'
    debtItems.push({
      id: `debt-${d.id}`,
      label: isCard ? `💳 ${nm}` : nm,
      amount: per,
      installmentCount: n,
      totalAmount: totalAmt,
    })
  }

  const debtStats = debtPaletteStats(debtItems)

  const pushExpenseSegments = (parts, denom) => {
    let colorIdx = 0
    for (const ex of expenseItems) {
      const f = ex.amount / denom
      if (f <= 1e-9) continue
      parts.push({
        id: ex.id,
        kind: 'expense',
        label: ex.label,
        amount: ex.amount,
        fraction: f,
        pctLabel: mkDonutPctLabel(f),
        color: DONUT_EXPENSE_PALETTE[colorIdx % DONUT_EXPENSE_PALETTE.length],
      })
      colorIdx += 1
    }
  }

  const pushDebtSegments = (parts, denom) => {
    for (const di of debtItems) {
      const f = di.amount / denom
      if (f <= 1e-9) continue
      const sev = debtSeverityForColor(di, debtStats)
      parts.push({
        id: di.id,
        kind: 'debt',
        label: `Cuota · ${di.label}`,
        amount: di.amount,
        fraction: f,
        pctLabel: mkDonutPctLabel(f),
        color: hslDebtRed(sev),
      })
    }
  }

  const pushDailySegments = (parts, denom) => {
    let colorIdx = expenseItems.length + debtItems.length
    for (const di of dailyItems) {
      const f = di.amount / denom
      if (f <= 1e-9) continue
      parts.push({
        id: di.id,
        kind: 'daily',
        label: di.label,
        amount: di.amount,
        fraction: f,
        pctLabel: mkDonutPctLabel(f),
        color: DONUT_EXPENSE_PALETTE[colorIdx % DONUT_EXPENSE_PALETTE.length],
      })
      colorIdx += 1
    }
  }

  if (incomes <= 0 && outflow <= 0) {
    return {
      segments: [
        {
          id: 'empty',
          kind: 'empty',
          label: 'Sin datos',
          amount: 0,
          fraction: 1,
          pctLabel: '—',
          color: DONUT_MUTED,
        },
      ],
      centerLabel: 'Ingresos',
      centerAmount: 0,
      variant: 'empty',
      hint: 'Cargá ingresos y egresos para ver el reparto.',
      percentContext: 'ingreso',
    }
  }

  if (incomes <= 0 && outflow > 0) {
    const denom = outflow
    const parts = []
    pushExpenseSegments(parts, denom)
    pushDebtSegments(parts, denom)
    pushDailySegments(parts, denom)
    const segments =
      parts.length > 0
        ? parts
        : [
            {
              id: 'out',
              kind: 'expense',
              label: 'Egresos',
              amount: outflow,
              fraction: 1,
              pctLabel: '100%',
              color: hslDebtRed(0.35),
            },
          ]
    normalizeDonutFractions(segments)
    return {
      segments,
      centerLabel: 'Egresos',
      centerAmount: outflow,
      variant: 'no_income',
      hint: 'Agregá ingresos para comparar con este egreso mensual.',
      percentContext: 'egreso',
    }
  }

  if (remaining >= 0) {
    const denom = incomes
    const parts = []
    pushExpenseSegments(parts, denom)
    pushDebtSegments(parts, denom)
    pushDailySegments(parts, denom)
    if (remaining > 0) {
      const rf = remaining / denom
      if (rf > 1e-9) {
        parts.push({
          id: 'rest',
          kind: 'rest',
          label: 'Restante',
          amount: remaining,
          fraction: rf,
          pctLabel: mkDonutPctLabel(rf),
          color: DONUT_REST_COLOR,
        })
      }
    }
    if (parts.length === 0 && incomes > 0) {
      parts.push({
        id: 'rest',
        kind: 'rest',
        label: 'Disponible',
        amount: incomes,
        fraction: 1,
        pctLabel: '100%',
        color: DONUT_REST_COLOR,
      })
    }
    normalizeDonutFractions(parts)
    return {
      segments: parts,
      centerLabel: 'Ingresos',
      centerAmount: incomes,
      variant: 'balanced',
      hint: null,
      percentContext: 'ingreso',
    }
  }

  const denom = outflow
  const parts = []
  pushExpenseSegments(parts, denom)
  pushDebtSegments(parts, denom)
  pushDailySegments(parts, denom)
  normalizeDonutFractions(parts)
  const segments =
    parts.length > 0
      ? parts
      : [
          {
            id: 'out',
            kind: 'debt',
            label: 'Egresos',
            amount: outflow,
            fraction: 1,
            pctLabel: '100%',
            color: hslDebtRed(0.85),
          },
        ]
  return {
    segments,
    centerLabel: 'Ingresos',
    centerAmount: incomes,
    variant: 'deficit',
    hint: 'Tus egresos superan lo que ingresás este mes.',
    percentContext: 'egreso',
  }
}

/** Resumen del mes + modelo para gráfico de dona (reparto del flujo). */
export function breakdownFlowChartModel(state) {
  const b = computeMonthBalance(state, 0)
  const outflow = b.fixed + b.debts + b.daily
  let marginPct = null
  if (b.incomes > 0) marginPct = (b.remaining / b.incomes) * 100
  return {
    incomes: b.incomes,
    outflow,
    remaining: b.remaining,
    marginPct,
    donut: monthFlowDonutFromState(state),
  }
}

/** Alturas normalizadas (0–1) para columnas de saldo proyectado. */
export function projectionBalanceBarsModel(state, count = PROJECTION_HORIZON_MONTHS) {
  const detail = projectionDetailRows(state, count)
  const balances = detail.map((r) => Number(r.balance) || 0)
  const minB = Math.min(0, ...balances)
  const maxB = Math.max(0, ...balances)
  const span = Math.max(maxB - minB, 1e-9)
  const zeroLineFrac = (0 - minB) / span
  return {
    rows: detail.map((r) => ({
      title: r.title,
      monthKey: r.monthKey,
      balance: r.balance,
      heightFrac: (Number(r.balance) - minB) / span,
      tone: projectionBalanceClassSuffix(r.balance),
    })),
    minBalance: minB,
    maxBalance: maxB,
    zeroLineFrac,
    hasMixedSign: minB < 0 && maxB > 0,
  }
}

export function debtSummaryForList(debt) {
  const per = monthlyInstallmentAmount(debt)
  const rem = remainingInstallments(debt)
  const finished = debtIsFinished(debt)
  return { perMonth: per, remainingCount: rem, finished }
}

export function debtMonthlyPreviewFromFormFields(totalAmountStr, installmentCountStr) {
  const total = Number(String(totalAmountStr ?? '').replace(',', '.'))
  const n = Math.floor(Number(String(installmentCountStr ?? '').replace(',', '.')))
  if (!Number.isFinite(total) || total < 0 || !Number.isInteger(n) || n < 1)
    return null
  return total / n
}
