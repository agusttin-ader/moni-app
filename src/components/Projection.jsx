import { useEffect, useMemo, useState } from 'react'
import {
  PROJECTION_HORIZON_MONTHS,
  projectionBalanceClassSuffix,
  projectionDetailRows,
} from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'

function shortMonthLabel(row) {
  const k = String(row?.monthKey ?? '')
  if (k === 'actual') return 'Ahora'
  if (k === 'siguiente') return '+1 mes'
  const m = /^siguiente\+(\d+)$/.exec(k)
  if (m) return `+${Number(m[1]) + 1} meses`
  return String(row?.title ?? '')
}

/** viewBox ancho (100) × bajo (~38): el wrap usa aspect-ratio ancho para usar todo el ancho de la tarjeta. */
const BCHART_VB_H = 38

/** Escala Y según saldos reales: arriba = más saldo, abajo = menos (déficit). */
function balanceChartGeometry(rows) {
  const balances = rows.map((r) => Number(r.balance) || 0)
  let minB = Math.min(...balances)
  let maxB = Math.max(...balances)
  if (minB === maxB) {
    const pad = Math.max(Math.abs(minB) * 0.08, 1)
    minB -= pad
    maxB += pad
  }
  const span = Math.max(maxB - minB, 1e-9)
  const padY = 5
  const innerH = BCHART_VB_H - 2 * padY
  const yFor = (b) => padY + innerH * ((maxB - b) / span)
  const yZero =
    minB <= 0 && maxB >= 0
      ? yFor(0)
      : minB > 0
        ? padY + innerH + 1.5
        : padY - 1.5

  const padX = 3.5
  const innerW = 100 - 2 * padX

  const points = rows.map((row, index) => {
    const x =
      rows.length > 1 ? padX + (index / (rows.length - 1)) * innerW : 50
    const y = Math.min(
      BCHART_VB_H - 3,
      Math.max(3, yFor(row.balance)),
    )
    return { x, y, balance: row.balance }
  })

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return { points, linePath: d, yZero, showZeroLine: minB < 0 && maxB > 0 }
}

export function Projection({ state }) {
  const rows = projectionDetailRows(state, PROJECTION_HORIZON_MONTHS)
  const [ready, setReady] = useState(false)

  const geo = useMemo(() => balanceChartGeometry(rows), [rows])
  const dataSignature = useMemo(
    () => rows.map((r) => r.balance).join('|'),
    [rows],
  )

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) setReady(false)
    })
    const id = requestAnimationFrame(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [dataSignature])

  return (
    <section className="moni-card moni-projection" id="proyeccion">
      <div className="moni-card__head">
        <h3 className="moni-card__title">Flujo proyectado</h3>
        <p className="moni-card__sub">
          Línea según <strong>saldo neto</strong> de cada mes (ingresos − gastos
          fijos − cuotas). Abajo el detalle en números.
        </p>
      </div>

      <div
        className="moni-projection-chart"
        role="img"
        aria-label={`Saldo neto proyectado en ${PROJECTION_HORIZON_MONTHS} meses`}
      >
        <div
          className={`moni-projection-chart__svg-wrap ${ready ? 'moni-projection-chart--ready' : ''}`}
        >
          <svg
            className="moni-projection-chart__svg"
            viewBox={`0 0 100 ${BCHART_VB_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {geo.showZeroLine ? (
              <line
                className="moni-projection-chart__zero"
                x1={1}
                y1={geo.yZero}
                x2={99}
                y2={geo.yZero}
              />
            ) : null}
            <path
              className="moni-projection-chart__path"
              d={geo.linePath}
              pathLength="1"
            />
            {geo.points.map((p, i) => (
              <circle
                key={`${rows[i].monthKey}-pt`}
                className={`moni-projection-chart__dot moni-projection-chart__dot--${projectionBalanceClassSuffix(p.balance)}`}
                cx={p.x}
                cy={p.y}
                r="3.25"
              />
            ))}
          </svg>
        </div>
        <ul className="moni-projection-chart__key">
          {rows.map((row) => (
            <li key={row.monthKey}>
              <span className="moni-projection-chart__key-label">
                {shortMonthLabel(row)}
              </span>
              <span
                className={`moni-projection-chart__key-val moni-projection-chart__key-val--${projectionBalanceClassSuffix(row.balance)}`}
              >
                {formatMoney(row.balance)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="moni-projection-list">
        {rows.map((row) => {
          const suf = projectionBalanceClassSuffix(row.balance)
          return (
            <li
              key={row.monthKey}
              className={`moni-projection-item moni-projection-item--${suf}`}
            >
              <div>
                <div className="moni-projection-item__title">{row.title}</div>
                <div className="moni-projection-item__meta">
                  Ingresos {formatMoney(row.incomes)} · Egresos{' '}
                  {formatMoney(row.fixed + row.debts)}
                </div>
              </div>
              <div className="moni-projection-item__balance">
                {formatMoney(row.balance)}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
