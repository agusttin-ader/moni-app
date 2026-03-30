import { buildCurrentMonthHeroView } from '../lib/calculations.js'
import { formatMoney } from '../lib/format.js'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js'

export function CurrentMonthHero({ remaining }) {
  const animated = useAnimatedNumber(remaining)
  const view = buildCurrentMonthHeroView(animated, formatMoney)
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
      </div>
    </section>
  )
}
