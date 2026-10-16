import type { FormEvent, ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
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

type AuthLayoutProps = {
  title: string
  description: string
  submitLabel: string
  submitting: boolean
  error: string | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  footer: ReactNode
  children: ReactNode
}

export function AuthLayout({
  title,
  description,
  submitLabel,
  submitting,
  error,
  onSubmit,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {children}
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Enviando…' : submitLabel}
            </Button>
            <p className="text-sm text-muted-foreground">{footer}</p>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}
