import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  PROJECTION_HORIZON_MONTHS,
  projectionBalanceClassSuffix,
  projectionDetailRows,
  projectionShortLabel,
} from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'

/**
 * Escala Y según saldos reales: arriba = más saldo, abajo = menos (déficit).
 * `viewW` ancho del viewBox (alto 100): debe coincidir con el aspect ratio del
 * contenedor para que, con meet, los puntos en X queden sobre la grilla de abajo.
 */
function balanceChartGeometry(rows, viewW = 100) {
  const balances = rows.map((r) => Number(r.balance) || 0)
  let minB = Math.min(...balances)
  let maxB = Math.max(...balances)
  if (minB === maxB) {
    const pad = Math.max(Math.abs(minB) * 0.08, 1)
    minB -= pad
    maxB += pad
  }
  const span = Math.max(maxB - minB, 1e-9)
  const padY = 10
  const innerH = 100 - 2 * padY
  const yFor = (b) => padY + innerH * ((maxB - b) / span)
  const yZero =
    minB <= 0 && maxB >= 0 ? yFor(0) : minB > 0 ? padY + innerH + 2 : padY - 2

  const n = rows.length
  const padX = viewW * 0.04
  const padX2 = viewW * 0.96
  const points = rows.map((row, index) => {
    const x =
      n <= 1 ? viewW / 2 : padX + ((index + 0.5) / n) * (padX2 - padX)
    const y = Math.min(96, Math.max(4, yFor(row.balance)))
    return { x, y, balance: row.balance }
  })

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return {
    points,
    linePath: d,
    yZero,
    showZeroLine: minB < 0 && maxB > 0,
    lineX1: padX,
    lineX2: padX2,
  }
}

function clonePathPoints(pts) {
  return pts.map((p) => ({ x: p.x, y: p.y, balance: p.balance }))
}

function pathDFromPoints(pts) {
  return pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
}

const PROJECTION_LINE_ANIM_MS = 480

export function Projection({ state }) {
  const rows = useMemo(
    () => projectionDetailRows(state, PROJECTION_HORIZON_MONTHS),
    [state],
  )
  const [chartViewW, setChartViewW] = useState(100)
  const chartWrapRef = useRef(null)
  const displayPointsRef = useRef(null)
  const lineAnimRafRef = useRef(0)
  const [renderPoints, setRenderPoints] = useState(null)
  const [expandedMonths, setExpandedMonths] = useState(() => ({}))
  const dotR = rows.length > 4 ? 3 : 4

  useLayoutEffect(() => {
    const el = chartWrapRef.current
    if (!el) return undefined
    const apply = () => {
      const r = el.getBoundingClientRect()
      if (r.width >= 1 && r.height >= 1) {
        setChartViewW((r.width / r.height) * 100)
      }
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const geo = useMemo(
    () => balanceChartGeometry(rows, chartViewW),
    [rows, chartViewW],
  )

  useEffect(() => {
    return () => cancelAnimationFrame(lineAnimRafRef.current)
  }, [])

  useEffect(() => {
    cancelAnimationFrame(lineAnimRafRef.current)
    const targetPts = geo.points
    const fromPts = displayPointsRef.current

    if (!fromPts || fromPts.length !== targetPts.length) {
      displayPointsRef.current = clonePathPoints(targetPts)
      queueMicrotask(() => setRenderPoints(null))
      return
    }

    const same = targetPts.every(
      (p, i) =>
        Math.abs(p.x - fromPts[i].x) < 1e-9 &&
        Math.abs(p.y - fromPts[i].y) < 1e-9,
    )
    if (same) {
      return
    }

    const startFrom = clonePathPoints(fromPts)
    const startTime = performance.now()
    const easeOutCubic = (t) => 1 - (1 - t) ** 3

    function tick(now) {
      const t = Math.min(1, (now - startTime) / PROJECTION_LINE_ANIM_MS)
      const e = easeOutCubic(t)
      const blended = targetPts.map((p, i) => {
        const f = startFrom[i] ?? p
        return {
          x: f.x + (p.x - f.x) * e,
          y: f.y + (p.y - f.y) * e,
          balance: p.balance,
        }
      })
      displayPointsRef.current = blended
      setRenderPoints(blended)
      if (t < 1) {
        lineAnimRafRef.current = requestAnimationFrame(tick)
      } else {
        displayPointsRef.current = clonePathPoints(targetPts)
        setRenderPoints(null)
      }
    }

    lineAnimRafRef.current = requestAnimationFrame(tick)
  }, [geo])

  const drawPoints = renderPoints ?? geo.points
  const linePathDraw = pathDFromPoints(drawPoints)

  const toggleMonthDetail = (monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }))
  }

  return (
    <section className="moni-card moni-projection" id="proyeccion">
      <div className="moni-card__head">
        <h3 className="moni-card__title">Flujo proyectado</h3>
        <p className="moni-card__sub">
          Línea según <strong>saldo neto</strong> de cada mes (ingresos − gastos
          fijos − variables del mes − cuotas). Los montos de abajo siguen a cada
          punto del gráfico.
        </p>
      </div>

      <div
        className="moni-projection-chart"
        role="img"
        aria-label="Saldo neto proyectado en seis meses"
      >
        <div ref={chartWrapRef} className="moni-projection-chart__svg-wrap">
          <svg
            className="moni-projection-chart__svg"
            viewBox={`0 0 ${chartViewW} 100`}
            preserveAspectRatio="xMidYMid meet"
          >
            {geo.showZeroLine ? (
              <line
                className="moni-projection-chart__zero"
                x1={geo.lineX1}
                y1={geo.yZero}
                x2={geo.lineX2}
                y2={geo.yZero}
              />
            ) : null}
            <path className="moni-projection-chart__path" d={linePathDraw} />
            {drawPoints.map((p, i) => (
              <circle
                key={`${rows[i].monthKey}-pt`}
                className={`moni-projection-chart__dot moni-projection-chart__dot--${projectionBalanceClassSuffix(p.balance)}`}
                cx={p.x}
                cy={p.y}
                r={dotR}
              />
            ))}
          </svg>
        </div>
        <ul
          className="moni-projection-chart__key"
          style={{ '--projection-cols': rows.length }}
        >
          {rows.map((row) => (
            <li key={row.monthKey}>
              <span className="moni-projection-chart__key-label">
                {projectionShortLabel(row.title)}
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

      <CollapsiblePanelDetail
        className="moni-collapse--projection-list"
        labelCollapsed="Proyección a meses"
        labelOpen="Ocultar detalle por mes"
        contentClassName="moni-collapse__projection-body"
        scrollMaxClass="moni-collapse__scroll--projection"
      >
        <p className="moni-card__sub moni-projection__list-hint">
          Abrí cada mes para ver el desglose de ingresos y egresos.
        </p>
        <ul className="moni-projection-list">
          {rows.map((row) => {
            const suf = projectionBalanceClassSuffix(row.balance)
            const open = Boolean(expandedMonths[row.monthKey])
            return (
              <li
                key={row.monthKey}
                className={`moni-projection-item-shell moni-projection-item-shell--${suf}`}
              >
                <button
                  type="button"
                  className="moni-projection-item moni-projection-item--toggle"
                  aria-expanded={open}
                  onClick={() => toggleMonthDetail(row.monthKey)}
                >
                  <div className="moni-projection-item__leading">
                    <span className="moni-projection-item__title">
                      {row.title}
                    </span>
                    <span className="moni-projection-item__hint">
                      {open ? 'Ocultar detalle' : 'Ver ingresos y egresos'}
                    </span>
                  </div>
                  <div className="moni-projection-item__balance">
                    {formatMoney(row.balance)}
                  </div>
                  <svg
                    className={`moni-projection-item__chev ${open ? 'moni-projection-item__chev--open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      fill="currentColor"
                      d="M12 15.5 6 8.25h12L12 15.5z"
                    />
                  </svg>
                </button>
                {open ? (
                  <div className="moni-projection-item__drawer moni-projection-item__drawer--open">
                    <div className="moni-projection-item__drawer-inner">
                      <p className="moni-projection-item__meta">
                        Ingresos {formatMoney(row.incomes)} · Fijos{' '}
                        {formatMoney(row.fixed)} · Variables{' '}
                        {formatMoney(row.daily)} · Cuotas{' '}
                        {formatMoney(row.debts)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </CollapsiblePanelDetail>
    </section>
  )
}
