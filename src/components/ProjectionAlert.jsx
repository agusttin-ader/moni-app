import {
  PROJECTION_HORIZON_MONTHS,
  deficitAlertText,
} from '../lib/calculations.js'

export function ProjectionAlert({ state }) {
  const text = deficitAlertText(state, PROJECTION_HORIZON_MONTHS)
  if (!text) return null
  return (
    <div className="moni-alert moni-alert--warn" role="status">
      <span className="moni-alert__icon" aria-hidden>
        !
      </span>
      <p className="moni-alert__text">{text}</p>
    </div>
  )
}
