import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CREDENTIALS_CACHE_NAME } from '../constants'
import { isCredentialsGet, networkFirstCredentials } from './credentialsNetworkFirst'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('credentials network-first cache', () => {
  const memory = new Map<string, Response>()

  const cachesImpl = {
    open: async () => ({
      put: async (request: Request, response: Response) => {
        memory.set(new URL(request.url).pathname, response)
      },
      match: async (request: Request) => memory.get(new URL(request.url).pathname),
    }),
  }

  beforeEach(() => {
    memory.clear()
  })

  it('identifies GET /api/credentials including query strings', () => {
    expect(
      isCredentialsGet(new Request('https://wallet.test/api/credentials?scenario=success')),
    ).toBe(true)
    expect(isCredentialsGet(new Request('https://wallet.test/api/profile'))).toBe(false)
    expect(
      isCredentialsGet(
        new Request('https://wallet.test/api/credentials', { method: 'POST' }),
      ),
    ).toBe(false)
  })

  it('stores a successful network response for later offline use', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ credentials: [{ id: '1' }] }))
    const request = new Request('https://wallet.test/api/credentials?scenario=success')
    const response = await networkFirstCredentials(request, { fetchImpl, cachesImpl })
    expect(response.status).toBe(200)
    expect(memory.has('/api/credentials')).toBe(true)
  })

  it('does not cache error responses', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: true }, 500))
    await networkFirstCredentials(new Request('https://wallet.test/api/credentials'), {
      fetchImpl,
      cachesImpl,
    })
    expect(memory.size).toBe(0)
  })

  it('returns the last cached body when the network fails', async () => {
    const onlineFetch = vi.fn(async () => jsonResponse({ credentials: [{ id: 'cached' }] }))
    await networkFirstCredentials(new Request('https://wallet.test/api/credentials'), {
      fetchImpl: onlineFetch,
      cachesImpl,
    })

    const offlineFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const offline = await networkFirstCredentials(
      new Request('https://wallet.test/api/credentials?scenario=success'),
      { fetchImpl: offlineFetch, cachesImpl },
    )

    expect(offline.headers.get('X-Wallet-Cache')).toBe('offline')
    const body = await offline.json()
    expect(body.credentials[0].id).toBe('cached')
  })

  it('returns 503 when offline and nothing is cached', async () => {
    const offlineFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    const response = await networkFirstCredentials(
      new Request('https://wallet.test/api/credentials'),
      { fetchImpl: offlineFetch, cachesImpl },
    )
    expect(response.status).toBe(503)
  })

  it('uses a dedicated cache name', () => {
    expect(CREDENTIALS_CACHE_NAME).toBe('uidai-wallet-credentials-v1')
  })
})
