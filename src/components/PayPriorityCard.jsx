import { debtPaymentPriorityItems } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'

function itemSummary(item) {
  const share = Math.round(item.cashflowShare * 100)
  const kind = item.debtKind === 'credit_card' ? 'Tarjeta' : 'Préstamo'
  return `${kind} · ${share}% de tu ingreso mensual`
}

export function PayPriorityCard({ state }) {
  const items = debtPaymentPriorityItems(state, 3)

  return (
    <section className="moni-card moni-pay-priority" aria-label="Prioridad de pagos">
      <div className="moni-card__head">
        <h3 className="moni-card__title">Pagá esto primero</h3>
        <p className="moni-card__sub">
          Ranking híbrido: costo financiero, riesgo de mora, urgencia e impacto en tu flujo.
        </p>
      </div>

      {!items.length ? (
        <p className="moni-empty">
          Cargá deudas activas para recibir una prioridad clara de pagos.
        </p>
      ) : (
        <div className="moni-pay-priority__list">
          {items.map((item, index) => (
            <article
              key={item.id}
              className={`moni-pay-priority__item moni-pay-priority__item--${item.tone}`}
            >
              <div className="moni-pay-priority__rank">{index + 1}</div>
              <div className="moni-pay-priority__body">
                <p className="moni-pay-priority__name">{item.debtName}</p>
                <p className="moni-pay-priority__meta">{itemSummary(item)}</p>
                <div className="moni-pay-priority__stats">
                  <span>Cuota {formatMoney(item.monthly)}</span>
                  <span>{item.remInstallments} cuotas restantes</span>
                </div>
              </div>
              <div className="moni-pay-priority__score">
                <span className="moni-pay-priority__score-label">Prioridad</span>
                <strong>{item.score}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
