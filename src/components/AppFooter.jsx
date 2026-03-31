/** Pie de página solo para uso en navegador (móvil o escritorio). Oculto en PWA instalada. */
export function AppFooter({ variant = 'app' }) {
  const year = new Date().getFullYear()

  return (
    <footer
      className={`moni-app-footer moni-app-footer--${variant}`}
      role="contentinfo"
    >
      <div className="moni-app-footer__inner">
        <span className="moni-app-footer__brand">Moni</span>
        <span className="moni-app-footer__dot" aria-hidden>
          ·
        </span>
        <span className="moni-app-footer__tagline">Finanzas personales</span>
        <span className="moni-app-footer__dot" aria-hidden>
          ·
        </span>
        <span className="moni-app-footer__copy">© {year}</span>
      </div>
    </footer>
  )
}
