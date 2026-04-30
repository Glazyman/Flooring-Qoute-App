'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, Check, X, Sparkles, Image as ImageIcon, ChevronDown } from 'lucide-react'

export interface RawRoom {
  name: string
  section: string
  lengthFt: number
  lengthIn: number
  widthFt: number
  widthIn: number
  sqft: number
}

type PageStatus = 'idle' | 'analyzing' | 'analyzed' | 'skipped' | 'error'

interface PageEntry {
  id: string
  file: File
  label: string
  thumbUrl: string
  selected: boolean
  status: PageStatus
  roomCount: number
  pageType?: string
  errorMsg?: string
}

interface Props {
  onRoomsExtracted: (rooms: RawRoom[], notes: string) => void
  /** Compact styling for inline form use; full for standalone page */
  compact?: boolean
  disabled?: boolean
}

async function pdfToPageEntries(file: File): Promise<PageEntry[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const entries: PageEntry[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)

    // Full-res for analysis
    const fullVp = page.getViewport({ scale: 2 })
    const fullCanvas = document.createElement('canvas')
    fullCanvas.width = fullVp.width
    fullCanvas.height = fullVp.height
    await page.render({ canvasContext: fullCanvas.getContext('2d')! as unknown as Parameters<typeof page.render>[0]['canvasContext'], viewport: fullVp }).promise
    const fullBlob = await new Promise<Blob>(r => fullCanvas.toBlob(b => r(b!), 'image/jpeg', 0.85))
    const analysisFile = new File([fullBlob], `${file.name}-page${i}.jpg`, { type: 'image/jpeg' })

    // Thumbnail
    const thumbVp = page.getViewport({ scale: 0.35 })
    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = thumbVp.width
    thumbCanvas.height = thumbVp.height
    await page.render({ canvasContext: thumbCanvas.getContext('2d')! as unknown as Parameters<typeof page.render>[0]['canvasContext'], viewport: thumbVp }).promise
    const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.7)

    entries.push({ id: crypto.randomUUID(), file: analysisFile, label: `Page ${i}`, thumbUrl, selected: true, status: 'idle', roomCount: 0 })
  }
  return entries
}

async function analyzeImageFile(file: File): Promise<{ rooms: RawRoom[]; notes: string; skipped?: string; error?: string }> {
  const fd = new FormData()
  fd.append('image', file)
  try {
    const res = await fetch('/api/quotes/blueprint', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) return { rooms: [], notes: '', error: data.error || 'Analysis failed' }
    if (data.isFlooringPage === false) return { rooms: [], notes: '', skipped: data.pageType || 'Not a flooring page' }
    const rooms: RawRoom[] = (data.rooms || []).map((r: RawRoom) => ({
      name: r.name || '', section: r.section || 'Main Floor',
      lengthFt: r.lengthFt || 0, lengthIn: r.lengthIn || 0,
      widthFt: r.widthFt || 0, widthIn: r.widthIn || 0,
      sqft: parseFloat(((r.lengthFt + r.lengthIn / 12) * (r.widthFt + r.widthIn / 12)).toFixed(1)),
    }))
    return { rooms, notes: data.notes || '' }
  } catch {
    return { rooms: [], notes: '', error: 'Failed to analyze' }
  }
}

export default function BlueprintPagePicker({ onRoomsExtracted, compact = false, disabled = false }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pages, setPages] = useState<PageEntry[]>([])
  const [pdfName, setPdfName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const selectedCount = pages.filter(p => p.selected).length
  const busy = extracting || analyzing

  function togglePage(id: string) {
    setPages(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p))
  }
  function selectAll(val: boolean) {
    setPages(prev => prev.map(p => ({ ...p, selected: val })))
  }
  function selectUnanalyzed() {
    setPages(prev => prev.map(p => ({ ...p, selected: p.status === 'idle' || p.status === 'error' })))
  }
  function clearPicker() {
    setPages([])
    setPdfName('')
    setError('')
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFiles = Array.from(e.target.files || [])
    if (!rawFiles.length) return
    setError('')
    if (fileRef.current) fileRef.current.value = ''

    const pdfs = rawFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    const images = rawFiles.filter(f => !pdfs.includes(f))

    // Plain images — analyze immediately, no picker
    if (pdfs.length === 0) {
      setAnalyzing(true)
      const allRooms: RawRoom[] = []
      const allNotes: string[] = []
      const errs: string[] = []
      for (const img of images) {
        const { rooms, notes, error: err, skipped } = await analyzeImageFile(img)
        if (err) errs.push(`${img.name}: ${err}`)
        if (skipped) errs.push(`${img.name}: Skipped (${skipped})`)
        allRooms.push(...rooms)
        if (notes) allNotes.push(notes)
      }
      if (errs.length) setError(errs.join(' · '))
      if (allRooms.length) onRoomsExtracted(allRooms, allNotes.join('\n'))
      setAnalyzing(false)
      return
    }

    // PDF — extract pages and show picker
    setExtracting(true)
    setPages([])
    setPdfName(pdfs.map(p => p.name).join(', '))
    const allEntries: PageEntry[] = []
    for (const pdf of pdfs) {
      try {
        const entries = await pdfToPageEntries(pdf)
        allEntries.push(...entries)
      } catch (err) {
        setError(`${pdf.name}: Could not read PDF — ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }
    setPages(allEntries)
    setExtracting(false)

    // Also handle any images that came alongside
    if (images.length) {
      setAnalyzing(true)
      const allRooms: RawRoom[] = []
      const allNotes: string[] = []
      for (const img of images) {
        const { rooms, notes } = await analyzeImageFile(img)
        allRooms.push(...rooms)
        if (notes) allNotes.push(notes)
      }
      if (allRooms.length) onRoomsExtracted(allRooms, allNotes.join('\n'))
      setAnalyzing(false)
    }
  }

  async function analyzeSelected() {
    const toRun = pages.filter(p => p.selected)
    if (!toRun.length) return
    setAnalyzing(true)
    setError('')
    setPages(prev => prev.map(p => p.selected ? { ...p, status: 'analyzing' } : p))

    const skipped: string[] = []
    const errs: string[] = []

    for (const p of toRun) {
      const { rooms, notes, error: err, skipped: skip } = await analyzeImageFile(p.file)
      if (err) {
        errs.push(`${p.label}: ${err}`)
        setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'error', errorMsg: err, roomCount: 0 } : x))
        continue
      }
      if (skip) {
        skipped.push(`${p.label} (${skip})`)
        setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'skipped', pageType: skip, roomCount: 0 } : x))
        continue
      }
      setPages(prev => prev.map(x => x.id === p.id ? { ...x, status: 'analyzed', roomCount: rooms.length } : x))
      if (rooms.length) onRoomsExtracted(rooms, notes)
    }

    const msgs: string[] = []
    if (errs.length) msgs.push(errs.join(' · '))
    if (skipped.length) msgs.push(`Skipped: ${skipped.join(', ')}`)
    if (msgs.length) setError(msgs.join(' · '))
    setAnalyzing(false)
    setCollapsed(true)
  }

  const statusBadge = (p: PageEntry) => {
    if (p.status === 'analyzing') return { label: '…', color: 'var(--primary)', bg: 'rgba(13,148,136,0.12)' }
    if (p.status === 'analyzed') return { label: `${p.roomCount}rm`, color: '#16a34a', bg: 'rgba(22,163,74,0.1)' }
    if (p.status === 'skipped') return { label: 'Skip', color: '#a16207', bg: 'rgba(161,98,7,0.09)' }
    if (p.status === 'error') return { label: 'Err', color: '#dc2626', bg: 'rgba(220,38,38,0.09)' }
    return null
  }

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple className="hidden" onChange={handleFileChange} />

      {/* Upload button / zone */}
      {pages.length === 0 && (
        <div
          onClick={() => !busy && !disabled && fileRef.current?.click()}
          className="rounded-xl transition-all"
          style={{
            border: '2px dashed',
            borderColor: busy ? 'var(--primary)' : '#e5e7eb',
            background: busy ? 'rgba(13,148,136,0.03)' : 'transparent',
            cursor: busy || disabled ? 'default' : 'pointer',
          }}
        >
          {busy ? (
            <div className={`flex flex-col items-center gap-2.5 text-center ${compact ? 'py-6 px-4' : 'py-10 px-6'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(13,148,136,0.1)' }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{extracting ? 'Reading PDF pages…' : 'Analyzing…'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{extracting ? 'Generating page previews' : 'Usually 10–20 seconds per page'}</p>
              </div>
              {!extracting && (
                <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ color: 'var(--primary)', background: 'rgba(13,148,136,0.08)' }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
                  Reading room dimensions
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => !disabled && fileRef.current?.click()}
              className={`flex flex-col items-center gap-2.5 w-full hover:bg-gray-50 rounded-xl transition-colors ${compact ? 'py-5 px-4' : 'py-8 px-6'}`}
            >
              <div className={`${compact ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl flex items-center justify-center`} style={{ background: 'rgba(13,148,136,0.08)' }}>
                <Upload className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className={`${compact ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>Upload blueprint or floor plan</p>
                <p className="text-xs mt-0.5 text-gray-400">JPG, PNG, HEIC, or PDF — pick pages to analyze</p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /></button>
        </div>
      )}

      {/* Page picker card */}
      {pages.length > 0 && (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* Header */}
          <button
            type="button"
            onClick={() => setCollapsed(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50/60 hover:bg-gray-100/60 transition-colors"
            style={{ borderBottom: collapsed ? 'none' : '1px solid #f3f4f6' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(13,148,136,0.08)' }}>
                <ImageIcon className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-gray-800">
                  {pages.length} pages
                  {pages.some(p => p.status !== 'idle') && (
                    <span className="ml-1.5 font-normal text-gray-400">
                      · {pages.filter(p => p.status === 'analyzed').length} analyzed
                      {pages.filter(p => p.status === 'skipped').length > 0 && `, ${pages.filter(p => p.status === 'skipped').length} skipped`}
                    </span>
                  )}
                  {pdfName && <span className="ml-1.5 truncate text-gray-400 font-normal">{pdfName}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-white transition-colors"
              >
                Replace
              </button>
              <button type="button" onClick={clearPicker} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="p-1.5 rounded-md text-gray-400">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
              </div>
            </div>
          </button>

          {/* Collapsible body */}
          {!collapsed && <>

          {/* Quick select bar */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100">
            <span className="text-[11px] font-semibold text-gray-400 mr-1">SELECT</span>
            {(['All', 'None', 'Unanalyzed'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => opt === 'All' ? selectAll(true) : opt === 'None' ? selectAll(false) : selectUnanalyzed()}
                className="text-[11px] font-medium text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                {opt}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-gray-400">{selectedCount} / {pages.length}</span>
          </div>

          {/* Thumbnail grid */}
          <div className={`p-2.5 grid gap-2 ${compact ? 'grid-cols-3 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'}`}>
            {pages.map(p => {
              const badge = statusBadge(p)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePage(p.id)}
                  className="relative rounded-lg border-2 overflow-hidden transition-all hover:shadow-sm text-left"
                  style={{
                    borderColor: p.selected ? 'var(--primary)' : '#e5e7eb',
                    background: p.selected ? 'rgba(13,148,136,0.02)' : 'white',
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative bg-gray-50 overflow-hidden" style={{ aspectRatio: '3/4' }}>
                    <img src={p.thumbUrl} alt={p.label} className="w-full h-full object-contain" />
                    {/* Checkbox */}
                    <div
                      className="absolute top-1.5 left-1.5 w-4 h-4 rounded flex items-center justify-center"
                      style={{
                        background: p.selected ? 'var(--primary)' : 'rgba(255,255,255,0.9)',
                        border: `1.5px solid ${p.selected ? 'var(--primary)' : '#d1d5db'}`,
                      }}
                    >
                      {p.selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    {/* Analyzing overlay */}
                    {p.status === 'analyzing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
                      </div>
                    )}
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                    <span className="text-[10px] font-semibold text-gray-600">{p.label}</span>
                    {badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: badge.color, background: badge.bg }}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Action footer */}
          <div className="flex items-center gap-3 px-3 py-2.5 border-t border-gray-100 bg-gray-50/60">
            <button
              type="button"
              onClick={analyzeSelected}
              disabled={analyzing || selectedCount === 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--primary)' }}
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {analyzing ? 'Analyzing…' : `Analyze ${selectedCount} page${selectedCount !== 1 ? 's' : ''}`}
            </button>
            {pages.some(p => p.status !== 'idle') && (
              <span className="text-[11px] text-gray-400 ml-auto">
                ✓ {pages.filter(p => p.status === 'analyzed').length} · ↷ {pages.filter(p => p.status === 'skipped').length} skipped
              </span>
            )}
          </div>

          </>}
        </div>
      )}
    </div>
  )
}
