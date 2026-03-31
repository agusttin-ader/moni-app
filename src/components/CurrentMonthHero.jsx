import { buildCurrentMonthHeroView, currentMonthHeroMeta } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function CurrentMonthHero({ state, remaining }) {
  const animated = useAnimatedNumber(remaining)
  const view = buildCurrentMonthHeroView(animated, formatMoney)
  const meta = currentMonthHeroMeta(state, formatMoney)
  const suffix = view.model.tone

  return (
    <section
      className={`moni-hero-main moni-hero-main--${suffix}`}
      id="resumen"
      aria-label="Resumen del mes actual"
    >
      <p className="moni-sr-only">{view.message}</p>
      <div className="moni-hero-main__inner">
        <p className="moni-hero-main__kicker">Este mes</p>
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
