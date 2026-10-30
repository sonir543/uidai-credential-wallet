import type { Credential, RequestStatus } from '../types/credential'

export type CredentialsState = {
  status: RequestStatus
  credentials: Credential[]
  errorMessage: string | null
  servedOffline: boolean
}

export const initialCredentialsState: CredentialsState = {
  status: 'idle',
  credentials: [],
  errorMessage: null,
  servedOffline: false,
}

export type CredentialsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; credentials: Credential[]; servedOffline: boolean }
  | { type: 'FETCH_EMPTY'; servedOffline: boolean }
  | { type: 'FETCH_ERROR'; message: string }

export function credentialsReducer(
  state: CredentialsState,
  action: CredentialsAction,
): CredentialsState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        status: 'loading',
        errorMessage: null,
      }
    case 'FETCH_SUCCESS':
      return {
        status: 'success',
        credentials: action.credentials,
        errorMessage: null,
        servedOffline: action.servedOffline,
      }
    case 'FETCH_EMPTY':
      return {
        status: 'empty',
        credentials: [],
        errorMessage: null,
        servedOffline: action.servedOffline,
      }
    case 'FETCH_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.message,
        servedOffline: false,
      }
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
