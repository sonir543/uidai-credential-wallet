import type { Credential, CredentialsResponse } from '../types/credential.ts'

export const MOCK_CREDENTIALS: Credential[] = [
  {
    id: 'cred-aadhaar-sandbox-01',
    type: 'AADHAAR',
    title: 'Aadhaar',
    issuer: 'UIDAI Sandbox',
    holderName: 'Aarav Mehta',
    identifier: '2345 6789 0123',
    issuedOn: '2024-03-12',
    expiresOn: null,
    status: 'active',
  },
  {
    id: 'cred-pan-sandbox-01',
    type: 'PAN',
    title: 'Permanent Account Number',
    issuer: 'Income Tax Department (Sandbox)',
    holderName: 'Aarav Mehta',
    identifier: 'ABCDE1234F',
    issuedOn: '2022-11-04',
    expiresOn: null,
    status: 'active',
  },
  {
    id: 'cred-dl-sandbox-01',
    type: 'DL',
    title: 'Driving Licence',
    issuer: 'Ministry of Road Transport (Sandbox)',
    holderName: 'Aarav Mehta',
    identifier: 'DL-04-20110149646',
    issuedOn: '2021-08-19',
    expiresOn: '2041-08-18',
    status: 'active',
  },
]

export const SUCCESS_RESPONSE: CredentialsResponse = {
  credentials: MOCK_CREDENTIALS,
}

export const EMPTY_RESPONSE: CredentialsResponse = {
  credentials: [],
}
