import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'
import { REVEAL_TIMEOUT_MS } from '../../constants'
import { lastFourVisibleChars, maskSensitiveValue } from '../../utils/maskSensitiveValue'
import './SecureDataMask.css'

type SecureDataMaskProps = {
  value: string
  label: string
  allowCopy?: boolean
}

export function SecureDataMask({ value, label, allowCopy = true }: SecureDataMaskProps) {
  const valueId = useId()
  const liveId = useId()
  const timerRef = useRef<number | null>(null)
  const [revealedPlaintext, setRevealedPlaintext] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [announcement, setAnnouncement] = useState(
    `${label} is hidden. Only the last four characters are shown.`,
  )

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const hideValue = useCallback(
    (reason: 'manual' | 'timeout' | 'visibility') => {
      clearTimer()
      setRevealedPlaintext(null)
      setCopied(false)
      if (reason === 'timeout') {
        setAnnouncement(`${label} was hidden automatically after 10 seconds.`)
        return
      }
      if (reason === 'visibility') {
        setAnnouncement(`${label} was hidden because the page is no longer visible.`)
        return
      }
      setAnnouncement(`${label} is now hidden.`)
    },
    [clearTimer, label],
  )

  const revealValue = useCallback(() => {
    clearTimer()
    setRevealedPlaintext(value)
    setAnnouncement(
      `${label} is visible. It will be hidden automatically after 10 seconds.`,
    )
    timerRef.current = window.setTimeout(() => {
      hideValue('timeout')
    }, REVEAL_TIMEOUT_MS)
  }, [clearTimer, hideValue, label, value])

  const handleCopy = useCallback(async () => {
    if (!revealedPlaintext) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(revealedPlaintext)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
        setAnnouncement(`${label} copied to clipboard.`)
      }
    } catch {
      // Ignore clipboard permission rejections
    }
  }, [label, revealedPlaintext])

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hideValue('visibility')
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [hideValue])

  // Security edge case: if value changes externally while revealed, re-mask immediately
  const previousValueRef = useRef(value)
  useEffect(() => {
    if (previousValueRef.current !== value) {
      previousValueRef.current = value
      hideValue('manual')
    }
  }, [value, hideValue])

  const isRevealed = revealedPlaintext != null
  const display = isRevealed ? revealedPlaintext : maskSensitiveValue(value)
  const lastFour = lastFourVisibleChars(value)

  return (
    <div className="secure-mask" data-revealed={isRevealed ? 'true' : 'false'}>
      <div className="secure-mask__row">
        <span id={valueId} className="secure-mask__value" data-testid="secure-value" aria-hidden="true">
          {display}
        </span>
        <span className="visually-hidden">
          {isRevealed
            ? `${label} ${revealedPlaintext}`
            : `${label} hidden, ending in ${lastFour || 'unknown digits'}.`}
        </span>
        <div className="secure-mask__actions">
          <button
            type="button"
            className="secure-mask__button"
            aria-pressed={isRevealed}
            aria-controls={valueId}
            aria-describedby={liveId}
            aria-label={isRevealed ? `Hide ${label}` : `Reveal ${label}`}
            onClick={() => {
              if (isRevealed) {
                hideValue('manual')
                return
              }
              revealValue()
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && isRevealed) {
                event.preventDefault()
                hideValue('manual')
              }
            }}
          >
            {isRevealed ? (
              <EyeOff size={13} className="secure-mask__icon" aria-hidden="true" />
            ) : (
              <Eye size={13} className="secure-mask__icon" aria-hidden="true" />
            )}
            <span>{isRevealed ? 'Hide' : 'Tap to reveal'}</span>
          </button>

          {isRevealed && allowCopy && (
            <button
              type="button"
              className="secure-mask__copy-button"
              aria-label={copied ? 'Copied' : `Copy ${label}`}
              title={copied ? 'Copied to clipboard' : 'Copy full identifier'}
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <Check size={13} className="secure-mask__icon secure-mask__icon--copied" aria-hidden="true" />
              ) : (
                <Copy size={13} className="secure-mask__icon" aria-hidden="true" />
              )}
              <span className="secure-mask__copy-text">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      {isRevealed && (
        <div className="secure-mask__timer-container" aria-hidden="true">
          <div className="secure-mask__timer-bar" />
        </div>
      )}

      <div id={liveId} className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}
