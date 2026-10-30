import { createContext, useContext } from 'react'
import type { SandboxScenario } from '../types/credential'
import type { CredentialsState } from './credentialsReducer'

export type CredentialsContextValue = {
  state: CredentialsState
  scenario: SandboxScenario
  online: boolean
  setScenario: (scenario: SandboxScenario) => void
  reload: () => void
}

export const CredentialsContext = createContext<CredentialsContextValue | null>(null)

export function useCredentials(): CredentialsContextValue {
  const value = useContext(CredentialsContext)
  if (!value) {
    throw new Error('useCredentials must be used within CredentialsProvider')
  }
  return value
}
