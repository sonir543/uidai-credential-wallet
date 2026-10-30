const MASK_PREFIX = 'XXXX-XXXX-'

export function compactIdentifier(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '')
}

export function lastFourVisibleChars(value: string): string {
  const compact = compactIdentifier(value)
  if (compact.length === 0) {
    return ''
  }
  return compact.slice(-4)
}

/**
 * Masks an identifier so only the last four characters remain visible.
 * Short secrets (4 characters or fewer) are fully masked to avoid leaking the whole value.
 */
export function maskSensitiveValue(value: string): string {
  const compact = compactIdentifier(value)
  if (compact.length === 0) {
    return `${MASK_PREFIX}XXXX`
  }
  if (compact.length <= 4) {
    return `${MASK_PREFIX}XXXX`
  }
  return `${MASK_PREFIX}${compact.slice(-4)}`
}

export function documentContainsPlaintext(haystack: string, plaintext: string): boolean {
  return haystack.includes(plaintext)
}
