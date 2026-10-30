import { describe, expect, it } from 'vitest'
import { MOCK_CREDENTIALS } from '../mocks/credentials'
import { credentialsReducer, initialCredentialsState } from './credentialsReducer'

describe('credentialsReducer', () => {
  it('moves to loading and clears a previous error', () => {
    const next = credentialsReducer(
      { ...initialCredentialsState, status: 'error', errorMessage: 'failed' },
      { type: 'FETCH_START' },
    )
    expect(next.status).toBe('loading')
    expect(next.errorMessage).toBeNull()
  })

  it('stores credentials on success', () => {
    const next = credentialsReducer(initialCredentialsState, {
      type: 'FETCH_SUCCESS',
      credentials: MOCK_CREDENTIALS,
      servedOffline: false,
    })
    expect(next.status).toBe('success')
    expect(next.credentials).toHaveLength(3)
    expect(next.servedOffline).toBe(false)
  })

  it('uses a dedicated empty state instead of success with zero items', () => {
    const next = credentialsReducer(initialCredentialsState, {
      type: 'FETCH_EMPTY',
      servedOffline: true,
    })
    expect(next.status).toBe('empty')
    expect(next.credentials).toEqual([])
    expect(next.servedOffline).toBe(true)
  })

  it('keeps previous credentials when a later fetch errors', () => {
    const success = credentialsReducer(initialCredentialsState, {
      type: 'FETCH_SUCCESS',
      credentials: MOCK_CREDENTIALS,
      servedOffline: false,
    })
    const failed = credentialsReducer(success, {
      type: 'FETCH_ERROR',
      message: 'sandbox down',
    })
    expect(failed.status).toBe('error')
    expect(failed.errorMessage).toBe('sandbox down')
    expect(failed.credentials).toHaveLength(3)
  })
})
