/**
 * Format a US phone number on blur/save.
 * Accepts any input shape and produces:
 *   10 digits  -> (###) ###-####
 *   11 digits starting with 1 -> 1 (###) ###-####
 *   anything else -> returned untouched
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  const digits = String(raw).replace(/\D+/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  return String(raw).trim()
}

/**
 * Compute and format an expiration date given a starting date (defaults to today)
 * and a number of valid days.
 *   addDays(30) -> "Nov 28, 2026"
 */
export function formatExpiration(validDays: number, from: Date = new Date()): string {
  if (!Number.isFinite(validDays) || validDays <= 0) return ''
  const d = new Date(from)
  d.setDate(d.getDate() + Math.round(validDays))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
