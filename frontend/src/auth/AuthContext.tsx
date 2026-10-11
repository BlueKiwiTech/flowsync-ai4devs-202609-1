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
    // Clear the local session first so a slow or failing API never blocks the
    // user; revoking the token server-side is best effort.
    const current = token
    setToken(null)
    if (current) await apiLogout(current).catch(() => {})
  }, [token, setToken])

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
