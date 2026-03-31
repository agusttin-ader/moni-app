import { budgetOverviewModel } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'

function clamp01(value) {
  return Math.max(0, Math.min(1, value))
}

export function BudgetHealthCard({ state }) {
  const overview = budgetOverviewModel(state)

  if (!overview.hasBudget) {
    return (
      <section className="moni-card moni-budget-card" aria-label="Presupuesto flexible">
        <div className="moni-card__head moni-budget-card__head">
          <h3 className="moni-card__title">Presupuesto flexible</h3>
          <p className="moni-card__sub">
            Definí topes por categoría para sostener mejor tu meta y evitar que el gasto variable te
            saque del rumbo.
          </p>
        </div>
        <p className="moni-budget-card__empty">
          Todavía no configuraste presupuestos variables.
        </p>
      </section>
    )
  }

  const usageRatio = clamp01(overview.usageRatio)
  const tone =
    overview.remaining < 0
      ? 'danger'
      : overview.usageRatio >= 0.85
        ? 'warning'
        : 'healthy'

  return (
    <section className={`moni-card moni-budget-card moni-budget-card--${tone}`} aria-label="Presupuesto flexible">
      <div className="moni-card__head moni-budget-card__head">
        <div>
          <h3 className="moni-card__title">Presupuesto flexible</h3>
          <p className="moni-card__sub">
            Seguimiento del gasto variable para cuidar tu margen y tu plan futuro.
          </p>
        </div>
        <span className={`moni-budget-pill moni-budget-pill--${tone}`}>
          {Math.round(overview.usageRatio * 100)}%
        </span>
      </div>

      <div className="moni-budget-card__hero">
        <div>
          <div className="moni-budget-card__label">Disponible</div>
          <div className="moni-budget-card__value">{formatMoney(overview.remaining)}</div>
        </div>
        <div className="moni-budget-card__side">
          <div>
            <span className="moni-budget-card__metric-label">Tope</span>
            <strong>{formatMoney(overview.totalLimit)}</strong>
          </div>
          <div>
            <span className="moni-budget-card__metric-label">Gastado</span>
            <strong>{formatMoney(overview.totalSpent)}</strong>
          </div>
        </div>
      </div>

      <div
        className="moni-budget-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usageRatio * 100)}
        aria-label="Uso del presupuesto flexible"
      >
        <span
          className={`moni-budget-progress__bar moni-budget-progress__bar--${tone}`}
          style={{ width: `${usageRatio * 100}%` }}
        />
      </div>

      <div className="moni-budget-card__meta">
        <p className="moni-budget-card__hint">
          Ritmo sugerido: <strong>{formatMoney(overview.safeToSpend)}</strong> por día durante los
          próximos <strong>{overview.daysLeft}</strong> días.
        </p>
        {overview.alertRow ? (
          <p className="moni-budget-card__hint">
            Más exigida: <strong>{overview.alertRow.emoji} {overview.alertRow.short}</strong>{' '}
            con {formatMoney(overview.alertRow.spent)} de {formatMoney(overview.alertRow.limit)}.
          </p>
        ) : null}
      </div>

      <div className="moni-budget-topcats">
        {overview.rows.slice(0, 3).map((row) => {
          const rowTone =
            row.remaining < 0 ? 'danger' : row.ratio >= 0.85 ? 'warning' : 'healthy'
          return (
            <div key={row.id} className="moni-budget-topcats__row">
              <div className="moni-budget-topcats__head">
                <span className="moni-budget-topcats__name">
                  {row.emoji} {row.short}
                </span>
                <span className={`moni-budget-topcats__amount moni-budget-topcats__amount--${rowTone}`}>
                  {formatMoney(row.remaining)}
                </span>
              </div>
              <div className="moni-budget-progress moni-budget-progress--compact" aria-hidden="true">
                <span
                  className={`moni-budget-progress__bar moni-budget-progress__bar--${rowTone}`}
                  style={{ width: `${Math.max(6, Math.min(100, row.progress * 100))}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
