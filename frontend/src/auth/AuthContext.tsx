import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { logout as apiLogout } from '@/lib/api'
import { AuthContext } from '@/auth/auth-context'

const TOKEN_KEY = 'flowsync.token'

function readToken(): string | null {
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
    // Storage unavailable (private mode, blocked): keep the token in memory only.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(readToken)

  const setToken = useCallback((next: string | null) => {
    writeToken(next)
    setTokenState(next)
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      // Best effort: the local session is cleared even if the API call fails.
      await apiLogout(token).catch(() => {})
    }
    setToken(null)
  }, [token, setToken])

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
