import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
}

const optionalAiAdviceConfig = {
  endpoint: String(import.meta.env.VITE_MONI_ADVICE_API_URL ?? '').trim(),
  enabled: String(import.meta.env.VITE_MONI_ADVICE_ENABLED ?? '').toLowerCase() === 'true',
}

function firebaseEnvComplete() {
  const required = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ]
  return required.every((v) => typeof v === 'string' && v.trim().length > 0)
}

let auth = null
let db = null
let storage = null
let firebaseInitError = null

if (!firebaseEnvComplete()) {
  firebaseInitError =
    'Faltan datos de Firebase. Creá un archivo .env en la raíz del proyecto (copiá .env.example) y completá todas las variables VITE_FIREBASE_*. Después reiniciá npm run dev.'
} else {
  try {
    const appConfig = Object.fromEntries(
      Object.entries(firebaseConfig).filter(
        ([, v]) => typeof v === 'string' && v.trim().length > 0,
      ),
    )
    const app =
      getApps().length === 0 ? initializeApp(appConfig) : getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (e) {
    console.error(e)
    firebaseInitError =
      e?.message ??
      'No se pudo inicializar Firebase. Revisá las credenciales en la consola de Firebase.'
  }
}

export { auth, db, storage, firebaseInitError, optionalAiAdviceConfig }
