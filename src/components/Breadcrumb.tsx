'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  quotes: 'Estimates',
  measurements: 'Measurements',
  invoices: 'Import',
  contacts: 'Contacts',
  settings: 'Settings',
  help: 'Help & Support',
  billing: 'Billing',
  new: 'New',
  edit: 'Edit',
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1.5">
      <Link href="/dashboard" style={{ fontSize: 12.5, color: '#aeaeb2', textDecoration: 'none' }}>
        Home
      </Link>
      {segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        const isLast = i === segments.length - 1
        const label = LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1, 8)
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(seg)
        const display = isUuid ? '#' + seg.slice(0, 6).toUpperCase() : label
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3" style={{ color: '#d1d1d6' }} />
            {isLast ? (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1d1d1f' }}>{display}</span>
            ) : (
              <Link href={href} style={{ fontSize: 12.5, color: '#aeaeb2', textDecoration: 'none' }}>
                {display}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
