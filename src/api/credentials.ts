import { CREDENTIALS_API_PATH } from '../constants'
import type { CredentialsResponse, SandboxScenario } from '../types/credential'

export class CredentialsRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'CredentialsRequestError'
    this.status = status
  }
}

export async function fetchCredentials(
  scenario: SandboxScenario = 'success',
): Promise<{ data: CredentialsResponse; servedOffline: boolean }> {
  const url = `${CREDENTIALS_API_PATH}?scenario=${encodeURIComponent(scenario)}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const servedOffline = response.headers.get('X-Wallet-Cache') === 'offline'

  if (!response.ok) {
    throw new CredentialsRequestError(
      `Could not load credentials (${response.status}).`,
      response.status,
    )
  }

  const data = (await response.json()) as CredentialsResponse
  if (!data || !Array.isArray(data.credentials)) {
    throw new CredentialsRequestError('The credentials response was malformed.', 500)
  }

  return { data, servedOffline }
}
