'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, PlusCircle, Settings,
  LogOut, CreditCard, Menu, X, HelpCircle, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import ContactModal from './ContactModal'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  highlight?: boolean
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quotes', label: 'All Quotes', icon: FileText },
  { href: '/quotes/new', label: 'New Quote', icon: PlusCircle, highlight: true },
]
const toolNav: NavItem[] = [
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
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
        style={{ background: 'var(--primary-gradient)' }}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {locked
          ? <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded-full">Upgrade</span>
          : <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={isActive
        ? { background: 'var(--primary-light)', color: '#818cf8' }
        : { color: 'var(--text-2)' }
      }
    >
      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
      {item.label}
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
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

  const initials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const sidebarContent = (
    <div className="flex flex-col h-full py-5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 mb-8">
        <Image src="/logo.png" alt="FloorQuote Pro" width={32} height={32} className="rounded-xl flex-shrink-0" />
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>FloorQuote Pro</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Estimating Tool</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-3 space-y-0.5">
        {mainNav.map(item => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} trialExhausted={trialExhausted} />
        ))}
      </nav>

      {/* Tools */}
      <div className="px-3 mt-7">
        <p className="text-xs font-semibold uppercase tracking-widest px-3.5 mb-2" style={{ color: 'var(--text-3)' }}>Tools</p>
        <nav className="space-y-0.5">
          {toolNav.map(item => (
            <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
          ))}
          <button
            onClick={() => { setMobileOpen(false); setContactOpen(true) }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--text-2)' }}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            Chat & Support
          </button>
          <button
            onClick={handleBillingPortal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ color: 'var(--text-2)' }}
          >
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            Billing
          </button>
        </nav>
      </div>

      {/* Bottom */}
      <div className="mt-auto px-3 space-y-3">
        {/* Upgrade card */}
        {trialExhausted && (
          <Link
            href="/billing/setup"
            className="block rounded-2xl p-4 text-white"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <p className="text-xs font-bold mb-0.5">Go Pro</p>
            <p className="text-xs opacity-75 leading-snug mb-3">You&apos;ve used all 3 free quotes.</p>
            <span className="inline-block bg-white/20 text-xs font-bold px-3 py-1.5 rounded-lg">
              Upgrade →
            </span>
          </Link>
        )}

        {/* Company card */}
        <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl" style={{ background: 'var(--card-alt)', border: '1px solid var(--border)' }}>
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--primary-gradient)' }}
          >
            {logoUrl
              ? <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{companyName}</p>
            {website
              ? <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="text-xs truncate block" style={{ color: 'var(--text-3)' }}>
                  {website.replace(/^https?:\/\//, '')}
                </a>
              : <p className="text-xs" style={{ color: 'var(--text-3)' }}>Free plan</p>}
          </div>
          <button onClick={handleLogout} title="Sign out" className="p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: 'var(--danger)' }}>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 min-h-screen fixed left-0 top-0"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-30"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-1 rounded-xl transition-colors" style={{ color: 'var(--text-2)' }}>
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} className="rounded-lg" />
          <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>FloorQuote Pro</span>
        </div>
        <div className="w-9" />
      </header>

      {/* Contact modal */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} className="rounded-lg" />
                <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>FloorQuote Pro</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-3)' }}>
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
