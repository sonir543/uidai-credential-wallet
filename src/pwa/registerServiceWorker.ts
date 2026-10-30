export function registerServiceWorker(): void {
  if (import.meta.env.MODE === 'test') {
    return
  }
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail in private mode or non-secure contexts; the app still works online.
    })
  })
}
