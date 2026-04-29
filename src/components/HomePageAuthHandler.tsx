'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Embedded on the homepage. Redirects already-signed-in visitors to /dashboard
 * so logged-in users don't see the marketing page.
 *
 * OAuth code exchange is handled server-side at /auth/callback/route.ts —
 * this component intentionally does NOT process `?code=...` query params.
 */
export default function HomePageAuthHandler() {
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.replace('/dashboard')
    }

    check()
  }, [router])

  return null
}
