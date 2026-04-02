import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RootErrorBoundary } from './RootErrorBoundary.jsx'

if (typeof window !== 'undefined') {
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    { passive: false },
  )
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const registerSw = () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  }
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(registerSw, { timeout: 4000 })
  } else {
    window.addEventListener('load', registerSw)
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró #root en el documento.')
}

createRoot(rootEl).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
