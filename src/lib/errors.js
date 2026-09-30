// Friendly, consistent error text. Raw Supabase errors are logged for developers, never shown as-is.
export const MESSAGES = {
  network: 'Unable to connect to SNFX Cloud. Your local data is preserved.',
  session: 'Your session has expired. Please sign in again.',
  load: 'Unable to load your trades. Please try again.',
  save: 'Unable to save this trade. Please try again.',
  config: 'SNFX Cloud is not configured for this site yet.',
  generic: 'Something went wrong. Please try again.',
}

const text = (e) => String((e && (e.message || e.msg)) || e || '').toLowerCase()

export function isNetworkError(e) {
  if (!e) return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return e.status === 0 || e.name === 'AuthRetryableFetchError' ||
    /failed to fetch|networkerror|network request failed|load failed|fetch failed|err_internet/.test(text(e))
}

export function isSessionError(e) {
  if (!e) return false
  return e.status === 401 || e.code === 'PGRST301' || e.code === 'PGRST303' ||
    /jwt|refresh token|session (missing|expired)|not authenticated/.test(text(e)) ||
    ['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(e.code)
}

export class CloudError extends Error {
  constructor(kind, message, cause) { super(message); this.name = 'CloudError'; this.kind = kind; this.cause = cause }
}

// kind: network | session | config | database
export function toCloudError(e, fallbackKey = 'generic') {
  if (e instanceof CloudError) return e
  if (isNetworkError(e)) return new CloudError('network', MESSAGES.network, e)
  if (isSessionError(e)) return new CloudError('session', MESSAGES.session, e)
  if (typeof console !== 'undefined' && import.meta.env && import.meta.env.DEV) console.warn('[SNFX Cloud]', e)
  return new CloudError('database', MESSAGES[fallbackKey] || MESSAGES.generic, e)
}

// Maps Supabase Auth errors to messages a trader can act on.
export function authMessage(e) {
  if (isNetworkError(e)) return MESSAGES.network
  const code = e && e.code
  const t = text(e)
  if (code === 'invalid_credentials' || /invalid login credentials/.test(t)) return 'Email or password is incorrect.'
  if (code === 'email_not_confirmed' || /email not confirmed/.test(t)) return 'Please verify your email address before signing in. Check your inbox for the confirmation link.'
  if (code === 'user_already_exists' || /already registered|already exists/.test(t)) return 'An account with this email already exists. Try signing in instead.'
  if (code === 'weak_password' || /password should|weak password/.test(t)) return 'That password is too weak. Use at least 8 characters with a letter and a number.'
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || e?.status === 429 || /rate limit|too many/.test(t)) return 'Too many attempts. Please wait a minute and try again.'
  if (code === 'signup_disabled') return 'New sign-ups are currently disabled.'
  if (code === 'same_password' || /different from the old password/.test(t)) return 'Choose a password different from your current one.'
  if (isSessionError(e)) return MESSAGES.session
  return MESSAGES.generic
}
