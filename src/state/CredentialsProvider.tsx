import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { fetchCredentials } from '../api/credentials'
import type { SandboxScenario } from '../types/credential'
import { CredentialsContext } from './credentialsContext'
import { credentialsReducer, initialCredentialsState } from './credentialsReducer'

const SCENARIO_KEY = 'uidai-wallet-sandbox-scenario'

function readStoredScenario(): SandboxScenario {
  try {
    const stored = sessionStorage.getItem(SCENARIO_KEY)
    if (stored === 'empty' || stored === 'error' || stored === 'success') {
      return stored
    }
  } catch {
    // sessionStorage may be blocked
  }
  return 'success'
}

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(credentialsReducer, initialCredentialsState)
  const [scenario, setScenarioState] = useState<SandboxScenario>(readStoredScenario)
  const [online, setOnline] = useState(
    () => (typeof navigator === 'undefined' ? true : navigator.onLine),
  )
  const [requestId, setRequestId] = useState(0)

  const setScenario = useCallback((next: SandboxScenario) => {
    setScenarioState(next)
    try {
      sessionStorage.setItem(SCENARIO_KEY, next)
    } catch {
      // ignore quota / private mode
    }
    setRequestId((value) => value + 1)
  }, [])

  const reload = useCallback(() => {
    setRequestId((value) => value + 1)
  }, [])

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      // Automatically refresh credentials when connectivity is restored
      setRequestId((value) => value + 1)
    }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      dispatch({ type: 'FETCH_START' })
      try {
        const { data, servedOffline } = await fetchCredentials(scenario)
        if (cancelled) {
          return
        }
        if (data.credentials.length === 0) {
          dispatch({ type: 'FETCH_EMPTY', servedOffline })
          return
        }
        dispatch({
          type: 'FETCH_SUCCESS',
          credentials: data.credentials,
          servedOffline,
        })
      } catch (error) {
        if (cancelled) {
          return
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load credentials from the sandbox.'
        dispatch({ type: 'FETCH_ERROR', message })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [scenario, requestId])

  const value = useMemo(
    () => ({
      state,
      scenario,
      online,
      setScenario,
      reload,
    }),
    [state, scenario, online, setScenario, reload],
  )

  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>
}
