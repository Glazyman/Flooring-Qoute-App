/**
 * Admin email allowlist — these accounts bypass all subscription checks
 * and are treated as if they're on the Pro plan with no quota limits.
 *
 * To grant admin access to additional users, either:
 * 1. Add their email to the ADMIN_EMAILS array below, OR
 * 2. Set the env var ADMIN_EMAILS to a comma-separated list (e.g. "a@x.com,b@y.com")
 *    The env var takes precedence and is merged with the hardcoded list.
 */
const ADMIN_EMAILS = [
  'glazeyman@gmail.com',
]

function getAdminEmails(): Set<string> {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return new Set([...ADMIN_EMAILS.map(e => e.toLowerCase()), ...fromEnv])
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().has(email.toLowerCase())
}

export function isAdminUser(user: { email?: string | null } | null | undefined): boolean {
  return isAdminEmail(user?.email)
}
