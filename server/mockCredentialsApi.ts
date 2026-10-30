import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { MOCK_API_DELAY_MS } from '../src/constants.ts'
import { EMPTY_RESPONSE, SUCCESS_RESPONSE } from '../src/mocks/credentials.ts'

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

async function respondToCredentials(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://wallet.local')
  if (url.pathname !== '/api/credentials') {
    next()
    return
  }
  if (req.method !== 'GET') {
    next()
    return
  }
  await handleGet(res, url)
}

async function handleGet(res: ServerResponse, url: URL): Promise<void> {

  await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS))

  const scenario = url.searchParams.get('scenario') ?? 'success'
  if (scenario === 'error') {
    sendJson(res, 500, {
      error: 'sandbox_error',
      message: 'UIDAI sandbox returned an error for this test scenario.',
    })
    return
  }
  if (scenario === 'empty') {
    sendJson(res, 200, EMPTY_RESPONSE)
    return
  }
  sendJson(res, 200, SUCCESS_RESPONSE)
}

export function mockCredentialsApi(): Plugin {
  return {
    name: 'mock-credentials-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void respondToCredentials(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void respondToCredentials(req, res, next)
      })
    },
  }
}
