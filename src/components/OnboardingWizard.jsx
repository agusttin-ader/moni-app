import { useCallback, useState } from 'react'
import { amountFieldError, nameFieldError } from '../lib/formValidation.js'

const STEPS = 3

export function OnboardingWizard({ dispatch, onLogout }) {
  const [step, setStep] = useState(0)
  const [incomeName, setIncomeName] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [expenseName, setExpenseName] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [error, setError] = useState(null)

  const goNext = useCallback(() => {
    setError(null)
    if (step === 0) {
      setStep(1)
      return
    }
    if (step === 1) {
      const eN = nameFieldError(incomeName)
      const eA = amountFieldError(incomeAmount)
      if (eN || eA) {
        setError(eN || eA)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const eN = nameFieldError(expenseName)
      const eA = amountFieldError(expenseAmount)
      if (eN || eA) {
        setError(eN || eA)
        return
      }
      const amtInc = Number(String(incomeAmount).replace(',', '.'))
      const amtExp = Number(String(expenseAmount).replace(',', '.'))
      dispatch({
        type: 'income/add',
        payload: {
          name: incomeName.trim(),
          amount: amtInc,
          frequency: 'mensual',
        },
      })
      dispatch({
        type: 'expense/add',
        payload: {
          name: expenseName.trim(),
          amount: amtExp,
          categoryId: 'home',
        },
      })
      dispatch({ type: 'onboarding/complete' })
    }
  }, [
    step,
    incomeName,
    incomeAmount,
    expenseName,
    expenseAmount,
    dispatch,
  ])

  const goBack = useCallback(() => {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }, [])

  return (
    <div className="moni-onboarding" role="region" aria-label="Configuración inicial">
      {onLogout ? (
        <div className="moni-onboarding__toolbar">
          <button
            type="button"
            className="moni-btn moni-btn--ghost moni-btn--sm"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
      <div className="moni-onboarding__card">
        <div className="moni-onboarding__brand">
          <img
            className="moni-onboarding__logo"
            src="/images/moni-logo.png"
            alt=""
            width={40}
            height={40}
            decoding="async"
          />
          <span className="moni-onboarding__brand-text">Moni</span>
        </div>

        <div className="moni-onboarding__steps" aria-hidden>
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`moni-onboarding__dot${i <= step ? ' moni-onboarding__dot--on' : ''}`}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h1 className="moni-onboarding__title">Empecemos con lo esencial</h1>
            <p className="moni-onboarding__lead">
              En dos minutos cargás un ingreso mensual y un gasto fijo. Después
              vas a ver tu saldo y proyección con datos reales.
            </p>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h1 className="moni-onboarding__title">Tu ingreso principal</h1>
            <p className="moni-onboarding__lead">
              Sueldo u otro ingreso que recibís todos los meses (podés editar
              esto después).
            </p>
            <label className="moni-field moni-onboarding__field">
              <span className="moni-field__label">Concepto</span>
              <input
                className="moni-input"
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                placeholder="Ej. Sueldo"
                autoComplete="off"
              />
            </label>
            <label className="moni-field moni-onboarding__field">
              <span className="moni-field__label">Monto mensual</span>
              <input
                className="moni-input"
                inputMode="decimal"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="0"
              />
            </label>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h1 className="moni-onboarding__title">Un gasto fijo</h1>
            <p className="moni-onboarding__lead">
              Algo que pagás todos los meses por un monto similar (alquiler,
              servicio, préstamo sin cuotas en la app).
            </p>
            <label className="moni-field moni-onboarding__field">
              <span className="moni-field__label">Concepto</span>
              <input
                className="moni-input"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="Ej. Alquiler"
                autoComplete="off"
              />
            </label>
            <label className="moni-field moni-onboarding__field">
              <span className="moni-field__label">Monto por mes</span>
              <input
                className="moni-input"
                inputMode="decimal"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0"
              />
            </label>
          </>
        ) : null}

        {error ? (
          <p className="moni-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="moni-onboarding__actions">
          {step > 0 ? (
            <button
              type="button"
              className="moni-btn moni-btn--ghost"
              onClick={goBack}
            >
              Atrás
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="moni-btn moni-btn--primary"
            onClick={goNext}
          >
            {step === 0 ? 'Siguiente' : step === 2 ? 'Ir al panel' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  )
}
