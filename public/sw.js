/**
 * PWA: nunca devolver index.html para JS/CSS u otros assets.
 * Hacerlo rompe la carga de módulos (pantalla negra en mobile / Safari).
 */
const CACHE_NAME = 'moni-cache-v2'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL).catch(() => {}),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
          return Promise.resolve()
        }),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  let url
  try {
    url = new URL(req.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  // Solo la navegación documento puede caer en el HTML cacheado (SPA offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(() =>
          caches
            .match('/index.html')
            .then((hit) => hit || caches.match('/')),
        ),
    )
    return
  }

  // Assets: red primero; ante fallo solo el mismo recurso en caché (nunca HTML).
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || Response.error()),
      ),
  )
})
