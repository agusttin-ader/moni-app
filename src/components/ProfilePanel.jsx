import { useEffect, useMemo, useState } from 'react'

function initialsFromProfile(profile, user) {
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    user?.displayName?.trim() ||
    user?.email?.trim() ||
    ''
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? ''
  return (a + b).toUpperCase() || '?'
}

export function ProfilePanel({
  open,
  onClose,
  user,
  profile,
  loading,
  saving,
  uploading,
  error,
  onSave,
  onUploadAvatar,
}) {
  const baseForm = useMemo(
    () => ({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      avatarUrl: profile?.avatarUrl ?? '',
    }),
    [profile],
  )

  const [form, setForm] = useState(baseForm)
  const [localError, setLocalError] = useState(null)

  useEffect(() => {
    if (open) {
      setForm(baseForm)
      setLocalError(null)
    }
  }, [open, baseForm])

  useEffect(() => {
    if (!open) return () => {}
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const initials = initialsFromProfile(profile, user)
  const busy = loading || saving || uploading

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError(null)
    try {
      await onSave?.(form)
      onClose?.()
    } catch (err) {
      setLocalError(err?.message ?? 'No se pudo guardar el perfil.')
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setLocalError(null)
    try {
      const url = await onUploadAvatar?.(file)
      if (url) {
        setForm((prev) => ({ ...prev, avatarUrl: url }))
      }
    } catch (err) {
      setLocalError(err?.message ?? 'No se pudo subir el avatar.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="moni-profile-modal" role="dialog" aria-modal="true">
      <div className="moni-profile-modal__backdrop" onClick={onClose} />
      <div className="moni-profile-modal__panel">
        <header className="moni-profile-modal__head">
          <div className="moni-profile-modal__title">
            <p className="moni-profile-modal__eyebrow">Cuenta</p>
            <h2>Perfil</h2>
          </div>
          <button
            type="button"
            className="moni-profile-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="moni-profile-modal__body">
          <div className="moni-profile-card">
            <div className="moni-profile-card__avatar">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="moni-profile-card__meta">
              <p className="moni-profile-card__name">
                {[form.firstName, form.lastName].filter(Boolean).join(' ') ||
                  user?.displayName ||
                  'Usuario'}
              </p>
              <label className="moni-profile-card__upload">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
                {uploading ? 'Subiendo...' : 'Cambiar foto'}
              </label>
            </div>
          </div>

          <form className="moni-profile-form" onSubmit={handleSubmit}>
            <div className="moni-profile-grid">
              <label className="moni-field">
                <span className="moni-field__label">Nombre</span>
                <input
                  className="moni-input"
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  disabled={busy}
                />
              </label>
              <label className="moni-field">
                <span className="moni-field__label">Apellido</span>
                <input
                  className="moni-input"
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  disabled={busy}
                />
              </label>
            </div>

            {localError || error ? (
              <p className="moni-form-error" role="alert">
                {localError || error}
              </p>
            ) : null}

            <div className="moni-profile-actions">
              <button
                type="button"
                className="moni-btn moni-btn--ghost"
                onClick={onClose}
                disabled={busy}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="moni-btn moni-btn--primary"
                disabled={busy}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
