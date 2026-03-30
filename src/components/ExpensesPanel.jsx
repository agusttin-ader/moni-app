import { useState } from 'react'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'
import { amountFieldError, nameFieldError } from '../lib/formValidation.js'
import { formatMoney } from '../lib/format.js'

export function ExpensesPanel({ items, dispatch }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const reset = () => {
    setEditingId(null)
    setName('')
    setAmount('')
    setError(null)
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    const eN = nameFieldError(name)
    const eA = amountFieldError(amount)
    if (eN || eA) {
      setError(eN || eA)
      return
    }
    setError(null)
    const payload = {
      name: name.trim(),
      amount: Number(String(amount).replace(',', '.')),
    }
    if (editingId) {
      dispatch({ type: 'expense/update', payload: { id: editingId, ...payload } })
    } else {
      dispatch({ type: 'expense/add', payload })
    }
    reset()
  }

  const startEdit = (x) => {
    setEditingId(x.id)
    setName(x.name)
    setAmount(String(x.amount))
    setError(null)
  }

  return (
    <section className="moni-panel" aria-label="Gastos fijos">
      <h3 className="moni-panel__title">Gastos fijos</h3>
      <form
        className="moni-form moni-form--compact moni-form--panel"
        onSubmit={onSubmit}
        autoComplete="off"
      >
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Concepto</span>
            <input
              className="moni-input"
              name="expense-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. alquiler"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Monto / mes</span>
            <input
              className="moni-input"
              name="expense-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            {editingId ? 'Guardar' : 'Agregar'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="moni-btn moni-btn--ghost moni-btn--sm"
              onClick={reset}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      {!items.length ? (
        <p className="moni-empty">No hay gastos cargados.</p>
      ) : (
        <CollapsiblePanelDetail
          labelCollapsed={`Ver gastos fijos (${items.length})`}
          labelOpen="Ocultar gastos"
        >
          <ul className="moni-list moni-list--embedded">
            {items.map((x) => (
              <li key={x.id} className="moni-list__item">
                <div>
                  <div className="moni-list__name">{x.name}</div>
                  <div className="moni-list__meta">{formatMoney(x.amount)}</div>
                </div>
                <div className="moni-list__actions">
                  <button
                    type="button"
                    className="moni-action-btn"
                    onClick={() => startEdit(x)}
                    aria-label="Editar gasto"
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
                    onClick={() =>
                      dispatch({ type: 'expense/delete', payload: { id: x.id } })
                    }
                    aria-label="Eliminar gasto"
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
              </li>
            ))}
          </ul>
        </CollapsiblePanelDetail>
      )}
    </section>
  )
}
