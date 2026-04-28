'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Invoice } from '@/lib/types'
import { FileText, Plus, Upload, Trash2, Square, CheckSquare } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-50 text-blue-600',
  paid: 'bg-green-50 text-green-600',
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function InvoicesClient({ initialInvoices }: { initialInvoices: Invoice[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialInvoices)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [working, setWorking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === items.length ? new Set() : new Set(items.map(i => i.id)))
  }

  function exitSelect() {
    setSelecting(false)
    setSelected(new Set())
  }

  async function bulkDelete() {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    ))
    setItems(prev => prev.filter(i => !selected.has(i.id)))
    exitSelect()
    setConfirmDelete(false)
    setWorking(false)
    router.refresh()
  }

  async function bulkSetStatus(status: 'sent' | 'paid') {
    setWorking(true)
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    ))
    setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, status } : i))
    exitSelect()
    setWorking(false)
  }

  const selCount = selected.size
  const allSelected = items.length > 0 && selCount === items.length

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Confirm bulk delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>
              Delete {selCount} invoice{selCount !== 1 ? 's' : ''}?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border font-semibold text-sm py-3 rounded-2xl"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                disabled={working}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-3 rounded-2xl disabled:opacity-50"
              >
                {working ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Track and manage your invoices</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {items.length > 0 && (
            <button
              onClick={() => selecting ? exitSelect() : setSelecting(true)}
              className={`text-sm font-semibold px-3.5 py-2.5 rounded-2xl border transition-colors ${
                selecting
                  ? 'bg-gray-100 border-gray-300 text-gray-700'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {selecting ? 'Cancel' : 'Select'}
            </button>
          )}
          <Link
            href="/invoices/new?tab=upload"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-3.5 py-2.5 rounded-2xl text-sm hover:bg-gray-50 transition-colors active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </Link>
          <Link
            href="/invoices/new"
            className="flex items-center gap-2 text-white font-semibold px-4 py-2.5 rounded-2xl text-sm active:scale-95"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </Link>
        </div>
      </div>

      {/* Select-all bar */}
      {selecting && items.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white" style={{ border: '1px solid var(--border)' }}>
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            {allSelected
              ? <CheckSquare className="w-5 h-5 text-violet-600" />
              : <Square className="w-5 h-5 text-gray-400" />
            }
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selCount > 0 && (
            <span className="text-sm text-gray-400">{selCount} selected</span>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
            <FileText className="w-7 h-7" style={{ color: 'var(--primary)' }} />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No invoices yet</p>
          <p className="text-sm text-gray-400 mb-5">Create your first invoice or upload an existing one.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
            <Link
              href="/invoices/new?tab=upload"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 font-semibold px-5 py-2.5 rounded-2xl text-sm hover:bg-gray-50"
            >
              <Upload className="w-4 h-4" /> Upload PDF
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map(inv => {
            const isSelected = selected.has(inv.id)
            const row = (
              <div
                key={inv.id}
                className={`flex items-center gap-4 bg-white rounded-2xl px-4 sm:px-5 py-4 transition-all`}
                style={{
                  border: `1px solid ${isSelected ? '#A78BFA' : 'var(--border)'}`,
                  boxShadow: isSelected ? '0 0 0 2px #DDD6FE' : 'var(--shadow-card)',
                }}
              >
                {selecting && (
                  <button onClick={() => toggleSelect(inv.id)} className="flex-shrink-0 p-0.5">
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-violet-600" />
                      : <Square className="w-5 h-5 text-gray-300" />
                    }
                  </button>
                )}

                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                </div>

                {selecting ? (
                  <button onClick={() => toggleSelect(inv.id)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{inv.customer_name}</p>
                      {inv.invoice_number && <span className="text-xs text-gray-400">#{inv.invoice_number}</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {inv.job_address && ` · ${inv.job_address}`}
                    </p>
                  </button>
                ) : (
                  <Link href={`/invoices/${inv.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{inv.customer_name}</p>
                      {inv.invoice_number && <span className="text-xs text-gray-400">#{inv.invoice_number}</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                      {new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {inv.job_address && ` · ${inv.job_address}`}
                    </p>
                  </Link>
                )}

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[inv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {inv.status}
                  </span>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{fmt(inv.total)}</p>
                </div>
              </div>
            )
            return row
          })}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selecting && selCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl" style={{ background: '#1c1c1e', minWidth: 300 }}>
          <span className="text-white text-sm font-semibold">{selCount} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => bulkSetStatus('sent')}
            disabled={working}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            Mark Sent
          </button>
          <button
            onClick={() => bulkSetStatus('paid')}
            disabled={working}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            Mark Paid
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={working}
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
