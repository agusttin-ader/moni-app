import { useEffect, useState } from 'react'
import {
  PROJECTION_HORIZON_MONTHS,
  projectionBalanceBarsModel,
} from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'

export function ProjectionBalanceChart({ state }) {
  const [ready, setReady] = useState(false)
  const model = projectionBalanceBarsModel(state, 3)

  useEffect(() => {
    let cancelled = false
    let id2 = 0
    const id1 = requestAnimationFrame(() => {
      if (cancelled) return
      setReady(false)
      id2 = requestAnimationFrame(() => {
        if (!cancelled) setReady(true)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [state.ingresos, state.gastos, state.deudas])

  return (
    <section
      className={`moni-card moni-chart-card moni-proj-chart ${ready ? 'moni-chart-card--ready' : ''}`}
      aria-label="Gráfico de saldo neto proyectado por mes"
    >
      <div className="moni-card__head moni-chart-card__head">
        <h3 className="moni-card__title">Saldo proyectado</h3>
        <p className="moni-card__sub">
          Cuánto te quedaría cada mes con los datos actuales (misma escala en los{' '}
          {PROJECTION_HORIZON_MONTHS} meses).
        </p>
      </div>

      <div
        className="moni-proj-chart__plot"
        style={
          model.hasMixedSign
            ? { '--moni-zero-line': `${model.zeroLineFrac * 100}%` }
            : undefined
        }
      >
        {model.hasMixedSign ? (
          <div className="moni-proj-chart__zero" aria-hidden="true" />
        ) : null}
        {model.rows.map((row, index) => (
          <div key={row.monthKey} className="moni-proj-chart__col">
            <div className="moni-proj-chart__col-inner">
              <div
                className={`moni-proj-chart__bar moni-proj-chart__bar--${row.tone}`}
                style={{
                  height: ready ? `${row.heightFrac * 100}%` : '0%',
                  transitionDelay: `${index * 70}ms`,
                }}
                title={`${row.title}: ${formatMoney(row.balance)}`}
              />
            </div>
            <span className="moni-proj-chart__col-label">{row.title}</span>
            <span className={`moni-proj-chart__col-val moni-proj-chart__col-val--${row.tone}`}>
              {formatMoney(row.balance)}
            </span>
          </div>
        ))}
      </div>

      <p className="moni-proj-chart__hint">
        Si una columna baja respecto de la anterior, el saldo mensual se
        reduce (por ejemplo por más cuotas en ciertos meses).
      </p>
    </section>
  )
}
