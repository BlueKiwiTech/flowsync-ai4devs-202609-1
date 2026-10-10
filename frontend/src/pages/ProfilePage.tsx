import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/auth/auth-context'
import { ApiError, getProfile } from '@/lib/api'
import type { User } from '@/lib/api'
import { AuthLayout } from '@/pages/AuthLayout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProfilePage() {
  const { token, setToken, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getProfile(token)
      .then((profile) => {
        if (!cancelled) setUser(profile)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          // Token expired or revoked: drop it, RequireAuth sends us to /login.
          setToken(null)
          return
        }
        setError(
          err instanceof ApiError && err.status === 0
            ? "Can't reach the server. Check your connection and try again."
            : 'Could not load your profile. Please try again.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [token, setToken])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
          >
            {user?.initials ?? '…'}
          </div>
          <div className="grid gap-1">
            <CardTitle className="text-2xl">Your profile</CardTitle>
            <CardDescription>You are logged in to FlowSync.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!user && !error && (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          )}
          {user && (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium" data-testid="profile-email">
                  {user.email}
                </dd>
              </div>
              {user.fullName && (
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{user.fullName}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Log out
          </Button>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
