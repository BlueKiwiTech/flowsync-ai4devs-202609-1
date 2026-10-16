import { Navigate, Outlet } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Only renders its child routes for signed-in users.
 */
export function RequireAuth() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

/**
 * Only renders its child routes (login, signup) for signed-out users.
 */
export function RequireGuest() {
  const { token } = useAuth()
  return token ? <Navigate to="/profile" replace /> : <Outlet />
}
