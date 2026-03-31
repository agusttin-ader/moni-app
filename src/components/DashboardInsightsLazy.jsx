import { BreakdownFlowChart } from './BreakdownFlowChart.jsx'
import { Projection } from './Projection.jsx'
import { RemainingSummary } from './RemainingSummary.jsx'

/** Chunk aparte: gráficos y resúmenes del dashboard (carga diferida). */
export default function DashboardInsightsLazy({ state }) {
  return (
    <>
      <div className="moni-dashboard-insights__stack">
        <RemainingSummary state={state} />
      </div>
      <div className="moni-dashboard-insights__stack">
        <BreakdownFlowChart state={state} />
      </div>
      <div className="moni-dashboard-insights__full">
        <Projection state={state} />
      </div>
    </>
  )
}
