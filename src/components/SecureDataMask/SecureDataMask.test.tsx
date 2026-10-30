import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REVEAL_TIMEOUT_MS } from '../../constants'
import { maskSensitiveValue } from '../../utils/maskSensitiveValue'
import { SecureDataMask } from './SecureDataMask'

const FULL_VALUE = '2345 6789 0123'
const LABEL = 'Aadhaar number'

function renderMask(value = FULL_VALUE) {
  return render(<SecureDataMask value={value} label={LABEL} />)
}

function visibleValue() {
  return screen.getByTestId('secure-value').textContent
}

describe('SecureDataMask security behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers()
    })
    vi.useRealTimers()
  })

  it('masks by default using only the last four characters', () => {
    renderMask()
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
    expect(screen.queryByText(FULL_VALUE)).not.toBeInTheDocument()
  })

  it('does not put the plaintext identifier in the DOM while masked', () => {
    const { container } = renderMask()
    expect(container.innerHTML).not.toContain(FULL_VALUE)
    expect(container.textContent).not.toContain('2345 6789')
    expect(container.innerHTML).not.toMatch(/2345\s*6789\s*0123/)
  })

  it('does not leak the full value through data attributes while masked', () => {
    const { container } = renderMask()
    expect(container.innerHTML).not.toContain(`value="${FULL_VALUE}"`)
    expect(container.innerHTML).not.toContain(`data-value="${FULL_VALUE}"`)
  })

  it('reveals the full value after Tap to reveal', () => {
    renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    expect(visibleValue()).toBe(FULL_VALUE)
    expect(screen.getByTestId('secure-value').textContent).not.toBe(
      maskSensitiveValue(FULL_VALUE),
    )
  })

  it('does not remask one millisecond before the 10 second deadline', () => {
    renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS - 1)
    })
    expect(visibleValue()).toBe(FULL_VALUE)
  })

  it('automatically remasks at 10 seconds', () => {
    renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS)
    })
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
    expect(screen.queryByText(FULL_VALUE)).not.toBeInTheDocument()
  })

  it('clears plaintext from rendered output after the timeout, not merely hiding it with CSS', () => {
    const { container } = renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    expect(container.innerHTML).toContain(FULL_VALUE)

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS)
    })

    expect(container.innerHTML).not.toContain(FULL_VALUE)
    expect(container.querySelector('[hidden]')).toBeNull()
    expect(screen.getByTestId('secure-value').getAttribute('style')).toBeNull()
    expect(visibleValue()).not.toBe(FULL_VALUE)
  })

  it('clears plaintext immediately when the user hides the value', () => {
    const { container } = renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Hide ${LABEL}` }))
    })
    expect(container.innerHTML).not.toContain(FULL_VALUE)
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
  })

  it('does not reveal again after a manual hide when the original timeout later fires', () => {
    renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Hide ${LABEL}` }))
    })
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS)
    })
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
    expect(screen.queryByText(FULL_VALUE)).not.toBeInTheDocument()
  })

  it('restarts the 10 second window if the value is revealed again', () => {
    renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
      vi.advanceTimersByTime(6_000)
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Hide ${LABEL}` }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
      vi.advanceTimersByTime(6_000)
    })
    expect(visibleValue()).toBe(FULL_VALUE)
    act(() => {
      vi.advanceTimersByTime(4_000)
    })
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
  })

  it('remasks when the document becomes hidden', () => {
    const { container } = renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(container.innerHTML).not.toContain(FULL_VALUE)
  })

  it('remasks on Escape', () => {
    renderMask()
    const button = screen.getByRole('button', { name: `Reveal ${LABEL}` })
    act(() => {
      fireEvent.click(button)
    })
    act(() => {
      fireEvent.keyDown(button, { key: 'Escape' })
    })
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
  })

  it('remasks immediately if the secret value prop changes while revealed', () => {
    const { rerender } = render(<SecureDataMask value="2345 6789 0123" label={LABEL} />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    expect(visibleValue()).toBe('2345 6789 0123')
    rerender(<SecureDataMask value="9999 8888 7777" label={LABEL} />)
    expect(visibleValue()).toBe('XXXX-XXXX-7777')
    expect(screen.queryByText('2345 6789 0123')).not.toBeInTheDocument()
    expect(screen.queryByText('9999 8888 7777')).not.toBeInTheDocument()
  })

  it('clears the pending timeout on unmount so plaintext cannot linger', () => {
    const { unmount } = renderMask()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: `Reveal ${LABEL}` }))
    })
    unmount()
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS)
      })
    }).not.toThrow()
  })

  it('keeps independent timers for two masked fields', () => {
    render(
      <>
        <SecureDataMask value="2345 6789 0123" label="Aadhaar number" />
        <SecureDataMask value="ABCDE1234F" label="PAN number" />
      </>,
    )
    const [aadhaarReveal, panReveal] = screen.getAllByRole('button', { name: /Reveal/ })
    act(() => {
      fireEvent.click(aadhaarReveal)
      vi.advanceTimersByTime(4_000)
    })
    act(() => {
      fireEvent.click(panReveal)
      vi.advanceTimersByTime(6_000)
    })
    const values = screen.getAllByTestId('secure-value').map((node) => node.textContent)
    expect(values[0]).toBe('XXXX-XXXX-0123')
    expect(values[1]).toBe('ABCDE1234F')
  })
})

describe('SecureDataMask accessibility', () => {
  it('is keyboard operable with Enter and Space', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    renderMask()
    await user.tab()
    expect(screen.getByRole('button', { name: `Reveal ${LABEL}` })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(visibleValue()).toBe(FULL_VALUE)
    await user.keyboard(' ')
    expect(visibleValue()).toBe('XXXX-XXXX-0123')
  })

  it('exposes pressed state and live announcements', () => {
    vi.useFakeTimers()
    renderMask()
    const button = screen.getByRole('button', { name: `Reveal ${LABEL}` })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    act(() => {
      fireEvent.click(button)
    })
    expect(screen.getByRole('button', { name: `Hide ${LABEL}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('status')).toHaveTextContent(/visible/i)
    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS)
    })
    expect(screen.getByRole('status')).toHaveTextContent(/hidden automatically after 10 seconds/i)
    vi.useRealTimers()
  })

  it('does not announce the full identifier while masked', () => {
    renderMask()
    const status = screen.getByRole('status')
    expect(status.textContent).not.toContain(FULL_VALUE)
    expect(status.textContent).toMatch(/hidden/i)
  })
})
