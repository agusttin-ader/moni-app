import { useMemo, useState } from 'react'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'
import {
  currentYearMonthString,
  debtIsFinished,
  debtMonthlyPreviewFromFormFields,
  debtSummaryForList,
  normalizeStartMonth,
  remainingInstallments,
} from '../lib/calculations.js'
import {
  amountFieldError,
  intFieldError,
  nameFieldError,
} from '../lib/formValidation.js'
import { formatMoney } from '../lib/format.js'

export function DebtsPanel({ items, dispatch }) {
  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentCount, setInstallmentCount] = useState('')
  const [startMonth, setStartMonth] = useState(() => currentYearMonthString())
  const [paidInstallments, setPaidInstallments] = useState('0')
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const preview = useMemo(
    () => debtMonthlyPreviewFromFormFields(totalAmount, installmentCount),
    [totalAmount, installmentCount],
  )

  const reset = () => {
    setEditingId(null)
    setName('')
    setTotalAmount('')
    setInstallmentCount('')
    setStartMonth(currentYearMonthString())
    setPaidInstallments('0')
    setError(null)
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    const eN = nameFieldError(name)
    const eT = amountFieldError(totalAmount)
    const eC = intFieldError(installmentCount, 'cantidad de cuotas')
    if (eN || eT || eC) {
      setError(eN || eT || eC)
      return
    }
    const paid = String(paidInstallments).trim()
    const paidN = paid === '' ? 0 : Number(paid.replace(',', '.'))
    if (!Number.isInteger(paidN) || paidN < 0) {
      setError('Cuotas pagadas debe ser un entero mayor o igual a 0.')
      return
    }
    setError(null)
    const count = Math.floor(Number(String(installmentCount).replace(',', '.')))
    const payload = {
      name: name.trim(),
      totalAmount: Number(String(totalAmount).replace(',', '.')),
      installmentCount: count,
      startMonth: normalizeStartMonth(startMonth),
      paidInstallments: paidN,
    }
    if (editingId) {
      dispatch({ type: 'debt/update', payload: { id: editingId, ...payload } })
    } else {
      dispatch({ type: 'debt/add', payload })
    }
    reset()
  }

  const startEdit = (x) => {
    setEditingId(x.id)
    setName(x.name)
    setTotalAmount(String(x.totalAmount))
    setInstallmentCount(String(x.installmentCount))
    setStartMonth(x.startMonth || currentYearMonthString())
    setPaidInstallments(String(x.paidInstallments ?? 0))
    setError(null)
  }

  return (
    <section className="moni-panel moni-panel--debts" aria-label="Deudas">
      <h3 className="moni-panel__title">Deudas (cuotas)</h3>

      <form
        className="moni-form moni-form--compact moni-form--panel moni-form--debts"
        onSubmit={onSubmit}
        autoComplete="off"
      >
        <label className="moni-field">
          <span className="moni-field__label">Concepto</span>
          <input
            className="moni-input"
            name="debt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. tarjeta, préstamo"
          />
        </label>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Total a pagar</span>
            <input
              className="moni-input"
              name="debt-total"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Nº cuotas</span>
            <input
              className="moni-input"
              name="debt-installments"
              inputMode="numeric"
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
              placeholder="12"
            />
          </label>
        </div>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Primer mes</span>
            <input
              type="month"
              className="moni-input moni-input--month"
              name="debt-start"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Ya pagadas</span>
            <input
              className="moni-input"
              name="debt-paid"
              inputMode="numeric"
              value={paidInstallments}
              onChange={(e) => setPaidInstallments(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        {preview != null ? (
          <p className="moni-hint">
            Cuota mensual estimada: <strong>{formatMoney(preview)}</strong>
          </p>
        ) : null}
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
        <p className="moni-empty">No hay deudas cargadas.</p>
      ) : (
        <CollapsiblePanelDetail
          labelCollapsed={`Ver deudas cargadas (${items.length})`}
          labelOpen="Ocultar deudas"
        >
          <ul className="moni-list moni-list--embedded">
            {items.map((x) => {
              const s = debtSummaryForList(x)
              const fin = debtIsFinished(x)
              const rem = remainingInstallments(x)
              return (
                <li key={x.id} className="moni-list__item">
                  <div>
                    <div className="moni-list__name">{x.name}</div>
                    <div className="moni-list__meta">
                      Total {formatMoney(x.totalAmount)} · {x.installmentCount}{' '}
                      cuotas
                      {fin ? (
                        <span className="moni-tag moni-tag--done"> finalizada</span>
                      ) : (
                        <>
                          {' '}
                          · cuota {formatMoney(s.perMonth)} · faltan {rem}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="moni-list__actions">
                    <button
                      type="button"
                    className="moni-action-btn"
                      onClick={() => startEdit(x)}
                    aria-label="Editar deuda"
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
                        dispatch({ type: 'debt/delete', payload: { id: x.id } })
                      }
                    aria-label="Eliminar deuda"
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
              )
            })}
          </ul>
        </CollapsiblePanelDetail>
      )}
    </section>
  )
}
