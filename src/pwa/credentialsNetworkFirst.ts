import { CREDENTIALS_API_PATH, CREDENTIALS_CACHE_NAME } from '../constants'

type CacheStore = {
  put: (request: Request, response: Response) => Promise<unknown>
  match: (request: Request) => Promise<Response | undefined>
}

type CachesLike = {
  open: (name: string) => Promise<CacheStore>
}

type FetchLike = typeof fetch

export function isCredentialsGet(request: Request): boolean {
  const url = new URL(request.url)
  return request.method === 'GET' && url.pathname === CREDENTIALS_API_PATH
}

export async function networkFirstCredentials(
  request: Request,
  deps: { fetchImpl?: FetchLike; cachesImpl?: CachesLike } = {},
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch
  const cachesImpl = deps.cachesImpl ?? caches
  const cache = await cachesImpl.open(CREDENTIALS_CACHE_NAME)

  try {
    const networkResponse = await fetchImpl(request)
    if (networkResponse.ok) {
      await cache.put(stripScenario(request), networkResponse.clone())
    }
    return networkResponse
  } catch {
    const cached = await cache.match(stripScenario(request))
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

function stripScenario(request: Request): Request {
  const url = new URL(request.url)
  url.search = ''
  return new Request(url.toString(), { method: 'GET' })
}
