import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Next.js 16 forbids setting cookies in Server Components — only
          // proxy/middleware, Route Handlers, and Server Actions may write
          // cookies. The proxy already refreshes the session on every request
          // (see src/proxy.ts → updateSession), so silently dropping any
          // attempted writes here is safe.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: options?.maxAge ?? 60 * 60 * 24 * 30,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            )
          } catch {
            // Called from a Server Component — ignore.
          }
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * Resolve the current Supabase user without throwing.
 *
 * `auth.getUser()` can throw on transient network errors or reject with an
 * `AuthApiError` for things like a revoked / chunked / corrupt refresh token.
 * Letting that bubble up to a Server Component crashes the page with a 500.
 * This helper guarantees a `User | null` and never throws — pages should
 * `redirect('/login')` on `null` (which the proxy will also re-confirm and
 * use to clear bad cookies in the same request loop).
 */
export async function getCurrentUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user
  } catch {
    return null
  }
}
