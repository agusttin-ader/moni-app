import { useEffect, useMemo, useState } from 'react'
import { useNarrowViewport } from '../hooks/useNarrowViewport.js'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'
import { amountFieldError, nameFieldError } from '../lib/formValidation.js'
import { formatMoney, formatYearMonth } from '../lib/format.js'

export function IncomesPanel({ items, dispatch, expandFormSignal = 0, listFilterQuery = '' }) {
  const narrow = useNarrowViewport()
  const filteredItems = useMemo(() => {
    const q = (listFilterQuery ?? '').trim().toLowerCase()
    if (!q) return items
    return items.filter((x) =>
      String(x.name ?? '')
        .toLowerCase()
        .includes(q),
    )
  }, [items, listFilterQuery])

  const [addFormOpen, setAddFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [effectiveFromMonth, setEffectiveFromMonth] = useState('')
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (expandFormSignal <= 0) return
    queueMicrotask(() => setAddFormOpen(true))
  }, [expandFormSignal])

  const reset = () => {
    setEditingId(null)
    setName('')
    setAmount('')
    setEffectiveFromMonth('')
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
    const payloadBase = {
      name: name.trim(),
      amount: Number(String(amount).replace(',', '.')),
      frequency: 'mensual',
      effectiveFromMonth: effectiveFromMonth.trim() || undefined,
    }
    if (editingId) {
      dispatch({
        type: 'income/update',
        payload: {
          id: editingId,
          ...payloadBase,
        },
      })
    } else {
      dispatch({
        type: 'income/add',
        payload: payloadBase,
      })
    }
    reset()
  }

  const startEdit = (x) => {
    setEditingId(x.id)
    setName(x.name)
    setAmount(String(x.amount))
    setEffectiveFromMonth(
      x.effectiveFromMonth != null ? String(x.effectiveFromMonth) : '',
    )
    setError(null)
  }

  const form = (
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
            name="income-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. sueldo"
          />
        </label>
        <label className="moni-field">
          <span className="moni-field__label">Monto / mes</span>
          <input
            className="moni-input"
            name="income-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </label>
      </div>
      <label className="moni-field">
        <span className="moni-field__label">Disponible desde (opcional)</span>
        <input
          type="month"
          className="moni-input moni-input--month"
          name="income-from-month"
          value={effectiveFromMonth}
          onChange={(e) => setEffectiveFromMonth(e.target.value)}
        />
      </label>
      <p className="moni-debt-micro">
        Si lo dejás vacío, Moni cuenta este ingreso en <strong>todos</strong> los meses de la
        proyección. Si recién vas a cobrar a partir de un mes (cambio de laburo, aguinaldo, etc.),
        elegí ese mes: hasta entonces no entra en el saldo mensual.
      </p>
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
  )

  return (
    <section className="moni-panel" id="moni-panel-ingresos" aria-label="Ingresos">
      <h3 className="moni-panel__title">Ingresos</h3>
      {narrow ? (
        <CollapsiblePanelDetail
          className="moni-collapse--panel-form"
          labelCollapsed="Cargar ingreso"
          labelOpen="Ocultar formulario"
          open={addFormOpen || Boolean(editingId)}
          onOpenChange={setAddFormOpen}
        >
          {form}
        </CollapsiblePanelDetail>
      ) : (
        form
      )}

      {!items.length ? (
        <p className="moni-empty">No hay ingresos cargados.</p>
      ) : (
        <CollapsiblePanelDetail
          labelCollapsed={`Ver ingresos cargados (${items.length})`}
          labelOpen="Ocultar ingresos"
        >
          {!filteredItems.length ? (
            <p className="moni-empty">Ningún ingreso coincide con la búsqueda.</p>
          ) : (
          <ul className="moni-list moni-list--embedded">
            {filteredItems.map((x) => (
              <li key={x.id} className="moni-list__item">
                <div>
                  <div className="moni-list__name">{x.name}</div>
                  <div className="moni-list__meta">
                    {formatMoney(x.amount)} · mensual
                    {x.effectiveFromMonth
                      ? ` · desde ${formatYearMonth(x.effectiveFromMonth)}`
                      : null}
                  </div>
                </div>
                <div className="moni-list__actions">
                  <button
                    type="button"
                    className="moni-action-btn"
                    onClick={() => startEdit(x)}
                    aria-label="Editar ingreso"
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
                      dispatch({ type: 'income/delete', payload: { id: x.id } })
                    }
                    aria-label="Eliminar ingreso"
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
          )}
        </CollapsiblePanelDetail>
      )}
    </section>
  )
}
