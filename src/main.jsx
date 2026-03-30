import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RootErrorBoundary } from './RootErrorBoundary.jsx'

// Service worker desactivado temporalmente para evitar desfasajes de chunks
// en mobile tras deploys (pantalla de login/dashboard que no carga).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {})
  })
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
