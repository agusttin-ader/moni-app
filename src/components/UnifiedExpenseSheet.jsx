import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXPENSE_CATEGORIES } from '../lib/expenseCategories.js'
import { amountFieldError, nameFieldError } from '../lib/formValidation.js'
import { lockBodyScroll } from '../lib/bodyScrollLock.js'

function todayISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Un solo flujo para gasto fijo o variable: concepto, monto, tipo, categoría con emoji.
 */
export function UnifiedExpenseSheet({
  open,
  onClose,
  dispatch,
  gastos,
  gastosDiarios,
  sheetKey,
  sheetOpts,
}) {
  const [mode, setMode] = useState('variable')
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('food')
  const [date, setDate] = useState(todayISODate)
  const [fixedFrequency, setFixedFrequency] = useState('mensual')
  const [fixedStartMonth, setFixedStartMonth] = useState(() =>
    todayISODate().slice(0, 7),
  )
  const [error, setError] = useState(null)
  const [editingFixedId, setEditingFixedId] = useState(null)
  const [editingDailyId, setEditingDailyId] = useState(null)

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setError(null)
      const opt = sheetOpts ?? {}
      const ef = opt.editFixedId
      const ed = opt.editDailyId
      if (ef) {
        const x = (gastos ?? []).find((g) => g.id === ef)
        if (x) {
          setMode('fixed')
          setConcept(String(x.name ?? ''))
          setAmount(String(x.amount ?? ''))
          setCategoryId(String(x.categoryId ?? 'other'))
          setFixedFrequency(String(x.frequency ?? 'mensual'))
          setFixedStartMonth(String(x.startMonth ?? todayISODate().slice(0, 7)))
          setDate(todayISODate())
          setEditingFixedId(x.id)
          setEditingDailyId(null)
          return
        }
      }
      if (ed) {
        const x = (gastosDiarios ?? []).find((g) => g.id === ed)
        if (x) {
          setMode('variable')
          setConcept(String(x.note ?? ''))
          setAmount(String(x.amount ?? ''))
          setCategoryId(String(x.categoryId ?? 'other'))
          setDate(String(x.date ?? '').slice(0, 10) || todayISODate())
          setEditingDailyId(x.id)
          setEditingFixedId(null)
          return
        }
      }
      setEditingFixedId(null)
      setEditingDailyId(null)
      const pref = opt.preferMode
      if (pref === 'fixed' || pref === 'variable') {
        setMode(pref)
      } else {
        setMode('variable')
      }
      setConcept('')
      setAmount('')
      setCategoryId('food')
      setDate(todayISODate())
      setFixedFrequency('mensual')
      setFixedStartMonth(todayISODate().slice(0, 7))
    })
  }, [open, sheetKey, sheetOpts, gastos, gastosDiarios])

  useEffect(() => {
    if (!open) return undefined
    return lockBodyScroll()
  }, [open])

  const onSubmit = (ev) => {
    ev.preventDefault()
    const eN = nameFieldError(concept)
    const eA = amountFieldError(amount)
    if (eN || eA) {
      setError(eN || eA)
      return
    }
    if (mode === 'variable') {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        setError('Elegí una fecha válida.')
        return
      }
    }
    setError(null)
    const amt = Number(String(amount).replace(',', '.'))
    const note = String(concept).trim()

    if (mode === 'fixed') {
      const payload = {
        name: note,
        amount: amt,
        categoryId,
        frequency: fixedFrequency,
        startMonth: fixedStartMonth,
      }
      if (editingFixedId) {
        dispatch({
          type: 'expense/update',
          payload: { id: editingFixedId, ...payload },
        })
      } else {
        dispatch({ type: 'expense/add', payload })
      }
    } else {
      const payload = {
        amount: amt,
        categoryId,
        date,
        note,
      }
      if (editingDailyId) {
        dispatch({
          type: 'dailyExpense/update',
          payload: { id: editingDailyId, ...payload },
        })
      } else {
        dispatch({ type: 'dailyExpense/add', payload })
      }
    }
    onClose?.()
  }

  const editing = Boolean(editingFixedId || editingDailyId)
  const title = editing
    ? 'Editar gasto'
    : mode === 'fixed'
      ? 'Nuevo gasto fijo'
      : 'Nuevo gasto variable'

  if (!open) return null

  return createPortal(
    <div className="moni-unified-sheet" role="dialog" aria-modal="true" aria-labelledby="moni-unified-sheet-title">
      <button
        type="button"
        className="moni-unified-sheet__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="moni-unified-sheet__panel">
        <div className="moni-unified-sheet__grab" aria-hidden />
        <div className="moni-unified-sheet__head">
          <h2 id="moni-unified-sheet-title" className="moni-unified-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="moni-unified-sheet__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form className="moni-unified-sheet__form" onSubmit={onSubmit}>
          <label className="moni-field">
            <span className="moni-field__label">Concepto</span>
            <input
              className="moni-input"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej. supermercado, Netflix, colectivo"
              autoComplete="off"
            />
          </label>

          <label className="moni-field">
            <span className="moni-field__label">Monto</span>
            <input
              className="moni-input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </label>

          {!editing ? (
            <div className="moni-segment" role="group" aria-label="Tipo de gasto">
              <button
                type="button"
                className={`moni-segment__btn${mode === 'variable' ? ' is-active' : ''}`}
                onClick={() => setMode('variable')}
              >
                Gasto variable
              </button>
              <button
                type="button"
                className={`moni-segment__btn${mode === 'fixed' ? ' is-active' : ''}`}
                onClick={() => setMode('fixed')}
              >
                Gasto fijo
              </button>
            </div>
          ) : (
            <p className="moni-unified-sheet__mode-hint">
              {mode === 'fixed' ? 'Gasto fijo recurrente' : 'Gasto variable por día'}
            </p>
          )}

          {mode === 'variable' ? (
            <label className="moni-field">
              <span className="moni-field__label">Fecha</span>
              <input
                className="moni-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          ) : (
            <div className="moni-unified-sheet__row moni-unified-sheet__row--two">
              <label className="moni-field">
                <span className="moni-field__label">Frecuencia</span>
                <select
                  className="moni-input"
                  value={fixedFrequency}
                  onChange={(e) => setFixedFrequency(e.target.value)}
                >
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </label>
              <label className="moni-field">
                <span className="moni-field__label">Primer mes</span>
                <input
                  className="moni-input"
                  type="month"
                  value={fixedStartMonth}
                  onChange={(e) => setFixedStartMonth(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="moni-field">
            <span className="moni-field__label">Categoría</span>
            <div className="moni-category-grid" role="list">
              {EXPENSE_CATEGORIES.map((c) => {
                const active = categoryId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="listitem"
                    data-active={active ? 'true' : 'false'}
                    className={`moni-category-chip${active ? ' moni-category-chip--active' : ''}`}
                    onClick={() => setCategoryId(c.id)}
                    aria-pressed={active}
                  >
                    <span className="moni-category-chip__check" aria-hidden>
                      {active ? '✓' : ''}
                    </span>
                    <span className="moni-category-chip__emoji" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="moni-category-chip__text">{c.short}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <p className="moni-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="moni-unified-sheet__actions">
            <button type="submit" className="moni-btn moni-btn--primary moni-btn--block">
              {editing ? 'Guardar' : 'Agregar'}
            </button>
            <button type="button" className="moni-btn moni-btn--ghost moni-btn--block" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
