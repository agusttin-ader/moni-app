import { lazy, Suspense, useCallback, useState } from 'react'
import { UnifiedExpenseSheet } from './UnifiedExpenseSheet.jsx'
import { computeMonthBalance } from '../lib/calculations.js'
import { BudgetHealthCard } from './BudgetHealthCard.jsx'
import { CurrentMonthHero } from './CurrentMonthHero.jsx'
import { DebtsPanel } from './DebtsPanel.jsx'
import { GastosPanel } from './GastosPanel.jsx'
import { AppFooter } from './AppFooter.jsx'
import { BudgetPlannerPanel } from './BudgetPlannerPanel.jsx'
import { GoalAdviceCard } from './GoalAdviceCard.jsx'
import { GoalActiveCard } from './GoalActiveCard.jsx'
import { GoalPlannerPanel } from './GoalPlannerPanel.jsx'
import { Header } from './Header.jsx'
import { IncomesPanel } from './IncomesPanel.jsx'
import { MiniMetrics } from './MiniMetrics.jsx'
import { PayPriorityCard } from './PayPriorityCard.jsx'
import { SpendingMixCard } from './SpendingMixCard.jsx'
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

/** Solo app instalada (PWA / “Agregar a inicio”): entrada completa al abrir. */
function shouldPlayInstalledAppEnter() {
  if (typeof window === 'undefined') return false
  try {
    const nav = window.navigator
    const iosStandalone =
      'standalone' in nav &&
      /** @type {Navigator & { standalone?: boolean }} */ (nav).standalone ===
      true
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      iosStandalone
    )
  } catch {
    return false
  }
}

export function Dashboard({ state, dispatch, user, onLogout }) {
  const { remaining } = computeMonthBalance(state, 0)
  const [activeView, setActiveView] = useState('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  /** Entrada suave al abrir la app descargada / instalada (solo presentación). */
  const [installedAppEnter] = useState(() => shouldPlayInstalledAppEnter())

  const onOpenProfile = useCallback(() => setProfileOpen(true), [])
  const onCloseProfile = useCallback(() => setProfileOpen(false), [])
  const onOpenHistory = useCallback(() => setHistoryOpen(true), [])
  const onCloseHistory = useCallback(() => setHistoryOpen(false), [])
  const {
    profile,
    loading: profileLoading,
    uploading: profileUploading,
    updateAvatar,
  } = useUserProfile(user)
  const {
    history: projectionHistory,
    loading: projectionHistoryLoading,
    error: projectionHistoryError,
  } = useProjectionHistory(user, state)

  const [unifiedOpen, setUnifiedOpen] = useState(false)
  const [unifiedKey, setUnifiedKey] = useState(0)
  const [unifiedOpts, setUnifiedOpts] = useState({})

  const openUnified = useCallback((opts = {}) => {
    setUnifiedOpts(opts)
    setUnifiedKey((k) => k + 1)
    setUnifiedOpen(true)
  }, [])
  const closeUnified = useCallback(() => setUnifiedOpen(false), [])
  const quickAddButton = (
    <button
      type="button"
      className="moni-fab-add"
      onClick={() => openUnified({ preferMode: 'variable' })}
      aria-label="Agregar gasto rápido"
    >
      +
    </button>
  )

  return (
    <div
      className={`moni-app${installedAppEnter ? ' moni-app--enter' : ''}`.trim()}
    >
      <div className="moni-shell">
        <aside className="moni-side-nav" aria-label="Navegación principal">
          <div className="moni-side-nav__brand">
            <img
              className="moni-side-nav__logo"
              src="/images/moni-logo.png"
              alt="Moni"
              decoding="async"
            />
            <p className="moni-side-nav__subtitle">Plan financiero personal</p>
          </div>
          <nav className="moni-side-nav__nav" aria-label="Vistas">
            <button
              type="button"
              className={`moni-side-nav__item${activeView === 'home' ? ' is-active' : ''}`}
              onClick={() => setActiveView('home')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`moni-side-nav__item${activeView === 'planning' ? ' is-active' : ''}`}
              onClick={() => setActiveView('planning')}
            >
              Planificación
            </button>
          </nav>
          <div className="moni-side-nav__footer">
            <button
              type="button"
              className="moni-side-nav__ghost"
              onClick={onOpenProfile}
            >
              Perfil
            </button>
            <button
              type="button"
              className="moni-side-nav__ghost"
              onClick={onOpenHistory}
            >
              Historial
            </button>
            <button
              type="button"
              className="moni-side-nav__ghost moni-side-nav__ghost--danger"
              onClick={onLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="moni-shell__content">
          <Header
            user={user}
            profile={profile}
            onLogout={onLogout}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenHistory}
            activeView={activeView}
            onChangeView={setActiveView}
            onQuickAdd={openUnified}
          />
      {profileOpen ? (
        <Suspense fallback={null}>
          <ProfilePanel
            open
            onClose={onCloseProfile}
            user={user}
            profile={profile}
            loading={profileLoading}
            uploading={profileUploading}
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
            {activeView === 'home' ? (
              <section className="moni-screen moni-screen--home" aria-label="Resumen financiero">
                <div className="moni-screen__top moni-anim-in">
                  <div className="moni-layout moni-layout--home">
                    <div className="moni-layout__main">
                      <div className="moni-layout__main-block moni-layout__main-block--overview">
                        <section className="moni-dashboard-overview">
                          <div className="moni-dashboard-overview__hero">
                            <CurrentMonthHero state={state} remaining={remaining} />
                            <PayPriorityCard state={state} />
                            <SpendingMixCard state={state} />
                          </div>
                          <div className="moni-dashboard-overview__side">
                            <GoalActiveCard state={state} />
                            <MiniMetrics state={state} />
                            <BudgetHealthCard state={state} />
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="moni-screen__content moni-anim-in">
                  <section className="moni-dashboard-insights">
                    <div className="moni-dashboard-insights__full">
                      <GoalAdviceCard state={state} />
                    </div>
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

                <div className="moni-screen__action">{quickAddButton}</div>
              </section>
            ) : (
              <section
                className="moni-screen moni-screen--planning moni-planning"
                id="listas"
                aria-label="Planificación financiera"
              >
                <header className="moni-screen__top moni-planning__intro moni-anim-in">
                  <p className="moni-planning__intro-kicker">Tu plan en Moni</p>
                  <h2 className="moni-planning__intro-title">Planificación</h2>
                  <p className="moni-planning__intro-lead">
                    Seguí los pasos en orden. Cuando termines, volvé a <strong>Inicio</strong> para ver el resumen
                    sin pantallas de carga.
                  </p>
                </header>

                <div className="moni-screen__content">
                  <div className="moni-planning__group moni-anim-in" id="moni-planning-objetivos">
                    <div className="moni-planning__group-head">
                      <div className="moni-planning__group-titles">
                        <p className="moni-planning__group-kicker">Paso 1 de 4</p>
                        <h3 className="moni-planning__group-title">Meta y límites por categoría</h3>
                        <p className="moni-planning__group-hint">
                          Objetivo claro y tope mensual por rubro para que el resto del plan tenga sentido.
                        </p>
                      </div>
                    </div>
                    <div className="moni-planning__group-panels moni-planning__group-panels--pair">
                      <div className="moni-planning__panel">
                        <GoalPlannerPanel state={state} dispatch={dispatch} />
                      </div>
                      <div className="moni-planning__panel">
                        <BudgetPlannerPanel state={state} dispatch={dispatch} />
                      </div>
                    </div>
                  </div>

                  <div className="moni-planning__group moni-anim-in" id="moni-planning-ingresos">
                    <div className="moni-planning__group-head">
                      <div className="moni-planning__group-titles">
                        <p className="moni-planning__group-kicker">Paso 2 de 4</p>
                        <h3 className="moni-planning__group-title">Ingresos del mes</h3>
                        <p className="moni-planning__group-hint">
                          Ingreso fijo u habitual: sueldo, monotributo, alquiler cobrado, etc.
                        </p>
                      </div>
                    </div>
                    <div className="moni-planning__group-panels">
                      <div className="moni-planning__panel">
                        <IncomesPanel
                          items={state.ingresos}
                          dispatch={dispatch}
                          expandFormSignal={0}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="moni-planning__group moni-anim-in" id="moni-planning-gastos">
                    <div className="moni-planning__group-head">
                      <div className="moni-planning__group-titles">
                        <p className="moni-planning__group-kicker">Paso 3 de 4</p>
                        <h3 className="moni-planning__group-title">Gastos fijos y del día</h3>
                        <p className="moni-planning__group-hint">
                          Primero lo que pagás todos los meses; después lo variable que vas registrando.
                        </p>
                      </div>
                    </div>
                    <div className="moni-planning__group-panels">
                      <div className="moni-planning__panel">
                        <GastosPanel
                          gastos={state.gastos}
                          gastosDiarios={state.gastosDiarios}
                          dispatch={dispatch}
                          onOpenUnified={openUnified}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="moni-planning__group moni-anim-in" id="moni-planning-deudas">
                    <div className="moni-planning__group-head">
                      <div className="moni-planning__group-titles">
                        <p className="moni-planning__group-kicker">Paso 4 de 4</p>
                        <h3 className="moni-planning__group-title">Deudas y cuotas</h3>
                        <p className="moni-planning__group-hint">
                          Cuotas y préstamos: Moni usa esto para el margen y la proyección.
                        </p>
                      </div>
                    </div>
                    <div className="moni-planning__group-panels">
                      <div className="moni-planning__panel">
                        <DebtsPanel
                          items={state.deudas}
                          dispatch={dispatch}
                          expandFormSignal={0}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="moni-screen__action">{quickAddButton}</div>
              </section>
            )}
            <UnifiedExpenseSheet
              open={unifiedOpen}
              onClose={closeUnified}
              dispatch={dispatch}
              gastos={state.gastos}
              gastosDiarios={state.gastosDiarios}
              sheetKey={unifiedKey}
              sheetOpts={unifiedOpts}
            />
          </main>
          <AppFooter variant="app" />
        </div>
      </div>
    </div>
  )
}
