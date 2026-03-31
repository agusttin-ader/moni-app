import { budgetProgressRows, variableCategorySpendingRows } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'

export function BreakdownFlowChart({ state }) {
  const budgetRows = budgetProgressRows(state)
  const hasBudget = budgetRows.length > 0
  const rows = (hasBudget ? budgetRows : variableCategorySpendingRows(state)).slice(0, 5)
  const footerLabel = hasBudget
    ? `${budgetRows.length} categorías con tope activo`
    : 'Categorías con mayor gasto variable este mes'

  return (
    <section className="moni-card moni-chart-card moni-spending-card" aria-label="Presión de categorías">
      <div className="moni-card__head moni-chart-card__head">
        <h3 className="moni-card__title">
          {hasBudget ? 'Presión por categoría' : 'Dónde se te va el gasto variable'}
        </h3>
        <p className="moni-card__sub">
          {hasBudget
            ? 'Detectá rápido qué categoría está condicionando más tu meta y tu margen futuro.'
            : 'Todavía no hay topes configurados. Esto te muestra dónde conviene ordenar primero el gasto diario.'}
        </p>
      </div>

      {!rows.length ? (
        <p className="moni-budget-card__empty">
          Registrá gastos variables para empezar a ver patrones.
        </p>
      ) : (
        <div className="moni-spending-chart">
          {rows.map((row) => {
            const ratio = hasBudget ? row.progress : row.share
            const tone = hasBudget
              ? row.remaining < 0
                ? 'danger'
                : row.ratio >= 0.85
                  ? 'warning'
                  : 'healthy'
              : 'healthy'
            return (
              <div key={row.categoryId ?? row.id} className="moni-spending-chart__row">
                <div className="moni-spending-chart__head">
                  <span className="moni-spending-chart__name">
                    {row.emoji} {row.short}
                  </span>
                  <span className={`moni-spending-chart__value moni-spending-chart__value--${tone}`}>
                    {formatMoney(row.spent)}
                    {hasBudget ? ` / ${formatMoney(row.limit)}` : ''}
                  </span>
                </div>
                <div className="moni-budget-progress moni-budget-progress--compact" aria-hidden="true">
                  <span
                    className={`moni-budget-progress__bar moni-budget-progress__bar--${tone}`}
                    style={{ width: `${Math.max(7, Math.min(100, ratio * 100))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="moni-chart-card__footer">
        <span className="moni-chart-card__footer-label">Lectura rápida</span>
        <strong className="moni-chart-card__footer-value moni-chart-card__footer-value--pos">
          {footerLabel}
        </strong>
        <span className="moni-chart-card__footer-hint">
          {hasBudget
            ? 'Si una barra está al límite, esa categoría ya compite directamente con tu objetivo.'
            : 'Definir presupuestos convierte este bloque en una guía concreta para priorizar.'}
        </span>
      </div>
    </section>
  )
}
