export function DashboardQuickActions({ onOpenUnified }) {
  return (
    <section className="moni-card moni-quick-actions-card" aria-label="Acciones rápidas">
      <div className="moni-card__head moni-quick-actions-card__head">
        <h3 className="moni-card__title">Acciones rápidas</h3>
        <p className="moni-card__sub">Lo importante, en uno o dos toques desde el inicio.</p>
      </div>

      <div className="moni-quick-actions">
        <button
          type="button"
          className="moni-quick-actions__btn moni-quick-actions__btn--primary"
          onClick={() => onOpenUnified?.({ preferMode: 'variable' })}
        >
          <span className="moni-quick-actions__icon" aria-hidden>
            +
          </span>
          <span>
            <strong>Gasto variable</strong>
            <small>carga diaria</small>
          </span>
        </button>

        <button
          type="button"
          className="moni-quick-actions__btn"
          onClick={() => onOpenUnified?.({ preferMode: 'fixed' })}
        >
          <span className="moni-quick-actions__icon" aria-hidden>
            =
          </span>
          <span>
            <strong>Gasto fijo</strong>
            <small>monto mensual</small>
          </span>
        </button>

        <a className="moni-quick-actions__btn moni-quick-actions__btn--ghost" href="#moni-panel-ingresos">
          <span className="moni-quick-actions__icon" aria-hidden>
            $
          </span>
          <span>
            <strong>Ingresos</strong>
            <small>editar o agregar</small>
          </span>
        </a>

        <a className="moni-quick-actions__btn moni-quick-actions__btn--ghost" href="#moni-panel-deudas">
          <span className="moni-quick-actions__icon" aria-hidden>
            %
          </span>
          <span>
            <strong>Cuotas</strong>
            <small>ver compromisos</small>
          </span>
        </a>
      </div>
    </section>
  )
}
