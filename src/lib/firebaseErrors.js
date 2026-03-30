/** Mensaje amigable para errores comunes de Firebase en la UI. */
export function friendlyFirestoreMessage(err) {
  const code = err?.code ?? ''
  const msg = String(err?.message ?? '')
  if (
    code === 'permission-denied' ||
    /permission|insufficient permissions/i.test(msg)
  ) {
    return 'No tenés permiso para esta acción. Revisá las reglas de Firestore en Firebase Console (perfil: colección profiles; datos: users; historial: users/.../projectionHistory).'
  }
  if (code === 'unavailable' || /network/i.test(msg)) {
    return 'Sin conexión o el servicio no está disponible. Intentá de nuevo.'
  }
  if (!msg) return 'Ocurrió un error al guardar. Probá de nuevo.'
  return msg
}
