import { useMemo, useState } from 'react'
import {
  activeGoalModel,
  goalAdviceItems,
  goalAdviceSummary,
  goalMotivationMessage,
} from '../lib/calculations.js'
import { requestAiAdviceSummary, aiAdviceAvailable } from '../lib/adviceAi.js'
import { formatMoney } from '../lib/format.js'

function detailForItem(item) {
  switch (item.id) {
    case 'goal-gap':
      return `Necesitás liberar ${formatMoney(item.monthlyGap)} por mes y todavía hay una brecha total de ${formatMoney(item.shortfall)}.`
    case 'goal-track':
      return `Separá ${formatMoney(item.reservePerMonth)} por mes y sostené esa disciplina para no salirte del objetivo.`
    case 'category-pressure':
      return `${item.categoryEmoji} ${item.categoryLabel} está usando ${formatMoney(item.categorySpent)} sobre ${formatMoney(item.categoryLimit)}.`
    case 'debt-pressure':
      return `${item.debtName} consume ${formatMoney(item.debtMonthly)} por mes y hoy compite con tu meta.`
    case 'fixed-load':
      return `Tus compromisos fijos ya absorben ${Math.round(item.fixedShare * 100)}% del ingreso mensual.`
    case 'save-now':
      return `Ya tenés margen para reservar ${formatMoney(item.reservePerMonth)} este mes.`
    case 'setup-budget':
      return 'Definir topes por categoría te va a dar más control para sostener el plan.'
    default:
      return ''
  }
}

export function GoalAdviceCard({ state }) {
  const goal = activeGoalModel(state)
  const items = goalAdviceItems(state)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [aiError, setAiError] = useState('')
  const baseSummary = useMemo(
    () => goalAdviceSummary(goal, items, formatMoney),
    [goal, items],
  )
  const motivation = useMemo(() => goalMotivationMessage(goal, items), [goal, items])

  const onGenerateAiSummary = async () => {
    setAiError('')
    setAiBusy(true)
    try {
      const next = await requestAiAdviceSummary(goal, items, baseSummary)
      if (next) setAiSummary(next)
      else setAiError('No hubo respuesta de la capa asistida.')
    } catch {
      setAiError('No pudimos generar la explicación asistida en este momento.')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <section className="moni-card moni-advice-card" aria-label="Recomendaciones">
      <div className="moni-card__head">
        <h3 className="moni-card__title">Qué priorizar ahora</h3>
        <p className="moni-card__sub">
          Tres decisiones concretas según tu meta y tus números de este mes.
        </p>
      </div>

      <p className="moni-advice-card__summary">
        {baseSummary}
      </p>
      <p className="moni-advice-card__motivation">{motivation}</p>

      {aiAdviceAvailable() ? (
        <div className="moni-advice-card__ai">
          <button
            type="button"
            className="moni-btn moni-btn--ghost moni-btn--sm"
            onClick={onGenerateAiSummary}
            disabled={aiBusy}
          >
            {aiBusy ? 'Generando explicación...' : 'Explicación asistida'}
          </button>
          {aiSummary ? <p className="moni-advice-card__ai-text">{aiSummary}</p> : null}
          {aiError ? <p className="moni-form-error">{aiError}</p> : null}
        </div>
      ) : null}

      {!items.length ? (
        <p className="moni-empty">Definí una meta en Planificación para ver qué conviene hacer primero.</p>
      ) : (
        <div className="moni-advice-list">
          {items.map((item, index) => (
            <article key={item.id} className={`moni-advice-item moni-advice-item--${item.tone}`}>
              <div className="moni-advice-item__rank">{index + 1}</div>
              <div className="moni-advice-item__body">
                <div className="moni-advice-item__title">{item.title}</div>
                <div className="moni-advice-item__text">{detailForItem(item)}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
