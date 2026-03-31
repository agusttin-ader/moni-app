import { useEffect, useState } from 'react'
import { breakdownFlowChartModel } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'

const DONUT_R = 38
const DONUT_CX = 50
const DONUT_CY = 50
const DONUT_STROKE = 9.5
const DONUT_STROKE_HOVER = 11.5
const DONUT_CIRC = 2 * Math.PI * DONUT_R

export function BreakdownFlowChart({ state }) {
  const [ready, setReady] = useState(false)
  const [hoverSeg, setHoverSeg] = useState(null)
  const m = breakdownFlowChartModel(state)
  const d = m.donut

  useEffect(() => {
    let cancelled = false
    let id2 = 0
    const id1 = requestAnimationFrame(() => {
      if (cancelled) return
      setHoverSeg(null)
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
  }, [state.ingresos, state.gastos, state.deudas, state.gastosDiarios])

  const pctLabel =
    m.marginPct != null && Number.isFinite(m.marginPct)
      ? `${Math.round(m.marginPct)}% de tus ingresos`
      : null

  const pctContextPhrase =
    d.percentContext === 'egreso' ? 'de tus egresos del mes' : 'de tus ingresos del mes'

  const circles = []
  let cumFrac = 0
  for (let i = 0; i < d.segments.length; i++) {
    const s = d.segments[i]
    const len = s.fraction * DONUT_CIRC
    const offset = -cumFrac * DONUT_CIRC
    cumFrac += s.fraction
    const active = hoverSeg?.id === s.id
    const strokeW = active ? DONUT_STROKE_HOVER : DONUT_STROKE
    circles.push(
      <circle
        key={s.id}
        className={`moni-donut-arc moni-donut-arc--${s.kind}`}
        r={DONUT_R}
        cx={DONUT_CX}
        cy={DONUT_CY}
        fill="none"
        stroke={s.color}
        strokeWidth={strokeW}
        strokeLinecap="butt"
        strokeDasharray={ready ? `${len} ${DONUT_CIRC}` : `0 ${DONUT_CIRC}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
        style={{
          transitionDelay: ready ? `${i * 48}ms` : '0ms',
          filter: active ? 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' : undefined,
        }}
        pointerEvents={s.kind === 'empty' ? 'none' : 'stroke'}
        onPointerEnter={() => setHoverSeg(s)}
      />,
    )
  }

  const tooltipVisible = hoverSeg && hoverSeg.kind !== 'empty'
  const showConceptBreakdown = d.variant !== 'empty'

  return (
    <section
      className={`moni-card moni-chart-card ${ready ? 'moni-chart-card--ready' : ''}`}
      aria-label="Gráfico de reparto del flujo del mes"
    >
      <div className="moni-card__head moni-chart-card__head">
        <h3 className="moni-card__title">Flujo del mes</h3>
        <p className="moni-card__sub">
          Colores por concepto; cuotas en rojos. Pasá el mouse sobre la rueda para el porcentaje.
          El detalle por ítem está en la sección de abajo (flecha).
        </p>
      </div>

      <div
        className="moni-donut-block"
        onPointerLeave={(e) => {
          const t = e.relatedTarget
          if (t instanceof Node && e.currentTarget.contains(t)) return
          setHoverSeg(null)
        }}
      >
        <div className="moni-donut-row moni-donut-row--chart">
          <div className="moni-donut-visual">
            <div
              className={`moni-donut-tooltip${tooltipVisible ? ' moni-donut-tooltip--visible' : ''}`}
              role="status"
              aria-hidden={!tooltipVisible}
            >
              {tooltipVisible ? (
                <>
                  <span className="moni-donut-tooltip__name">{hoverSeg.label}</span>
                  <span className="moni-donut-tooltip__pct">
                    <strong>{hoverSeg.pctLabel}</strong>{' '}
                    <span className="moni-donut-tooltip__ctx">{pctContextPhrase}</span>
                  </span>
                  <span className="moni-donut-tooltip__amt">{formatMoney(hoverSeg.amount)}</span>
                </>
              ) : null}
            </div>

            <svg className="moni-donut-svg" viewBox="0 0 100 100" aria-hidden="true">
              <circle
                className="moni-donut-track"
                r={DONUT_R}
                cx={DONUT_CX}
                cy={DONUT_CY}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={DONUT_STROKE}
              />
              {circles}
            </svg>
            <div className="moni-donut-center">
              <span className="moni-donut-center__label">{d.centerLabel}</span>
              <strong className="moni-donut-center__val">{formatMoney(d.centerAmount)}</strong>
            </div>
          </div>
        </div>

        {showConceptBreakdown ? (
          <CollapsiblePanelDetail
            className="moni-collapse--chart"
            labelCollapsed="Ver reparto por concepto"
            labelOpen="Ocultar detalle del reparto"
            scrollMaxClass="moni-collapse__scroll--chart"
          >
            <ul className="moni-donut-legend moni-donut-legend--in-collapse">
              {d.segments.map((s) => (
                <li
                  key={s.id}
                  className={`moni-donut-legend__item moni-donut-legend__item--${s.kind} ${hoverSeg?.id === s.id ? 'moni-donut-legend__item--active' : ''}`}
                  onPointerEnter={() => s.kind !== 'empty' && setHoverSeg(s)}
                >
                  <span
                    className="moni-donut-legend__swatch"
                    style={{ background: s.color }}
                  />
                  <div className="moni-donut-legend__text">
                    <span className="moni-donut-legend__name">{s.label}</span>
                    <span className="moni-donut-legend__amt">{formatMoney(s.amount)}</span>
                  </div>
                  <span className="moni-donut-legend__pct">{s.pctLabel}</span>
                </li>
              ))}
            </ul>
          </CollapsiblePanelDetail>
        ) : null}
      </div>

      {d.hint ? <p className="moni-donut-caption">{d.hint}</p> : null}

      <div className="moni-chart-card__footer">
        <span className="moni-chart-card__footer-label">Saldo después de egresos</span>
        <strong
          className={`moni-chart-card__footer-value moni-chart-card__footer-value--${m.remaining >= 0 ? 'pos' : 'neg'}`}
        >
          {formatMoney(m.remaining)}
        </strong>
        {pctLabel ? (
          <span className="moni-chart-card__footer-hint">{pctLabel}</span>
        ) : null}
      </div>
    </section>
  )
}
