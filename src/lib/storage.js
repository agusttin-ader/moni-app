import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './firebase.js'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function requireStorage() {
  if (!storage) {
    throw new Error('Storage no está disponible.')
  }
}

function extensionFromType(type) {
  if (type === 'image/png') return 'png'
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  return 'img'
}

export function validateAvatarFile(file) {
  if (!file) return 'No se seleccionó ninguna imagen.'
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato no válido. Usá PNG, JPG, WEBP o GIF.'
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return 'La imagen supera el límite de 2 MB.'
  }
  return null
}

export async function uploadAvatar(uid, file) {
  requireStorage()
  if (!uid || typeof uid !== 'string') {
    throw new Error('uploadAvatar: uid inválido.')
  }
  const error = validateAvatarFile(file)
  if (error) {
    throw new Error(error)
  }

  const ext = extensionFromType(file.type)
  const fileRef = ref(storage, `avatars/${uid}/${Date.now()}.${ext}`)
  await uploadBytes(fileRef, file, { contentType: file.type })
  return getDownloadURL(fileRef)
}
