import { currentMonthBreakdown } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function RemainingSummary({ state }) {
  const b = currentMonthBreakdown(state)
  const i = useAnimatedNumber(b.incomes)
  const f = useAnimatedNumber(b.fixed)
  const d = useAnimatedNumber(b.debts)
  const r = useAnimatedNumber(b.remaining)

  return (
    <section className="moni-card moni-breakdown" aria-label="Desglose del mes">
      <h3 className="moni-card__title">Desglose del mes</h3>
      <ul className="moni-kv">
        <li>
          <span>Ingresos</span>
          <strong>{formatMoney(i)}</strong>
        </li>
        <li>
          <span>Gastos fijos</span>
          <strong>{formatMoney(f)}</strong>
        </li>
        <li>
          <span>Cuotas del mes</span>
          <strong>{formatMoney(d)}</strong>
        </li>
        <li className="moni-kv__total">
          <span>Restante</span>
          <strong>{formatMoney(r)}</strong>
        </li>
      </ul>
    </section>
  )
}
