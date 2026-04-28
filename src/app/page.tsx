'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RootPage() {
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function checkAuth() {
      const supabase = createClient()

      // Check if there's a PKCE code in the URL (from Google OAuth redirect)
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
        // Check if they already have a company (new Google sign-ups may not)
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
      } else {
        router.replace('/home')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #E5E5EA',
          borderTopColor: '#0D9488', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
