import { useId, useState } from 'react'

/**
 * Lista o bloque de detalle oculto por defecto; flecha animada para expandir.
 * Modo controlado: pasá `open` y `onOpenChange` (p. ej. formulario móvil + edición).
 */
export function CollapsiblePanelDetail({
  defaultOpen = false,
  open: openControlled,
  onOpenChange,
  labelCollapsed,
  labelOpen,
  children,
  className = '',
  contentClassName = '',
  scrollMaxClass = 'moni-collapse__scroll--panel',
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(defaultOpen)
  const controlled = openControlled !== undefined
  const open = controlled ? openControlled : openUncontrolled
  const panelId = useId()

  const setOpen = (next) => {
    if (controlled) {
      onOpenChange?.(next)
    } else {
      setOpenUncontrolled(next)
    }
  }

  return (
    <div className={`moni-collapse ${className}`.trim()}>
      <button
        type="button"
        className="moni-collapse__trigger"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen(!open)}
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
      {open ? (
        <div
          id={panelId}
          className="moni-collapse__inner moni-collapse__inner--open"
          role="region"
        >
          <div className="moni-collapse__content">
            <div className={`moni-collapse__scroll ${scrollMaxClass} ${contentClassName}`.trim()}>
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
