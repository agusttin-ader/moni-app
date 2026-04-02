import {
  currentMonthBreakdown,
  currentYearMonthString,
  savingsMonthTotal,
} from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function RemainingSummary({ state }) {
  const b = currentMonthBreakdown(state)
  const i = useAnimatedNumber(b.incomes)
  const f = useAnimatedNumber(b.fixed)
  const d = useAnimatedNumber(b.debts)
  const v = useAnimatedNumber(b.daily)
  const r = useAnimatedNumber(b.remaining)
  const sav = savingsMonthTotal(state, currentYearMonthString())
  const s = useAnimatedNumber(sav)

  return (
    <section className="moni-card moni-breakdown" aria-label="Base del mes">
      <h3 className="moni-card__title">Base del mes</h3>
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
          <span>Gastos variables (mes)</span>
          <strong>{formatMoney(v)}</strong>
        </li>
        <li>
          <span>Cuotas del mes</span>
          <strong>{formatMoney(d)}</strong>
        </li>
        <li className="moni-kv__savings">
          <span>Ahorro registrado (mes)</span>
          <strong>{formatMoney(s)}</strong>
        </li>
        <li className="moni-kv__total">
          <span>Restante</span>
          <strong>{formatMoney(r)}</strong>
        </li>
      </ul>
    </section>
  )
}
