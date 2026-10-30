import { describe, expect, it } from 'vitest'
import {
  compactIdentifier,
  lastFourVisibleChars,
  maskSensitiveValue,
} from './maskSensitiveValue'

describe('maskSensitiveValue', () => {
  it('shows only the last four characters in the XXXX-XXXX-1234 pattern', () => {
    expect(maskSensitiveValue('2345 6789 0123')).toBe('XXXX-XXXX-0123')
  })

  it('ignores separators when choosing the last four characters', () => {
    expect(maskSensitiveValue('DL-04-20110149646')).toBe('XXXX-XXXX-9646')
    expect(maskSensitiveValue('ABCDE1234F')).toBe('XXXX-XXXX-234F')
  })

  it('fully masks secrets that are four characters or shorter', () => {
    expect(maskSensitiveValue('1234')).toBe('XXXX-XXXX-XXXX')
    expect(maskSensitiveValue('AB')).toBe('XXXX-XXXX-XXXX')
    expect(maskSensitiveValue('')).toBe('XXXX-XXXX-XXXX')
  })

  it('never returns the original identifier', () => {
    const original = '234567890123'
    expect(maskSensitiveValue(original)).not.toContain('23456789')
    expect(maskSensitiveValue(original)).not.toBe(original)
  })
})

describe('identifier helpers', () => {
  it('compacts to alphanumeric characters only', () => {
    expect(compactIdentifier('2345 6789 0123')).toBe('234567890123')
  })

  it('returns the last four compact characters', () => {
    expect(lastFourVisibleChars('ABCDE1234F')).toBe('234F')
  })
})
