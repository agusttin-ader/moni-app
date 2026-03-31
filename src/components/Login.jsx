import { useState } from 'react'
import {
  emailFieldError,
  nameFieldError,
  passwordFieldError,
} from '../lib/formValidation.js'
import { login, loginWithGoogle, register } from '../lib/auth.js'

function GoogleMark() {
  return (
    <svg
      className="moni-google-mark"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function Login() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const validateAll = () => {
    const e1 = nameFieldError(firstName) || nameFieldError(lastName)
    if (e1) return e1
    const e2 = emailFieldError(email)
    if (e2) return e2
    const e3 = passwordFieldError(password)
    if (e3) return e3
    if (password !== passwordConfirm) return 'Las contraseñas no coinciden.'
    return null
  }

  const onGoogle = async () => {
    setError(null)
    setBusy(true)
    const { error: err } = await loginWithGoogle()
    setBusy(false)
    if (err) setError(err)
  }

  const onRegister = async (ev) => {
    ev.preventDefault()
    const v = validateAll()
    if (v) {
      setError(v)
      return
    }
    setError(null)
    setBusy(true)
    const { error: err } = await register(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
  }

  const onLoginOnly = async (ev) => {
    ev.preventDefault()
    const e2 = emailFieldError(email)
    const e3 = passwordFieldError(password)
    if (e2 || e3) {
      setError(e2 || e3)
      return
    }
    setError(null)
    setBusy(true)
    const { error: err } = await login(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <section
      className="moni-login-card"
      id="login-panel"
      tabIndex={-1}
      aria-labelledby="login-title"
    >
      <h2 id="login-title" className="moni-login-card__title">
        Empezá tu plan con MONI
      </h2>
      <p className="moni-login-card__hint">
        Entrá para ordenar tu situación actual, definir una meta concreta y ver si el futuro que
        querés es financieramente posible.
      </p>

      <button
        type="button"
        className="moni-btn moni-btn--secondary moni-btn--with-icon moni-btn--block"
        onClick={onGoogle}
        disabled={busy}
      >
        <GoogleMark />
        <span>Continuar con Google</span>
      </button>

      <div className="moni-login-sep" role="presentation">
        <span>o con email</span>
      </div>

      <form className="moni-form" onSubmit={onRegister} noValidate>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Nombre</span>
            <input
              className="moni-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Apellido</span>
            <input
              className="moni-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </label>
        </div>
        <div className="moni-form-row moni-form-row--single">
          <label className="moni-field">
            <span className="moni-field__label">Email</span>
            <input
              className="moni-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
        </div>
        <div className="moni-form-row moni-form-row--split">
          <label className="moni-field">
            <span className="moni-field__label">Contraseña</span>
            <input
              className="moni-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="moni-field">
            <span className="moni-field__label">Confirmar</span>
            <input
              className="moni-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
        </div>

        {error ? (
          <p className="moni-form-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="moni-login-actions">
          <button
            type="submit"
            className="moni-btn moni-btn--primary moni-btn--block moni-login-card__cta"
            disabled={busy}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            className="moni-login-foot-link"
            onClick={onLoginOnly}
            disabled={busy}
          >
            ¿Ya tenés cuenta? <span className="moni-login-foot-link__em">Iniciar sesión</span>
          </button>
        </div>
      </form>
    </section>
  )
}
