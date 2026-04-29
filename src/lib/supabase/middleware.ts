import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Cookie names Supabase may have set in the browser. We clear all of these on a
 * bad-session detection so the user can recover without manually clearing cookies.
 *
 * Includes:
 *  - `sb-*-auth-token` (and chunked variants `.0`, `.1`, …)
 *  - `sb-*-auth-token-code-verifier` (PKCE OAuth state)
 *  - `sb-provider-token`, `sb-refresh-token`, etc.
 */
function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith('sb-') || name.startsWith('supabase-')
}

function clearSupabaseCookies(
  request: NextRequest,
  response: NextResponse
): void {
  for (const c of request.cookies.getAll()) {
    if (isSupabaseAuthCookie(c.name)) {
      // `delete` writes a Set-Cookie header that expires the cookie in the browser.
      response.cookies.delete(c.name)
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Keep users logged in for 30 days
              maxAge: options?.maxAge ?? 60 * 60 * 24 * 30,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname
  const isAuthPath =
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/auth/')
  const isApiPath = path.startsWith('/api/')
  const isPublicPath =
    path === '/' ||
    path.startsWith('/home') ||
    path.startsWith('/contact') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms') ||
    path.startsWith('/billing/setup')

  // Resolve the current user. If the cookies are corrupt, the refresh token is
  // expired/revoked, or the Supabase auth API is briefly unreachable, this can
  // throw. We MUST NOT let that crash the proxy — a 500 here renders as a
  // Chrome "This page couldn't load" error until the user manually clears
  // cookies. Instead, treat any failure as "no user" and clear the bad cookies
  // so the next request starts fresh.
  let user: { id: string } | null = null
  let authFailed = false
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      // `getUser()` returns an error (rather than throwing) for known auth
      // failures like an invalid refresh token. Treat them the same as a throw.
      authFailed = true
    } else {
      user = data.user
    }
  } catch {
    authFailed = true
  }

  if (authFailed) {
    // Build a fresh response so we don't accidentally carry stale Set-Cookie
    // headers from `setAll` calls that ran before the error.
    if (isAuthPath || isApiPath || isPublicPath) {
      const response = NextResponse.next({ request })
      clearSupabaseCookies(request, response)
      return response
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    clearSupabaseCookies(request, response)
    return response
  }

  if (!user && !isAuthPath && !isApiPath && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
