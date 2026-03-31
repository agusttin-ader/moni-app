/**
 * Importante: con assets hasheados (Vite), cache-first en HTML rompe el deploy:
 * el index cacheado apunta a viejos *.js → 404 → pantalla negra sin React.
 * Online: red primero y actualizamos cache. Offline: fallback al cache.
 */
const CACHE_NAME = 'moni-cache-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/', '/index.html', '/manifest.webmanifest']).catch(() => {}),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(networkFirstWithCacheFallback(req))
})

async function networkFirstWithCacheFallback(req) {
  try {
    const response = await fetch(req)
    if (response && response.status === 200 && response.type === 'basic') {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
    }
    return response
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    if (req.mode === 'navigate') {
      const shell = await caches.match('/index.html')
      if (shell) return shell
    }
    return Response.error()
  }
}
