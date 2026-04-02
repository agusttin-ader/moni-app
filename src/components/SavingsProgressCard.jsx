import { useCallback, useEffect, useState } from 'react'
import { savingsProgressModel } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function SavingsProgressCard({ state, dispatch, onRegisterSavings }) {
  const model = savingsProgressModel(state)
  const savedA = useAnimatedNumber(model.saved)
  const [goalDraft, setGoalDraft] = useState(() =>
    model.goal > 0 ? String(model.goal) : '',
  )
  const [goalEditing, setGoalEditing] = useState(false)

  useEffect(() => {
    if (!goalEditing) {
      setGoalDraft(model.goal > 0 ? String(model.goal) : '')
    }
  }, [model.goal, goalEditing])

  const persistGoal = useCallback(() => {
    const n = Number(String(goalDraft).replace(',', '.')) || 0
    dispatch({ type: 'savings/setMonthlyGoal', payload: { monthlyGoal: Math.max(0, n) } })
    setGoalEditing(false)
  }, [dispatch, goalDraft])

  const barPct = model.hasGoal ? Math.max(0, Math.min(100, model.ratio * 100)) : 0

  const contextLine = model.hasGoal
    ? model.met
      ? `${model.pct}% · Meta cumplida`
      : `${model.pct}% · Faltan ${formatMoney(model.remaining)}`
    : model.saved > 0
      ? `${formatMoney(savedA)} registrados · Definí una meta para la barra`
      : 'Definí una meta mensual y registrá cada ahorro'

  const vsPrev =
    model.savedPrevMonth > 0
      ? model.saved >= model.savedPrevMonth
        ? `Mejor que el mes pasado (${formatMoney(model.savedPrevMonth)}).`
        : `Mes anterior: ${formatMoney(model.savedPrevMonth)}.`
      : null

  return (
    <section className="moni-card moni-savings-card" aria-label="Ahorro del mes">
      <div className="moni-savings-card__top">
        <h3 className="moni-card__title moni-savings-card__title">Ahorro del mes</h3>
        <button
          type="button"
          className="moni-btn moni-btn--secondary moni-btn--sm moni-savings-card__add"
          onClick={() => onRegisterSavings?.()}
        >
          + Agregar ahorro
        </button>
      </div>

      <p className="moni-savings-card__main-value" aria-live="polite">
        <strong className="moni-savings-card__current">{formatMoney(savedA)}</strong>
        <span className="moni-savings-card__slash"> / </span>
        {goalEditing ? (
          <span className="moni-savings-card__goal-edit">
            <input
              className="moni-input moni-savings-card__goal-input"
              inputMode="decimal"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={persistGoal}
              onKeyDown={(e) => {
                if (e.key === 'Enter') persistGoal()
              }}
              aria-label="Meta mensual de ahorro"
            />
          </span>
        ) : (
          <button
            type="button"
            className="moni-savings-card__goal-btn"
            onClick={() => {
              setGoalDraft(model.goal > 0 ? String(model.goal) : '')
              setGoalEditing(true)
            }}
          >
            {model.goal > 0 ? formatMoney(model.goal) : 'definir meta'}
          </button>
        )}
      </p>

      <div className="moni-savings-strip" aria-hidden="true">
        <div className="moni-savings-strip__track">
          <span className="moni-savings-strip__fill" style={{ width: `${barPct}%` }} />
        </div>
      </div>

      <p className="moni-savings-card__context">{contextLine}</p>
      {vsPrev ? <p className="moni-savings-card__compare">{vsPrev}</p> : null}
    </section>
  )
}
