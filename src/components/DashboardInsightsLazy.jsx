import { BreakdownFlowChart } from './BreakdownFlowChart.jsx'
import { Projection } from './Projection.jsx'
import { ProjectionBalanceChart } from './ProjectionBalanceChart.jsx'
import { RemainingSummary } from './RemainingSummary.jsx'

/** Chunk aparte: gráficos y resúmenes del dashboard (carga diferida). */
export default function DashboardInsightsLazy({ state }) {
  return (
    <>
      <div className="moni-dashboard-insights__stack">
        <RemainingSummary state={state} />
        <BreakdownFlowChart state={state} />
      </div>
      <div className="moni-dashboard-insights__stack">
        <Projection state={state} />
        <ProjectionBalanceChart state={state} />
      </div>
    </>
  )
}
