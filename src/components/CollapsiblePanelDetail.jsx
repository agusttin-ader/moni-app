import { useId, useState } from 'react'

/**
 * Lista o bloque de detalle oculto por defecto; flecha animada para expandir.
 */
export function CollapsiblePanelDetail({
  defaultOpen = false,
  labelCollapsed,
  labelOpen,
  children,
  className = '',
  contentClassName = '',
  scrollMaxClass = 'moni-collapse__scroll--panel',
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className={`moni-collapse ${className}`.trim()}>
      <button
        type="button"
        className="moni-collapse__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="moni-collapse__trigger-text">
          {open ? labelOpen : labelCollapsed}
        </span>
        <svg
          className={`moni-collapse__icon ${open ? 'moni-collapse__icon--open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path fill="currentColor" d="M12 15.5 6 8.25h12L12 15.5z" />
        </svg>
      </button>
      <div
        id={panelId}
        className={`moni-collapse__inner ${open ? 'moni-collapse__inner--open' : ''}`}
        role="region"
        aria-hidden={!open}
      >
        <div className="moni-collapse__content">
          <div className={`moni-collapse__scroll ${scrollMaxClass} ${contentClassName}`.trim()}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
