import { useEffect } from 'react'
import { projectionBalanceClassSuffix } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { lockBodyScroll } from '../lib/bodyScrollLock.js'

function monthLabel(ym) {
  const [y, m] = String(ym ?? '').split('-')
  if (!y || !m) return ym
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export function ProjectionHistoryPanel({
  open,
  onClose,
  history,
  loading,
  error,
}) {
  useEffect(() => {
    if (!open) return () => {}
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return undefined
    return lockBodyScroll()
  }, [open])

  if (!open) return null

  return (
    <div className="moni-profile-modal" role="dialog" aria-modal="true">
      <div className="moni-profile-modal__backdrop" onClick={onClose} />
      <div className="moni-profile-modal__panel moni-history-modal__panel">
        <header className="moni-profile-modal__head">
          <div className="moni-profile-modal__title">
            <p className="moni-profile-modal__eyebrow">Flujo</p>
            <h2>Historial proyectado</h2>
          </div>
          <button
            type="button"
            className="moni-profile-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="moni-history-modal__body">
          <p className="moni-history-modal__hint">
            Resumen mensual guardado automáticamente. Podés revisar cómo estaba
            tu saldo en meses anteriores (hasta 24 registros).
          </p>
          {loading ? (
            <p className="moni-hint">Cargando historial...</p>
          ) : error ? (
            <p className="moni-form-error" role="alert">
              {error}
            </p>
          ) : !history?.length ? (
            <p className="moni-empty">Aún no hay historial guardado.</p>
          ) : (
            <ul className="moni-history-list moni-history-list--modal">
              {history.map((item) => {
                const tone = projectionBalanceClassSuffix(item.remaining)
                return (
                  <li key={item.monthKey} className="moni-history-item">
                    <div>
                      <div className="moni-history-item__title">
                        {monthLabel(item.monthKey)}
                      </div>
                      <div className="moni-history-item__meta">
                        Ingresos {formatMoney(item.incomes)} · Egresos{' '}
                        {formatMoney(item.fixed + item.debts)}
                      </div>
                    </div>
                    <div
                      className={`moni-history-item__balance moni-history-item__balance--${tone}`}
                    >
                      {formatMoney(item.remaining)}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
