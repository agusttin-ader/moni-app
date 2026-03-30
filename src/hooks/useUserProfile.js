import { useCallback, useEffect, useState } from 'react'
import { friendlyFirestoreMessage } from '../lib/firebaseErrors.js'
import { buildEmptyProfile, getUserProfile, saveUserProfile } from '../lib/profile.js'
import { uploadAvatar } from '../lib/storage.js'

export function useUserProfile(user) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!user?.uid) {
      queueMicrotask(() => {
        setProfile(null)
        setLoading(false)
        setError(null)
      })
      return () => {}
    }

    const base = buildEmptyProfile(user)
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true)
        setError(null)
      }
    })

    getUserProfile(user.uid)
      .then((remote) => {
        if (cancelled) return
        setProfile({ ...base, ...(remote ?? {}) })
      })
      .catch((err) => {
        if (cancelled) return
        setError(friendlyFirestoreMessage(err) || 'No se pudo cargar el perfil.')
        setProfile(base)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const saveProfile = useCallback(
    async (data) => {
      if (!user?.uid) return null
      setSaving(true)
      setError(null)
      try {
        const payload = await saveUserProfile(user.uid, data)
        const { updatedAt: _updatedAt, ...rest } = payload ?? {}
        void _updatedAt
        setProfile((prev) => ({ ...(prev ?? {}), ...rest }))
        return rest
      } catch (err) {
        setError(friendlyFirestoreMessage(err) || 'No se pudo guardar el perfil.')
        throw err
      } finally {
        setSaving(false)
      }
    },
    [user?.uid],
  )

  const updateAvatar = useCallback(
    async (file) => {
      if (!user?.uid) return null
      setUploading(true)
      setError(null)
      try {
        const url = await uploadAvatar(user.uid, file)
        await saveUserProfile(user.uid, { avatarUrl: url })
        setProfile((prev) => ({ ...(prev ?? {}), avatarUrl: url }))
        return url
      } catch (err) {
        setError(friendlyFirestoreMessage(err) || 'No se pudo subir el avatar.')
        throw err
      } finally {
        setUploading(false)
      }
    },
    [user?.uid],
  )

  return {
    profile,
    loading,
    saving,
    uploading,
    error,
    saveProfile,
    updateAvatar,
  }
}
