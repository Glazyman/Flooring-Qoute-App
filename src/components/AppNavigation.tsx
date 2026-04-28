'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, PlusCircle, Settings,
  LogOut, CreditCard, Menu, X, HelpCircle, Users, Receipt, Ruler, ChevronDown,
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
  { href: '/measurements', label: 'Measurements', icon: Ruler },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/contacts', label: 'Contacts', icon: Users },
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

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all"
      style={isActive
        ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.95)' }
        : { color: 'rgba(255,255,255,0.5)' }
      }
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
    >
      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
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
    <div className="flex flex-col h-full py-3 overflow-y-auto">

      {/* Company header */}
      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-white/5 transition-colors text-left">
          <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: '#7C3AED' }}>
            {logoUrl
              ? <img src={logoUrl} alt={companyName} className="w-full h-full object-cover" />
              : initials}
          </div>
          <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>{companyName}</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </button>
      </div>

      {/* New Quote CTA */}
      <div className="px-3 mb-4">
        <Link
          href={trialExhausted ? '/billing/setup' : '/quotes/new'}
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-1.5 rounded-md text-[13px] font-semibold text-white transition-all"
          style={{ background: '#7C3AED' }}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Quote
          {trialExhausted && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded ml-1">Upgrade</span>}
        </Link>
      </div>

      {/* Main nav */}
      <div className="px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} trialExhausted={trialExhausted} />
        ))}
      </div>

      {/* Divider */}
      <div className="mx-3 my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Tools */}
      <div className="px-3 space-y-0.5">
        {toolItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
        ))}
        <button
          onClick={() => { setMobileOpen(false); setContactOpen(true) }}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all text-left"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
        >
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Help & Support
        </button>
        <button
          onClick={handleBillingPortal}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all text-left"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)' }}
        >
          <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
          Billing
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all text-left"
          style={{ color: 'rgba(239,68,68,0.6)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.9)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(239,68,68,0.6)' }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          Sign Out
        </button>
      </div>

      {/* Trial upgrade */}
      {trialExhausted && (
        <div className="mt-auto mx-3 mb-2">
          <Link
            href="/billing/setup"
            className="block rounded-lg p-3 text-white"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' }}
          >
            <p className="text-xs font-bold mb-0.5">✨ Upgrade to Pro</p>
            <p className="text-xs opacity-70 leading-snug mb-2">3 free quotes used. Unlock unlimited.</p>
            <span className="inline-block bg-white text-violet-700 text-xs font-bold px-2.5 py-1 rounded-md">
              Upgrade now →
            </span>
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-56 min-h-screen fixed left-0 top-0"
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="FloorQuote Pro" width={28} height={28} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-[13px] leading-tight block" style={{ color: 'rgba(255,255,255,0.9)' }}>FloorQuote Pro</span>
          </div>
        </div>
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 z-30"
        style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-1 rounded-md"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FloorQuote Pro" width={24} height={24} className="rounded-md" />
          <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>FloorQuote Pro</span>
        </div>
        <div className="w-9" />
      </header>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ background: 'var(--sidebar-bg)', paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="FloorQuote Pro" width={24} height={24} className="rounded-md" />
                <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>FloorQuote Pro</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
