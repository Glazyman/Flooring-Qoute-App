import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-md" style={{ background: 'rgba(12,15,30,0.85)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">FloorQuote Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Contact
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="mt-24" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">FloorQuote Pro</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            {user ? (
              <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-700 transition-colors">Sign In</Link>
                <Link href="/signup" className="hover:text-gray-700 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} FloorQuote Pro</p>
        </div>
      </footer>
    </div>
  )
}
