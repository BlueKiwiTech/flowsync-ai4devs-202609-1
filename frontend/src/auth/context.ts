import { createContext } from 'react'

type AuthContextValue = {
  token: string | null
  setToken: (token: string) => void
  clearToken: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
