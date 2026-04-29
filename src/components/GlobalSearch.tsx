'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface QuoteResult {
  id: string
  customer_name: string
  estimate_number: number
  job_address: string | null
  status: string
  created_at: string
}

interface ContactResult {
  id: string
  name: string
  phone: string | null
  email: string | null
  company: string | null
}

interface SearchResults {
  quotes: QuoteResult[]
  contacts: ContactResult[]
}

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data: SearchResults = await res.json()
        setResults(data)
        setOpen(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleNavigate = (path: string) => {
    setOpen(false)
    setQuery('')
    setResults(null)
    router.push(path)
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const hasResults = results && (results.quotes.length > 0 || results.contacts.length > 0)
  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(120,120,128,0.08)', borderRadius: 10,
          padding: '6px 12px', width: 200,
        }}
      >
        <Search size={13} color="#aeaeb2" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results && query.trim()) setOpen(true) }}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: '#1d1d1f', flex: 1, minWidth: 0,
          }}
        />
      </div>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            minWidth: 280,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          {loading && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#8a8a8e' }}>
              Searching…
            </div>
          )}

          {!loading && !hasResults && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: '#8a8a8e' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && results && results.quotes.length > 0 && (
            <>
              <div
                style={{
                  padding: '6px 12px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#8a8a8e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                Estimates
              </div>
              {results.quotes.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() => handleNavigate(`/quotes/${quote.id}`)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', cursor: 'pointer',
                    background: 'transparent', border: 'none',
                    fontSize: 13, color: '#1d1d1f',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 500 }}>{quote.customer_name}</span>
                  {quote.estimate_number && (
                    <span style={{ color: '#8a8a8e', marginLeft: 6 }}>
                      #{quote.estimate_number}
                    </span>
                  )}
                  {quote.job_address && (
                    <div style={{ fontSize: 11, color: '#8a8a8e', marginTop: 1 }}>
                      {quote.job_address}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}

          {!loading && results && results.contacts.length > 0 && (
            <>
              <div
                style={{
                  padding: '6px 12px 4px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#8a8a8e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid #f1f5f9',
                  borderTop: results.quotes.length > 0 ? '1px solid #f1f5f9' : undefined,
                  marginTop: results.quotes.length > 0 ? 4 : 0,
                }}
              >
                Contacts
              </div>
              {results.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleNavigate('/contacts')}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', cursor: 'pointer',
                    background: 'transparent', border: 'none',
                    fontSize: 13, color: '#1d1d1f',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 500 }}>{contact.name}</span>
                  {contact.company && (
                    <span style={{ color: '#8a8a8e', marginLeft: 6, fontSize: 12 }}>
                      {contact.company}
                    </span>
                  )}
                  {(contact.email || contact.phone) && (
                    <div style={{ fontSize: 11, color: '#8a8a8e', marginTop: 1 }}>
                      {contact.email ?? contact.phone}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
