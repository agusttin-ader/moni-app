import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScrollLight } from '../lib/bodyScrollLock.js'

function initialsFromUser(user, profile) {
  const label =
    user?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    ''
  const dn = label.trim()
  if (dn) {
    const parts = dn.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] ?? ''
    const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? ''
    return (a + b).toUpperCase() || 'U'
  }
  return '?'
}

const hubDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function Header({
  user,
  profile,
  onLogout,
  onOpenProfile,
  onOpenHistory,
  activeView = 'home',
  onChangeView,
  onQuickAdd,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isLoggedIn = Boolean(user)
  const sessionLabel =
    user?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Usuario'
  const avatarUrl = profile?.avatarUrl || user?.photoURL || ''

  const greetingName =
    user?.displayName?.split?.(/\s+/)?.[0]?.trim() ||
    profile?.firstName?.trim() ||
    'Usuario'

  const hubDateLabel = useMemo(() => {
    try {
      return hubDateFormatter.format(new Date())
    } catch {
      return ''
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined
    return lockBodyScrollLight()
  }, [menuOpen])

  const handleLogoutClick = () => {
    setMenuOpen(false)
    onLogout?.()
  }

  const handleProfileClick = () => {
    setMenuOpen(false)
    onOpenProfile?.()
  }

  const handleHistoryClick = () => {
    setMenuOpen(false)
    onOpenHistory?.()
  }

  const goHome = () => {
    setMenuOpen(false)
    onChangeView?.('home')
  }

  const goPlanning = () => {
    setMenuOpen(false)
    onChangeView?.('planning')
  }

  const menuPortal = createPortal(
    <div
      className={`moni-topnav__menu-layer ${menuOpen ? 'is-open' : ''}`}
      aria-hidden={!menuOpen}
    >
      <button
        type="button"
        className="moni-topnav__menu-backdrop"
        aria-label="Cerrar menú"
        onClick={() => setMenuOpen(false)}
        tabIndex={menuOpen ? 0 : -1}
      />
      <div
        id="moni-dashboard-menu"
        className={`moni-topnav__drawer ${menuOpen ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="moni-topnav__drawer-inner">
          <div className="moni-topnav__drawer-head">
            <span className="moni-topnav__drawer-head-title">Menu</span>
            <button
              type="button"
              className="moni-topnav__drawer-close"
              aria-label="Cerrar menú"
              onClick={() => setMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            </button>
          </div>
          <nav className="moni-topnav__drawer-nav moni-topnav__drawer-nav--primary" aria-label="Secciones">
            <button
              type="button"
              className={`moni-topnav__drawer-link moni-topnav__drawer-link--nav${activeView === 'home' ? ' is-active' : ''}`}
              onClick={goHome}
            >
              <span className="moni-topnav__drawer-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
                </svg>
              </span>
              <span className="moni-topnav__drawer-link-label">Inicio</span>
            </button>
            <button
              type="button"
              className={`moni-topnav__drawer-link moni-topnav__drawer-link--nav${activeView === 'planning' ? ' is-active' : ''}`}
              onClick={goPlanning}
            >
              <span className="moni-topnav__drawer-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5V5" />
                  <path d="M4 9h10V5" />
                  <path d="M14 9h6v10" />
                  <path d="M4 15h10" />
                  <rect x="8" y="11" width="4" height="8" rx="1" />
                </svg>
              </span>
              <span className="moni-topnav__drawer-link-label">Planificación</span>
            </button>
          </nav>

          <div className="moni-topnav__drawer-divider" aria-hidden />

          <nav className="moni-topnav__drawer-nav" aria-label="Cuenta">
            <button type="button" className="moni-topnav__drawer-link" onClick={handleHistoryClick}>
              <span className="moni-topnav__drawer-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20h16" />
                  <path d="M7 20v-8" />
                  <path d="M12 20V8" />
                  <path d="M17 20v-12" />
                </svg>
              </span>
              <span className="moni-topnav__drawer-link-label">Historial de flujo</span>
            </button>
          </nav>

          <div className="moni-topnav__drawer-profile">
            <div className="moni-topnav__drawer-avatar moni-avatar" aria-hidden>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  decoding="async"
                  loading="lazy"
                  fetchPriority="low"
                />
              ) : (
                initialsFromUser(user, profile)
              )}
            </div>
            <div className="moni-topnav__drawer-profile-text">
              <p className="moni-topnav__drawer-name">{sessionLabel}</p>
              <button type="button" className="moni-topnav__drawer-profile-link" onClick={handleProfileClick}>
                Ver perfil
              </button>
            </div>
          </div>

          <div className="moni-topnav__drawer-footer">
            <button
              type="button"
              className="moni-topnav__drawer-link moni-topnav__drawer-link--danger"
              onClick={handleLogoutClick}
              disabled={!isLoggedIn}
            >
              <span className="moni-topnav__drawer-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="22" height="22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 17H6V7h4" />
                  <path d="M14 12H9" />
                  <path d="m12 9 3 3-3 3" />
                </svg>
              </span>
              <span className="moni-topnav__drawer-link-label">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )

  return (
    <>
      {menuPortal}
      <header className="moni-topnav moni-topnav--shell" role="banner">
        <div className="moni-topnav__shell-row">
          <button
            type="button"
            className={`moni-topnav__menu-btn${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="moni-dashboard-menu"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="moni-topnav__brand">
            <div className="moni-topnav__logo-wrap">
              <img
                className="moni-topnav__logo"
                src="/images/moni-logo.png"
                alt="Moni"
                decoding="async"
              />
            </div>
            <span className="moni-topnav__tagline">Plan financiero personal</span>
          </div>

          <div className="moni-topnav__actions" />
        </div>

        <div className="moni-topnav__hub">
          <div className="moni-topnav__hub-welcome">
            <p className="moni-topnav__hub-greeting">
              Hola, <strong>{greetingName}</strong>
            </p>
            <p className="moni-topnav__hub-date">{hubDateLabel}</p>
          </div>
          <div className="moni-topnav__hub-tools">
            <div className="moni-topnav__actions moni-topnav__actions--hub">
              <button
                type="button"
                className="moni-topnav__quick-add"
                onClick={() => onQuickAdd?.({ preferMode: 'variable' })}
                aria-label="Carga rápida de gasto"
              >
                <span className="moni-topnav__quick-add-plus" aria-hidden>
                  +
                </span>
                <span>Agregar</span>
              </button>
              <button type="button" className="moni-topnav__session" onClick={handleProfileClick} aria-label="Abrir perfil">
                <div className="moni-avatar" title={user?.email ?? user?.displayName ?? 'Usuario'}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      decoding="async"
                      loading="lazy"
                      fetchPriority="low"
                    />
                  ) : (
                    initialsFromUser(user, profile)
                  )}
                </div>
                <div className="moni-topnav__session-text">
                  <span className="moni-topnav__session-label">{sessionLabel}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
