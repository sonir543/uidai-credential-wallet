export type CredentialType = 'AADHAAR' | 'PAN' | 'DL'

export type CredentialStatus = 'active' | 'expiring' | 'expired'

export type Credential = {
  id: string
  type: CredentialType
  title: string
  issuer: string
  holderName: string
  identifier: string
  issuedOn: string
  expiresOn: string | null
  status: CredentialStatus
}

export type CredentialsResponse = {
  credentials: Credential[]
}

export type SandboxScenario = 'success' | 'empty' | 'error'

export type RequestStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'
