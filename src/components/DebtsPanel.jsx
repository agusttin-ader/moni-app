import { useEffect, useMemo, useState } from 'react'
import { useNarrowViewport } from '../hooks/useNarrowViewport.js'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'
import {
  addMonthsToYearMonth,
  clampPaidInstallments,
  currentYearMonthString,
  debtIsFinished,
  debtMonthlyPreviewFromFormFields,
  debtSummaryForList,
  normalizeStartMonth,
  remainingInstallments,
} from '../lib/calculations.js'
import {
  amountFieldError,
  intFieldError,
  nameFieldError,
} from '../lib/formValidation.js'
import { formatMoney, formatYearMonth } from '../lib/format.js'

export function DebtsPanel({ items, dispatch, expandFormSignal = 0, listFilterQuery = '' }) {
  const narrow = useNarrowViewport()
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentCount, setInstallmentCount] = useState('')
  const [startMonth, setStartMonth] = useState(() => currentYearMonthString())
  const [paidInstallments, setPaidInstallments] = useState('0')
  const [debtKind, setDebtKind] = useState('loan')
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (expandFormSignal <= 0) return
    queueMicrotask(() => setAddFormOpen(true))
  }, [expandFormSignal])

  const preview = useMemo(
    () => debtMonthlyPreviewFromFormFields(totalAmount, installmentCount),
    [totalAmount, installmentCount],
  )

  const filteredDebtItems = useMemo(() => {
    const q = (listFilterQuery ?? '').trim().toLowerCase()
    if (!q) return items
    return items.filter((x) =>
      String(x.name ?? '')
        .toLowerCase()
        .includes(q),
    )
  }, [items, listFilterQuery])

  const reset = () => {
    setEditingId(null)
    setName('')
    setTotalAmount('')
    setInstallmentCount('')
    setStartMonth(currentYearMonthString())
    setPaidInstallments('0')
    setDebtKind('loan')
    setError(null)
  }

  const onSubmit = (ev) => {
    ev.preventDefault()
    const eN = nameFieldError(name)
    const eT = amountFieldError(totalAmount)
    const eC = intFieldError(installmentCount, 'cantidad de cuotas')
    if (eN || eT || eC) {
      setError(eN || eT || eC)
      return
    }
    const paid = String(paidInstallments).trim()
    const paidN = paid === '' ? 0 : Number(paid.replace(',', '.'))
    if (!Number.isInteger(paidN) || paidN < 0) {
      setError('Las cuotas ya pagadas deben ser un número entero (0 o más).')
      return
    }
    setError(null)
    const count = Math.floor(Number(String(installmentCount).replace(',', '.')))
    const payload = {
      name: name.trim(),
      totalAmount: Number(String(totalAmount).replace(',', '.')),
      installmentCount: count,
      startMonth: normalizeStartMonth(startMonth),
      paidInstallments: paidN,
      debtKind,
    }
    if (editingId) {
      const capped = clampPaidInstallments(paidN, count)
      dispatch({
        type: 'debt/update',
        payload: { id: editingId, ...payload, paidInstallments: capped },
      })
    } else {
      dispatch({ type: 'debt/add', payload })
    }
    reset()
  }

  const startEdit = (x) => {
    setEditingId(x.id)
    setName(x.name)
    setTotalAmount(String(x.totalAmount))
    setInstallmentCount(String(x.installmentCount))
    setStartMonth(x.startMonth || currentYearMonthString())
    setPaidInstallments(String(x.paidInstallments ?? 0))
    setDebtKind(x.debtKind === 'credit_card' ? 'credit_card' : 'loan')
    setError(null)
  }

  const form = (
    <form
      className="moni-form moni-form--compact moni-form--panel moni-form--debts"
      onSubmit={onSubmit}
      autoComplete="off"
    >
      <div className="moni-debt-section">
        <p className="moni-debt-section__label">¿Qué estás pagando?</p>
        <div className="moni-debt-type-pick" role="group" aria-label="Tipo de cuota">
          <button
            type="button"
            className={`moni-debt-type-btn${debtKind === 'loan' ? ' moni-debt-type-btn--active' : ''}`}
            onClick={() => setDebtKind('loan')}
          >
            <span className="moni-debt-type-btn__emoji" aria-hidden>
              🏦
            </span>
            <span className="moni-debt-type-btn__title">Préstamo u otro</span>
            <span className="moni-debt-type-btn__hint">Banco, financiación, etc.</span>
          </button>
          <button
            type="button"
            className={`moni-debt-type-btn${debtKind === 'credit_card' ? ' moni-debt-type-btn--active' : ''}`}
            onClick={() => setDebtKind('credit_card')}
          >
            <span className="moni-debt-type-btn__emoji" aria-hidden>
              💳
            </span>
            <span className="moni-debt-type-btn__title">Tarjeta de crédito</span>
            <span className="moni-debt-type-btn__hint">Cuotas del resumen</span>
          </button>
        </div>
      </div>

      <div className="moni-debt-section">
        <label className="moni-field">
          <span className="moni-field__label">Nombre</span>
          <input
            className="moni-input"
            name="debt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Préstamo Galicia, Visa Gold"
          />
        </label>
        <p className="moni-debt-micro">Así lo vas a reconocer en la lista.</p>
      </div>

      <div className="moni-debt-section">
        <p className="moni-debt-section__label">Montos</p>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Total a pagar</span>
            <input
              className="moni-input"
              name="debt-total"
              inputMode="decimal"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">En cuántas cuotas</span>
            <input
              className="moni-input"
              name="debt-installments"
              inputMode="numeric"
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
              placeholder="12"
            />
          </label>
        </div>
        <p className="moni-debt-micro">
          Dividimos el total en cuotas iguales para calcular tu mes.
        </p>
      </div>

      <div className="moni-debt-section">
        <p className="moni-debt-section__label">¿Cuándo empieza la cuota?</p>
        <p className="moni-debt-micro">
          Elegí el <strong>mes de la primera cuota</strong> que querés seguir acá (vencimiento
          mensual, no el día exacto).
        </p>
        <div
          className="moni-debt-month-chips"
          role="group"
          aria-label="Atajos: mes de primera cuota"
        >
          <button
            type="button"
            className="moni-debt-month-chip"
            onClick={() =>
              setStartMonth(addMonthsToYearMonth(currentYearMonthString(), -1))
            }
          >
            Mes anterior
          </button>
          <button
            type="button"
            className="moni-debt-month-chip"
            onClick={() => setStartMonth(currentYearMonthString())}
          >
            Este mes
          </button>
          <button
            type="button"
            className="moni-debt-month-chip"
            onClick={() =>
              setStartMonth(addMonthsToYearMonth(currentYearMonthString(), 1))
            }
          >
            Próximo mes
          </button>
        </div>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Primera cuota (mes)</span>
            <input
              type="month"
              className="moni-input moni-input--month"
              name="debt-start"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Cuotas ya pagas</span>
            <input
              className="moni-input"
              name="debt-paid"
              inputMode="numeric"
              value={paidInstallments}
              onChange={(e) => setPaidInstallments(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>
        <p className="moni-debt-micro">
          Si recién empezás, en cuotas pagas poné <strong>0</strong>. Si ya pagaste algunas,
          indicá cuántas llevás.
        </p>
      </div>

      {preview != null && Number(preview) > 0 ? (
        <div className="moni-debt-preview" role="status">
          <span className="moni-debt-preview__label">Vas a pagar alrededor de</span>
          <strong className="moni-debt-preview__amount">{formatMoney(preview)}</strong>
          <span className="moni-debt-preview__unit">por mes (cuota estimada)</span>
        </div>
      ) : null}

      {error ? (
        <p className="moni-form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="moni-form-actions moni-form-actions--debts">
        <button type="submit" className="moni-btn moni-btn--primary moni-btn--sm">
          {editingId ? 'Guardar cambios' : 'Agregar a la lista'}
        </button>
        {editingId ? (
          <button
            type="button"
            className="moni-btn moni-btn--ghost moni-btn--sm"
            onClick={reset}
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  )

  return (
    <section
      className="moni-panel moni-panel--debts"
      id="moni-panel-deudas"
      aria-label="Cuotas y deudas"
    >
      <h3 className="moni-panel__title">Cuotas mensuales</h3>
      <p className="moni-debt-intro">
        Sumá lo que pagás en cuotas fijas cada mes: tarjeta, préstamo, financiación. Moni divide el
        total en cuotas <strong>iguales</strong> para tu presupuesto (no simula interés bancario ni
        TNA).
      </p>

      {narrow ? (
        <CollapsiblePanelDetail
          className="moni-collapse--panel-form"
          labelCollapsed="Agregar una cuota"
          labelOpen="Cerrar formulario"
          open={addFormOpen || Boolean(editingId)}
          onOpenChange={setAddFormOpen}
        >
          {form}
        </CollapsiblePanelDetail>
      ) : (
        form
      )}

      {!items.length ? (
        <p className="moni-empty moni-empty--debts">
          Todavía no cargaste cuotas. Cuando agregues la primera, vas a ver el resumen acá.
        </p>
      ) : (
        <CollapsiblePanelDetail
          labelCollapsed={`Ver mis cuotas (${items.length})`}
          labelOpen="Ocultar lista"
        >
          {!filteredDebtItems.length ? (
            <p className="moni-empty moni-empty--debts">Ninguna cuota coincide con la búsqueda.</p>
          ) : (
          <ul className="moni-debt-list">
            {filteredDebtItems.map((x) => {
              const s = debtSummaryForList(x)
              const fin = debtIsFinished(x)
              const rem = remainingInstallments(x)
              const isCard = String(x.debtKind ?? 'loan') === 'credit_card'
              const paid = clampPaidInstallments(
                x.paidInstallments,
                x.installmentCount,
              )
              const totalN = Math.max(0, Math.floor(Number(x.installmentCount) || 0))
              return (
                <li key={x.id} className="moni-debt-card">
                  <div className="moni-debt-card__body">
                    <div className="moni-debt-card__title-row">
                      <span className="moni-debt-card__icon" aria-hidden>
                        {isCard ? '💳' : '🏦'}
                      </span>
                      <span className="moni-debt-card__name">{x.name}</span>
                    </div>
                    {fin ? (
                      <p className="moni-debt-card__status moni-debt-card__status--done">
                        Listo: terminaste de pagar
                      </p>
                    ) : (
                      <>
                        <p className="moni-debt-card__amount-line">
                          <span className="moni-debt-card__per">
                            {formatMoney(s.perMonth)}
                          </span>
                          <span className="moni-debt-card__per-label">/ mes</span>
                        </p>
                        <p className="moni-debt-card__progress">
                          {paid} de {totalN} cuotas pagadas
                          {rem > 0 ? ` · faltan ${rem}` : null}
                        </p>
                        <p className="moni-debt-card__dates">
                          Plan de cuotas: {formatYearMonth(x.startMonth)} →{' '}
                          {formatYearMonth(
                            addMonthsToYearMonth(x.startMonth, Math.max(0, totalN - 1)),
                          )}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="moni-debt-card__actions">
                    <button
                      type="button"
                      className="moni-action-btn"
                      onClick={() => startEdit(x)}
                      aria-label={`Editar ${x.name}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path
                          d="M4 16.5V20h3.5L19 8.5l-3.5-3.5L4 16.5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.5 5l3.5 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="moni-sr-only">Editar</span>
                    </button>
                    <button
                      type="button"
                      className="moni-action-btn moni-action-btn--danger"
                      onClick={() =>
                        dispatch({ type: 'debt/delete', payload: { id: x.id } })
                      }
                      aria-label={`Eliminar ${x.name}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <path
                          d="M6 6l12 12M18 6l-12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="moni-sr-only">Eliminar</span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          )}
        </CollapsiblePanelDetail>
      )}
    </section>
  )
}
