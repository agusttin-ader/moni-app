import { useMemo, useState } from 'react'
import { expenseCategoryById } from '../../lib/expenseCategories.js'
import { variableIncomeCategoryById } from '../../lib/incomeVariableCategories.js'
import { buildUnifiedMovements } from '../../lib/unifiedMovements.js'
import { formatISODateShort, formatMoney } from '../../lib/format.js'
import { useMobileLayout } from '../../hooks/useMobileLayout.js'
import { MovementSwipeRow } from './MovementSwipeRow.jsx'

function rowLabel(row) {
  if (row.kind === 'saving') return 'Ahorro'
  if (row.kind === 'income') return variableIncomeCategoryById(row.categoryId ?? 'varios').short
  return expenseCategoryById(row.categoryId ?? 'other').short
}

function rowEmoji(row) {
  if (row.kind === 'saving') return '💰'
  if (row.kind === 'income') return variableIncomeCategoryById(row.categoryId ?? 'varios').emoji
  return expenseCategoryById(row.categoryId ?? 'other').emoji
}

export function MovementsScreen({
  state,
  onEditExpense,
  onEditSaving,
  onEditIncome,
  dispatch,
}) {
  const mobile = useMobileLayout()
  const [filter, setFilter] = useState('all')
  const rows = useMemo(() => buildUnifiedMovements(state), [state])

  const filtered = useMemo(() => {
    if (filter === 'expense') return rows.filter((r) => r.kind === 'expense')
    if (filter === 'saving') return rows.filter((r) => r.kind === 'saving')
    if (filter === 'income') return rows.filter((r) => r.kind === 'income')
    return rows
  }, [rows, filter])

  const rowContent = (row) => {
    const isIn =
      row.kind === 'saving' || row.kind === 'income'
    return (
      <div
        className={`moni-mov__row-inner${isIn ? ' moni-mov__row-inner--save' : ' moni-mov__row-inner--spend'}`}
      >
        <div className="moni-mov__meta-block">
          <span className="moni-mov__icon" aria-hidden>
            {rowEmoji(row)}
          </span>
          <div className="moni-mov__text">
            <span className="moni-mov__title">{rowLabel(row)}</span>
            <span className="moni-mov__sub">
              {formatISODateShort(row.date)}
              {row.note ? ` · ${row.note}` : ''}
            </span>
          </div>
        </div>
        <div className="moni-mov__amt-block">
          <span
            className={`moni-mov__amt-big${isIn ? ' moni-mov__amt-big--in' : ' moni-mov__amt-big--out'}`}
          >
            {row.kind === 'expense' ? '−' : '+'}
            {formatMoney(row.amount)}
          </span>
        </div>
      </div>
    )
  }

  const handleEdit = (row) => {
    if (row.kind === 'expense') onEditExpense?.(row.id)
    else if (row.kind === 'saving') onEditSaving?.(row.id)
    else onEditIncome?.(row.id)
  }

  const handleDelete = (row) => {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar este movimiento?')) return
    if (row.kind === 'expense') {
      dispatch({ type: 'dailyExpense/delete', payload: { id: row.id } })
    } else if (row.kind === 'saving') {
      dispatch({ type: 'savings/delete', payload: { id: row.id } })
    } else {
      dispatch({ type: 'variableIncome/delete', payload: { id: row.id } })
    }
  }

  return (
    <div className="moni-mov">
      <div className="moni-segment moni-mov__filters" role="tablist" aria-label="Filtro">
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'all'}
          className={`moni-segment__btn${filter === 'all' ? ' is-active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'expense'}
          className={`moni-segment__btn${filter === 'expense' ? ' is-active' : ''}`}
          onClick={() => setFilter('expense')}
        >
          Gastos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'income'}
          className={`moni-segment__btn${filter === 'income' ? ' is-active' : ''}`}
          onClick={() => setFilter('income')}
        >
          Ingresos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === 'saving'}
          className={`moni-segment__btn${filter === 'saving' ? ' is-active' : ''}`}
          onClick={() => setFilter('saving')}
        >
          Ahorros
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="moni-empty moni-mov__empty">Sin movimientos.</p>
      ) : (
        <ul className="moni-mov__list">
          {filtered.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="moni-mov__li">
              {mobile ? (
                <MovementSwipeRow onEdit={() => handleEdit(row)} onDelete={() => handleDelete(row)}>
                  {rowContent(row)}
                </MovementSwipeRow>
              ) : (
                <div className="moni-mov__row moni-mov__row--desktop">
                  {rowContent(row)}
                  <div className="moni-mov__actions">
                    <button
                      type="button"
                      className="moni-action-btn"
                      onClick={() => handleEdit(row)}
                      aria-label="Editar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden width="18" height="18">
                        <path
                          d="M4 16.5V20h3.5L19 8.5l-3.5-3.5L4 16.5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="moni-action-btn moni-action-btn--danger"
                      onClick={() => handleDelete(row)}
                      aria-label="Eliminar"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden width="18" height="18">
                        <path
                          d="M6 6l12 12M18 6l-12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
