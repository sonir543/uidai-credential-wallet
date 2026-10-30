import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SUCCESS_RESPONSE } from '../../mocks/credentials'
import { CredentialsProvider } from '../../state/CredentialsProvider'
import { Dashboard } from './Dashboard'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('credential dashboard states', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows a loading state while credentials are in flight', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    )
    render(
      <CredentialsProvider>
        <Dashboard />
      </CredentialsProvider>,
    )
    expect(screen.getByRole('status', { name: 'Loading credentials' })).toBeInTheDocument()
  })

  it('renders issued credentials after a successful fetch', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(SUCCESS_RESPONSE)))
    render(
      <CredentialsProvider>
        <Dashboard />
      </CredentialsProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Aadhaar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Permanent Account Number' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Driving Licence' })).toBeInTheDocument()
    expect(screen.queryByText('2345 6789 0123')).not.toBeInTheDocument()
  })

  it('shows an empty state when the sandbox has no documents', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ credentials: [] })))
    sessionStorage.setItem('uidai-wallet-sandbox-scenario', 'empty')
    render(
      <CredentialsProvider>
        <Dashboard />
      </CredentialsProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'No credentials issued' })).toBeInTheDocument()
  })

  it('shows an error with retry', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: true }, 500))
      .mockResolvedValueOnce(jsonResponse(SUCCESS_RESPONSE))
    vi.stubGlobal('fetch', fetchMock)

    sessionStorage.setItem('uidai-wallet-sandbox-scenario', 'error')
    const user = userEvent.setup()
    render(
      <CredentialsProvider>
        <Dashboard />
      </CredentialsProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Credentials could not be loaded' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Aadhaar' })).toBeInTheDocument()
  })
})
