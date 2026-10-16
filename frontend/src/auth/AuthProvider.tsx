import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { AuthContext } from './context'

const TOKEN_KEY = 'flowsync.token'

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage unavailable (private mode, blocked site data): keep the token in memory only.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState(readToken)

  const setToken = useCallback((value: string) => {
    writeToken(value)
    setTokenState(value)
  }, [])

  const clearToken = useCallback(() => {
    writeToken(null)
    setTokenState(null)
  }, [])

  const value = useMemo(() => ({ token, setToken, clearToken }), [token, setToken, clearToken])

  return <AuthContext value={value}>{children}</AuthContext>
}
