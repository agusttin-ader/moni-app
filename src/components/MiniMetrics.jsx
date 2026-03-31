import { budgetOverviewModel, computeMonthBalance } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function MiniMetrics({ state }) {
  const { incomes: inc, fixed, debts, daily, remaining } = computeMonthBalance(state, 0)
  const committed = fixed + debts
  const budget = budgetOverviewModel(state)
  const incA = useAnimatedNumber(inc)
  const committedA = useAnimatedNumber(committed)
  const dailyA = useAnimatedNumber(daily)
  const budgetA = useAnimatedNumber(budget.hasBudget ? budget.remaining : remaining)

  return (
    <div className="moni-mini-metrics">
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Ingresos del mes</div>
        <div className="moni-mini-metrics__value">{formatMoney(incA)}</div>
      </div>
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Compromisos fijos</div>
        <div className="moni-mini-metrics__value">{formatMoney(committedA)}</div>
      </div>
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Variables del mes</div>
        <div className="moni-mini-metrics__value">{formatMoney(dailyA)}</div>
      </div>
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Margen disponible</div>
        <div className="moni-mini-metrics__value">{formatMoney(budgetA)}</div>
      </div>
    </div>
  )
}
