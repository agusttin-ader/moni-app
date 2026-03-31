/** @typedef {{ id: string, name: string, amount: number, frequency: string }} Income */
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

export function totalMonthlyIncome(incomes) {
  return (incomes ?? []).reduce((sum, i) => {
    if (!i || typeof i !== 'object') return sum
    const amt = Number(i.amount) || 0
    const freq = String(i.frequency ?? 'mensual').toLowerCase()
    if (freq !== 'mensual') return sum
    return sum + amt
  }, 0)
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

export function computeMonthBalance(state, monthOffset) {
  const incomes = totalMonthlyIncome(state?.ingresos)
  const fixed = totalFixedExpenses(state?.gastos)
  const debts = totalDebtPaymentsForMonth(state?.deudas, monthOffset)
  const remaining = incomes - fixed - debts
  return { incomes, fixed, debts, remaining }
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
    const flow = Math.max(b.incomes, b.fixed + b.debts, Math.abs(b.remaining))
    maxFlow = Math.max(maxFlow, flow)
    const p = proj[i]
    rows.push({
      monthKey: p.month,
      title: projectionRelativeTitle(p.month),
      balance: p.balance,
      incomes: b.incomes,
      fixed: b.fixed,
      debts: b.debts,
      flowWeight: 0,
    })
  }
  for (const row of rows) {
    const flow = Math.max(
      row.incomes,
      row.fixed + row.debts,
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

/**
 * @returns {{ segments: Array<{ id: string, kind: string, label: string, amount: number, fraction: number, pctLabel: string, color: string }>, centerLabel: string, centerAmount: number, variant: string, hint: string | null, percentContext: 'ingreso' | 'egreso' }}
 */
function monthFlowDonutFromState(state) {
  const b = computeMonthBalance(state, 0)
  const { incomes, fixed, debts: debtsSum, remaining } = b
  const outflow = fixed + debtsSum
  const baseIdx = yearMonthToIndex(currentYearMonthString())

  const expenseItems = []
  for (const e of state?.gastos ?? []) {
    if (!e || typeof e !== 'object') continue
    const amt = Number(e.amount) || 0
    if (amt <= 0) continue
    expenseItems.push({
      id: `exp-${e.id}`,
      label: String(e.name ?? 'Gasto').trim() || 'Gasto',
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
    debtItems.push({
      id: `debt-${d.id}`,
      label: String(d.name ?? 'Deuda').trim() || 'Deuda',
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
  const outflow = b.fixed + b.debts
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
