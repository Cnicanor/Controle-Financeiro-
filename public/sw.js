const CACHE_NAME = 'meu-financeiro-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]
const CACHEABLE_DESTINATIONS = new Set(['style', 'script', 'image', 'font', 'manifest'])

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((response) => response || caches.match('/'))),
    )
    return
  }

  if (!isSameOrigin) {
    return
  }

  const shouldCache =
    requestUrl.pathname.startsWith('/assets/') ||
    APP_SHELL.includes(requestUrl.pathname) ||
    CACHEABLE_DESTINATIONS.has(request.destination)

  if (!shouldCache) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clonedResponse = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clonedResponse))
          }

          return networkResponse
        })
        .catch(() => caches.match('/index.html').then((response) => response || caches.match('/')))
    }),
  )
})
