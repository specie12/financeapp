/**
 * Extracts a user-facing message from an API/axios error. Falls back to a
 * generic message so a failed request is never silently swallowed.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data
    const msg = data?.message
    if (Array.isArray(msg)) return msg.filter(Boolean).join(', ')
    if (typeof msg === 'string' && msg.trim()) return msg
  }
  if (err instanceof Error && err.message) return err.message
  return fallback
}
