import {
  activeGoalModel,
  computeMonthBalance,
  currentYearMonthString,
  savingsMonthTotal,
  totalSavingsEntriesAmount,
} from '../../lib/calculations.js'
import { expenseCategoryById } from '../../lib/expenseCategories.js'
import { variableIncomeCategoryById } from '../../lib/incomeVariableCategories.js'
import { formatISODateShort, formatMoney } from '../../lib/format.js'
import { getUnifiedTransactions } from '../../lib/transactions.js'

/**
 * Inicio: saldo, meta con %, resumen compacto gastos/ahorros del mes.
 */
export function HomeScreen({ state, onOpenPlan, onOpenDetails }) {
  const b = computeMonthBalance(state, 0)
  const marginDeficit = b.remaining < 0
  const inflow = b.incomes + b.variableIncome
  const outflow = b.fixed + b.debts + b.daily
  const ym = currentYearMonthString()
  const savingsMonth = savingsMonthTotal(state, ym)
  const goal = activeGoalModel(state)
  const savedTotal = totalSavingsEntriesAmount(state)
  const pct =
    goal && goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100))
      : 0

  const recent = getUnifiedTransactions(state).slice(0, 3)

  return (
    <div className="moni-home-simple">
      <div className="moni-home-simple__hero">
        <p className="moni-home-simple__kicker">Margen del mes</p>
        <p
          className={`moni-home-simple__balance${
            marginDeficit ? ' moni-home-simple__balance--deficit' : ' moni-home-simple__balance--surplus'
          }`}
        >
          {formatMoney(b.remaining)}
        </p>
      </div>

      <div className="moni-home-simple__summary">
        <div className="moni-home-simple__summary-row">
          <span className="moni-home-simple__summary-label">Ingresos</span>
          <span className="moni-home-simple__summary-val moni-home-simple__summary-val--in">
            {formatMoney(inflow)}
          </span>
        </div>
        <div className="moni-home-simple__summary-row">
          <span className="moni-home-simple__summary-label">Gastos</span>
          <span className="moni-home-simple__summary-val moni-home-simple__summary-val--out">
            {formatMoney(outflow)}
          </span>
        </div>
        <div className="moni-home-simple__summary-row">
          <span className="moni-home-simple__summary-label">Ahorros (mes)</span>
          <span className="moni-home-simple__summary-val moni-home-simple__summary-val--in">
            {formatMoney(savingsMonth)}
          </span>
        </div>
      </div>

      {goal ? (
        <section className="moni-home-simple__goal" aria-label="Meta">
          <div className="moni-home-simple__goal-top">
            <span className="moni-home-simple__goal-pct">{pct}%</span>
            <button type="button" className="moni-home-simple__link" onClick={onOpenPlan}>
              Meta
            </button>
          </div>
          <div className="moni-home-simple__bar moni-home-simple__bar--hero" aria-hidden>
            <div className="moni-home-simple__bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="moni-home-simple__goal-nums">
            <span>{formatMoney(goal.savedAmount)}</span>
            <span className="moni-home-simple__goal-sep">/</span>
            <span>{formatMoney(goal.targetAmount)}</span>
          </div>
          <p className="moni-home-simple__goal-feedback">
            {pct}% de la meta
            {goal.remainingNeeded > 0 && goal.requiredPerMonth > 0.01
              ? ` · ~${Math.max(1, Math.ceil(goal.remainingNeeded / goal.requiredPerMonth))} meses al ritmo actual`
              : ''}
          </p>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="moni-home-simple__recent" aria-label="Actividad reciente">
          <div className="moni-home-simple__recent-head">
            <span className="moni-home-simple__recent-title">Actividad reciente</span>
          </div>
          <ul className="moni-home-simple__recent-list">
            {recent.map((row) => (
              <li key={`${row.type}-${row.id}`} className="moni-home-simple__recent-li">
                <span className="moni-home-simple__recent-icon" aria-hidden>
                  {row.type === 'savings'
                    ? '💰'
                    : row.type === 'income'
                      ? variableIncomeCategoryById(row.categoryId ?? 'varios').emoji
                      : expenseCategoryById(row.categoryId ?? 'other').emoji}
                </span>
                <div className="moni-home-simple__recent-meta">
                  <span className="moni-home-simple__recent-label">
                    {row.type === 'savings'
                      ? 'Ahorro'
                      : row.type === 'income'
                        ? variableIncomeCategoryById(row.categoryId ?? 'varios').short
                        : expenseCategoryById(row.categoryId ?? 'other').short}
                  </span>
                  <span className="moni-home-simple__recent-date">{formatISODateShort(row.date)}</span>
                </div>
                <span
                  className={`moni-home-simple__recent-amt${
                    row.type === 'savings' || row.type === 'income'
                      ? ' moni-home-simple__recent-amt--in'
                      : ' moni-home-simple__recent-amt--out'
                  }`}
                >
                  {row.type === 'expense' ? '−' : '+'}
                  {formatMoney(row.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!goal ? (
        <section className="moni-home-simple__goal moni-home-simple__goal--empty">
          {savedTotal > 0 ? (
            <p className="moni-home-simple__orphan">
              {formatMoney(savedTotal)} ·{' '}
              <button type="button" className="moni-home-simple__link" onClick={onOpenPlan}>
                Definir meta
              </button>
            </p>
          ) : (
            <button type="button" className="moni-btn moni-btn--primary moni-btn--block" onClick={onOpenPlan}>
              Meta
            </button>
          )}
        </section>
      ) : null}

      {onOpenDetails ? (
        <button type="button" className="moni-home-simple__details-cta" onClick={onOpenDetails}>
          Ver detalles
        </button>
      ) : null}
    </div>
  )
}
