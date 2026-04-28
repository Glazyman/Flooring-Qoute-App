import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FloorQuote Pro" width={32} height={32} className="rounded-xl" />
            <span className="font-extrabold text-gray-900 text-[15px] tracking-tight">FloorQuote Pro</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className="text-sm font-semibold text-white px-4 py-2 rounded-xl" style={{ background: 'var(--primary)' }}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="text-sm font-semibold text-white px-3 sm:px-4 py-2 rounded-xl transition-colors whitespace-nowrap" style={{ background: 'var(--primary)' }}>
                  <span className="hidden sm:inline">Get Started Free</span>
                  <span className="sm:hidden">Start Free</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-24">
        <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FloorQuote Pro" width={24} height={24} className="rounded-lg" />
            <span className="text-sm font-semibold text-gray-700">FloorQuote Pro</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} FloorQuote Pro. All rights reserved.</p>
          <div className="flex items-center gap-5 text-sm text-gray-400">
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
            {user
              ? <Link href="/dashboard" className="hover:text-gray-700 transition-colors">Dashboard</Link>
              : <Link href="/signup" className="hover:text-gray-700 transition-colors">Sign Up</Link>}
          </div>
        </div>
      </footer>
    </div>
  )
}
