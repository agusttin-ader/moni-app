import { useState } from 'react'
import { computeMonthBalance } from '../lib/calculations.js'
import { BreakdownFlowChart } from './BreakdownFlowChart.jsx'
import { CurrentMonthHero } from './CurrentMonthHero.jsx'
import { DebtsPanel } from './DebtsPanel.jsx'
import { ExpensesPanel } from './ExpensesPanel.jsx'
import { Header } from './Header.jsx'
import { IncomesPanel } from './IncomesPanel.jsx'
import { MiniMetrics } from './MiniMetrics.jsx'
import { ProfilePanel } from './ProfilePanel.jsx'
import { Projection } from './Projection.jsx'
import { ProjectionHistoryPanel } from './ProjectionHistoryPanel.jsx'
import { ProjectionAlert } from './ProjectionAlert.jsx'
import { ProjectionBalanceChart } from './ProjectionBalanceChart.jsx'
import { RemainingSummary } from './RemainingSummary.jsx'
import { useUserProfile } from '../hooks/useUserProfile.js'
import { useProjectionHistory } from '../hooks/useProjectionHistory.js'

export function Dashboard({ state, dispatch, user, onLogout }) {
  const { remaining } = computeMonthBalance(state, 0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const {
    profile,
    loading: profileLoading,
    saving: profileSaving,
    uploading: profileUploading,
    error: profileError,
    saveProfile,
    updateAvatar,
  } = useUserProfile(user)
  const {
    history: projectionHistory,
    loading: projectionHistoryLoading,
    error: projectionHistoryError,
  } = useProjectionHistory(user, state)

  return (
    <div className="moni-app">
      <Header
        user={user}
        profile={profile}
        onLogout={onLogout}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        profile={profile}
        loading={profileLoading}
        saving={profileSaving}
        uploading={profileUploading}
        error={profileError}
        onSave={saveProfile}
        onUploadAvatar={updateAvatar}
      />
      <ProjectionHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={projectionHistory}
        loading={projectionHistoryLoading}
        error={projectionHistoryError}
      />
      <main className="moni-main">
        <div className="moni-layout">
          <div className="moni-layout__primary">
            <div className="moni-anim-in" style={{ animationDelay: '0ms' }}>
              <section className="moni-dashboard-overview">
                <div className="moni-dashboard-overview__hero">
                  <CurrentMonthHero remaining={remaining} />
                </div>
                <div className="moni-dashboard-overview__side">
                  <MiniMetrics state={state} />
                  <ProjectionAlert state={state} />
                </div>
              </section>
            </div>
            <div className="moni-anim-in" style={{ animationDelay: '120ms' }}>
              <section className="moni-dashboard-insights">
                <div className="moni-dashboard-insights__stack">
                  <RemainingSummary state={state} />
                  <BreakdownFlowChart state={state} />
                </div>
                <div className="moni-dashboard-insights__stack">
                  <Projection state={state} />
                  <ProjectionBalanceChart state={state} />
                </div>
              </section>
            </div>
          </div>

          <aside className="moni-layout__aside" id="listas">
            <div className="moni-anim-in" style={{ animationDelay: '80ms' }}>
              <IncomesPanel items={state.ingresos} dispatch={dispatch} />
            </div>
            <div className="moni-anim-in" style={{ animationDelay: '140ms' }}>
              <ExpensesPanel items={state.gastos} dispatch={dispatch} />
            </div>
            <div className="moni-anim-in" style={{ animationDelay: '200ms' }}>
              <DebtsPanel items={state.deudas} dispatch={dispatch} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
