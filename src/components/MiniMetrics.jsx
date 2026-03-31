import { computeMonthBalance } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function MiniMetrics({ state }) {
  const { incomes: inc, fixed, debts, daily } = computeMonthBalance(state, 0)
  const out = fixed + debts + daily
  const incA = useAnimatedNumber(inc)
  const outA = useAnimatedNumber(out)

  return (
    <div className="moni-mini-metrics">
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Ingresos mensuales</div>
        <div className="moni-mini-metrics__value">{formatMoney(incA)}</div>
      </div>
      <div className="moni-mini-metrics__card">
        <div className="moni-mini-metrics__label">Salidas del mes</div>
        <div className="moni-mini-metrics__value">{formatMoney(outA)}</div>
      </div>
    </div>
  )
}
