import { useEffect, useState } from 'react'

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

export function Header({ user, profile, onLogout, onOpenProfile, onOpenHistory }) {
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

  return (
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
          <span className="moni-topnav__tagline">Finanzas personales</span>
        </div>

        <div className="moni-topnav__actions">
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
              {avatarUrl ? <img src={avatarUrl} alt="" /> : initialsFromUser(user, profile)}
            </div>
            <div className="moni-topnav__session-text">
              <span className="moni-topnav__session-label">{sessionLabel}</span>
            </div>
          </button>

          <button
            type="button"
            className="moni-topnav__menu-btn"
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

      <div
        id="moni-dashboard-menu"
        className={`moni-topnav__drawer ${menuOpen ? 'is-open' : ''}`}
        role="menu"
        aria-label="Opciones de cuenta"
      >
        <button
          type="button"
          className="moni-topnav__drawer-item"
          role="menuitem"
          onClick={handleProfileClick}
        >
          Perfil
        </button>
        <button
          type="button"
          className="moni-topnav__drawer-item"
          role="menuitem"
          onClick={handleHistoryClick}
        >
          Historial de flujo
        </button>
        <button
          type="button"
          className="moni-topnav__drawer-item moni-topnav__drawer-item--danger"
          role="menuitem"
          onClick={handleLogoutClick}
          disabled={!isLoggedIn}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}
