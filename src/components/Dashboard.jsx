import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { UnifiedExpenseSheet } from './UnifiedExpenseSheet.jsx'
import { AddEntryFlow } from './add/AddEntryFlow.jsx'
import { AppFooter } from './AppFooter.jsx'
import { BudgetHealthCard } from './BudgetHealthCard.jsx'
import { BudgetPlannerPanel } from './BudgetPlannerPanel.jsx'
import { CurrentMonthHero } from './CurrentMonthHero.jsx'
import { DebtsPanel } from './DebtsPanel.jsx'
import { GastosPanel } from './GastosPanel.jsx'
import { GoalAdviceCard } from './GoalAdviceCard.jsx'
import { GoalActiveCard } from './GoalActiveCard.jsx'
import { GoalPlannerPanel } from './GoalPlannerPanel.jsx'
import { Header } from './Header.jsx'
import { HomeScreen } from './home/HomeScreen.jsx'
import { IncomesPanel } from './IncomesPanel.jsx'
import { MiniMetrics } from './MiniMetrics.jsx'
import { MovementsScreen } from './movements/MovementsScreen.jsx'
import { PayPriorityCard } from './PayPriorityCard.jsx'
import { SavingsProgressCard } from './SavingsProgressCard.jsx'
import { SpendingMixCard } from './SpendingMixCard.jsx'
import { computeMonthBalance } from '../lib/calculations.js'
import { useMobileLayout } from '../hooks/useMobileLayout.js'
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
const DetailsScreenLazy = lazy(() =>
  import('./details/DetailsScreen.jsx').then((m) => ({ default: m.DetailsScreen })),
)

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
  const mobile = useMobileLayout()
  const { remaining } = computeMonthBalance(state, 0)
  const [activeView, setActiveView] = useState('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [installedAppEnter] = useState(() => shouldPlayInstalledAppEnter())

  /** En escritorio no existen add/movements/details: mostramos home sin setState en un effect. */
  const activeViewResolved = useMemo(() => {
    if (
      !mobile &&
      (activeView === 'add' ||
        activeView === 'movements' ||
        activeView === 'details')
    ) {
      return 'home'
    }
    return activeView
  }, [mobile, activeView])

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

  const goAdd = useCallback(() => setActiveView('add'), [])
  const goPlan = useCallback(() => setActiveView('planning'), [])
  const goDetails = useCallback(() => setActiveView('details'), [])
  const goHome = useCallback(() => setActiveView('home'), [])

  const quickAddMobile =
    activeView === 'home' || activeView === 'movements' || activeView === 'planning' ? (
      <button type="button" className="moni-fab-add" onClick={goAdd} aria-label="Agregar">
        +
      </button>
    ) : null

  const quickAddDesktop =
    activeViewResolved === 'home' || activeViewResolved === 'planning' ? (
      <button
        type="button"
        className="moni-fab-add"
        onClick={() => openUnified({ preferMode: 'variable' })}
        aria-label="Agregar gasto o ahorro"
      >
        +
      </button>
    ) : null

  const registerSavingsAction = mobile
    ? () => setActiveView('add')
    : () => openUnified({ preferMode: 'savings' })

  return (
    <div
      className={`moni-app${installedAppEnter ? ' moni-app--enter' : ''}${mobile ? ' moni-app--mobile-layout' : ''}`.trim()}
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
            {mobile ? (
              <>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeView === 'home' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('home')}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeView === 'add' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('add')}
                >
                  Agregar
                </button>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeView === 'movements' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('movements')}
                >
                  Movimientos
                </button>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeView === 'planning' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('planning')}
                >
                  Plan
                </button>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeView === 'details' ? ' is-active' : ''}`}
                  onClick={goDetails}
                >
                  Detalles
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeViewResolved === 'home' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('home')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`moni-side-nav__item${activeViewResolved === 'planning' ? ' is-active' : ''}`}
                  onClick={() => setActiveView('planning')}
                >
                  Planificación
                </button>
              </>
            )}
          </nav>
          <div className="moni-side-nav__footer">
            <button type="button" className="moni-side-nav__ghost" onClick={onOpenProfile}>
              Perfil
            </button>
            <button type="button" className="moni-side-nav__ghost" onClick={onOpenHistory}>
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
            activeView={activeViewResolved}
            onChangeView={setActiveView}
            onQuickAdd={mobile ? goAdd : () => openUnified({ preferMode: 'variable' })}
            mobileLayout={mobile}
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

          <main
            className={
              mobile ? 'moni-main moni-main--with-tab-bar' : 'moni-main'
            }
          >
            {mobile ? (
              <>
                {activeView === 'home' ? (
                  <section className="moni-screen moni-screen--home" aria-label="Inicio">
                    <div className="moni-screen__top moni-anim-in">
                      <HomeScreen state={state} onOpenPlan={goPlan} onOpenDetails={goDetails} />
                    </div>
                    <div className="moni-screen__action">{quickAddMobile}</div>
                  </section>
                ) : null}

                {activeView === 'add' ? (
                  <section className="moni-screen moni-screen--add" aria-label="Agregar">
                    <AddEntryFlow
                      state={state}
                      dispatch={dispatch}
                      onDone={() => setActiveView('home')}
                    />
                  </section>
                ) : null}

                {activeView === 'movements' ? (
                  <section className="moni-screen moni-screen--movements" aria-label="Movimientos">
                    <MovementsScreen
                      state={state}
                      dispatch={dispatch}
                      onEditExpense={(id) => openUnified({ editDailyId: id })}
                      onEditSaving={(id) => openUnified({ editSavingsId: id })}
                      onEditIncome={(id) => openUnified({ editIncomeId: id })}
                    />
                    <div className="moni-screen__action">{quickAddMobile}</div>
                  </section>
                ) : null}

                {activeView === 'planning' ? (
                  <PlanningBody
                    compactIntro
                    state={state}
                    dispatch={dispatch}
                    openUnified={openUnified}
                    onRegisterSavings={registerSavingsAction}
                    footerAction={quickAddMobile}
                  />
                ) : null}

                {activeView === 'details' ? (
                  <section className="moni-screen moni-screen--details" aria-label="Detalles">
                    <Suspense
                      fallback={<div className="moni-details-skel" aria-hidden />}
                    >
                      <DetailsScreenLazy state={state} onBack={goHome} />
                    </Suspense>
                  </section>
                ) : null}
              </>
            ) : (
              <>
                {activeViewResolved === 'home' ? (
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
                              <div className="moni-dashboard-overview__savings">
                                <SavingsProgressCard
                                  state={state}
                                  dispatch={dispatch}
                                  onRegisterSavings={registerSavingsAction}
                                />
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
                            <div className="moni-dashboard-insights-skel" aria-hidden />
                          }
                        >
                          <DashboardInsightsLazy state={state} />
                        </Suspense>
                      </section>
                    </div>

                    <div className="moni-screen__action">{quickAddDesktop}</div>
                  </section>
                ) : null}

                {activeViewResolved === 'planning' ? (
                  <PlanningBody
                    state={state}
                    dispatch={dispatch}
                    openUnified={openUnified}
                    onRegisterSavings={registerSavingsAction}
                    footerAction={quickAddDesktop}
                  />
                ) : null}
              </>
            )}

            <UnifiedExpenseSheet
              open={unifiedOpen}
              onClose={closeUnified}
              dispatch={dispatch}
              gastos={state.gastos}
              gastosDiarios={state.gastosDiarios}
              ingresosDiarios={state.ingresosDiarios}
              savingsEntries={state.savingsEntries}
              sheetKey={unifiedKey}
              sheetOpts={unifiedOpts}
            />
          </main>

          {mobile ? (
            <nav className="moni-tab-bar" aria-label="Principal">
              <button
                type="button"
                className={`moni-tab-bar__btn${activeView === 'home' ? ' is-active' : ''}`}
                onClick={() => setActiveView('home')}
              >
                <span className="moni-tab-bar__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
                  </svg>
                </span>
                <span>Inicio</span>
              </button>
              <button
                type="button"
                className={`moni-tab-bar__btn${activeView === 'add' ? ' is-active' : ''}`}
                onClick={() => setActiveView('add')}
              >
                <span className="moni-tab-bar__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v8M8 12h8" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Agregar</span>
              </button>
              <button
                type="button"
                className={`moni-tab-bar__btn${activeView === 'movements' ? ' is-active' : ''}`}
                onClick={() => setActiveView('movements')}
              >
                <span className="moni-tab-bar__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
                  </svg>
                </span>
                <span>Movimientos</span>
              </button>
              <button
                type="button"
                className={`moni-tab-bar__btn${activeView === 'planning' ? ' is-active' : ''}`}
                onClick={() => setActiveView('planning')}
              >
                <span className="moni-tab-bar__icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M4 19.5V5M4 9h10V5" />
                    <path d="M14 9h6v10" />
                    <path d="M4 15h10" />
                  </svg>
                </span>
                <span>Plan</span>
              </button>
            </nav>
          ) : null}

          <AppFooter variant="app" />
        </div>
      </div>
    </div>
  )
}

function PlanningBody({
  state,
  dispatch,
  openUnified,
  onRegisterSavings,
  footerAction,
  compactIntro,
}) {
  return (
    <section
      className="moni-screen moni-screen--planning moni-planning"
      id="listas"
      aria-label="Planificación financiera"
    >
      <header
        className={`moni-screen__top moni-planning__intro moni-anim-in${compactIntro ? ' moni-planning__intro--compact' : ''}`}
      >
        {compactIntro ? (
          <h2 className="moni-planning__intro-title">Plan</h2>
        ) : (
          <>
            <p className="moni-planning__intro-kicker">Tu plan en Moni</p>
            <h2 className="moni-planning__intro-title">Planificación</h2>
            <p className="moni-planning__intro-lead">
              Completá cada paso y volvé a <strong>Inicio</strong>: el resumen te dirá si el mes cierra bien y qué
              conviene tocar primero.
            </p>
          </>
        )}
      </header>

      <div className="moni-screen__content">
        <div className="moni-planning__group moni-anim-in" id="moni-planning-objetivos">
          {compactIntro ? null : (
            <div className="moni-planning__group-head">
              <div className="moni-planning__group-titles">
                <p className="moni-planning__group-kicker">Paso 1 de 4</p>
                <h3 className="moni-planning__group-title">Meta y límites por categoría</h3>
                <p className="moni-planning__group-hint">
                  Elegí un tope por rubro para saber cuánto podés gastar sin romper la meta.
                </p>
              </div>
            </div>
          )}
          <div className="moni-planning__group-panels moni-planning__group-panels--pair">
            <div className="moni-planning__panel">
              <GoalPlannerPanel
                state={state}
                dispatch={dispatch}
                onRegisterSavings={onRegisterSavings}
              />
            </div>
            <div className="moni-planning__panel">
              <BudgetPlannerPanel state={state} dispatch={dispatch} />
            </div>
          </div>
        </div>

        <div className="moni-planning__group moni-anim-in" id="moni-planning-ingresos">
          {compactIntro ? null : (
            <div className="moni-planning__group-head">
              <div className="moni-planning__group-titles">
                <p className="moni-planning__group-kicker">Paso 2 de 4</p>
                <h3 className="moni-planning__group-title">Ingresos del mes</h3>
                <p className="moni-planning__group-hint">
                  Cargá lo que entra todos los meses: sin eso el margen y la proyección no son fiables.
                </p>
              </div>
            </div>
          )}
          <div className="moni-planning__group-panels">
            <div className="moni-planning__panel">
              <IncomesPanel items={state.ingresos} dispatch={dispatch} expandFormSignal={0} />
            </div>
          </div>
        </div>

        <div className="moni-planning__group moni-anim-in" id="moni-planning-gastos">
          {compactIntro ? null : (
            <div className="moni-planning__group-head">
              <div className="moni-planning__group-titles">
                <p className="moni-planning__group-kicker">Paso 3 de 4</p>
                <h3 className="moni-planning__group-title">Gastos fijos y del día</h3>
                <p className="moni-planning__group-hint">
                  Primero compromisos fijos, después variables: así ves dónde podés recortar si hace falta.
                </p>
              </div>
            </div>
          )}
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
          {compactIntro ? null : (
            <div className="moni-planning__group-head">
              <div className="moni-planning__group-titles">
                <p className="moni-planning__group-kicker">Paso 4 de 4</p>
                <h3 className="moni-planning__group-title">Deudas y cuotas</h3>
                <p className="moni-planning__group-hint">
                  Las cuotas restan del margen cada mes: cargalas para priorizar pagos con criterio.
                </p>
              </div>
            </div>
          )}
          <div className="moni-planning__group-panels">
            <div className="moni-planning__panel">
              <DebtsPanel items={state.deudas} dispatch={dispatch} expandFormSignal={0} />
            </div>
          </div>
        </div>
      </div>

      <div className="moni-screen__action">{footerAction}</div>
    </section>
  )
}
