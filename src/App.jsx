import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import './App.css'
import { AppFooter } from './components/AppFooter.jsx'
import { OnboardingWizard } from './components/OnboardingWizard.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useMoniState } from './hooks/useMoniState.js'
import { logout } from './lib/auth.js'
import { firebaseInitError } from './lib/firebase.js'

const Dashboard = lazy(() =>
  import('./components/Dashboard.jsx').then((m) => ({ default: m.Dashboard })),
)
const Login = lazy(() =>
  import('./components/Login.jsx').then((m) => ({ default: m.Login })),
)

const MOTIVATION_QUOTES = [
  {
    text: 'No ahorres lo que te queda después de gastar; gastá lo que te queda después de ahorrar.',
    author: 'Warren Buffett',
  },
  {
    text: 'Riqueza es tener activos que trabajan para vos, incluso cuando vos dormís.',
    author: 'Robert Kiyosaki',
  },
  {
    text: 'Un presupuesto es decirle a tu dinero adónde ir, en lugar de preguntarte adónde se fue.',
    author: 'Dave Ramsey',
  },
  {
    text: 'Invertí en ti mismo: el interés compuesto del conocimiento también existe.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'La disciplina con el gasto pequeño protege las metas grandes.',
    author: 'Naval Ravikant',
  },
  {
    text: 'El tiempo es tu activo más valioso: usalo para crear opciones, no solo para consumirlas.',
    author: 'Carl Richards',
  },
  {
    text: 'La tranquilidad financiera empieza cuando gastás menos de lo que ganás, de forma constante.',
    author: 'Morgan Housel',
  },
  {
    text: 'Quien no mide sus gastos, no administra su futuro: solo reacciona al presente.',
    author: 'Peter Drucker',
  },
  {
    text: 'Ahorrar no es privarte hoy: es habilitar libertad mañana.',
    author: 'Paula Pant',
  },
  {
    text: 'La mejor inversión suele ser la que evita un error caro.',
    author: 'Charlie Munger',
  },
]

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { state, dispatch, dataReady } = useMoniState(user, authLoading)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [logoutBusy, setLogoutBusy] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const syncPwaFlag = () => {
      const nav = window.navigator
      const iosStandalone =
        'standalone' in nav &&
        /** @type {Navigator & { standalone?: boolean }} */ (nav).standalone ===
          true
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        iosStandalone
      root.toggleAttribute('data-moni-pwa', standalone)
    }
    syncPwaFlag()
    const m1 = window.matchMedia('(display-mode: standalone)')
    const m2 = window.matchMedia('(display-mode: fullscreen)')
    m1.addEventListener('change', syncPwaFlag)
    m2.addEventListener('change', syncPwaFlag)
    return () => {
      m1.removeEventListener('change', syncPwaFlag)
      m2.removeEventListener('change', syncPwaFlag)
    }
  }, [])

  useEffect(() => {
    if (user) return undefined
    const t = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [user])

  const handleLogout = useCallback(async () => {
    setLogoutBusy(true)
    try {
      await logout()
    } finally {
      setLogoutBusy(false)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="moni-loading-shell" role="status" aria-live="polite">
        <div className="moni-loading-spinner" aria-hidden />
        <p className="moni-loading-text">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    const quote = MOTIVATION_QUOTES[quoteIndex] ?? MOTIVATION_QUOTES[0]
    return (
      <div className="moni-auth-shell">
        <div className="moni-auth-visual-top" aria-hidden />
        {firebaseInitError ? (
          <div className="moni-config-alert" role="alert">
            <strong className="moni-config-alert__title">Configuración</strong>
            <p className="moni-config-alert__text">{firebaseInitError}</p>
          </div>
        ) : null}
        <div className="moni-auth-main">
          <div className="moni-auth-hero" aria-hidden={false}>
            <div className="moni-auth-brand">
              <img
                className="moni-auth-brand__logo"
                src="/images/moni-logo.png"
                alt="Moni"
                decoding="async"
                fetchPriority="high"
              />
            </div>
            <p className="moni-auth-hero__eyebrow">Finanzas personales</p>
            <h1 className="moni-auth-hero__title">
              Toma el control{' '}
              <span className="moni-auth-hero__accent">de tus finanzas</span>
            </h1>
            <p className="moni-auth-hero__lead">
              Ingresos, gastos y cuotas en un solo lugar. Entrá con Google o
              email y organizá tu mes en minutos.
            </p>
            <ol className="moni-auth-hero__steps">
              <li style={{ animationDelay: '120ms' }}>
                <span className="moni-auth-step-num">1</span>
                <span>Creá tu cuenta o iniciá sesión</span>
              </li>
              <li style={{ animationDelay: '360ms' }}>
                <span className="moni-auth-step-num">2</span>
                <span>Cargá tus ingresos y gastos</span>
              </li>
              <li style={{ animationDelay: '600ms' }}>
                <span className="moni-auth-step-num">3</span>
                <span>Mirá tu proyección a 6 meses</span>
              </li>
            </ol>
            <figure
              className="moni-auth-quotes"
              key={quoteIndex}
              aria-live="polite"
            >
              <blockquote className="moni-auth-quotes__text">
                “{quote.text}”
              </blockquote>
              <figcaption className="moni-auth-quotes__author">
                — {quote.author}
              </figcaption>
            </figure>
          </div>
          <div className="moni-auth-panel">
            <Suspense
              fallback={
                <div
                  className="moni-login-card moni-login-card--skeleton"
                  aria-busy="true"
                  aria-label="Cargando formulario"
                />
              }
            >
              <Login />
            </Suspense>
          </div>
        </div>
        <AppFooter variant="auth" />
      </div>
    )
  }

  if (!dataReady) {
    return (
      <div className="moni-loading-shell" role="status" aria-live="polite">
        <div className="moni-loading-spinner" aria-hidden />
        <p className="moni-loading-text">Sincronizando tus datos...</p>
      </div>
    )
  }

  if (!state.onboardingComplete) {
    return (
      <OnboardingWizard dispatch={dispatch} onLogout={handleLogout} />
    )
  }

  return (
    <>
      {logoutBusy ? (
        <div
          className="moni-loading-shell moni-loading-shell--overlay"
          role="status"
          aria-live="polite"
        >
          <div className="moni-loading-spinner" aria-hidden />
          <p className="moni-loading-text">Cerrando sesión...</p>
        </div>
      ) : null}
      <Suspense
        fallback={
          <div className="moni-loading-shell" role="status" aria-live="polite">
            <div className="moni-loading-spinner" aria-hidden />
            <p className="moni-loading-text">Preparando panel...</p>
          </div>
        }
      >
        <Dashboard
          state={state}
          dispatch={dispatch}
          user={user}
          onLogout={handleLogout}
        />
      </Suspense>
    </>
  )
}
