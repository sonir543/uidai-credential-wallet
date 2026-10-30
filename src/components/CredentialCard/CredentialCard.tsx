import { QrCode, ShieldCheck } from 'lucide-react'
import type { Credential } from '../../types/credential'
import { SecureDataMask } from '../SecureDataMask/SecureDataMask'
import './CredentialCard.css'

const TYPE_META: Record<
  Credential['type'],
  { mark: string; tone: string; identifierLabel: string; emblemText: string }
> = {
  AADHAAR: {
    mark: 'आ',
    tone: 'aadhaar',
    identifierLabel: 'Aadhaar number',
    emblemText: 'भारत सरकार · Govt of India',
  },
  PAN: {
    mark: 'PAN',
    tone: 'pan',
    identifierLabel: 'PAN',
    emblemText: 'आयकर विभाग · Income Tax Dept',
  },
  DL: {
    mark: 'DL',
    tone: 'dl',
    identifierLabel: 'Driving licence number',
    emblemText: 'सड़क परिवहन · MoRTH India',
  },
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No expiry'
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

type CredentialCardProps = {
  credential: Credential
  onInspect?: (credential: Credential) => void
}

export function CredentialCard({ credential, onInspect }: CredentialCardProps) {
  const meta = TYPE_META[credential.type]
  const identifierLabel = meta.identifierLabel

  return (
    <article className={`credential-card credential-card--${meta.tone}`}>
      {/* Subtle guilloche security pattern overlay */}
      <div className="credential-card__watermark" aria-hidden="true" />

      <header className="credential-card__top">
        <div className="credential-card__seal-wrapper">
          <span className="credential-card__seal" aria-hidden="true">
            {meta.mark}
          </span>
          <div className="credential-card__chip" aria-hidden="true" title="Smart Identity Chip">
            <div className="credential-card__chip-line" />
            <div className="credential-card__chip-line" />
          </div>
        </div>

        <div className="credential-card__headings">
          <p className="credential-card__emblem">{meta.emblemText}</p>
          <p className="credential-card__kicker">{credential.issuer}</p>
          <h2>{credential.title}</h2>
        </div>

        <div className="credential-card__top-actions">
          <span className={`credential-card__status credential-card__status--${credential.status}`}>
            <ShieldCheck size={11} aria-hidden="true" />
            <span>{credential.status}</span>
          </span>
          {onInspect && (
            <button
              type="button"
              className="credential-card__inspect-btn"
              onClick={() => onInspect(credential)}
              aria-label={`Inspect verifiable credential and QR for ${credential.title}`}
              title="Inspect W3C Verifiable Credential QR and cryptographic proof"
            >
              <QrCode size={13} aria-hidden="true" />
              <span>QR Code</span>
            </button>
          )}
        </div>
      </header>

      <div className="credential-card__holder-section">
        <span className="credential-card__field-label">Document Holder</span>
        <p className="credential-card__holder">{credential.holderName}</p>
      </div>

      <div className="credential-card__secret">
        <p className="credential-card__label">{identifierLabel}</p>
        <SecureDataMask value={credential.identifier} label={identifierLabel} />
      </div>

      <footer className="credential-card__footer">
        <dl className="credential-card__meta">
          <div>
            <dt>Issued</dt>
            <dd>{formatDate(credential.issuedOn)}</dd>
          </div>
          <div>
            <dt>Valid until</dt>
            <dd>{formatDate(credential.expiresOn)}</dd>
          </div>
        </dl>
        <div className="credential-card__security-badge" title="Cryptographically signed by sandbox root authority">
          <ShieldCheck size={12} aria-hidden="true" />
          <span>W3C VC Spec</span>
        </div>
      </footer>
    </article>
  )
}
