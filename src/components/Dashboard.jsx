import { lazy, Suspense, useCallback, useState } from 'react'
import { computeMonthBalance } from '../lib/calculations.js'
import { CurrentMonthHero } from './CurrentMonthHero.jsx'
import { DebtsPanel } from './DebtsPanel.jsx'
import { ExpensesPanel } from './ExpensesPanel.jsx'
import { AppFooter } from './AppFooter.jsx'
import { Header } from './Header.jsx'
import { IncomesPanel } from './IncomesPanel.jsx'
import { MiniMetrics } from './MiniMetrics.jsx'
import { ProjectionAlert } from './ProjectionAlert.jsx'
import { useUserProfile } from '../hooks/useUserProfile.js'
import { useProjectionHistory } from '../hooks/useProjectionHistory.js'

const ProfilePanel = lazy(() =>
  import('./ProfilePanel.jsx').then((m) => ({ default: m.ProfilePanel })),
)
const ProjectionHistoryPanel = lazy(() =>
  import('./ProjectionHistoryPanel.jsx').then((m) => ({
    default: m.ProjectionHistoryPanel,
  })),
)
const DashboardInsightsLazy = lazy(() => import('./DashboardInsightsLazy.jsx'))

function shouldPlayMobileAppEnter() {
  if (typeof window === 'undefined') return false
  try {
    const narrow = window.matchMedia('(max-width: 720px)').matches
    const nav = window.navigator
    const iosStandalone =
      'standalone' in nav &&
      /** @type {Navigator & { standalone?: boolean }} */ (nav).standalone ===
        true
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      iosStandalone
    return narrow || standalone
  } catch {
    return false
  }
}

export function Dashboard({ state, dispatch, user, onLogout }) {
  const { remaining } = computeMonthBalance(state, 0)
  const [profileOpen, setProfileOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Entrada suave en móvil o app instalada (solo presentación). */
  const [mobileAppEnter] = useState(() => shouldPlayMobileAppEnter())

  const onOpenProfile = useCallback(() => setProfileOpen(true), [])
  const onCloseProfile = useCallback(() => setProfileOpen(false), [])
  const onOpenHistory = useCallback(() => setHistoryOpen(true), [])
  const onCloseHistory = useCallback(() => setHistoryOpen(false), [])
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
    <div
      className={`moni-app${mobileAppEnter ? ' moni-app--enter' : ''}`.trim()}
    >
      <Header
        user={user}
        profile={profile}
        onLogout={onLogout}
        onOpenProfile={onOpenProfile}
        onOpenHistory={onOpenHistory}
      />
      {profileOpen ? (
        <Suspense fallback={null}>
          <ProfilePanel
            open
            onClose={onCloseProfile}
            user={user}
            profile={profile}
            loading={profileLoading}
            saving={profileSaving}
            uploading={profileUploading}
            error={profileError}
            onSave={saveProfile}
            onUploadAvatar={updateAvatar}
          />
        </Suspense>
      ) : null}
      {historyOpen ? (
        <Suspense fallback={null}>
          <ProjectionHistoryPanel
            open
            onClose={onCloseHistory}
            history={projectionHistory}
            loading={projectionHistoryLoading}
            error={projectionHistoryError}
          />
        </Suspense>
      ) : null}
      <main className="moni-main">
        <div className="moni-layout">
          <div className="moni-layout__primary">
            <div className="moni-anim-in">
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
            <div className="moni-anim-in">
              <section className="moni-dashboard-insights">
                <Suspense
                  fallback={
                    <div
                      className="moni-dashboard-insights-skel"
                      aria-hidden
                    />
                  }
                >
                  <DashboardInsightsLazy state={state} />
                </Suspense>
              </section>
            </div>
          </div>

          <aside className="moni-layout__aside" id="listas">
            <div className="moni-anim-in">
              <IncomesPanel items={state.ingresos} dispatch={dispatch} />
            </div>
            <div className="moni-anim-in">
              <ExpensesPanel items={state.gastos} dispatch={dispatch} />
            </div>
            <div className="moni-anim-in">
              <DebtsPanel items={state.deudas} dispatch={dispatch} />
            </div>
          </aside>
        </div>
      </main>
      <AppFooter variant="app" />
    </div>
  )
}
