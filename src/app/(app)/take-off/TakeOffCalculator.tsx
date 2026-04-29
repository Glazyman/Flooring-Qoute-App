'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, Loader2, Plus, Trash2, ChevronRight, AlertCircle, Info } from 'lucide-react'

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

  // Group by section
  const sections = Array.from(new Set(rooms.map(r => r.section)))

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Take-Off Calculator</h1>
          <p className="text-xs text-gray-400 mt-0.5">Upload a blueprint or floor plan to extract room dimensions with AI</p>
        </div>
        {rooms.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Upload zone */}
      {isPro ? (
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center transition-colors hover:bg-gray-50 cursor-pointer"
          style={{ borderColor: '#e5e7eb' }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              <p className="text-sm font-medium text-gray-700">Analyzing blueprint with AI</p>
              <p className="text-xs text-gray-400">This usually takes 10 to 20 seconds per image</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {rooms.length > 0 ? 'Upload more pages' : 'Upload blueprint or measurement sheet'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, or HEIC. Upload multiple images for multi-floor jobs.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/billing/setup"
          className="flex items-center gap-4 border rounded-xl p-5 transition-colors hover:bg-gray-50"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.08)' }}>
            <Upload className="w-5 h-5" style={{ color: 'var(--primary)' }} />
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
        <div className="flex items-start gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm" style={{ border: '1px solid #fecaca' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Notes from image */}
      {notes && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 px-4 py-3 rounded-xl text-sm" style={{ border: '1px solid #fde68a' }}>
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Notes from blueprint</p>
            <p className="text-xs leading-relaxed whitespace-pre-line">{notes}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {rooms.length > 0 && (
        <>
          {/* Waste factor */}
          <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <p className="text-sm font-medium text-gray-700 flex-1">Waste factor</p>
            <div className="flex items-center gap-2">
              {[5, 10, 15, 20].map(p => (
                <button
                  key={p}
                  onClick={() => setWastePct(p)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={wastePct === p
                    ? { background: 'var(--primary)', color: 'white' }
                    : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Rooms by section */}
          <div className="space-y-4">
            {sections.map(section => {
              const sectionRooms = rooms.filter(r => r.section === section)
              const sectionTotal = sectionRooms.reduce((s, r) => s + sqft(r), 0)
              return (
                <div key={section} className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">{section}</p>
                    <p className="text-xs font-semibold text-gray-500">{sectionTotal.toFixed(1)} sqft</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {sectionRooms.map((room, idx) => {
                      const globalIdx = rooms.indexOf(room)
                      return (
                        <div key={idx} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {room.name || 'Room'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {dimLabel(room.lengthFt, room.lengthIn)} × {dimLabel(room.widthFt, room.widthIn)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 tabular-nums shrink-0">
                            {sqft(room).toFixed(1)} sqft
                          </p>
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
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-500">Total area (no waste)</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">{totalRaw.toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-sm text-gray-500">Waste factor ({wastePct}%)</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">+{(totalWithWaste - totalRaw).toFixed(1)} sqft</p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <p className="text-sm font-bold text-gray-900">Order quantity</p>
                <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--primary)' }}>
                  {Math.ceil(totalWithWaste)} sqft
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={startEstimate}
              className="flex-1 inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-opacity hover:opacity-90"
              style={{ background: 'var(--button-dark)' }}
            >
              <Plus className="w-4 h-4" />
              Start Estimate with These Rooms
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading || !isPro}
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium px-5 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              Add Another Floor
            </button>
          </div>
        </>
      )}

      {/* Empty state hint when no rooms and not loading */}
      {!loading && rooms.length === 0 && isPro && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Upload a blueprint above to get started.</p>
          <p className="text-xs mt-1">You can also enter rooms manually in a new project.</p>
        </div>
      )}
    </div>
  )
}
