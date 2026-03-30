import { useEffect, useMemo, useRef, useState } from 'react'
import { friendlyFirestoreMessage } from '../lib/firebaseErrors.js'
import {
  buildProjectionSnapshot,
  getProjectionHistory,
  saveProjectionSnapshot,
} from '../lib/projectionHistory.js'

function snapshotSignature(snapshot) {
  if (!snapshot) return ''
  return [
    snapshot.monthKey,
    snapshot.incomes,
    snapshot.fixed,
    snapshot.debts,
    snapshot.remaining,
    snapshot.projection?.map((p) => p.balance).join('|'),
  ].join(':')
}

function upsertHistory(list, snapshot) {
  const next = Array.isArray(list) ? [...list] : []
  const idx = next.findIndex((h) => h.monthKey === snapshot.monthKey)
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...snapshot }
  } else {
    next.unshift(snapshot)
  }
  return next
}

export function useProjectionHistory(user, state) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastSavedRef = useRef('')
  const saveTimerRef = useRef(0)

  const snapshot = useMemo(
    () => buildProjectionSnapshot(state),
    [state],
  )
  const signature = useMemo(() => snapshotSignature(snapshot), [snapshot])

  useEffect(() => {
    if (!user?.uid) {
      queueMicrotask(() => {
        setHistory([])
        setLoading(false)
        setError(null)
      })
      return () => {}
    }
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true)
        setError(null)
      }
    })
    getProjectionHistory(user.uid, 24)
      .then((rows) => {
        if (!cancelled) setHistory(rows ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            friendlyFirestoreMessage(err) || 'No se pudo cargar el historial.',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return () => {}
    if (!signature || signature === lastSavedRef.current) return () => {}
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        await saveProjectionSnapshot(user.uid, snapshot)
        lastSavedRef.current = signature
        setHistory((prev) => upsertHistory(prev, snapshot))
      } catch (err) {
        setError(
          friendlyFirestoreMessage(err) || 'No se pudo guardar el historial.',
        )
      }
    }, 700)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [signature, snapshot, user?.uid])

  return { history, loading, error }
}
