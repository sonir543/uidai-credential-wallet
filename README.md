# UIDAI Sandbox Credential Wallet

[![Repository](https://img.shields.io/badge/GitHub-sonir543%2Fuidai--credential--wallet-blue?logo=github)](https://github.com/sonir543/uidai-credential-wallet)

Progressive Web App that acts as a **test digital identity wallet** for the UIDAI sandbox. It lists mock credentials (Aadhaar, PAN, Driving Licence), reveals sensitive numbers only on demand, and keeps the last successful credentials response available offline.

**Public Repository:** [https://github.com/sonir543/uidai-credential-wallet](https://github.com/sonir543/uidai-credential-wallet)

This is sandbox / assignment software. It does not connect to production UIDAI systems and the identifiers are fictional.

## Approach

- **State:** React Context plus `useReducer`. The reducer has explicit `loading`, `success`, `empty`, and `error` states. The dashboard renders those states and offers retry.
- **Data:** `GET /api/credentials` is served by a Vite mock middleware (`?scenario=success|empty|error`). No real backend.
- **Security UI:** `SecureDataMask` keeps plaintext in component state only while revealed. Masked rendering uses `XXXX-XXXX-1234`. A 10 second timer remasks and sets plaintext state back to `null`, so the full value is removed from the DOM rather than hidden with CSS. The field also remasks on Escape, tab hide, Hide, and unmount.
- **Accessibility:** The control is a button (keyboard, Enter/Space), with `aria-pressed`, `aria-controls`, `aria-label`, and a polite live region.
- **Offline:** `public/sw.js` intercepts `GET /api/credentials` with network-first caching. If the network fails, it returns the last cached JSON and marks it with `X-Wallet-Cache: offline`.

## Run the app

```bash
npm install
npm run dev
```

Open http://localhost:5173. Use **Simulate API responses** to see success, empty, and error.

Offline check:

1. Load the dashboard once while online (this fills the service worker cache).
2. In DevTools, set the network to Offline and reload.
3. The wallet should still show the last credentials payload.

Production-style preview:

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

`SecureDataMask` tests use fake timers and would fail if the auto remask timeout were wrong (they assert still-visible at 9999ms and hidden at 10000ms). Other tests cover masking, reducer states, dashboard loading/error/empty/success, and the credentials cache strategy.

## Assumptions

- Identifiers are mock sandbox values, not real Aadhaar/PAN/DL numbers.
- Full credential JSON still lives in the dashboard store after fetch (needed to render cards). The assignment’s “clear from component state” rule is applied inside `SecureDataMask`.
- Service worker registration is skipped in unit tests.
- Caching prioritizes `GET /api/credentials` with canonical query-stripped keys, plus resilient app shell offline reload support while excluding Vite HMR paths in development.
