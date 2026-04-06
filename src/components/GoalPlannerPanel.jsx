import { useMemo, useState } from 'react'
import {
  activeGoalModel,
  effectiveGoalSavedAmount,
  goalCategoryLabel,
} from '../lib/calculations.js'
import { amountFieldError, nameFieldError } from '../lib/formValidation.js'
import { formatISODateShort, formatMoney, formatYearMonth } from '../lib/format.js'

const GOAL_CATEGORIES = [
  { id: 'relocation', label: 'Mudanza / nuevo comienzo' },
  { id: 'emergency', label: 'Fondo de emergencia' },
  { id: 'travel', label: 'Viaje' },
  { id: 'home', label: 'Hogar' },
  { id: 'education', label: 'Formación' },
  { id: 'other', label: 'Otra meta' },
]

export function GoalPlannerPanel({ state, dispatch, onRegisterSavings }) {
  const goals = useMemo(() => state.goals ?? [], [state.goals])
  const activeGoal = activeGoalModel(state)
  const savingsSorted = useMemo(
    () =>
      [...(state.savingsEntries ?? [])].sort((a, b) =>
        String(b.date).localeCompare(String(a.date)),
      ),
    [state.savingsEntries],
  )
  const [editingId, setEditingId] = useState(null)
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [savedAmount, setSavedAmount] = useState('')
  const [targetMonth, setTargetMonth] = useState('')
  const [priority, setPriority] = useState('medium')
  const [category, setCategory] = useState('relocation')
  const [error, setError] = useState(null)
  const [savingsEditId, setSavingsEditId] = useState(null)
  const [savingsEditAmount, setSavingsEditAmount] = useState('')
  const [savingsEditDate, setSavingsEditDate] = useState('')
  const [savingsLedgerError, setSavingsLedgerError] = useState(null)

  const reset = () => {
    setEditingId(null)
    setTitle('')
    setTargetAmount('')
    setSavedAmount('')
    setTargetMonth('')
    setPriority('medium')
    setCategory('relocation')
    setError(null)
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const titleError = nameFieldError(title)
    const amountError = amountFieldError(targetAmount)
    const savedError =
      String(savedAmount).trim() === '' ? null : amountFieldError(savedAmount)
    if (titleError || amountError || savedError) {
      setError(titleError || amountError || savedError)
      return
    }
    if (!targetMonth) {
      setError('Elegí el mes objetivo de esta meta.')
      return
    }
    dispatch({
      type: 'goal/save',
      payload: {
        id: editingId,
        title: title.trim(),
        targetAmount: Number(String(targetAmount).replace(',', '.')),
        savedAmount: Number(String(savedAmount || '0').replace(',', '.')),
        targetMonth,
        priority,
        category,
      },
    })
    reset()
  }

  const startEdit = (goal) => {
    setEditingId(goal.id)
    setTitle(goal.title)
    setTargetAmount(String(goal.targetAmount))
    setSavedAmount(String(goal.savedAmount ?? 0))
    setTargetMonth(goal.targetMonth)
    setPriority(goal.priority ?? 'medium')
    setCategory(goal.category ?? 'other')
    setError(null)
  }

  return (
    <section className="moni-panel moni-panel--goal" aria-label="Objetivos financieros">
      <div className="moni-panel__headline">
        <h3 className="moni-panel__title">Objetivos</h3>
        <p className="moni-panel__subtitle">La meta activa guía la lectura futura de MONI</p>
      </div>

      <form className="moni-form moni-form--compact moni-form--panel" onSubmit={onSubmit}>
        <label className="moni-field">
          <span className="moni-field__label">Meta</span>
          <input
            className="moni-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. Irme a vivir al sur"
          />
        </label>

        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Monto objetivo</span>
            <input
              className="moni-input"
              inputMode="decimal"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Base inicial</span>
            <input
              className="moni-input"
              inputMode="decimal"
              value={savedAmount}
              onChange={(event) => setSavedAmount(event.target.value)}
              placeholder="0"
            />
            <span className="moni-field__hint">Opcional. La barra de meta usa solo ahorros registrados.</span>
          </label>
        </div>

        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Mes objetivo</span>
            <input
              type="month"
              className="moni-input moni-input--month"
              value={targetMonth}
              onChange={(event) => setTargetMonth(event.target.value)}
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Prioridad</span>
            <select
              className="moni-input"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </label>
        </div>

        <label className="moni-field">
          <span className="moni-field__label">Tipo de objetivo</span>
          <select
            className="moni-input"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {GOAL_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="moni-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="moni-form-actions">
          <button type="submit" className="moni-btn moni-btn--primary moni-btn--sm">
            {editingId ? 'Guardar meta' : 'Crear meta'}
          </button>
          {editingId ? (
            <button type="button" className="moni-btn moni-btn--ghost moni-btn--sm" onClick={reset}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="moni-savings-ledger">
        <div className="moni-savings-ledger__head">
          <h4 className="moni-savings-ledger__title">Ahorros registrados</h4>
          {onRegisterSavings ? (
            <button
              type="button"
              className="moni-btn moni-btn--secondary moni-btn--sm"
              onClick={() => onRegisterSavings()}
            >
              + Registrar ahorro
            </button>
          ) : null}
        </div>
        <p className="moni-savings-ledger__sub">
          Cada movimiento suma al total ahorrado de tu <strong>meta activa</strong> y actualiza la barra de
          progreso en Inicio.
        </p>
        {!savingsSorted.length ? (
          <p className="moni-empty moni-savings-ledger__empty">Todavía no registraste ahorros desde Moni.</p>
        ) : (
          <ul className="moni-savings-ledger__list">
            {savingsSorted.map((entry) => {
              const isEditing = savingsEditId === entry.id
              return (
                <li key={entry.id} className="moni-savings-ledger__item">
                  {isEditing ? (
                    <div className="moni-savings-ledger__edit">
                      <div className="moni-form-row moni-form-row--split">
                        <label className="moni-field">
                          <span className="moni-field__label">Monto</span>
                          <input
                            className="moni-input"
                            inputMode="decimal"
                            value={savingsEditAmount}
                            onChange={(e) => setSavingsEditAmount(e.target.value)}
                          />
                        </label>
                        <label className="moni-field">
                          <span className="moni-field__label">Fecha</span>
                          <input
                            type="date"
                            className="moni-input"
                            value={savingsEditDate}
                            onChange={(e) => setSavingsEditDate(e.target.value)}
                          />
                        </label>
                      </div>
                      {savingsLedgerError ? (
                        <p className="moni-form-error" role="alert">
                          {savingsLedgerError}
                        </p>
                      ) : null}
                      <div className="moni-savings-ledger__edit-actions">
                        <button
                          type="button"
                          className="moni-btn moni-btn--primary moni-btn--sm"
                          onClick={() => {
                            const err = amountFieldError(savingsEditAmount)
                            if (err) {
                              setSavingsLedgerError(err)
                              return
                            }
                            const d = String(savingsEditDate).slice(0, 10)
                            if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
                              setSavingsLedgerError('Elegí una fecha válida.')
                              return
                            }
                            const amt = Number(String(savingsEditAmount).replace(',', '.'))
                            if (!Number.isFinite(amt) || amt <= 0) {
                              setSavingsLedgerError('Ingresá un monto mayor a cero.')
                              return
                            }
                            setSavingsLedgerError(null)
                            dispatch({
                              type: 'savings/update',
                              payload: { id: entry.id, amount: amt, date: d },
                            })
                            setSavingsEditId(null)
                          }}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          className="moni-btn moni-btn--ghost moni-btn--sm"
                          onClick={() => {
                            setSavingsEditId(null)
                            setSavingsLedgerError(null)
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="moni-savings-ledger__main">
                        <span className="moni-savings-ledger__amount">{formatMoney(entry.amount)}</span>
                        <span className="moni-savings-ledger__date">{formatISODateShort(entry.date)}</span>
                      </div>
                      <div className="moni-savings-ledger__actions">
                        <button
                          type="button"
                          className="moni-action-btn"
                          onClick={() => {
                            setSavingsEditId(entry.id)
                            setSavingsEditAmount(String(entry.amount))
                            setSavingsEditDate(String(entry.date ?? '').slice(0, 10))
                            setSavingsLedgerError(null)
                          }}
                          aria-label="Editar ahorro"
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
                        </button>
                        <button
                          type="button"
                          className="moni-action-btn moni-action-btn--danger"
                          onClick={() => {
                            if (
                              typeof window !== 'undefined' &&
                              !window.confirm('¿Eliminar este registro de ahorro?')
                            ) {
                              return
                            }
                            dispatch({ type: 'savings/delete', payload: { id: entry.id } })
                          }}
                          aria-label="Eliminar ahorro"
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
                        </button>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {activeGoal ? (
        <p className="moni-hint">
          Activa ahora: <strong>{activeGoal.title}</strong> para {formatYearMonth(activeGoal.targetMonth)}.
        </p>
      ) : null}

      {!goals.length ? (
        <p className="moni-empty">
          Cuando crees una meta, MONI te va a decir si es viable y qué deberías priorizar primero.
        </p>
      ) : (
        <div className="moni-goal-list">
          {goals.map((goal) => (
            <article key={goal.id} className="moni-goal-list__item">
              <div className="moni-goal-list__body">
                <div className="moni-goal-list__name">{goal.title}</div>
                <div className="moni-goal-list__meta">
                  {goalCategoryLabel(goal.category)} · {formatMoney(effectiveGoalSavedAmount(state, goal))} de{' '}
                  {formatMoney(goal.targetAmount)} · {formatYearMonth(goal.targetMonth)}
                </div>
              </div>
              <div className="moni-goal-list__actions">
                <button
                  type="button"
                  className="moni-action-btn"
                  onClick={() => startEdit(goal)}
                  aria-label={`Editar ${goal.title}`}
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
                </button>
                <button
                  type="button"
                  className="moni-action-btn moni-action-btn--danger"
                  onClick={() => dispatch({ type: 'goal/delete', payload: { id: goal.id } })}
                  aria-label={`Eliminar ${goal.title}`}
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
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
