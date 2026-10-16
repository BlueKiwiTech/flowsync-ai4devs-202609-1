import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { CircleAlert } from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
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
import { ApiError, getProfile, logout, type User } from '@/lib/api'

export function ProfilePage() {
  const { token, clearToken } = useAuth()
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
          clearToken()
          return
        }
        setError('No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.')
      })

    return () => {
      cancelled = true
    }
  }, [token, clearToken])

  async function handleLogout() {
    if (token) await logout(token).catch(() => {})
    clearToken()
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tu perfil</CardTitle>
          <CardDescription>Datos de tu cuenta de FlowSync.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!error && !user && <p className="text-sm text-muted-foreground">Cargando…</p>}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user.initials}
              </div>
              <div className="min-w-0">
                {user.fullName && <p className="truncate font-medium">{user.fullName}</p>}
                <p className="truncate text-sm">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Miembro desde {new Date(user.createdAt).toLocaleDateString('es')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="mt-6">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
