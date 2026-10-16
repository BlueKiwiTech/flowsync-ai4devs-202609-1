export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string | null
}

type AuthResponse = {
  user: User
  token: string
}

type ApiErrorItem = {
  message: string
  field?: string
  rule?: string
}

export class ApiError extends Error {
  status: number
  errors: ApiErrorItem[]

  constructor(status: number, errors: ApiErrorItem[]) {
    super(errors[0]?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string | null
}

async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`/api/v1/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, [])
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const errors = Array.isArray(payload?.errors) ? payload.errors : []
    throw new ApiError(response.status, errors)
  }

  return payload?.data as T
}

export function signup(email: string, password: string, passwordConfirmation: string) {
  return request<AuthResponse>('auth/signup', {
    method: 'POST',
    body: { fullName: null, email, password, passwordConfirmation },
  })
}

export function login(email: string, password: string) {
  return request<AuthResponse>('auth/login', { method: 'POST', body: { email, password } })
}

export function getProfile(token: string) {
  return request<User>('account/profile', { token })
}

export function logout(token: string) {
  return request<unknown>('account/logout', { method: 'POST', token })
}

const fieldMessages: Record<string, Record<string, string>> = {
  email: {
    'database.unique': 'Ya existe una cuenta con este email.',
    'email': 'Introduce un email válido.',
    'required': 'El email es obligatorio.',
  },
  password: {
    minLength: 'La contraseña debe tener al menos 8 caracteres.',
    maxLength: 'La contraseña no puede superar los 32 caracteres.',
    required: 'La contraseña es obligatoria.',
  },
  passwordConfirmation: {
    sameAs: 'Las contraseñas no coinciden.',
    required: 'Confirma la contraseña.',
  },
}

/**
 * Turns an error thrown by the API client into a message that can be shown to the user.
 */
export function getAuthErrorMessage(error: unknown, context: 'login' | 'signup') {
  if (!(error instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.'

  if (error.status === 0) return 'No se pudo conectar con el servidor. Inténtalo más tarde.'

  if (context === 'login' && (error.status === 400 || error.status === 401)) {
    return 'Email o contraseña incorrectos.'
  }

  if (error.status === 422) {
    const messages = error.errors.map(
      ({ field, rule }) =>
        (field && rule && fieldMessages[field]?.[rule]) || 'Revisa los datos introducidos.'
    )
    return [...new Set(messages)].join(' ')
  }

  if (error.status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'

  return 'Algo salió mal. Inténtalo de nuevo.'
}
