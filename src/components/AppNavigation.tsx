'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, Settings,
  LogOut, CreditCard, Menu, X, HelpCircle, Users, Receipt, Ruler, Plus,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quotes', label: 'Estimates', icon: FileText },
  { href: '/measurements', label: 'Measurements', icon: Ruler },
  { href: '/invoices', label: 'Import', icon: Receipt },
  { href: '/contacts', label: 'Contacts', icon: Users },
]

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & Support', icon: HelpCircle },
]

function NavLink({ item, onClick, badge }: { item: NavItem; onClick?: () => void; badge?: number }) {
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
      style={isActive
        ? { background: '#f2f2f7', color: '#1d1d1f', fontWeight: 600, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', fontSize: 13, textDecoration: 'none' }
        : { background: 'transparent', color: '#6e6e73', fontWeight: 400, borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', fontSize: 13, textDecoration: 'none' }
      }
      onMouseEnter={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = '#fafafa'
          ;(e.currentTarget as HTMLElement).style.color = '#1d1d1f'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = '#6e6e73'
        }
      }}
    >
      <item.icon size={14} strokeWidth={isActive ? 2 : 1.7} color={isActive ? '#1d1d1f' : '#aeaeb2'} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
          background: '#1d1d1f', color: 'white',
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

export default function AppNavigation({
  companyName, logoUrl, website, trialExhausted = false, planLabel, pendingMeasurements = 0,
}: {
  companyName: string
  logoUrl?: string | null
  website?: string | null
  trialExhausted?: boolean
  planLabel?: string
  pendingMeasurements?: number
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', flex: 1 }}>

      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/logo.png" alt="FloorQuote Pro" width={30} height={30} style={{ borderRadius: 9, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>FloorQuote Pro</span>
        <button
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg"
          style={{ color: '#6e6e73', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User / Company section */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {/* Avatar with gradient ring */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#1d1d1f 0%,#3a3a3c 100%)',
            padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', background: 'white' }} />
            ) : (
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: '#1d1d1f',
              }}>
                {initials}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#1d1d1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{companyName}</p>
            <p style={{ fontSize: 11, color: '#aeaeb2', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {planLabel ? `${planLabel} plan` : website || ''}
            </p>
          </div>
        </div>
      </div>

      {/* New Quote CTA */}
      <div style={{ padding: '12px 12px 8px' }}>
        <Link
          href={trialExhausted ? '/billing/setup' : '/quotes/new'}
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '9px 0', borderRadius: 10,
            background: 'linear-gradient(135deg,#1d1d1f 0%,#3a3a3c 100%)',
            color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Plus size={14} strokeWidth={2.5} color="white" />
          New Quote
          {trialExhausted && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: 4 }}>Upgrade</span>}
        </Link>
      </div>

      {/* Main nav */}
      <div style={{ padding: '6px 10px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.09em', margin: '0 0 4px 2px' }}>MAIN</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={() => setMobileOpen(false)}
              badge={item.href === '/measurements' ? pendingMeasurements : undefined}
            />
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ marginTop: 'auto', padding: '4px 10px 6px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {bottomNavItems.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
          ))}
          <button
            onClick={handleBillingPortal}
            style={{
              background: 'transparent', color: '#6e6e73', fontWeight: 400, borderRadius: 9,
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', fontSize: 13,
              border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; (e.currentTarget as HTMLElement).style.color = '#1d1d1f' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6e6e73' }}
          >
            <CreditCard size={14} strokeWidth={1.7} color="#aeaeb2" />
            Billing
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent', color: '#ff453a', fontWeight: 400, borderRadius: 9,
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', fontSize: 13,
              border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff5f5' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <LogOut size={14} strokeWidth={1.7} color="#ff453a" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px 12px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 11, color: '#aeaeb2', margin: 0 }}>© 2026 FloorQuote Pro</p>
      </div>

      {/* Trial upgrade banner */}
      {trialExhausted && (
        <div style={{ margin: '0 10px 10px' }}>
          <Link
            href="/billing/setup"
            style={{
              display: 'block', borderRadius: 10, padding: 12, color: 'white',
              background: 'linear-gradient(135deg,#1d1d1f 0%,#3a3a3c 100%)',
              textDecoration: 'none',
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px' }}>✨ Upgrade to Pro</p>
            <p style={{ fontSize: 11, opacity: 0.7, margin: '0 0 8px', lineHeight: 1.4 }}>3 free quotes used. Unlock unlimited.</p>
            <span style={{
              display: 'inline-block', background: 'rgba(255,255,255,0.15)',
              color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
            }}>
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
        className="hidden lg:flex flex-col w-[216px] h-screen fixed left-0 top-0"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-30"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-lg"
          style={{ color: '#6e6e73' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/logo.png" alt="FloorQuote Pro" width={26} height={26} style={{ borderRadius: 7 }} />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.02em' }}>FloorQuote Pro</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[216px] flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(20px)',
              paddingTop: 'env(safe-area-inset-top)',
            }}
          >
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  )
}
