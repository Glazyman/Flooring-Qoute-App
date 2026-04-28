import type { FlooringType } from './types'

export const FLOORING_LABEL: Record<string, string> = {
  hardwood: 'Hardwood',
  unfinished: 'Unfinished',
  prefinished: 'Pre-Finished',
  engineered: 'Engineered',
  prefinished_engineered: 'Pre-Finished Engineered',
  unfinished_engineered: 'Unfinished Engineered',
  vinyl: 'Vinyl / LVT',
  tile: 'Tile',
  carpet: 'Carpet',
  laminate: 'Laminate',
}

const HARDWOOD_FAMILY = new Set([
  'hardwood',
  'unfinished',
  'prefinished',
  'engineered',
  'prefinished_engineered',
  'unfinished_engineered',
])

function shortLabel(type: string): string {
  if (HARDWOOD_FAMILY.has(type)) return 'Hardwood'
  if (type === 'vinyl') return 'LVT'
  return FLOORING_LABEL[type] || (type.charAt(0).toUpperCase() + type.slice(1))
}

/**
 * Derive a human-readable flooring label for a quote.
 * - If multiple distinct types are used across sections, joins them ("Hardwood + LVT").
 * - Otherwise returns the single section type.
 * - Falls back to the legacy `flooring_type` column.
 */
export function flooringTypeLabel(
  flooringType: FlooringType | string | null | undefined,
  sectionFlooringTypes?: Record<string, string> | null
): string {
  if (sectionFlooringTypes && Object.keys(sectionFlooringTypes).length > 0) {
    const typesUsed = Array.from(new Set(Object.values(sectionFlooringTypes).map(shortLabel)))
    if (typesUsed.length > 0) return typesUsed.join(' + ')
  }
  if (!flooringType) return ''
  return FLOORING_LABEL[flooringType] || (String(flooringType).charAt(0).toUpperCase() + String(flooringType).slice(1))
}
