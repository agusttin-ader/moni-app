import { useMemo, useState } from 'react'
import { EXPENSE_CATEGORIES } from '../../lib/expenseCategories.js'
import { VARIABLE_INCOME_CATEGORIES } from '../../lib/incomeVariableCategories.js'
import {
  currentYearMonthString,
  normalizeStartMonth,
  previewDailyExpenseGoalImpact,
} from '../../lib/calculations.js'
import { amountFieldError, nameFieldError } from '../../lib/formValidation.js'
import { formatMoney } from '../../lib/format.js'

function todayISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const pickerOptions = [
  {
    id: 'variable',
    title: 'Gasto variable',
    hint: 'Algo que pagaste este mes',
    icon: 'variable',
  },
  {
    id: 'savings',
    title: 'Ahorro',
    hint: 'Apartá plata para tu meta',
    icon: 'savings',
  },
  {
    id: 'fixed',
    title: 'Gasto fijo',
    hint: 'Suscripción, alquiler, etc.',
    icon: 'fixed',
  },
  {
    id: 'income',
    title: 'Ingreso extra',
    hint: 'Variable: freelance, ventas…',
    icon: 'income',
  },
]

function PickerIcon({ name }) {
  const a = { width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.65 }
  switch (name) {
    case 'variable':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...a}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 8h8M8 12h6M8 16h5" strokeLinecap="round" />
        </svg>
      )
    case 'savings':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...a}>
          <ellipse cx="12" cy="14" rx="7" ry="4" />
          <path d="M5 14V10a7 7 0 0114 0v4" strokeLinecap="round" />
          <path d="M12 10v-3" strokeLinecap="round" />
        </svg>
      )
    case 'fixed':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...a}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
          <path d="M12 15h.01" strokeLinecap="round" strokeWidth="2.5" />
        </svg>
      )
    case 'income':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...a}>
          <path d="M4 17V7a2 2 0 012-2h3" strokeLinecap="round" />
          <path d="M7 14l3-3 3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 9V5h-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

function AddTypePicker({ onPick, onClose }) {
  return (
    <div className="moni-add-flow moni-add-flow--picker">
      <header className="moni-add-flow__picker-top">
        <div className="moni-add-flow__picker-titles">
          <h2 className="moni-add-flow__h2">Nuevo movimiento</h2>
          <p className="moni-add-flow__lead">Elegí qué querés registrar</p>
        </div>
        <button type="button" className="moni-add-flow__close" onClick={onClose} aria-label="Cerrar">
          <span aria-hidden>×</span>
        </button>
      </header>
      <ul className="moni-add-flow__list" role="list">
        {pickerOptions.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              className={`moni-add-flow__option moni-add-flow__option--${opt.icon}`}
              onClick={() => onPick(opt.id)}
            >
              <span className="moni-add-flow__option-icon" aria-hidden>
                <PickerIcon name={opt.icon} />
              </span>
              <span className="moni-add-flow__option-text">
                <span className="moni-add-flow__option-title">{opt.title}</span>
                <span className="moni-add-flow__option-hint">{opt.hint}</span>
              </span>
              <span className="moni-add-flow__option-chev" aria-hidden>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AddEntryFlow({ state, dispatch, onDone }) {
  const [entryType, setEntryType] = useState(null)

  if (!entryType) {
    return <AddTypePicker onPick={setEntryType} onClose={onDone} />
  }

  return (
    <AddTypeForm
      entryType={entryType}
      state={state}
      dispatch={dispatch}
      onBack={() => setEntryType(null)}
      onDone={onDone}
    />
  )
}

function defaultCategoryIdForEntryType(entryType) {
  if (entryType === 'income') return 'varios'
  return 'food'
}

function AddTypeForm({ entryType, state, dispatch, onBack, onDone }) {
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(() => defaultCategoryIdForEntryType(entryType))
  const [note, setNote] = useState('')
  const [date, setDate] = useState(todayISODate)
  const [showMore, setShowMore] = useState(false)
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('mensual')
  const [startMonth, setStartMonth] = useState(() => currentYearMonthString())
  const [error, setError] = useState(null)

  const insight = useMemo(() => {
    if (entryType !== 'variable') return null
    return previewDailyExpenseGoalImpact(state, amount)
  }, [entryType, state, amount])

  const submit = (e) => {
    e.preventDefault()
    setError(null)
    const errAmt = amountFieldError(amount)
    if (errAmt) {
      setError(errAmt)
      return
    }
    const amt = Number(String(amount).replace(',', '.'))
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('Monto inválido.')
      return
    }
    const d = String(date).slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setError('Fecha inválida.')
      return
    }

    if (entryType === 'variable') {
      dispatch({
        type: 'dailyExpense/add',
        payload: { amount: amt, categoryId, date: d, note: note.trim() },
      })
    } else if (entryType === 'savings') {
      dispatch({
        type: 'savings/add',
        payload: { amount: amt, date: d, note: note.trim() },
      })
    } else if (entryType === 'fixed') {
      const errN = nameFieldError(name)
      if (errN) {
        setError(errN)
        return
      }
      dispatch({
        type: 'expense/add',
        payload: {
          name: name.trim(),
          amount: amt,
          categoryId,
          frequency,
          startMonth: normalizeStartMonth(startMonth || currentYearMonthString()),
        },
      })
    } else if (entryType === 'income') {
      dispatch({
        type: 'variableIncome/add',
        payload: { amount: amt, categoryId, date: d, note: note.trim() },
      })
    }
    onDone?.()
  }

  const titles = {
    variable: 'Gasto',
    savings: 'Ahorro',
    fixed: 'Gasto fijo',
    income: 'Ingreso',
  }
  const titleHints = {
    variable: 'Registrá un consumo del día',
    savings: 'Sumá un aporte a tu meta',
    fixed: 'Cargá un compromiso recurrente',
    income: 'Anotá un ingreso variable',
  }

  return (
    <form className={`moni-add-flow moni-add-flow--form moni-add-flow--${entryType}`} onSubmit={submit}>
      <div className="moni-add-flow__toolbar">
        <button type="button" className="moni-add-flow__back" onClick={onBack} aria-label="Volver">
          ←
        </button>
        <span className="moni-add-flow__toolbar-copy">
          <span className="moni-add-flow__toolbar-title">{titles[entryType]}</span>
          <span className="moni-add-flow__toolbar-hint">{titleHints[entryType]}</span>
        </span>
        <span className="moni-add-flow__toolbar-spacer" aria-hidden />
      </div>

      <div className="moni-add-flow__body">
        <label className="moni-add-flow__amount-wrap">
          <span className="moni-sr-only">Monto</span>
          <span className="moni-add-flow__currency">$</span>
          <input
            className="moni-add-flow__amount"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            autoComplete="off"
            autoFocus
          />
        </label>

        {entryType === 'fixed' && (
          <label className="moni-field moni-field--tight">
            <span className="moni-field__label">Nombre</span>
            <input className="moni-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Alquiler" />
          </label>
        )}

        {(entryType === 'variable' || entryType === 'fixed') && (
          <div className="moni-add-flow__chips" role="group" aria-label="Categoría">
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`moni-chip${categoryId === c.id ? ' is-active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                <span aria-hidden>{c.emoji}</span> {c.short}
              </button>
            ))}
          </div>
        )}

        {entryType === 'income' && (
          <div className="moni-add-flow__chips" role="group" aria-label="Tipo">
            {VARIABLE_INCOME_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`moni-chip${categoryId === c.id ? ' is-active' : ''}`}
                onClick={() => setCategoryId(c.id)}
              >
                <span aria-hidden>{c.emoji}</span> {c.short}
              </button>
            ))}
          </div>
        )}

        {entryType === 'variable' && insight && (
          <div className={`moni-add-flow__insight moni-add-flow__insight--${insight.tone}`} role="status">
            <p className="moni-add-flow__insight-line">
              Después: <strong>{formatMoney(insight.marginAfter)}</strong> de margen
            </p>
            {insight.goalLine ? <p className="moni-add-flow__insight-goal">{insight.goalLine}</p> : null}
          </div>
        )}

        {(entryType === 'variable' || entryType === 'savings' || entryType === 'income') && (
          <label className="moni-field moni-field--tight">
            <span className="moni-field__label">Nota</span>
            <input
              className="moni-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
              autoComplete="off"
            />
          </label>
        )}

        <button
          type="button"
          className="moni-add-flow__more-toggle"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
        >
          {showMore ? 'Menos opciones' : 'Más opciones'}
        </button>

        {showMore ? (
          <div className="moni-add-flow__more">
            {(entryType === 'variable' || entryType === 'savings' || entryType === 'income') && (
              <label className="moni-field moni-field--tight">
                <span className="moni-field__label">Fecha</span>
                <input className="moni-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
            )}
            {entryType === 'fixed' && (
              <>
                <label className="moni-field moni-field--tight">
                  <span className="moni-field__label">Frecuencia</span>
                  <select className="moni-input" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </label>
                <label className="moni-field moni-field--tight">
                  <span className="moni-field__label">Desde</span>
                  <input
                    className="moni-input moni-input--month"
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="moni-form-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="moni-add-flow__footer">
        <button type="submit" className="moni-btn moni-btn--primary moni-btn--block moni-add-flow__submit">
          Guardar
        </button>
      </div>
    </form>
  )
}
