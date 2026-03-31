import { useEffect, useId, useRef, useState } from 'react'

/** @typedef {'all' | 'fixed' | 'variable'} GastosFilter */

const OPTIONS = [
  { value: /** @type {const} */ ('all'), label: 'Todos (fijos + variables del mes)' },
  { value: /** @type {const} */ ('fixed'), label: 'Solo gastos fijos' },
  { value: /** @type {const} */ ('variable'), label: 'Solo gastos variables (este mes)' },
]

/**
 * @param {{ value: GastosFilter, onChange: (v: GastosFilter) => void }} props
 */
export function GastosFilterSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const listId = useId()

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(/** @type {Node} */ (e.target))) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="moni-select-custom" ref={wrapRef}>
      <span className="moni-gastos-filter__label" id={`${listId}-label`}>
        Ver listado
      </span>
      <button
        type="button"
        className="moni-select-custom__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={`Filtrar listado: ${current.label}. Abrir opciones`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="moni-select-custom__value">{current.label}</span>
        <span className={`moni-select-custom__chev${open ? ' is-open' : ''}`} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <ul className="moni-select-custom__menu" id={listId} role="listbox" aria-label="Opciones de filtro">
          {OPTIONS.map((opt) => (
            <li key={opt.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`moni-select-custom__option${opt.value === value ? ' is-selected' : ''}`}
                onClick={() => {
                  onChange(/** @type {GastosFilter} */ (opt.value))
                  setOpen(false)
                }}
              >
                <span className="moni-select-custom__check" aria-hidden>
                  {opt.value === value ? '✓' : ''}
                </span>
                <span className="moni-select-custom__option-text">{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
