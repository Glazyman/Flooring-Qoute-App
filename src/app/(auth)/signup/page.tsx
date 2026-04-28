'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        data: {
          full_name: form.fullName,
          company_name: form.companyName,
        },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Setup company via API route using service role
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

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Create your account</h1>
      <p className="text-sm text-gray-400 mb-6">3 free quotes — no credit card required</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
            {error}
          </div>
        )}

        {[
          { field: 'fullName', label: 'Full Name', type: 'text', placeholder: 'John Smith', autoComplete: 'name' },
          { field: 'companyName', label: 'Company Name', type: 'text', placeholder: 'Smith Flooring LLC', autoComplete: 'organization' },
          { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
          { field: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
        ].map(({ field, label, type, placeholder, autoComplete }) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={form[field as keyof typeof form]}
              onChange={(e) => set(field, e.target.value)}
              required
              minLength={field === 'password' ? 6 : undefined}
              autoComplete={autoComplete}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-gray-300"
              placeholder={placeholder}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl text-sm transition-colors shadow-sm mt-2 focus:outline-none"
        >
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
          Sign in
        </Link>
      </p>
    </>
  )
}
