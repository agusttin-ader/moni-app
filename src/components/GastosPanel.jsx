import { useMemo, useState } from 'react'
import { currentYearMonthString } from '../lib/calculations.js'
import { expenseCategoryById } from '../lib/expenseCategories.js'
import { formatMoney } from '../lib/format.js'
import { CollapsiblePanelDetail } from './CollapsiblePanelDetail.jsx'
import { GastosFilterSelect } from './GastosFilterSelect.jsx'

/** @typedef {'all' | 'fixed' | 'variable'} GastosFilter */

export function GastosPanel({ gastos, gastosDiarios, dispatch, onOpenUnified }) {
  const [filter, setFilter] = useState(
    /** @type {GastosFilter} */ ('all'),
  )

  const monthKey = currentYearMonthString()

  const variableMonth = useMemo(() => {
    const list = (gastosDiarios ?? []).filter(
      (g) => g && String(g.date ?? '').slice(0, 7) === monthKey,
    )
    return [...list].sort((a, b) => {
      const d = String(b.date).localeCompare(String(a.date))
      if (d !== 0) return d
      return String(b.id).localeCompare(String(a.id))
    })
  }, [gastosDiarios, monthKey])

  const fixedTotal = useMemo(
    () =>
      (gastos ?? []).reduce((s, g) => s + (Number(g.amount) || 0), 0),
    [gastos],
  )

  const variableTotal = useMemo(
    () =>
      variableMonth.reduce((s, g) => s + (Number(g.amount) || 0), 0),
    [variableMonth],
  )

  const rows = useMemo(() => {
    const fixed = (gastos ?? []).map((x) => ({
      kind: /** @type {const} */ ('fixed'),
      id: x.id,
      sort: 0,
      data: x,
    }))
    const variable = variableMonth.map((x) => ({
      kind: /** @type {const} */ ('variable'),
      id: x.id,
      sort: 1,
      data: x,
    }))
    const merged = [...fixed, ...variable]
    if (filter === 'fixed') return merged.filter((r) => r.kind === 'fixed')
    if (filter === 'variable') return merged.filter((r) => r.kind === 'variable')
    return merged
  }, [gastos, variableMonth, filter])

  const listCount = rows.length
  const emptyMsg =
    filter === 'fixed'
      ? 'No hay gastos fijos cargados.'
      : filter === 'variable'
        ? 'No hay gastos variables este mes.'
        : 'No hay gastos cargados. Usá el botón de abajo para agregar el primero.'

  return (
    <section
      className="moni-panel moni-panel--gastos-unified"
      id="moni-panel-gastos"
      aria-label="Gastos"
    >
      <h3 className="moni-panel__title">Gastos</h3>
      <p className="moni-panel__hint moni-panel__hint--gastos">
        Un solo registro para <strong>fijos</strong> (cada mes) y <strong>variables</strong>{' '}
        (por día). Los gráficos usan ambos automáticamente.
      </p>

      <div className="moni-gastos-toolbar">
        <div className="moni-gastos-filter">
          <GastosFilterSelect value={filter} onChange={setFilter} />
        </div>
        <button
          type="button"
          className="moni-btn moni-btn--primary moni-btn--sm moni-gastos-add"
          onClick={() => onOpenUnified?.({})}
        >
          + Agregar gasto
        </button>
      </div>

      <p className="moni-gastos-totals" aria-live="polite">
        <span>
          Fijos: <strong>{formatMoney(fixedTotal)}</strong>/mes
        </span>
        <span className="moni-gastos-totals__sep" aria-hidden>
          ·
        </span>
        <span>
          Variables (mes): <strong>{formatMoney(variableTotal)}</strong>
        </span>
      </p>

      {!listCount ? (
        <p className="moni-empty">{emptyMsg}</p>
      ) : (
        <CollapsiblePanelDetail
          labelCollapsed={`Ver movimientos (${listCount})`}
          labelOpen="Ocultar lista"
        >
          <ul className="moni-list moni-list--embedded moni-gastos-list">
            {rows.map((row) => {
              if (row.kind === 'fixed') {
                const x = row.data
                const cat = expenseCategoryById(x.categoryId ?? 'other')
                return (
                  <li key={`f-${x.id}`} className="moni-list__item moni-gastos-row">
                    <div>
                      <div className="moni-list__name">
                        <span className="moni-gastos-badge moni-gastos-badge--fixed">
                          Fijo
                        </span>
                        <span aria-hidden>{cat.emoji}</span> {x.name}
                      </div>
                      <div className="moni-list__meta">{formatMoney(x.amount)} / mes</div>
                    </div>
                    <div className="moni-list__actions">
                      <button
                        type="button"
                        className="moni-action-btn"
                        onClick={() => onOpenUnified?.({ editFixedId: x.id })}
                        aria-label="Editar gasto fijo"
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
                          dispatch({ type: 'expense/delete', payload: { id: x.id } })
                        }
                        aria-label="Eliminar"
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
              }
              const x = row.data
              const cat = expenseCategoryById(x.categoryId)
              const label = x.note?.trim() ? x.note.trim() : cat.short
              return (
                <li key={`v-${x.id}`} className="moni-list__item moni-gastos-row">
                  <div>
                    <div className="moni-list__name">
                      <span className="moni-gastos-badge moni-gastos-badge--variable">
                        Variable
                      </span>
                      <span aria-hidden>{cat.emoji}</span> {label}
                    </div>
                    <div className="moni-list__meta">
                      {x.date} · {formatMoney(x.amount)}
                    </div>
                  </div>
                  <div className="moni-list__actions">
                    <button
                      type="button"
                      className="moni-action-btn"
                      onClick={() => onOpenUnified?.({ editDailyId: x.id })}
                      aria-label="Editar gasto variable"
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
                        dispatch({
                          type: 'dailyExpense/delete',
                          payload: { id: x.id },
                        })
                      }
                      aria-label="Eliminar"
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
        </CollapsiblePanelDetail>
      )}
    </section>
  )
}
