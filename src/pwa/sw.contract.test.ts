import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('service worker contract', () => {
  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')

  it('intercepts GET /api/credentials', () => {
    expect(source).toContain("'/api/credentials'")
    expect(source).toContain("event.request.method !== 'GET'")
    expect(source).toContain('event.respondWith(networkFirstCredentials(event.request))')
  })

  it('serves the last cached response when fetch throws', () => {
    expect(source).toContain('cache.match(cacheKey)')
    expect(source).toContain("headers.set('X-Wallet-Cache', 'offline')")
    expect(source).toContain('return new Response(cached.body')
  })

  it('does not cache unsuccessful network responses', () => {
    expect(source).toContain('if (networkResponse.ok)')
    expect(source).toContain('cache.put(cacheKey, networkResponse.clone())')
  })
})
