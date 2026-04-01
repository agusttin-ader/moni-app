import { buildCurrentMonthHeroView, currentMonthHeroMeta } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function CurrentMonthHero({ state, remaining }) {
  const monthlyIncome = Number(
    state?.ingresos
      ?.filter((item) => String(item?.frequency ?? '').toLowerCase() === 'mensual')
      ?.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0) ?? 0,
  )
  const animated = useAnimatedNumber(remaining)
  const view = buildCurrentMonthHeroView(animated, formatMoney, monthlyIncome)
  const meta = currentMonthHeroMeta(state, formatMoney)
  const suffix = view.model.tone
  const statusTone =
    suffix === 'negative' ? 'deficit' : suffix === 'positive' ? 'healthy' : 'neutral'
  const statusLabel =
    statusTone === 'deficit'
      ? 'Déficit'
      : statusTone === 'healthy'
        ? 'Superávit'
        : 'Equilibrado'

  return (
    <section
      className={`moni-hero-main moni-hero-main--${suffix}${
        suffix === 'negative'
          ? ` moni-hero-main--deficit-${view.model.deficitSeverity}`
          : ''
      }`}
      id="resumen"
      aria-label="Resumen del mes actual"
    >
      <p className="moni-sr-only">{view.message}</p>
      <div className="moni-hero-main__inner">
        <div className="moni-hero-main__kicker-row">
          <p className="moni-hero-main__kicker">Este mes</p>
          <span className={`moni-hero-main__status moni-hero-main__status--${statusTone}`}>
            <span className="moni-hero-main__status-dot" aria-hidden />
            {statusLabel}
          </span>
        </div>
        <p className="moni-hero-main__amount" aria-hidden>
          {view.amountDisplay}
        </p>
        <p className="moni-hero-main__caption">{view.message}</p>
        <div className="moni-hero-main__meta">
          <span className={`moni-hero-main__meta-pill moni-hero-main__meta-pill--${meta.tone}`}>
            {meta.label}
          </span>
          <strong className="moni-hero-main__meta-value">{meta.value}</strong>
        </div>
      </div>
    </section>
  )
}
