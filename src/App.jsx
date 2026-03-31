import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import { Login } from './components/Login.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useMoniState } from './hooks/useMoniState.js'
import { logout } from './lib/auth.js'
import { firebaseInitError } from './lib/firebase.js'

const Dashboard = lazy(() =>
  import('./components/Dashboard.jsx').then((m) => ({ default: m.Dashboard })),
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
  const { state, dispatch } = useMoniState(user, authLoading)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [logoutBusy, setLogoutBusy] = useState(false)

  useEffect(() => {
    if (user) return undefined
    const t = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % MOTIVATION_QUOTES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [user])

  const handleLogout = async () => {
    setLogoutBusy(true)
    try {
      await logout()
    } finally {
      setLogoutBusy(false)
    }
  }

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
        {firebaseInitError ? (
          <div className="moni-config-alert" role="alert">
            <strong className="moni-config-alert__title">Configuración</strong>
            <p className="moni-config-alert__text">{firebaseInitError}</p>
          </div>
        ) : null}
        <div className="moni-auth-main">
          <div className="moni-auth-hero" aria-hidden={false}>
            <p className="moni-auth-hero__eyebrow">Bienvenido a Moni</p>
            <h1 className="moni-auth-hero__title">Organizá tu mes con claridad</h1>
            <p className="moni-auth-hero__lead">
              Creá tu cuenta o iniciá sesión. En tres pasos simples ves cuánto te
              queda hoy y cómo se proyectan los próximos meses.
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
            <Login />
          </div>
        </div>
      </div>
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
