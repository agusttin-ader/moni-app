import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { currentYearMonthString } from '../../lib/calculations.js'
import { buildCategoryDistributionForMonth, buildSavingsCumulativeSeries } from '../../lib/detailsSeries.js'
import { formatMoney } from '../../lib/format.js'
import { BreakdownFlowChart } from '../BreakdownFlowChart.jsx'
import { Projection } from '../Projection.jsx'
import { RemainingSummary } from '../RemainingSummary.jsx'

const PIE_COLORS = [
  '#0d9488',
  '#6366f1',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#64748b',
]

const tipMoney = (value) => formatMoney(value)

const chartMotion = {
  animationDuration: 850,
  animationEasing: 'ease-out',
  isAnimationActive: true,
}

/**
 * Detalles (móvil): mismos bloques de contexto que el dashboard web + gráficos propios.
 * @param {{ state: object, onBack: () => void }} props
 */
export function DetailsScreen({ state, onBack }) {
  const ym = currentYearMonthString()
  const categoryData = buildCategoryDistributionForMonth(state, ym)
  const savingsCumulative = buildSavingsCumulativeSeries(state)

  return (
    <div className="moni-details moni-details--premium">
      <header className="moni-details__header moni-details__header--anim">
        <button type="button" className="moni-details__back" onClick={onBack} aria-label="Volver">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="moni-details__title">Detalles</h1>
      </header>

      <div className="moni-details__scroll">
        <div className="moni-details__web-stack moni-details__anim" style={{ '--anim-order': 0 }}>
          <RemainingSummary state={state} />
        </div>

        <div className="moni-details__web-stack moni-details__anim" style={{ '--anim-order': 1 }}>
          <BreakdownFlowChart state={state} />
        </div>

        <div className="moni-details__web-stack moni-details__projection-wrap moni-details__anim" style={{ '--anim-order': 2 }}>
          <Projection state={state} />
        </div>

        <section
          className="moni-details__section moni-details__anim"
          aria-labelledby="moni-details-categories"
          style={{ '--anim-order': 3 }}
        >
          <h2 id="moni-details-categories" className="moni-details__h2">
            Gasto variable por categoría
          </h2>
          <p className="moni-details__sub">Mes actual</p>
          {categoryData.length > 0 ? (
            <div className="moni-details__chart-wrap moni-details__chart-wrap--split">
              <div className="moni-details__pie">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={850}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.categoryId} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={tipMoney} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="moni-details__bar-side">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={categoryData.slice(0, 6)}
                    layout="vertical"
                    margin={{ left: 4, right: 8 }}
                    {...chartMotion}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" horizontal />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip formatter={tipMoney} />
                    <Bar dataKey="value" name="Gasto" fill="#0d9488" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="moni-details__empty">Sin gastos variables este mes.</p>
          )}
        </section>

        <section className="moni-details__section moni-details__anim" aria-labelledby="moni-details-savings" style={{ '--anim-order': 4 }}>
          <h2 id="moni-details-savings" className="moni-details__h2">
            Ahorro acumulado
          </h2>
          {savingsCumulative.length > 0 ? (
            <div className="moni-details__chart-wrap">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={savingsCumulative} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} {...chartMotion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 9, fill: 'var(--eth-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(d) => String(d).slice(5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--eth-muted)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 0 }).format(v)
                    }
                  />
                  <Tooltip formatter={tipMoney} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Acumulado"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="moni-details__empty">Todavía no registraste ahorros.</p>
          )}
        </section>
      </div>
    </div>
  )
}
