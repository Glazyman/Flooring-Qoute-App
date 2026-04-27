'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, PlusCircle, Settings,
  LogOut, CreditCard, Menu, X, HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import ContactModal from './ContactModal'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quotes', label: 'All Quotes', icon: FileText },
  { href: '/quotes/new', label: 'New Quote', icon: PlusCircle, highlight: true },
]

const toolItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavLink({ item, onClick, trialExhausted }: { item: NavItem; onClick?: () => void; trialExhausted?: boolean }) {
  const pathname = usePathname()
  const isActive =
    item.href === '/quotes/new'
      ? pathname === '/quotes/new'
      : pathname === item.href ||
        (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/quotes/new')

  if (item.highlight) {
    const locked = trialExhausted
    return (
      <Link
        href={locked ? '/billing/setup' : item.href}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)', boxShadow: '0 2px 8px rgba(13,148,136,0.35)' }}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {locked
          ? <span className="ml-auto text-xs bg-white/25 px-2 py-0.5 rounded-full">Upgrade</span>
          : <svg className="w-3.5 h-3.5 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
        isActive ? 'font-semibold' : 'hover:bg-gray-50'
      }`}
      style={isActive ? { background: 'var(--primary-light)', color: 'var(--primary)' } : { color: 'var(--text-2)' }}
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-600' : ''}`} />
      {item.label}
      {isActive && <span className="ml-auto w-2 h-2 rounded-full bg-teal-500" />}
    </Link>
  )
}

export default function AppNavigation({
  companyName, logoUrl, website, trialExhausted = false,
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

  const initials = companyName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  const sidebarContent = (
    <div className="flex flex-col h-full py-5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 mb-7">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
          <Image src="/logo.png" alt="FloorQuote Pro" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="font-bold text-gray-900 text-[15px] tracking-tight leading-none block">FloorQuote Pro</span>
          <span className="text-[11px] text-gray-400 font-medium">Flooring Estimates</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="px-3 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pb-1.5">Menu</p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} trialExhausted={trialExhausted} />
        ))}
      </div>

      {/* Tools */}
      <div className="px-3 mt-5 space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pb-1.5">Tools</p>
        {toolItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
        ))}
        <button
          onClick={() => { setMobileOpen(false); setContactOpen(true) }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
          style={{ color: 'var(--text-2)' }}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          Chat & Support
        </button>
        <button
          onClick={handleBillingPortal}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:bg-gray-50 active:scale-95"
          style={{ color: 'var(--text-2)' }}
        >
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Billing
        </button>
      </div>

      {/* Bottom */}
      <div className="mt-auto px-3 space-y-3">
        {trialExhausted && (
          <Link
            href="/billing/setup"
            className="block rounded-2xl p-4 text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0f766e 100%)', boxShadow: '0 4px 12px rgba(13,148,136,0.3)' }}
          >
            <p className="text-xs font-bold mb-0.5">✨ Upgrade to Pro</p>
            <p className="text-xs opacity-75 leading-snug mb-3">3 free quotes used. Unlock unlimited.</p>
            <span className="inline-block bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
              Upgrade now →
            </span>
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:bg-red-50 active:scale-95 text-red-400 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>

        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-gray-50 border border-gray-100">
          <div
            className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--primary)' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{companyName}</p>
            {website ? (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[11px] text-gray-400 hover:text-teal-600 truncate block transition-colors"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <p className="text-[11px] text-gray-400">Free plan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0" style={{ boxShadow: '1px 0 0 #f0f0f5' }}>
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors active:scale-95"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} className="rounded-lg" />
          <span className="font-bold text-gray-900 text-sm tracking-tight">FloorQuote Pro</span>
        </div>
        <div className="w-9" />
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="FloorQuote Pro" width={28} height={28} className="rounded-lg" />
                <span className="font-bold text-gray-900 text-sm">FloorQuote Pro</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  )
}
