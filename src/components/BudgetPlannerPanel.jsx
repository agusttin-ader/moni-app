import { useMemo, useState } from 'react'
import { EXPENSE_CATEGORIES } from '../lib/expenseCategories.js'
import { budgetProgressRows } from '../lib/calculations.js'
import { amountFieldError } from '../lib/formValidation.js'
import { formatMoney } from '../lib/format.js'

export function BudgetPlannerPanel({ state, dispatch }) {
  const rows = useMemo(() => budgetProgressRows(state), [state])
  const [editingId, setEditingId] = useState(null)
  const [categoryId, setCategoryId] = useState(EXPENSE_CATEGORIES[0]?.id ?? 'food')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [error, setError] = useState(null)

  const reset = () => {
    setEditingId(null)
    setCategoryId(EXPENSE_CATEGORIES[0]?.id ?? 'food')
    setMonthlyLimit('')
    setError(null)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const nextError = amountFieldError(monthlyLimit)
    if (nextError) {
      setError(nextError)
      return
    }
    dispatch({
      type: 'budget/save',
      payload: {
        id: editingId,
        categoryId,
        monthlyLimit: Number(String(monthlyLimit).replace(',', '.')),
      },
    })
    reset()
  }

  const startEdit = (row) => {
    setEditingId(row.id)
    setCategoryId(row.categoryId)
    setMonthlyLimit(String(row.limit))
    setError(null)
  }

  return (
    <section className="moni-panel moni-panel--budget" aria-label="Presupuestos flexibles">
      <div className="moni-panel__headline">
        <h3 className="moni-panel__title">Presupuestos flexibles</h3>
        <p className="moni-panel__subtitle">Topes mensuales para proteger tu margen y tus metas</p>
      </div>

      <form className="moni-form moni-form--compact moni-form--panel" onSubmit={onSubmit}>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Categoría</span>
            <select
              className="moni-input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.emoji} {category.label}
                </option>
              ))}
            </select>
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Tope mensual</span>
            <input
              className="moni-input"
              inputMode="decimal"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        {error ? (
          <p className="moni-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="moni-form-actions">
          <button type="submit" className="moni-btn moni-btn--primary moni-btn--sm">
            {editingId ? 'Guardar tope' : 'Agregar tope'}
          </button>
          {editingId ? (
            <button type="button" className="moni-btn moni-btn--ghost moni-btn--sm" onClick={reset}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {!rows.length ? (
        <p className="moni-empty">
          Definí tu primer presupuesto y Moni lo va a usar también como referencia para la proyección.
        </p>
      ) : (
        <div className="moni-budget-list">
          {rows.map((row) => {
            const tone =
              row.remaining < 0 ? 'danger' : row.ratio >= 0.85 ? 'warning' : 'healthy'
            return (
              <article key={row.id} className={`moni-budget-item moni-budget-item--${tone}`}>
                <div className="moni-budget-item__body">
                  <div className="moni-budget-item__head">
                    <div>
                      <div className="moni-budget-item__name">
                        {row.emoji} {row.label}
                      </div>
                      <div className="moni-budget-item__meta">
                        {formatMoney(row.spent)} de {formatMoney(row.limit)}
                      </div>
                    </div>
                    <div className={`moni-budget-item__remaining moni-budget-item__remaining--${tone}`}>
                      {formatMoney(row.remaining)}
                    </div>
                  </div>
                  <div className="moni-budget-progress moni-budget-progress--compact" aria-hidden="true">
                    <span
                      className={`moni-budget-progress__bar moni-budget-progress__bar--${tone}`}
                      style={{ width: `${Math.max(6, Math.min(100, row.progress * 100))}%` }}
                    />
                  </div>
                </div>
                <div className="moni-budget-item__actions">
                  <button
                    type="button"
                    className="moni-action-btn"
                    onClick={() => startEdit(row)}
                    aria-label={`Editar presupuesto de ${row.label}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M4 16.5V20h3.5L19 8.5l-3.5-3.5L4 16.5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.5 5l3.5 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="moni-sr-only">Editar</span>
                  </button>
                  <button
                    type="button"
                    className="moni-action-btn moni-action-btn--danger"
                    onClick={() => dispatch({ type: 'budget/delete', payload: { id: row.id } })}
                    aria-label={`Eliminar presupuesto de ${row.label}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path
                        d="M6 6l12 12M18 6l-12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="moni-sr-only">Eliminar</span>
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
