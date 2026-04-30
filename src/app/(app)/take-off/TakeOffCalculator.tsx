'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Loader2, Plus, Trash2, ChevronRight, AlertCircle, Info, ScanLine } from 'lucide-react'

interface Room {
  name: string
  section: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  sqft: number
}

function sqft(r: Room) {
  return parseFloat(((r.lengthFt + r.lengthIn / 12) * (r.widthFt + r.widthIn / 12)).toFixed(1))
}

function dimLabel(ft: number, inches: number) {
  return inches > 0 ? `${ft}' ${inches}"` : `${ft}'`
}

export default function TakeOffCalculator({ isPro }: { isPro: boolean }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [rooms, setRooms] = useState<Room[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wastePct, setWastePct] = useState(10)

  const totalRaw = rooms.reduce((s, r) => s + sqft(r), 0)
  const totalWithWaste = totalRaw * (1 + wastePct / 100)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setLoading(true)
    setError('')

    const allRooms: Room[] = []
    const allNotes: string[] = []
    const errors: string[] = []

    for (const file of files) {
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await fetch('/api/quotes/blueprint', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) {
          errors.push(`${file.name}: ${data.error || 'Analysis failed'}`)
          continue
        }
        const extracted: Room[] = (data.rooms || []).map((r: {
          name: string; section: string
          lengthFt: number; lengthIn: number
          widthFt: number; widthIn: number
        }) => ({
          name: r.name || '',
          section: r.section || 'Main Floor',
          lengthFt: r.lengthFt || 0,
          lengthIn: r.lengthIn || 0,
          widthFt: r.widthFt || 0,
          widthIn: r.widthIn || 0,
          sqft: 0,
        })).map((r: Room) => ({ ...r, sqft: sqft(r) }))
        allRooms.push(...extracted)
        if (data.notes) allNotes.push(data.notes)
      } catch {
        errors.push(`${file.name}: Failed to analyze`)
      }
    }

    if (errors.length) setError(errors.join(' · '))
    if (allRooms.length) {
      setRooms(prev => prev.length ? [...prev, ...allRooms] : allRooms)
      if (allNotes.length) setNotes(prev => [prev, ...allNotes].filter(Boolean).join('\n'))
    }

    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeRoom(idx: number) {
    setRooms(prev => prev.filter((_, i) => i !== idx))
  }

  function clearAll() {
    setRooms([])
    setNotes('')
    setError('')
  }

  function startEstimate() {
    if (!rooms.length) return
    sessionStorage.setItem('takeoff_rooms', JSON.stringify(rooms))
    router.push('/quotes/new')
  }

  const sections = Array.from(new Set(rooms.map(r => r.section)))
  const hasRooms = rooms.length > 0

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.1)' }}>
            <ScanLine className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Take-Off Calculator</h1>
            <p className="text-xs text-gray-400 mt-0.5">Upload a blueprint to extract room dimensions with AI</p>
          </div>
        </div>
        {hasRooms && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5 mt-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Upload zone */}
      {isPro ? (
        <>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <div
            onClick={() => !loading && fileRef.current?.click()}
            className="rounded-2xl transition-all"
            style={{
              border: '2px dashed',
              borderColor: loading ? 'var(--primary)' : '#d1d5db',
              background: loading ? 'rgba(13,148,136,0.03)' : 'white',
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                  <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Analyzing blueprint with AI</p>
                  <p className="text-xs text-gray-400 mt-1">Usually 10 to 20 seconds per image</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                  Reading room dimensions
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.08)' }}>
                  <Upload className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {hasRooms ? 'Upload another page' : 'Upload your blueprint or floor plan'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG, or HEIC — upload multiple images for multi-floor jobs
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-opacity"
                  style={{ background: 'var(--primary)' }}
                >
                  Choose file
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link
          href="/billing/setup"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 transition-colors hover:bg-gray-50"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.08)' }}>
            <ScanLine className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              AI Blueprint Take-Off
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}>Pro</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Upgrade to Pro to upload floor plans and extract room dimensions automatically</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        </Link>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 px-4 py-3.5 rounded-xl text-sm" style={{ border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Notes from image */}
      {notes && (
        <div className="flex items-start gap-2.5 bg-amber-50 text-amber-800 px-4 py-3.5 rounded-xl text-sm" style={{ border: '1px solid #fde68a' }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Notes from blueprint</p>
            <p className="text-xs leading-relaxed whitespace-pre-line">{notes}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {hasRooms && (
        <>
          {/* Waste factor selector */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Waste factor</p>
              <p className="text-xs text-gray-400 mt-0.5">Extra material ordered to cover cuts and waste</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 10, 15, 20].map(p => (
                <button
                  key={p}
                  onClick={() => setWastePct(p)}
                  className="text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  style={wastePct === p
                    ? { background: 'var(--primary)', color: 'white', boxShadow: '0 2px 8px rgba(13,148,136,0.3)' }
                    : { background: '#f3f4f6', color: '#6b7280' }
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Rooms grouped by section */}
          <div className="space-y-3">
            {sections.map(section => {
              const sectionRooms = rooms.filter(r => r.section === section)
              const sectionTotal = sectionRooms.reduce((s, r) => s + sqft(r), 0)
              return (
                <div key={section} className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  {/* Section header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50" style={{ background: '#fafafa' }}>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{section}</p>
                    <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--primary)' }}>{sectionTotal.toFixed(1)} sqft</p>
                  </div>
                  {/* Room rows */}
                  <div className="divide-y divide-gray-50">
                    {sectionRooms.map((room, idx) => {
                      const globalIdx = rooms.indexOf(room)
                      return (
                        <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-400" style={{ background: '#f3f4f6' }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{room.name || 'Room'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {dimLabel(room.lengthFt, room.lengthIn)} × {dimLabel(room.widthFt, room.widthIn)}
                            </p>
                          </div>
                          <p className="text-sm font-bold tabular-nums text-gray-900 shrink-0">{sqft(room).toFixed(1)} sqft</p>
                          <button
                            onClick={() => removeRoom(globalIdx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
            <div className="divide-y divide-white/10">
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-teal-100">Measured area</p>
                <p className="text-sm font-semibold text-white tabular-nums">{totalRaw.toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-teal-100">Waste ({wastePct}%)</p>
                <p className="text-sm font-semibold text-white tabular-nums">+{(totalWithWaste - totalRaw).toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-xs font-semibold text-teal-200 uppercase tracking-wider mb-0.5">Order quantity</p>
                  <p className="text-xs text-teal-200">Amount to order with waste included</p>
                </div>
                <p className="text-3xl font-extrabold text-white tabular-nums">{Math.ceil(totalWithWaste)}<span className="text-lg font-semibold text-teal-200 ml-1">sqft</span></p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startEstimate}
              className="flex-1 inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3.5 rounded-xl text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--button-dark)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              <Plus className="w-4 h-4" />
              Start Estimate with These Rooms
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading || !isPro}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-5 py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Add Another Floor
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !hasRooms && isPro && (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Upload a blueprint above and AI will extract every room.</p>
          <p className="text-xs text-gray-300 mt-1">You can also enter rooms manually when starting a new project.</p>
        </div>
      )}
    </div>
  )
}
