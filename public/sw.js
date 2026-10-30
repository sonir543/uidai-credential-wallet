/* UIDAI Sandbox Wallet — intercepts GET /api/credentials */
const CREDENTIALS_PATH = '/api/credentials'
const CACHE_NAME = 'uidai-wallet-credentials-v1'
const STATIC_CACHE_NAME = 'uidai-wallet-static-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (url.pathname === CREDENTIALS_PATH) {
    event.respondWith(networkFirstCredentials(event.request))
    return
  }

  // App shell offline fallback for static assets (production & full-page offline reload resilience)
  if (
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/@') &&
    !url.pathname.includes('node_modules')
  ) {
    event.respondWith(networkFirstAppShell(event.request))
  }
})

async function networkFirstCredentials(request) {
  const cache = await caches.open(CACHE_NAME)
  const cacheKey = credentialsCacheKey(request)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      await cache.put(cacheKey, networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(cacheKey)
    if (cached) {
      const headers = new Headers(cached.headers)
      headers.set('X-Wallet-Cache', 'offline')
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      })
    }
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'No cached credentials are available while offline.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

function credentialsCacheKey(request) {
  const url = new URL(request.url)
  return new Request(`${url.origin}${CREDENTIALS_PATH}`, { method: 'GET' })
}

async function networkFirstAppShell(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    if (request.mode === 'navigate') {
      const fallback = (await cache.match('/')) || (await cache.match('/index.html'))
      if (fallback) return fallback
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' })
  }
}
