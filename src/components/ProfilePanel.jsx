import { useEffect, useMemo, useState } from 'react'

function initialsFromProfile(profile, user) {
  const name =
    user?.displayName?.trim() ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
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
  uploading,
  onUploadAvatar,
}) {
  const baseForm = useMemo(
    () => ({
      avatarUrl: profile?.avatarUrl ?? '',
    }),
    [profile],
  )

  const [form, setForm] = useState(baseForm)
  useEffect(() => {
    if (open) {
      setForm(baseForm)
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
  const busy = loading || uploading
  const displayName =
    user?.displayName?.trim() || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Usuario'
  const email = user?.email?.trim() || 'Sin email'

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const url = await onUploadAvatar?.(file)
      if (url) {
        setForm((prev) => ({ ...prev, avatarUrl: url }))
      }
    } catch {
      // Silencioso por UX: el usuario mantiene control del modal sin alertas bloqueantes.
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
                <img
                  src={form.avatarUrl}
                  alt="Avatar"
                  decoding="async"
                  loading="lazy"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="moni-profile-card__meta">
              <p className="moni-profile-card__name">{displayName}</p>
              <p className="moni-profile-card__mail">{email}</p>
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

          <div className="moni-profile-form">
            <p className="moni-panel__hint">Tu identidad se sincroniza automáticamente desde tu cuenta.</p>

            <div className="moni-profile-actions">
              <button
                type="button"
                className="moni-btn moni-btn--ghost"
                onClick={onClose}
                disabled={busy}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
