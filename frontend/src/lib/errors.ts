import { ApiError } from '@/lib/api'

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Password',
  passwordConfirmation: 'Password confirmation',
}

/**
 * Turns an API/network error into a message that can be shown to the user.
 */
export function toFriendlyMessage(
  error: unknown,
  context: 'login' | 'signup',
): string {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.'
  }

  if (error.status === 0) {
    return "Can't reach the server. Check your connection and try again."
  }

  if (context === 'login' && (error.status === 400 || error.status === 401)) {
    return 'Incorrect email or password.'
  }

  if (error.status === 422) {
    const duplicateEmail = error.errors.some(
      (e) => e.field === 'email' && e.rule === 'database.unique',
    )
    if (duplicateEmail) {
      return 'An account with this email already exists. Try logging in instead.'
    }

    const invalidEmail = error.errors.some(
      (e) => e.field === 'email' && e.rule === 'email',
    )
    if (invalidEmail) return 'Please enter a valid email address.'

    const passwordLength = error.errors.some(
      (e) =>
        e.field === 'password' &&
        (e.rule === 'minLength' || e.rule === 'maxLength'),
    )
    if (passwordLength) return 'Password must be between 8 and 32 characters.'

    const first = error.errors[0]
    if (first?.field) {
      return `${FIELD_LABELS[first.field] ?? first.field} is not valid.`
    }
  }

  return 'Something went wrong. Please try again.'
}
