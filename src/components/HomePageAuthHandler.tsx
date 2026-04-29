'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Embedded on the homepage. Handles two cases without blocking page render:
 *  1) `?code=…` query param — Supabase OAuth (Google sign-in) redirected back here.
 *     Exchange the code for a session, ensure the user has a company, then send to /dashboard.
 *  2) Existing session — redirect logged-in visitors to /dashboard.
 *
 * If neither, this component is a no-op and the marketing homepage shows.
 */
export default function HomePageAuthHandler() {
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function check() {
      const supabase = createClient()

      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          router.replace('/login?error=auth_failed')
          return
        }
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: membership } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (!membership) {
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'My'

          await fetch('/api/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              email: user.email,
              fullName: displayName,
              companyName: `${displayName.trim()}'s Company`,
            }),
          })
        }

        router.replace('/dashboard')
      }
    }

    check()
  }, [router])

  return null
}
