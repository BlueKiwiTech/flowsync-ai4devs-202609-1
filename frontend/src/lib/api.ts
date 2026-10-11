const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'

export type User = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string
  updatedAt: string | null
}

export type AuthResponse = {
  user: User
  token: string
}

export type ApiErrorItem = {
  message: string
  field?: string
  rule?: string
}

/**
 * Error thrown for any non-2xx response. `status` is 0 when the
 * request never reached the server (network error, CORS, server down).
 */
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

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
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

export function signup(email: string, password: string) {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: {
      fullName: null,
      email,
      password,
      passwordConfirmation: password,
    },
  })
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function getProfile(token: string) {
  return request<User>('/account/profile', { token })
}

export function logout(token: string) {
  return request<unknown>('/account/logout', { method: 'POST', token })
}
