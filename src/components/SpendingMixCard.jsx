import { currentMonthBreakdown } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

function pct(value, total) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

export function SpendingMixCard({ state }) {
  const breakdown = currentMonthBreakdown(state)
  const fixed = Math.max(0, Number(breakdown.fixed) || 0)
  const variable = Math.max(0, Number(breakdown.daily) || 0)
  const debt = Math.max(0, Number(breakdown.debts) || 0)
  const total = fixed + variable + debt
  const fixedPct = pct(fixed, total)
  const variablePct = pct(variable, total)
  const debtPct = Math.max(0, 100 - fixedPct - variablePct)
  const totalA = useAnimatedNumber(total)
  const fixedPctA = useAnimatedNumber(fixedPct)
  const variablePctA = useAnimatedNumber(variablePct)
  const debtPctA = useAnimatedNumber(debtPct)

  const donutStyle = {
    background: `conic-gradient(
      #2dd4bf 0% ${fixedPct}%,
      #60a5fa ${fixedPct}% ${fixedPct + variablePct}%,
      #a78bfa ${fixedPct + variablePct}% 100%
    )`,
  }

  return (
    <section className="moni-card moni-spending-mix" aria-label="Distribución de gastos">
      <div className="moni-card__head">
        <h3 className="moni-card__title">Distribución de gastos</h3>
        <p className="moni-card__sub">Visual rápido de cómo se reparte tu egreso mensual.</p>
      </div>

      {!total ? (
        <p className="moni-empty">Todavía no hay gastos cargados para este mes.</p>
      ) : (
        <div className="moni-spending-mix__content">
          <div className="moni-spending-mix__donut" style={donutStyle} aria-hidden="true">
            <div className="moni-spending-mix__donut-center">
              <span>Egreso</span>
              <strong className="moni-spending-mix__total">{formatMoney(totalA)}</strong>
            </div>
          </div>

          <ul className="moni-spending-mix__legend">
            <li>
              <span className="moni-spending-mix__swatch moni-spending-mix__swatch--fixed" />
              <span>Fijos</span>
              <strong>{Math.max(0, Math.round(fixedPctA))}%</strong>
            </li>
            <li>
              <span className="moni-spending-mix__swatch moni-spending-mix__swatch--variable" />
              <span>Variables</span>
              <strong>{Math.max(0, Math.round(variablePctA))}%</strong>
            </li>
            <li>
              <span className="moni-spending-mix__swatch moni-spending-mix__swatch--debt" />
              <span>Cuotas</span>
              <strong>{Math.max(0, Math.round(debtPctA))}%</strong>
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}
