import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import { flooringTypeLabel, FLOORING_LABEL } from '@/lib/flooringLabels'

// Palette — mirrors src/components/QuoteDetailCard.tsx
const BAND_BG = '#1e293b'
const BAND_TEXT = '#ffffff'
const FRAME_BORDER_COLOR = '#cbd5e1'
const ROW_BORDER_COLOR = '#e2e8f0'
const BODY_COLOR = '#0f172a'
const MUTED_COLOR = '#475569'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: BODY_COLOR,
    paddingTop: 28,
    paddingBottom: 0,
    paddingLeft: 28,
    paddingRight: 28,
    backgroundColor: '#ffffff',
  },

  // ---- Top header (company info + stacked title) ----
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  companyBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logoImg: {
    width: 50,
    height: 50,
    marginRight: 10,
    objectFit: 'contain',
  },
  companyTextCol: {
    flex: 1,
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BODY_COLOR,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8.5,
    color: MUTED_COLOR,
    marginBottom: 1,
    lineHeight: 1.35,
  },
  companyLabel: {
    fontFamily: 'Helvetica-Bold',
    color: BAND_BG,
  },

  titleBlock: {
    width: 220,
    alignItems: 'flex-end',
  },
  titleFlooring: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: BAND_BG,
    lineHeight: 1,
  },
  titleEstimate: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: MUTED_COLOR,
    marginTop: 2,
    marginBottom: 8,
  },
  metaLineWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2,
    marginTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: ROW_BORDER_COLOR,
    width: '100%',
    gap: 4,
  },
  metaDiamond: {
    fontSize: 7,
    color: BAND_BG,
  },
  metaLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: BODY_COLOR,
  },
  metaValue: {
    fontSize: 9.5,
    color: MUTED_COLOR,
  },

  // ---- Customer / Project boxes ----
  boxesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  boxTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: BODY_COLOR,
    marginBottom: 6,
  },
  boxFieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  boxFieldLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: BODY_COLOR,
    width: 70,
    flexShrink: 0,
  },
  boxFieldValue: {
    fontSize: 8.5,
    color: '#334155',
    flex: 1,
    flexShrink: 1,
  },
  sectionTotalRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },

  // ---- Cost Breakdown label ----
  costBreakdownLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: BAND_BG,
    marginBottom: 4,
    marginTop: 2,
  },

  // ---- Items table ----
  itemsTable: {
    borderWidth: 1,
    borderColor: FRAME_BORDER_COLOR,
    borderRadius: 4,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BAND_BG,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  itemsHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: BAND_TEXT,
  },
  itemsRow: {
    flexDirection: 'row',
    paddingVertical: 5.5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_BORDER_COLOR,
  },
  itemsCell: {
    fontSize: 9,
    color: BODY_COLOR,
  },
  cellDescription: { width: '46%', paddingRight: 6 },
  cellQty: { width: '13%', textAlign: 'right' },
  cellUom: { width: '11%', textAlign: 'right' },
  cellRate: { width: '14%', textAlign: 'right' },
  cellTotal: { width: '16%', textAlign: 'right' },
  cellTotalBold: { fontFamily: 'Helvetica-Bold' },

  // ---- Signature row (inside items table) ----
  signatureRow: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_BORDER_COLOR,
  },
  signatureTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  signatureSub: {
    fontSize: 8.5,
    color: '#6b7280',
    marginBottom: 8,
  },
  signatureLineRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-end',
  },
  signaturePartFull: {
    flex: 1,
  },
  signaturePartShort: {
    width: 100,
  },
  signatureUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    height: 18,
    marginBottom: 2,
  },
  signatureSubLabel: {
    fontSize: 7,
    color: '#9ca3af',
  },

  // ---- Bottom row (scope + totals) ----
  bottomRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 14,
  },
  scopeCol: {
    flex: 1,
  },
  scopeText: {
    fontSize: 9,
    color: BODY_COLOR,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  paymentTermsText: {
    fontSize: 8,
    color: MUTED_COLOR,
    lineHeight: 1.4,
    marginTop: 4,
  },
  totalsCol: {
    width: 200,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  totalsLabel: {
    fontSize: 9.5,
    color: BODY_COLOR,
  },
  totalsValue: {
    fontSize: 9.5,
    color: BODY_COLOR,
  },
  totalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  totalLabelLg: {
    fontSize: 13,
    fontFamily: 'Helvetica-BoldOblique',
    color: BODY_COLOR,
  },
  totalValueBox: {
    borderWidth: 1,
    borderColor: FRAME_BORDER_COLOR,
    paddingVertical: 4,
    paddingHorizontal: 10,
    minWidth: 110,
  },
  totalValueText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BODY_COLOR,
    textAlign: 'right',
  },

  // ---- Inclusions / Exclusions / Qualifications ----
  ixqWrapper: {
    marginTop: 14,
  },
  ixqSection: {
    marginBottom: 8,
  },
  ixqLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#64748b',
    marginBottom: 3,
  },
  ixqText: {
    fontSize: 9,
    color: BODY_COLOR,
    lineHeight: 1.5,
  },

  // ---- Disclaimer terms ----
  disclaimerFooter: {
    marginTop: 12,
  },
  disclaimerLine: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    color: BODY_COLOR,
    lineHeight: 1.4,
  },

  // ---- Bottom contact bar (charcoal full-width) ----
  contactBar: {
    backgroundColor: BAND_BG,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginTop: 18,
    marginLeft: -28,
    marginRight: -28,
    marginBottom: 0,
  },
  contactBarText: {
    color: BAND_TEXT,
    textAlign: 'center',
    fontSize: 9,
  },
  contactBarBold: {
    fontFamily: 'Helvetica-Bold',
    color: BAND_TEXT,
  },
})

function fmtMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function fmtNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function fmtQty(value: number): string {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return new Intl.NumberFormat('en-US').format(rounded)
  }
  return fmtNumber(rounded, 2)
}

interface ItemRow {
  description: string
  qty?: string
  uom?: string
  rate?: string
  total?: string
}

interface QuotePdfDocumentProps {
  quote: Quote
  rooms: QuoteRoom[]
  lineItems?: QuoteLineItem[]
  settings: CompanySettings | null
}

export function QuotePdfDocument({
  quote: q,
  rooms,
  lineItems = [],
  settings,
}: QuotePdfDocumentProps) {
  // ---- Inputs (mirror QuoteDetailCard live computation) ----
  const wasteFactor = 1 + (Number(q.waste_pct) || 0) / 100
  const adjustedSqft = Number(q.adjusted_sqft) || 0
  const matRate = Number(q.material_cost_per_sqft) || 0
  const labRate = Number(q.labor_cost_per_sqft) || 0
  const stairCount = q.stair_count && q.stair_count > 0 ? q.stair_count : null
  const extrasJson = (q.extras_json ?? {}) as Record<string, number>

  const sectionPricing =
    (q as unknown as {
      section_pricing?: Record<string, { material: number; labor: number }> | null
    }).section_pricing ?? null
  const sectionKeys = sectionPricing ? Object.keys(sectionPricing) : []
  const roomsBySection: Record<string, number> = {}
  rooms.forEach((r) => {
    const key = r.section || 'Main Floor'
    roomsBySection[key] = (roomsBySection[key] ?? 0) + (Number(r.sqft) || 0)
  })
  const canRenderPerSection =
    sectionKeys.length > 1 && sectionKeys.every((k) => (roomsBySection[k] ?? 0) > 0)

  const flooringLabel =
    flooringTypeLabel(q.flooring_type, q.section_flooring_types) || 'flooring'
  const baseDesc = q.material_description?.trim()

  // ---- Build display rows ----
  const rows: ItemRow[] = []

  if (canRenderPerSection && sectionPricing) {
    sectionKeys.forEach((sectionName) => {
      const baseSqft = roomsBySection[sectionName] ?? 0
      const adjSqft = baseSqft * wasteFactor
      const sp = sectionPricing[sectionName] || { material: 0, labor: 0 }
      const sectionType = q.section_flooring_types?.[sectionName]
      const sectionLabel = sectionType
        ? FLOORING_LABEL[sectionType] || sectionType
        : flooringTypeLabel(q.flooring_type, q.section_flooring_types)
      const matDesc = baseDesc
        ? `${sectionName} — ${baseDesc}`
        : `${sectionName}: supply ${sectionLabel}`
      const sMat = Number(sp.material) || 0
      const sLab = Number(sp.labor) || 0
      rows.push({
        description: matDesc,
        qty: fmtQty(adjSqft),
        uom: 'SF',
        rate: fmtNumber(sMat, 2),
        total: fmtNumber(adjSqft * sMat, 2),
      })
      if (sLab > 0) {
        rows.push({
          description: `${sectionName}: labor / installation`,
          qty: fmtQty(adjSqft),
          uom: 'SF',
          rate: fmtNumber(sLab, 2),
          total: fmtNumber(adjSqft * sLab, 2),
        })
      }
    })
  } else if (adjustedSqft > 0) {
    rows.push({
      description: baseDesc || `Supply ${flooringLabel}`,
      qty: fmtQty(adjustedSqft),
      uom: 'SF',
      rate: fmtNumber(matRate, 2),
      total: fmtNumber(adjustedSqft * matRate, 2),
    })
    if (labRate > 0) {
      rows.push({
        description: 'Labor / installation',
        qty: fmtQty(adjustedSqft),
        uom: 'SF',
        rate: fmtNumber(labRate, 2),
        total: fmtNumber(adjustedSqft * labRate, 2),
      })
    }
  }

  // Custom line items
  lineItems.forEach((li) => {
    const liQty = Number(li.qty) || 0
    const liRate = Number(li.unit_price) || 0
    const liTotal = Number(li.total) || liQty * liRate
    rows.push({
      description: li.description?.trim() || '—',
      qty: liQty > 0 ? fmtQty(liQty) : '',
      uom: li.uom || 'SF',
      rate: fmtNumber(liRate, 2),
      total: fmtNumber(liTotal, 2),
    })
  })

  // Fixed fees
  if (q.removal_fee > 0) {
    rows.push({
      description: 'Removal of existing flooring',
      uom: 'LS',
      rate: fmtNumber(q.removal_fee, 2),
      total: fmtNumber(q.removal_fee, 2),
    })
  }
  if (q.furniture_fee > 0) {
    rows.push({
      description: 'Furniture moving',
      uom: 'LS',
      rate: fmtNumber(q.furniture_fee, 2),
      total: fmtNumber(q.furniture_fee, 2),
    })
  }
  if (q.stairs_fee > 0) {
    const perUnit = stairCount ? q.stairs_fee / stairCount : q.stairs_fee
    rows.push({
      description: stairCount ? `Stairs (${stairCount})` : 'Stairs',
      qty: stairCount ? String(stairCount) : '',
      uom: 'EA',
      rate: fmtNumber(perUnit, 2),
      total: fmtNumber(q.stairs_fee, 2),
    })
  }
  if (q.quarter_round_fee > 0) {
    rows.push({
      description: 'Quarter round / moldings',
      uom: 'LS',
      rate: fmtNumber(q.quarter_round_fee, 2),
      total: fmtNumber(q.quarter_round_fee, 2),
    })
  }
  if (q.reducers_fee > 0) {
    rows.push({
      description: 'Reducers / saddles',
      uom: 'LS',
      rate: fmtNumber(q.reducers_fee, 2),
      total: fmtNumber(q.reducers_fee, 2),
    })
  }
  if (q.delivery_fee > 0) {
    rows.push({
      description: 'Delivery',
      uom: 'LS',
      rate: fmtNumber(q.delivery_fee, 2),
      total: fmtNumber(q.delivery_fee, 2),
    })
  }
  if (q.custom_fee_amount > 0 && q.custom_fee_label?.trim()) {
    rows.push({
      description: q.custom_fee_label.trim(),
      uom: 'LS',
      rate: fmtNumber(q.custom_fee_amount, 2),
      total: fmtNumber(q.custom_fee_amount, 2),
    })
  }

  // extras_json
  if ((extrasJson.subfloor_prep ?? 0) > 0) {
    rows.push({
      description: 'Subfloor prep',
      uom: 'LS',
      rate: fmtNumber(extrasJson.subfloor_prep, 2),
      total: fmtNumber(extrasJson.subfloor_prep, 2),
    })
  }
  if ((extrasJson.underlayment_per_sqft ?? 0) > 0 && adjustedSqft > 0) {
    rows.push({
      description: 'Underlayment',
      qty: fmtQty(adjustedSqft),
      uom: 'SF',
      rate: fmtNumber(extrasJson.underlayment_per_sqft, 2),
      total: fmtNumber(extrasJson.underlayment_per_sqft * adjustedSqft, 2),
    })
  }
  if ((extrasJson.transition_qty ?? 0) > 0 && (extrasJson.transition_unit ?? 0) > 0) {
    rows.push({
      description: 'Transition strips',
      qty: fmtQty(extrasJson.transition_qty),
      uom: 'EA',
      rate: fmtNumber(extrasJson.transition_unit, 2),
      total: fmtNumber(extrasJson.transition_qty * extrasJson.transition_unit, 2),
    })
  }
  if ((extrasJson.floor_protection ?? 0) > 0) {
    rows.push({
      description: 'Floor protection',
      uom: 'LS',
      rate: fmtNumber(extrasJson.floor_protection, 2),
      total: fmtNumber(extrasJson.floor_protection, 2),
    })
  }
  if ((extrasJson.disposal_fee ?? 0) > 0) {
    rows.push({
      description: 'Disposal / dump fee',
      uom: 'LS',
      rate: fmtNumber(extrasJson.disposal_fee, 2),
      total: fmtNumber(extrasJson.disposal_fee, 2),
    })
  }

  // ---- Live totals (mirror QuoteDetailCard.tsx exactly) ----
  const liveFixedFees =
    (q.removal_fee || 0) +
    (q.furniture_fee || 0) +
    (q.stairs_fee || 0) +
    (q.quarter_round_fee || 0) +
    (q.reducers_fee || 0) +
    (q.delivery_fee || 0) +
    (q.custom_fee_amount || 0)
  const liveExtrasSum =
    (extrasJson.subfloor_prep ?? 0) +
    (extrasJson.floor_protection ?? 0) +
    (extrasJson.disposal_fee ?? 0) +
    (extrasJson.underlayment_per_sqft ?? 0) * adjustedSqft +
    (extrasJson.transition_qty ?? 0) * (extrasJson.transition_unit ?? 0)
  const lineItemsSum = lineItems.reduce(
    (s, li) =>
      s +
      (Number(li.total) || (Number(li.qty) || 0) * (Number(li.unit_price) || 0)),
    0
  )

  let displaySubtotal: number
  if (canRenderPerSection && sectionPricing) {
    const sectionMatLab = sectionKeys.reduce((sum, sectionName) => {
      const baseSqft = roomsBySection[sectionName] ?? 0
      const adjSqft = baseSqft * wasteFactor
      const sp = sectionPricing[sectionName] || { material: 0, labor: 0 }
      return (
        sum +
        adjSqft * (Number(sp.material) || 0) +
        adjSqft * (Number(sp.labor) || 0)
      )
    }, 0)
    displaySubtotal = sectionMatLab + liveFixedFees + liveExtrasSum + lineItemsSum
  } else {
    displaySubtotal =
      adjustedSqft * matRate +
      adjustedSqft * labRate +
      liveFixedFees +
      liveExtrasSum +
      lineItemsSum
  }

  const displayMarkup = q.markup_pct > 0 ? displaySubtotal * (q.markup_pct / 100) : 0
  const taxBase = displaySubtotal + displayMarkup
  const displayTax = q.tax_enabled ? taxBase * (q.tax_pct / 100) : 0
  const displayFinalTotal = displaySubtotal + displayMarkup + displayTax
  const displayDeposit =
    q.deposit_pct > 0 ? displayFinalTotal * (q.deposit_pct / 100) : 0
  const remainingBalance = displayFinalTotal - displayDeposit

  const showSubtotal = (q.tax_enabled && displayTax > 0) || displayMarkup > 0
  const showDeposit = q.deposit_pct > 0 && displayDeposit > 0

  const dateStr = new Date(q.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

  // Inclusions / Exclusions / Qualifications — fall back to company defaults
  const inclusions = (q.inclusions ?? settings?.default_inclusions ?? '').trim()
  const exclusions = (q.exclusions ?? settings?.default_exclusions ?? '').trim()
  const qualifications =
    (q.qualifications ?? settings?.default_qualifications ?? '').trim()

  const terms = [
    settings?.terms_validity?.trim(),
    settings?.terms_scheduling?.trim(),
    settings?.terms_scope?.trim(),
  ].filter((t): t is string => !!t && t.length > 0)

  // Address blocks
  const addrLine1 = [settings?.address_line1, settings?.address_line2]
    .filter(Boolean)
    .join(', ')
  const cityLine = [settings?.city, settings?.state, settings?.zip]
    .filter(Boolean)
    .join(', ')

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* ---- Top: company info (left) + stacked title (right) ---- */}
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {settings?.logo_url ? (
              <Image src={settings.logo_url} style={styles.logoImg} />
            ) : null}
            <View style={styles.companyTextCol}>
              <Text style={styles.companyName}>
                {settings?.company_name || 'Flooring Company'}
              </Text>
              {addrLine1 ? (
                <Text style={styles.companyDetail}>{addrLine1}</Text>
              ) : null}
              {cityLine ? (
                <Text style={styles.companyDetail}>{cityLine}</Text>
              ) : null}
              {settings?.phone ? (
                <Text style={styles.companyDetail}>
                  <Text style={styles.companyLabel}>Office: </Text>
                  {settings.phone}
                </Text>
              ) : null}
              {settings?.email ? (
                <Text style={styles.companyDetail}>
                  <Text style={styles.companyLabel}>Email: </Text>
                  {settings.email}
                </Text>
              ) : null}
              {settings?.website ? (
                <Text style={styles.companyDetail}>
                  <Text style={styles.companyLabel}>Web: </Text>
                  {settings.website}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.titleFlooring}>Flooring</Text>
            <Text style={styles.titleEstimate}>Estimate</Text>
            <View style={styles.metaLineWrapper}>
              <Text style={styles.metaDiamond}>◆</Text>
              <Text style={styles.metaLabel}>Estimate Date:</Text>
              <Text style={styles.metaValue}>{dateStr}</Text>
            </View>
            <View style={styles.metaLineWrapper}>
              <Text style={styles.metaDiamond}>◆</Text>
              <Text style={styles.metaLabel}>Estimate #:</Text>
              <Text style={styles.metaValue}>{q.quote_number || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ---- Customer / Project boxes ---- */}
        <View style={styles.boxesRow}>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Client Information:</Text>
            {q.customer_name ? (
              <View style={styles.boxFieldRow}>
                <Text style={styles.boxFieldLabel}>Name:</Text>
                <Text style={styles.boxFieldValue}>{q.customer_name}</Text>
              </View>
            ) : null}
            {q.job_address ? (
              <View style={styles.boxFieldRow}>
                <Text style={styles.boxFieldLabel}>Address:</Text>
                <Text style={styles.boxFieldValue}>{q.job_address}</Text>
              </View>
            ) : null}
            {q.customer_phone ? (
              <View style={styles.boxFieldRow}>
                <Text style={styles.boxFieldLabel}>Phone:</Text>
                <Text style={styles.boxFieldValue}>{q.customer_phone}</Text>
              </View>
            ) : null}
            {q.customer_email ? (
              <View style={styles.boxFieldRow}>
                <Text style={styles.boxFieldLabel}>Email:</Text>
                <Text style={styles.boxFieldValue}>{q.customer_email}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.box}>
            <Text style={styles.boxTitle}>Project Details:</Text>
            {canRenderPerSection && sectionPricing ? (
              <>
                {/* Total area (multi-section) */}
                <View style={styles.sectionTotalRow}>
                  <Text style={styles.boxFieldLabel}>Total Area:</Text>
                  <Text style={styles.boxFieldValue}>
                    {fmtQty(sectionKeys.reduce((s, k) => s + (roomsBySection[k] ?? 0) * wasteFactor, 0))} sqft
                  </Text>
                </View>
                {/* Per-section breakdown */}
                {sectionKeys.map((sec) => {
                  const secType = q.section_flooring_types?.[sec]
                  const secLabel = secType
                    ? FLOORING_LABEL[secType] || secType
                    : flooringLabel
                  const adjSqft = (roomsBySection[sec] ?? 0) * wasteFactor
                  return (
                    <View key={sec} style={styles.boxFieldRow}>
                      <Text style={styles.boxFieldLabel}>{sec}:</Text>
                      <Text style={styles.boxFieldValue}>{secLabel} — {fmtQty(adjSqft)} sqft</Text>
                    </View>
                  )
                })}
                {q.wood_species ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Wood Species:</Text>
                    <Text style={styles.boxFieldValue}>{q.wood_species}</Text>
                  </View>
                ) : null}
                {q.material_description ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Color / Style:</Text>
                    <Text style={styles.boxFieldValue}>{q.material_description}</Text>
                  </View>
                ) : null}
                {q.additional_details ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Notes:</Text>
                    <Text style={styles.boxFieldValue}>{q.additional_details}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                {q.flooring_type ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Flooring Type:</Text>
                    <Text style={styles.boxFieldValue}>{flooringLabel}</Text>
                  </View>
                ) : null}
                {adjustedSqft > 0 ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Area:</Text>
                    <Text style={styles.boxFieldValue}>{fmtQty(adjustedSqft)} sqft</Text>
                  </View>
                ) : null}
                {q.wood_species ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Wood Species:</Text>
                    <Text style={styles.boxFieldValue}>{q.wood_species}</Text>
                  </View>
                ) : null}
                {q.material_description ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Color / Style:</Text>
                    <Text style={styles.boxFieldValue}>{q.material_description}</Text>
                  </View>
                ) : null}
                {q.additional_details ? (
                  <View style={styles.boxFieldRow}>
                    <Text style={styles.boxFieldLabel}>Notes:</Text>
                    <Text style={styles.boxFieldValue}>{q.additional_details}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        {/* ---- Cost Breakdown table ---- */}
        <Text style={styles.costBreakdownLabel}>Cost Breakdown</Text>
        <View style={styles.itemsTable}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.itemsHeaderCell, styles.cellDescription]}>
              Item Description
            </Text>
            <Text style={[styles.itemsHeaderCell, styles.cellQty]}>Quantity</Text>
            <Text style={[styles.itemsHeaderCell, styles.cellUom]}>UoM</Text>
            <Text style={[styles.itemsHeaderCell, styles.cellRate]}>Unit Price</Text>
            <Text style={[styles.itemsHeaderCell, styles.cellTotal]}>Total</Text>
          </View>

          {rows.map((row, i) => (
            <View key={i} style={styles.itemsRow}>
              <Text style={[styles.itemsCell, styles.cellDescription]}>
                {row.description}
              </Text>
              <Text style={[styles.itemsCell, styles.cellQty]}>
                {row.qty ?? ''}
              </Text>
              <Text style={[styles.itemsCell, styles.cellUom]}>
                {row.uom ?? ''}
              </Text>
              <Text style={[styles.itemsCell, styles.cellRate]}>
                {row.rate ?? ''}
              </Text>
              <Text
                style={[styles.itemsCell, styles.cellTotal, styles.cellTotalBold]}
              >
                {row.total ?? ''}
              </Text>
            </View>
          ))}

          {/* Authorization + signature lines */}
          <View style={styles.signatureRow}>
            <Text style={styles.signatureTitle}>
              READ CAREFULLY SIGN &amp; EMAIL BACK
            </Text>
            <Text style={styles.signatureSub}>
              You are authorized to do work as is specified above.
            </Text>
            <View style={styles.signatureLineRow}>
              <View style={styles.signaturePartFull}>
                <View style={styles.signatureUnderline} />
                <Text style={styles.signatureSubLabel}>AUTHORIZED SIGNATURE</Text>
              </View>
              <View style={styles.signaturePartShort}>
                <View style={styles.signatureUnderline} />
                <Text style={styles.signatureSubLabel}>DATE</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ---- Bottom row: scope/notes + totals ---- */}
        <View style={styles.bottomRow}>
          <View style={styles.scopeCol}>
            {q.scope_of_work?.trim() ? (
              <Text style={styles.scopeText}>{q.scope_of_work.trim()}</Text>
            ) : null}
            {q.notes?.trim() ? (
              <Text style={styles.scopeText}>{q.notes.trim()}</Text>
            ) : null}
            {settings?.payment_terms?.trim() ? (
              <Text style={styles.paymentTermsText}>
                {settings.payment_terms.trim()}
              </Text>
            ) : null}
          </View>

          <View style={styles.totalsCol}>
            {showSubtotal ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{fmtMoney(displaySubtotal)}</Text>
              </View>
            ) : null}
            {q.tax_enabled && displayTax > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({q.tax_pct}%)</Text>
                <Text style={styles.totalsValue}>{fmtMoney(displayTax)}</Text>
              </View>
            ) : null}
            {displayMarkup > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Profit ({q.markup_pct}%)</Text>
                <Text style={styles.totalsValue}>{fmtMoney(displayMarkup)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRowBox}>
              <Text style={styles.totalLabelLg}>Total</Text>
              <View style={styles.totalValueBox}>
                <Text style={styles.totalValueText}>
                  {fmtMoney(displayFinalTotal)}
                </Text>
              </View>
            </View>

            {showDeposit ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    Deposit Due ({q.deposit_pct}%)
                  </Text>
                  <Text style={styles.totalsValue}>
                    {fmtMoney(displayDeposit)}
                  </Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Remaining Balance</Text>
                  <Text style={styles.totalsValue}>
                    {fmtMoney(remainingBalance)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* ---- Inclusions / Exclusions / Qualifications ---- */}
        {inclusions || exclusions || qualifications ? (
          <View style={styles.ixqWrapper}>
            {inclusions ? (
              <View style={styles.ixqSection}>
                <Text style={styles.ixqLabel}>INCLUSIONS</Text>
                <Text style={styles.ixqText}>{inclusions}</Text>
              </View>
            ) : null}
            {exclusions ? (
              <View style={styles.ixqSection}>
                <Text style={styles.ixqLabel}>EXCLUSIONS</Text>
                <Text style={styles.ixqText}>{exclusions}</Text>
              </View>
            ) : null}
            {qualifications ? (
              <View style={styles.ixqSection}>
                <Text style={styles.ixqLabel}>QUALIFICATIONS</Text>
                <Text style={styles.ixqText}>{qualifications}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ---- Disclaimer terms ---- */}
        {terms.length > 0 ? (
          <View style={styles.disclaimerFooter}>
            {terms.map((t, i) => (
              <Text key={i} style={styles.disclaimerLine}>
                {t}
              </Text>
            ))}
          </View>
        ) : null}

        {/* ---- Contact footer bar (charcoal full-width) ---- */}
        {settings?.email || settings?.phone ? (
          <View style={styles.contactBar}>
            <Text style={styles.contactBarText}>
              For any questions, contact:{' '}
              {settings?.email ? (
                <Text style={styles.contactBarBold}>{settings.email}</Text>
              ) : null}
              {settings?.email && settings?.phone ? ' or ' : null}
              {settings?.phone ? (
                <Text style={styles.contactBarBold}>{settings.phone}</Text>
              ) : null}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
