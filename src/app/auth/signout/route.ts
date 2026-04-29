import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Hard sign-out endpoint.
 *
 * Calling `supabase.auth.signOut()` directly from the client breaks if the
 * session is in a corrupt state — which is precisely when users most need to
 * sign out (e.g. recovering from "This page couldn't load" by way of the
 * route error boundary). This server route nukes every Supabase auth cookie
 * unconditionally, then asks Supabase to revoke the session as a best-effort
 * follow-up.
 *
 * Accepts both GET and POST so it can be hit from a `<form>`, `fetch`, or a
 * plain `<a href>`.
 */
async function handle(request: NextRequest) {
  const isJson = request.headers.get('accept')?.includes('application/json')

  const response = isJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL('/login', request.url))

  // Clear every Supabase cookie regardless of whether revoke succeeds. This
  // unblocks the user even if their refresh token is invalid.
  for (const c of request.cookies.getAll()) {
    if (c.name.startsWith('sb-') || c.name.startsWith('supabase-')) {
      response.cookies.delete(c.name)
    }
  }

  // Best-effort revoke. Wrapped in try/catch because a corrupt session is the
  // exact case where this throws — and we still want to clear cookies above.
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignore — cookies are already cleared on the response.
  }

  return response
}

export async function POST(request: NextRequest) {
  return handle(request)
}

export async function GET(request: NextRequest) {
  return handle(request)
}
