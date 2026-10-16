import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/auth/useAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAuthErrorMessage, login } from '@/lib/api'

export function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { token } = await login(email.trim(), password)
      setToken(token)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err, 'login'))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar sesión"
      description="Accede a tu cuenta de FlowSync."
      submitLabel="Entrar"
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/signup" className="font-medium text-foreground underline underline-offset-4">
            Regístrate
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
    </AuthLayout>
  )
}
