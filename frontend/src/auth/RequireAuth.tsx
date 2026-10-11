import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '@/auth/auth-context'

/**
 * Renders its children only when there is a stored token; otherwise sends the
 * user to the login screen. Token validity is checked by the protected page
 * itself (a 401 from the API clears the token).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
