import { useEffect, useReducer, useRef, useState } from 'react'
import {
  getUserData,
  moniStatePersistenceKey,
  saveUserData,
} from '../lib/db.js'
import { createInitialState, moniReducer } from '../state/moniReducer.js'

const SAVE_DEBOUNCE_MS = 650

/**
 * Estado sincronizado con Firestore. Tras hidratar guarda con debounce
 * y solo si el payload cambió (menos escrituras, más fluidez).
 */
export function useMoniState(user, authLoading) {
  const [state, dispatch] = useReducer(moniReducer, undefined, createInitialState)
  const [dataReady, setDataReady] = useState(false)
  const hydratedForUid = useRef(null)
  const lastPersistedKey = useRef(null)
  const saveTimerRef = useRef(0)

  useEffect(() => {
    if (authLoading) return

    if (!user?.uid) {
      queueMicrotask(() => setDataReady(false))
      hydratedForUid.current = null
      lastPersistedKey.current = null
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = 0
      }
      dispatch({ type: 'state/replace', payload: createInitialState() })
      return
    }

    const uid = user.uid
    queueMicrotask(() => setDataReady(false))
    hydratedForUid.current = null
    lastPersistedKey.current = null
    let cancelled = false

    ;(async () => {
      try {
        const data = await getUserData(uid)
        if (cancelled) return
        dispatch({ type: 'state/replace', payload: data })
        if (!cancelled) {
          hydratedForUid.current = uid
          lastPersistedKey.current = moniStatePersistenceKey(data)
          setDataReady(true)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          const fallback = createInitialState()
          dispatch({ type: 'state/replace', payload: fallback })
          hydratedForUid.current = uid
          lastPersistedKey.current = moniStatePersistenceKey(fallback)
          setDataReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, user?.uid])

  useEffect(() => {
    if (authLoading || !user?.uid) return
    if (hydratedForUid.current !== user.uid) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = 0
      const key = moniStatePersistenceKey(state)
      if (!key || key === lastPersistedKey.current) return
      saveUserData(user.uid, state)
        .then(() => {
          lastPersistedKey.current = key
        })
        .catch((e) => console.error('saveUserData', e))
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = 0
      }
    }
  }, [state, authLoading, user?.uid])

  return { state, dispatch, dataReady }
}
