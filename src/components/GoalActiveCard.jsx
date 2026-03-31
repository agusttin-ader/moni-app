import {
  activeGoalModel,
  goalAdviceSummary,
  goalCategoryLabel,
  goalAdviceItems,
} from '../lib/calculations.js'
import { formatMoney, formatYearMonth } from '../lib/format.js'

function viabilityCopy(goal) {
  switch (goal.viability) {
    case 'viable':
      return 'Viable'
    case 'tight':
      return 'Ajustada'
    default:
      return 'En riesgo'
  }
}

export function GoalActiveCard({ state }) {
  const goal = activeGoalModel(state)
  const advice = goalAdviceItems(state)

  if (!goal) {
    return (
      <section className="moni-card moni-goal-card moni-goal-card--empty" aria-label="Meta activa">
        <div className="moni-card__head">
          <h3 className="moni-card__title">Meta activa</h3>
          <p className="moni-card__sub">
            Definí una meta con monto y fecha para que MONI te diga si tu situación actual alcanza.
          </p>
        </div>
      </section>
    )
  }

  const tone =
    goal.viability === 'viable'
      ? 'positive'
      : goal.viability === 'tight'
        ? 'warning'
        : 'negative'

  return (
    <section className={`moni-card moni-goal-card moni-goal-card--${tone}`} aria-label="Meta activa">
      <div className="moni-goal-card__topline">
        <div>
          <p className="moni-goal-card__eyebrow">{goalCategoryLabel(goal.category)}</p>
          <h3 className="moni-goal-card__title">{goal.title}</h3>
        </div>
        <span className={`moni-goal-card__pill moni-goal-card__pill--${tone}`}>
          {viabilityCopy(goal)}
        </span>
      </div>

      <div className="moni-goal-card__grid">
        <div>
          <span className="moni-goal-card__label">Objetivo</span>
          <strong className="moni-goal-card__value">{formatMoney(goal.targetAmount)}</strong>
        </div>
        <div>
          <span className="moni-goal-card__label">Fecha</span>
          <strong className="moni-goal-card__value">{formatYearMonth(goal.targetMonth)}</strong>
        </div>
        <div>
          <span className="moni-goal-card__label">Ahorrado hoy</span>
          <strong className="moni-goal-card__value">{formatMoney(goal.savedAmount)}</strong>
        </div>
        <div>
          <span className="moni-goal-card__label">Faltante mensual</span>
          <strong className="moni-goal-card__value">{formatMoney(goal.requiredPerMonth)}</strong>
        </div>
      </div>

      <div className="moni-goal-progress">
        <div className="moni-goal-progress__track" aria-hidden="true">
          <span
            className="moni-goal-progress__fill"
            style={{ width: `${Math.max(4, Math.min(100, goal.progress * 100))}%` }}
          />
        </div>
        <div className="moni-goal-progress__meta">
          <span>{goal.monthsLeft} meses por delante</span>
          <span>{formatMoney(goal.projectedByTarget)} proyectados al cierre</span>
        </div>
      </div>

      <p className="moni-goal-card__summary">
        {goalAdviceSummary(goal, advice, formatMoney)}
      </p>
    </section>
  )
}
