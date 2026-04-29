'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        data: { full_name: form.fullName, company_name: form.companyName },
      },
    })

    if (signupError) { setError(signupError.message); setLoading(false); return }

    if (data.user) {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email: form.email,
          fullName: form.fullName,
          companyName: form.companyName,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to set up account')
        setLoading(false)
        return
      }
    }

    window.location.href = '/'
  }

  const passwordsMatch = !form.confirmPassword || form.password === form.confirmPassword

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-400 mb-6">3 free quotes — no credit card required</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
          {error}
        </div>
      )}

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:opacity-60 mb-4"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name + Company */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
          <input
            type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
            required autoComplete="name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company Name</label>
          <input
            type="text" value={form.companyName} onChange={e => set('companyName', e.target.value)}
            required autoComplete="organization"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
            placeholder="Smith Flooring LLC"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
          <input
            type="email" value={form.email} onChange={e => set('email', e.target.value)}
            required autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={e => set('password', e.target.value)}
              required minLength={6} autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-gray-300"
              placeholder="Min. 6 characters"
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              required autoComplete="new-password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-xl border text-gray-900 text-sm focus:outline-none focus:ring-2 placeholder:text-gray-300 ${
                !passwordsMatch
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-200 focus:ring-teal-500'
              }`}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {!passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordsMatch}
          className="w-full text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors mt-1 focus:outline-none disabled:opacity-60"
          style={{ background: 'var(--button-dark)' }}
        >
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-5">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
