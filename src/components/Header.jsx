import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { lockBodyScrollLight } from '../lib/bodyScrollLock.js'

function initialsFromUser(user, profile) {
  const label =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user?.displayName ||
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
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user?.displayName ||
    user?.email ||
    'Usuario'
  const avatarUrl = profile?.avatarUrl || user?.photoURL || ''

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
        aria-label="Menú de cuenta"
      >
        <div className="moni-topnav__drawer-inner">
          <div className="moni-topnav__drawer-profile">
            <div
              className="moni-topnav__drawer-avatar moni-avatar"
              aria-hidden
            >
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
              <button
                type="button"
                className="moni-topnav__drawer-profile-link"
                onClick={handleProfileClick}
              >
                Ver perfil
              </button>
            </div>
          </div>

          <nav className="moni-topnav__drawer-nav" aria-label="Accesos">
            <button
              type="button"
              className="moni-topnav__drawer-link"
              onClick={handleHistoryClick}
            >
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

        <div className="moni-topnav__actions">
          <button
            type="button"
            className="moni-topnav__quick-add"
            onClick={() => onQuickAdd?.({ preferMode: 'variable' })}
            aria-label="Carga rápida de gasto"
          >
            + Carga rápida
          </button>
          <button
            type="button"
            className="moni-topnav__session"
            onClick={handleProfileClick}
            aria-label="Abrir perfil"
          >
            <div
              className="moni-avatar"
              title={user?.email ?? user?.displayName ?? 'Usuario'}
            >
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

          <button
            type="button"
            className={`moni-topnav__menu-btn${menuOpen ? ' is-open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="moni-dashboard-menu"
            aria-label="Más opciones"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="moni-topnav__view-tabs" role="tablist" aria-label="Secciones principales">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'home'}
          className={`moni-topnav__view-tab${activeView === 'home' ? ' is-active' : ''}`}
          onClick={() => {
            setMenuOpen(false)
            onChangeView?.('home')
          }}
        >
          Inicio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'planning'}
          className={`moni-topnav__view-tab${activeView === 'planning' ? ' is-active' : ''}`}
          onClick={() => {
            setMenuOpen(false)
            onChangeView?.('planning')
          }}
        >
          Planificación
        </button>
      </div>
    </header>
    </>
  )
}
