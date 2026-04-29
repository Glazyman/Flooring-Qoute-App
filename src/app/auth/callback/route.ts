import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side OAuth callback handler.
 *
 * Supabase's PKCE flow stores the code verifier in cookies that are managed by
 * the server-side @supabase/ssr client. Exchanging the code for a session must
 * therefore happen on the server, where those cookies are readable AND we can
 * write the resulting session cookies back to the browser.
 *
 * Flow:
 *   1. Google redirects here with `?code=...`.
 *   2. We exchange the code for a session.
 *   3. If the user is brand-new (no company_members row yet), we provision a
 *      company via the same logic the (app)/layout.tsx uses for first-time
 *      Google sign-ups.
 *   4. Redirect to /dashboard (or `?next=...` if provided).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_failed&detail=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // Provision a company for brand-new Google users so the dashboard loads.
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split('@')[0] ||
        'My'

      try {
        await fetch(`${origin}/api/auth/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward the session cookie so /api/auth/setup can authenticate.
            cookie: request.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            fullName: displayName,
            companyName: `${displayName.trim()}'s Company`,
          }),
        })
      } catch {
        // Best effort: the (app)/layout.tsx will also try to provision on first
        // dashboard load if this fails, so we don't block the sign-in here.
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
