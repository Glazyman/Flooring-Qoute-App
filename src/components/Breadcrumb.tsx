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
    <nav className="flex items-center gap-1.5 text-sm">
      <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition-colors">
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
            <ChevronRight className="w-3 h-3 text-gray-300" />
            {isLast ? (
              <span className="text-gray-700 font-medium">{display}</span>
            ) : (
              <Link href={href} className="text-gray-400 hover:text-gray-700 transition-colors">
                {display}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
