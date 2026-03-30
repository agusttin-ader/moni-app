import {
  totalDebtPaymentsForMonth,
  totalFixedExpenses,
  totalMonthlyIncome,
} from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function MiniMetrics({ state }) {
  const inc = totalMonthlyIncome(state.ingresos)
  const out =
    totalFixedExpenses(state.gastos) + totalDebtPaymentsForMonth(state.deudas, 0)
  const incA = useAnimatedNumber(inc)
  const outA = useAnimatedNumber(out)

  return (
    <div className="moni-mini-metrics">
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Ingresos mensuales</div>
        <div className="moni-mini-metrics__value">{formatMoney(incA)}</div>
      </div>
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Egresos + cuotas</div>
        <div className="moni-mini-metrics__value">{formatMoney(outA)}</div>
      </div>
    </div>
  )
}
