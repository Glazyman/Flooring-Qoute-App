'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, PlusCircle, Settings,
  LogOut, CreditCard, Menu, X, HelpCircle, Users, Receipt, Ruler,
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
  { href: '/quotes', label: 'Estimates', icon: FileText },
  { href: '/measurements', label: 'Saved Measurements', icon: Ruler },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/contacts', label: 'Contacts', icon: Users },
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
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95 mt-1"
        style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', boxShadow: '0 2px 8px rgba(124,58,237,0.4)' }}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
        {locked
          ? <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Upgrade</span>
          : <svg className="w-3 h-3 ml-auto opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
      </Link>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
      style={isActive
        ? { background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-text-active)' }
        : { color: 'var(--sidebar-text)' }
      }
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)' }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />}
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
    <div className="flex flex-col h-full py-4 overflow-y-auto">
      {/* Main nav */}
      <div className="px-3 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 pb-2" style={{ color: 'var(--sidebar-section-label)' }}>Menu</p>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} trialExhausted={trialExhausted} />
        ))}
      </div>

      {/* Tools */}
      <div className="px-3 mt-5 space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest px-3 pb-2" style={{ color: 'var(--sidebar-section-label)' }}>Tools</p>
        {toolItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
        ))}
        <button
          onClick={() => { setMobileOpen(false); setContactOpen(true) }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          Chat & Support
        </button>
        <button
          onClick={handleBillingPortal}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          Billing
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
          style={{ color: 'rgba(239,68,68,0.7)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.7)' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>

      {/* Bottom — trial upgrade card + company card */}
      <div className="mt-auto px-3 space-y-2 pt-4">
        {trialExhausted && (
          <Link
            href="/billing/setup"
            className="block rounded-xl p-3.5 text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}
          >
            <p className="text-xs font-bold mb-0.5">✨ Upgrade to Pro</p>
            <p className="text-xs opacity-70 leading-snug mb-3">3 free quotes used. Unlock unlimited.</p>
            <span className="inline-block bg-white text-violet-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
              Upgrade now →
            </span>
          </Link>
        )}

        {/* Company card */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div
            className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: '#7C3AED' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-text-active)' }}>{companyName}</p>
            {website ? (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[11px] truncate block transition-colors hover:text-violet-400"
                style={{ color: 'var(--sidebar-text)' }}
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <p className="text-[11px]" style={{ color: 'var(--sidebar-section-label)' }}>Free plan</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 min-h-screen fixed left-0 top-0"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="FloorQuote Pro" width={32} height={32} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight leading-tight block" style={{ color: 'var(--sidebar-text-active)' }}>FloorQuote Pro</span>
            <span className="text-[11px]" style={{ color: 'var(--sidebar-section-label)' }}>Flooring Estimates</span>
          </div>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-30"
        style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 rounded-lg active:scale-95"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FloorQuote Pro" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-sm" style={{ color: 'var(--sidebar-text-active)' }}>FloorQuote Pro</span>
        </div>
        <div className="w-9" />
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 flex flex-col"
            style={{ background: 'var(--sidebar-bg)', paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="FloorQuote Pro" width={28} height={28} className="rounded-lg" />
                <span className="font-bold text-sm" style={{ color: 'var(--sidebar-text-active)' }}>FloorQuote Pro</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--sidebar-text)' }}
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
