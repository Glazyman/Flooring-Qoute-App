'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  LogOut,
  CreditCard,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import ContactModal from './ContactModal'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
  section?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quotes', label: 'All Quotes', icon: FileText },
  { href: '/quotes/new', label: 'New Quote', icon: PlusCircle, highlight: true },
]

const toolItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavLink({
  item,
  onClick,
  trialExhausted,
}: {
  item: NavItem
  onClick?: () => void
  trialExhausted?: boolean
}) {
  const pathname = usePathname()
  const isActive =
    item.href === '/quotes/new'
      ? pathname === '/quotes/new'
      : pathname === item.href ||
        (item.href !== '/dashboard' &&
          pathname.startsWith(item.href) &&
          item.href !== '/quotes/new')

  if (item.highlight) {
    const locked = trialExhausted
    return (
      <Link
        href={locked ? '/billing/setup' : item.href}
        onClick={onClick}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {locked ? (
          <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded-full">Upgrade</span>
        ) : (
          <svg className="w-3.5 h-3.5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'font-semibold'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
      style={isActive ? { background: 'var(--primary-light)', color: 'var(--primary)' } : {}}
    >
      <item.icon
        className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-600' : ''}`}
      />
      {item.label}
    </Link>
  )
}

export default function AppNavigation({
  companyName,
  logoUrl,
  website,
  trialExhausted = false,
}: {
  companyName: string
  logoUrl?: string | null
  website?: string | null
  trialExhausted?: boolean
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleBillingPortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const initials = companyName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sidebarContent = (
    <div className="flex flex-col h-full py-4">
      {/* App Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-7">
        <Image src="/logo.png" alt="FloorQuote Pro" width={32} height={32} className="rounded-xl" />
        <span className="font-bold text-slate-800 text-base tracking-tight">FloorQuote Pro</span>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} trialExhausted={trialExhausted} />
        ))}
      </nav>

      {/* Tools section */}
      <div className="px-3 mt-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-3.5 mb-2">Tools</p>
        <nav className="space-y-0.5">
          {toolItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
          ))}
          <button
            onClick={() => { setMobileOpen(false); setContactOpen(true) }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            Chat & Support
          </button>
          <button
            onClick={handleBillingPortal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
          >
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            Billing
          </button>
        </nav>
      </div>

      {/* Bottom — company + upgrade card */}
      <div className="mt-auto px-3">
        {trialExhausted && (
          <Link
            href="/billing/setup"
            className="block rounded-2xl p-4 mb-3 text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)' }}
          >
            <p className="text-xs font-bold mb-0.5">Upgrade to Pro</p>
            <p className="text-xs opacity-75 leading-snug mb-3">You've used all 3 free quotes. Unlock unlimited.</p>
            <span className="inline-block bg-white text-xs font-bold px-3 py-1.5 rounded-lg" style={{ color: 'var(--primary)' }}>
              Upgrade plan →
            </span>
          </Link>
        )}

        {/* Company badge */}
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-100 bg-slate-50">
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--primary)' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{companyName}</p>
            {website ? (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-teal-600 truncate block transition-colors"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <p className="text-xs text-slate-400">Free plan</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-slate-100 fixed left-0 top-0 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} className="rounded-lg" />
          <span className="font-bold text-slate-800 text-sm">FloorQuote Pro</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Contact modal */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} className="rounded-lg" />
                <span className="font-bold text-slate-800 text-sm">FloorQuote Pro</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
