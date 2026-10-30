import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  Copy,
  Info,
  RefreshCw,
  Shield,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useCredentials } from '../../state/credentialsContext'
import type { Credential, SandboxScenario } from '../../types/credential'
import { CredentialCard } from '../CredentialCard/CredentialCard'
import './Dashboard.css'

export function Dashboard() {
  const { state, scenario, online, setScenario, reload } = useCredentials()
  const [inspectCredential, setInspectCredential] = useState<Credential | null>(null)
  const [copiedJson, setCopiedJson] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    reload()
    setTimeout(() => setIsRefreshing(false), 600)
  }, [reload])

  const handleCopyJson = useCallback(async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        setCopiedJson(true)
        setTimeout(() => setCopiedJson(false), 2000)
      }
    } catch {
      // ignore clipboard permission error
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectCredential) {
        setInspectCredential(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectCredential])

  return (
    <div className="wallet">
      <a className="skip-link" href="#credentials">
        Skip to credentials
      </a>

      {/* Indian National Tricolor accent bar */}
      <div className="wallet__tricolor-bar" aria-hidden="true">
        <span className="tricolor-saffron" />
        <span className="tricolor-white" />
        <span className="tricolor-green" />
      </div>

      {!online ? (
        <div className="banner banner--offline" role="status">
          <WifiOff size={16} aria-hidden="true" />
          <span>You are offline. Showing the last credentials saved on this device, if available.</span>
        </div>
      ) : null}
      {state.servedOffline ? (
        <div className="banner banner--cache" role="status">
          <Shield size={16} aria-hidden="true" />
          <span>Credentials were served from the on-device cache.</span>
        </div>
      ) : null}

      <header className="masthead">
        <div className="masthead__brand">
          <span className="masthead__mark" aria-hidden="true">
            UID
          </span>
          <div>
            <div className="masthead__kicker-row">
              <p className="masthead__kicker">UIDAI Innovation Vertical · Sandbox</p>
              <span className={`masthead__network-pill ${online ? 'is-online' : 'is-offline'}`}>
                {online ? <Wifi size={12} aria-hidden="true" /> : <WifiOff size={12} aria-hidden="true" />}
                <span>{online ? 'Online' : 'Offline'}</span>
              </span>
            </div>
            <h1>Verifiable Credential Wallet</h1>
          </div>
        </div>
        <p className="masthead__lede">
          A test digital identity wallet. Sensitive numbers stay masked until you reveal them,
          then they disappear from component state after 10 seconds.
        </p>
      </header>

      {/* Quick stats strip */}
      <div className="wallet__stats-bar">
        <div className="wallet__stat">
          <span className="wallet__stat-label">Active Credentials</span>
          <span className="wallet__stat-value">{state.status === 'success' ? state.credentials.length : 0}</span>
        </div>
        <div className="wallet__stat">
          <span className="wallet__stat-label">Offline Engine</span>
          <span className="wallet__stat-value">Service Worker v1.0</span>
        </div>
        <div className="wallet__stat">
          <span className="wallet__stat-label">Security Protocol</span>
          <span className="wallet__stat-value">10s Auto-Conceal</span>
        </div>
      </div>

      <section className="sandbox" aria-label="Sandbox controls">
        <div className="sandbox__header">
          <p>Simulate API responses</p>
          <button
            type="button"
            className="sandbox__refresh-btn"
            onClick={handleRefresh}
            aria-label="Refresh credentials from sandbox"
            title="Refresh credentials"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin' : undefined} aria-hidden="true" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="sandbox__row">
          {(['success', 'empty', 'error'] as SandboxScenario[]).map((option) => (
            <button
              key={option}
              type="button"
              className={scenario === option ? 'is-active' : undefined}
              aria-pressed={scenario === option}
              onClick={() => setScenario(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section id="credentials" className="board" aria-live="polite">
        {state.status === 'loading' || state.status === 'idle' ? (
          <LoadingState />
        ) : null}

        {state.status === 'error' ? (
          <ErrorState message={state.errorMessage} onRetry={reload} />
        ) : null}

        {state.status === 'empty' ? <EmptyState onRetry={reload} /> : null}

        {state.status === 'success' ? (
          <div className="board__grid">
            {state.credentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onInspect={(cred) => setInspectCredential(cred)}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* Verifiable Credential QR and Cryptographic Inspection Modal */}
      {inspectCredential && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setInspectCredential(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="modal-header__info">
                <span className="modal-header__tag">W3C Verifiable Credential</span>
                <h2 id="modal-title">{inspectCredential.title}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setInspectCredential(null)}
                aria-label="Close modal"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="modal-body">
              <div className="modal-qr-section">
                <div className="modal-qr-frame">
                  <SimulatedQrCode data={inspectCredential.id} />
                </div>
                <div className="modal-qr-caption">
                  <span className="modal-qr-badge">
                    <ShieldCheck size={14} aria-hidden="true" />
                    <span>UIDAI Digital Signature Verified</span>
                  </span>
                  <p>Hold in front of sandbox verifier reader to authenticate credential claims.</p>
                </div>
              </div>

              <div className="modal-details">
                <div className="modal-details__row">
                  <span className="modal-label">Issuer DID</span>
                  <code className="modal-code">did:in:uidai:sandbox:auth-authority-01</code>
                </div>
                <div className="modal-details__row">
                  <span className="modal-label">Holder Name</span>
                  <span className="modal-val">{inspectCredential.holderName}</span>
                </div>
                <div className="modal-details__row">
                  <span className="modal-label">Issued On</span>
                  <span className="modal-val">{inspectCredential.issuedOn}</span>
                </div>
                <div className="modal-details__row">
                  <span className="modal-label">Signature Suite</span>
                  <code className="modal-code">Ed25519Signature2020</code>
                </div>
              </div>

              <div className="modal-json-preview">
                <div className="modal-json-header">
                  <span>W3C JSON-LD Representation</span>
                  <button
                    type="button"
                    className="modal-copy-json-btn"
                    onClick={() =>
                      handleCopyJson(
                        JSON.stringify(generateVcJson(inspectCredential), null, 2),
                      )
                    }
                  >
                    <Copy size={12} aria-hidden="true" />
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="modal-json-content">
                  {JSON.stringify(generateVcJson(inspectCredential), null, 2)}
                </pre>
              </div>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setInspectCredential(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="board__grid" role="status" aria-label="Loading credentials">
      {[1, 2, 3].map((key) => (
        <div key={key} className="skeleton-card">
          <div className="skeleton-card__header">
            <div className="skeleton-circle" />
            <div className="skeleton-lines">
              <div className="skeleton-line skeleton-line--short" />
              <div className="skeleton-line skeleton-line--medium" />
            </div>
          </div>
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line--label" />
            <div className="skeleton-line skeleton-line--value" />
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-line skeleton-line--tag" />
            <div className="skeleton-line skeleton-line--btn" />
          </div>
        </div>
      ))}
      <span className="visually-hidden">Fetching sandbox credentials…</span>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="state-card state-card--error" role="alert">
      <div className="state-card__icon state-card__icon--error">
        <AlertCircle size={28} aria-hidden="true" />
      </div>
      <h2>Credentials could not be loaded</h2>
      <p>{message ?? 'The sandbox request failed.'}</p>
      <p>Retry the request, or switch the sandbox scenario to success.</p>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="state-card">
      <div className="state-card__icon">
        <Info size={28} aria-hidden="true" />
      </div>
      <h2>No credentials issued</h2>
      <p>This sandbox wallet does not have any identity documents yet.</p>
      <button type="button" onClick={onRetry}>
        Check again
      </button>
    </div>
  )
}

function generateVcJson(credential: Credential) {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://uidai.gov.in/contexts/identity-v1.jsonld',
    ],
    id: `urn:uuid:${credential.id}`,
    type: ['VerifiableCredential', `${credential.type}Credential`],
    issuer: {
      id: 'did:in:uidai:sandbox:auth-authority-01',
      name: credential.issuer,
    },
    issuanceDate: `${credential.issuedOn}T09:30:00Z`,
    expirationDate: credential.expiresOn ? `${credential.expiresOn}T23:59:59Z` : null,
    credentialSubject: {
      id: 'did:in:holder:aarav-mehta',
      name: credential.holderName,
      type: credential.type,
      identifier: credential.identifier,
      status: credential.status,
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: `${credential.issuedOn}T09:30:05Z`,
      verificationMethod: 'did:in:uidai:sandbox:auth-authority-01#key-1',
      proofPurpose: 'assertionMethod',
      jws: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...4A2',
    },
  }
}

function SimulatedQrCode({ data }: { data: string }) {
  // Renders a high-density, sharp SVG simulated QR code matrix with corners
  return (
    <svg
      viewBox="0 0 100 100"
      width="140"
      height="140"
      className="simulated-qr"
      aria-label={`QR Code for ${data}`}
    >
      <rect width="100" height="100" fill="#ffffff" rx="6" />
      {/* Top Left Finder */}
      <rect x="8" y="8" width="24" height="24" fill="#0b1c33" rx="4" />
      <rect x="12" y="12" width="16" height="16" fill="#ffffff" rx="2" />
      <rect x="16" y="16" width="8" height="8" fill="#0b1c33" rx="1" />
      {/* Top Right Finder */}
      <rect x="68" y="8" width="24" height="24" fill="#0b1c33" rx="4" />
      <rect x="72" y="12" width="16" height="16" fill="#ffffff" rx="2" />
      <rect x="76" y="16" width="8" height="8" fill="#0b1c33" rx="1" />
      {/* Bottom Left Finder */}
      <rect x="8" y="68" width="24" height="24" fill="#0b1c33" rx="4" />
      <rect x="12" y="72" width="16" height="16" fill="#ffffff" rx="2" />
      <rect x="16" y="76" width="8" height="8" fill="#0b1c33" rx="1" />
      {/* Data Pattern Modules */}
      <rect x="36" y="10" width="6" height="6" fill="#0b1c33" />
      <rect x="46" y="10" width="4" height="4" fill="#0b1c33" />
      <rect x="54" y="12" width="6" height="6" fill="#0b1c33" />
      <rect x="36" y="20" width="4" height="6" fill="#0b1c33" />
      <rect x="44" y="24" width="8" height="4" fill="#0b1c33" />
      <rect x="56" y="22" width="6" height="4" fill="#0b1c33" />
      <rect x="10" y="36" width="6" height="4" fill="#0b1c33" />
      <rect x="20" y="38" width="4" height="6" fill="#0b1c33" />
      <rect x="36" y="36" width="8" height="8" fill="#0b1c33" />
      <rect x="48" y="38" width="6" height="4" fill="#0b1c33" />
      <rect x="60" y="36" width="8" height="6" fill="#0b1c33" />
      <rect x="74" y="36" width="6" height="6" fill="#0b1c33" />
      <rect x="84" y="38" width="6" height="4" fill="#0b1c33" />
      <rect x="12" y="48" width="8" height="4" fill="#0b1c33" />
      <rect x="24" y="46" width="6" height="8" fill="#0b1c33" />
      <rect x="38" y="48" width="6" height="6" fill="#0b1c33" />
      <rect x="50" y="46" width="8" height="6" fill="#0b1c33" />
      <rect x="66" y="48" width="6" height="8" fill="#0b1c33" />
      <rect x="80" y="46" width="8" height="6" fill="#0b1c33" />
      <rect x="36" y="60" width="6" height="6" fill="#0b1c33" />
      <rect x="48" y="58" width="4" height="8" fill="#0b1c33" />
      <rect x="58" y="62" width="8" height="4" fill="#0b1c33" />
      <rect x="72" y="58" width="6" height="6" fill="#0b1c33" />
      <rect x="84" y="62" width="6" height="6" fill="#0b1c33" />
      <rect x="36" y="74" width="8" height="4" fill="#0b1c33" />
      <rect x="48" y="72" width="6" height="8" fill="#0b1c33" />
      <rect x="62" y="76" width="6" height="6" fill="#0b1c33" />
      <rect x="74" y="72" width="8" height="4" fill="#0b1c33" />
      <rect x="86" y="76" width="4" height="6" fill="#0b1c33" />
      <rect x="38" y="84" width="6" height="6" fill="#0b1c33" />
      <rect x="48" y="86" width="8" height="4" fill="#0b1c33" />
      <rect x="60" y="84" width="4" height="6" fill="#0b1c33" />
      <rect x="70" y="86" width="6" height="4" fill="#0b1c33" />
      <rect x="82" y="84" width="8" height="6" fill="#0b1c33" />
    </svg>
  )
}
