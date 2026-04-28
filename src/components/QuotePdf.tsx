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

const BORDER = '#0f172a'
const BAND = '#94a3b8'
const ROW_BORDER = '#e2e8f0'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    padding: 28,
    backgroundColor: '#ffffff',
  },

  // Top header row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  companyBlock: {
    width: '48%',
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    flexDirection: 'row',
  },
  companyTextCol: {
    flex: 1,
  },
  logoImg: {
    width: 44,
    height: 44,
    marginRight: 10,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8.5,
    color: '#334155',
    marginBottom: 1.5,
  },
  estimateBlock: {
    width: '48%',
    alignItems: 'flex-end',
  },
  estimateTitle: {
    fontSize: 26,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#0f172a',
    marginBottom: 6,
  },
  metaTable: {
    width: 200,
    borderWidth: 1,
    borderColor: BORDER,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaCell: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 9.5,
    textAlign: 'center',
  },
  metaCellLabel: {
    backgroundColor: '#f1f5f9',
  },
  metaCellDivider: {
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  metaCellBottomDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  // Customer / Job boxes
  boxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
  },
  boxHeader: {
    backgroundColor: BAND,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  boxHeaderText: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 10,
    color: '#0f172a',
    textAlign: 'center',
  },
  boxBody: {
    padding: 8,
    minHeight: 64,
  },
  boxBodyText: {
    fontSize: 10,
    color: '#0f172a',
    marginBottom: 2,
  },

  // Items table
  itemsTable: {
    marginBottom: 4,
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BAND,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  itemsHeaderCell: {
    fontFamily: 'Helvetica-BoldOblique',
    fontSize: 10,
    color: '#0f172a',
  },
  itemsRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_BORDER,
  },
  itemsCell: {
    fontSize: 9.5,
    color: '#0f172a',
  },
  cellDescription: {
    flex: 5,
    paddingRight: 8,
  },
  cellQty: {
    flex: 1,
    textAlign: 'right',
  },
  cellRate: {
    flex: 1,
    textAlign: 'right',
  },
  cellTotal: {
    flex: 1,
    textAlign: 'right',
  },
  cellHeaderQty: {
    flex: 1,
    textAlign: 'center',
  },
  cellHeaderRate: {
    flex: 1,
    textAlign: 'center',
  },
  cellHeaderTotal: {
    flex: 1,
    textAlign: 'center',
  },

  // Bottom row (scope + totals)
  bottomRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 16,
  },
  scopeCol: {
    flex: 1,
  },
  scopeText: {
    fontSize: 9.5,
    color: '#0f172a',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  paymentTermsText: {
    fontSize: 8.5,
    color: '#475569',
    lineHeight: 1.35,
    marginTop: 4,
  },
  totalsCol: {
    width: 240,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  totalsLabel: {
    fontSize: 9.5,
    color: '#0f172a',
  },
  totalsValue: {
    fontSize: 9.5,
    color: '#0f172a',
  },
  totalRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  totalLabelLg: {
    fontSize: 14,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#0f172a',
  },
  totalValueBox: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 10,
    minWidth: 110,
  },
  totalValueText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right',
  },

  // Disclaimer footer
  disclaimerFooter: {
    marginTop: 22,
  },
  disclaimerLine: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Oblique',
    color: '#0f172a',
    lineHeight: 1.4,
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
  // Render qty without decimals if integer-valued, else 2 decimals.
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return new Intl.NumberFormat('en-US').format(rounded)
  }
  return fmtNumber(rounded, 2)
}

function fallbackDescription(q: Quote): string {
  const label = flooringTypeLabel(q.flooring_type, q.section_flooring_types) || 'flooring'
  return `Install and supply ${label}`
}

interface ItemRow {
  description: string
  qty?: string
  rate?: string
  total?: string
  isSignature?: boolean
}

interface QuotePdfDocumentProps {
  quote: Quote
  rooms: QuoteRoom[]
  lineItems?: QuoteLineItem[]
  settings: CompanySettings | null
}

export function QuotePdfDocument({ quote: q, rooms, lineItems = [], settings }: QuotePdfDocumentProps) {
  const remainingBalance = q.final_total - q.deposit_amount
  const terms = [
    settings?.terms_validity?.trim(),
    settings?.terms_scheduling?.trim(),
    settings?.terms_scope?.trim(),
  ].filter((t): t is string => !!t && t.length > 0)

  const sectionPricing =
    (q as unknown as {
      section_pricing?: Record<string, { material: number; labor: number }> | null
    }).section_pricing ?? null

  const rows: ItemRow[] = []

  // Main flooring row(s).
  // If multiple sections with per-section pricing exist and we can compute
  // per-section sqft from rooms, render one row per section. Otherwise the
  // single combined row (skipped when adjusted_sqft is 0).
  const sectionKeys = sectionPricing ? Object.keys(sectionPricing) : []
  const roomsBySection: Record<string, number> = {}
  rooms.forEach((r) => {
    const key = r.section || 'Main Floor'
    roomsBySection[key] = (roomsBySection[key] ?? 0) + (Number(r.sqft) || 0)
  })

  const canRenderPerSection =
    sectionKeys.length > 1 &&
    sectionKeys.every((k) => (roomsBySection[k] ?? 0) > 0)

  if (canRenderPerSection && sectionPricing) {
    const wasteFactor = 1 + (Number(q.waste_pct) || 0) / 100
    sectionKeys.forEach((sectionName) => {
      const baseSqft = roomsBySection[sectionName] ?? 0
      const adjSqft = baseSqft * wasteFactor
      const sp = sectionPricing[sectionName] || { material: 0, labor: 0 }
      const matRate = Number(sp.material) || 0
      const labRate = Number(sp.labor) || 0
      const sectionType = q.section_flooring_types?.[sectionName]
      const sectionLabel = sectionType
        ? FLOORING_LABEL[sectionType] || sectionType
        : flooringTypeLabel(q.flooring_type, q.section_flooring_types)
      const baseDesc = q.material_description?.trim()
      // Material row
      rows.push({
        description: baseDesc
          ? `${sectionName} — ${baseDesc}`
          : `${sectionName}: supply ${sectionLabel}`,
        qty: fmtQty(adjSqft),
        rate: fmtNumber(matRate, 2),
        total: fmtNumber(adjSqft * matRate, 2),
      })
      // Labor row
      if (labRate > 0) {
        rows.push({
          description: `${sectionName}: labor / installation`,
          qty: fmtQty(adjSqft),
          rate: fmtNumber(labRate, 2),
          total: fmtNumber(adjSqft * labRate, 2),
        })
      }
    })
  } else if (q.adjusted_sqft > 0) {
    const matRate = Number(q.material_cost_per_sqft) || 0
    const labRate = Number(q.labor_cost_per_sqft) || 0
    const materialDesc = q.material_description?.trim() || fallbackDescription(q)
    // Material row
    rows.push({
      description: materialDesc,
      qty: fmtQty(q.adjusted_sqft),
      rate: fmtNumber(matRate, 2),
      total: fmtNumber(Number(q.material_total) || q.adjusted_sqft * matRate, 2),
    })
    // Labor row
    if (labRate > 0) {
      rows.push({
        description: 'Labor / installation',
        qty: fmtQty(q.adjusted_sqft),
        rate: fmtNumber(labRate, 2),
        total: fmtNumber(Number(q.labor_total) || q.adjusted_sqft * labRate, 2),
      })
    }
  }

  // Quote line items.
  lineItems.forEach((li) => {
    const qty = Number(li.qty) || 0
    const rate = Number(li.unit_price) || 0
    const total = Number(li.total) || qty * rate
    rows.push({
      description: li.description?.trim() || '—',
      qty: qty > 0 ? fmtQty(qty) : '',
      rate: fmtNumber(rate, 2),
      total: fmtNumber(total, 2),
    })
  })

  // Fixed extras.
  if (q.removal_fee > 0) {
    rows.push({
      description: 'Removal of existing flooring',
      rate: fmtNumber(q.removal_fee, 2),
      total: fmtNumber(q.removal_fee, 2),
    })
  }
  if (q.furniture_fee > 0) {
    rows.push({
      description: 'Furniture moving',
      rate: fmtNumber(q.furniture_fee, 2),
      total: fmtNumber(q.furniture_fee, 2),
    })
  }
  if (q.stairs_fee > 0) {
    const count = q.stair_count && q.stair_count > 0 ? q.stair_count : null
    const perUnit = count ? q.stairs_fee / count : q.stairs_fee
    rows.push({
      description: count ? `Stairs (${count})` : 'Stairs',
      qty: count ? String(count) : '',
      rate: fmtNumber(perUnit, 2),
      total: fmtNumber(q.stairs_fee, 2),
    })
  }
  if (q.quarter_round_fee > 0) {
    rows.push({
      description: 'Quarter round / moldings',
      rate: fmtNumber(q.quarter_round_fee, 2),
      total: fmtNumber(q.quarter_round_fee, 2),
    })
  }
  if (q.reducers_fee > 0) {
    rows.push({
      description: 'Reducers / saddles',
      rate: fmtNumber(q.reducers_fee, 2),
      total: fmtNumber(q.reducers_fee, 2),
    })
  }
  if (q.delivery_fee > 0) {
    rows.push({
      description: 'Delivery',
      rate: fmtNumber(q.delivery_fee, 2),
      total: fmtNumber(q.delivery_fee, 2),
    })
  }
  if (q.custom_fee_amount > 0 && q.custom_fee_label?.trim()) {
    rows.push({
      description: q.custom_fee_label.trim(),
      rate: fmtNumber(q.custom_fee_amount, 2),
      total: fmtNumber(q.custom_fee_amount, 2),
    })
  }

  // extras_json items.
  const ex = (q.extras_json || {}) as Record<string, number>
  if (ex.subfloor_prep > 0) {
    rows.push({
      description: 'Subfloor prep',
      rate: fmtNumber(ex.subfloor_prep, 2),
      total: fmtNumber(ex.subfloor_prep, 2),
    })
  }
  if (ex.underlayment_per_sqft > 0 && q.adjusted_sqft > 0) {
    const total = ex.underlayment_per_sqft * q.adjusted_sqft
    rows.push({
      description: 'Underlayment',
      qty: fmtQty(q.adjusted_sqft),
      rate: fmtNumber(ex.underlayment_per_sqft, 2),
      total: fmtNumber(total, 2),
    })
  }
  if (ex.transition_qty > 0 && ex.transition_unit > 0) {
    const total = ex.transition_qty * ex.transition_unit
    rows.push({
      description: 'Transition strips',
      qty: fmtQty(ex.transition_qty),
      rate: fmtNumber(ex.transition_unit, 2),
      total: fmtNumber(total, 2),
    })
  }
  if (ex.floor_protection > 0) {
    rows.push({
      description: 'Floor protection',
      rate: fmtNumber(ex.floor_protection, 2),
      total: fmtNumber(ex.floor_protection, 2),
    })
  }
  if (ex.disposal_fee > 0) {
    rows.push({
      description: 'Disposal / dump fee',
      rate: fmtNumber(ex.disposal_fee, 2),
      total: fmtNumber(ex.disposal_fee, 2),
    })
  }

  // Inline signature row at end of items table.
  rows.push({
    description:
      'READ CAREFULLY SIGN & EMAIL BACK________________________  Date____________',
    isSignature: true,
  })

  const showSubtotal =
    (q.tax_enabled && q.tax_amount > 0) || q.markup_amount > 0
  const showDeposit = q.deposit_pct > 0 && q.deposit_amount > 0

  const dateStr = new Date(q.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            {settings?.logo_url ? (
              <Image src={settings.logo_url} style={styles.logoImg} />
            ) : null}
            <View style={styles.companyTextCol}>
              <Text style={styles.companyName}>
                {settings?.company_name || 'Flooring Company'}
              </Text>
              {settings?.phone ? (
                <Text style={styles.companyDetail}>T: {settings.phone}</Text>
              ) : null}
              {settings?.email ? (
                <Text style={styles.companyDetail}>{settings.email}</Text>
              ) : null}
              {settings?.website ? (
                <Text style={styles.companyDetail}>{settings.website}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.estimateBlock}>
            <Text style={styles.estimateTitle}>Estimate</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.metaCell,
                    styles.metaCellLabel,
                    styles.metaCellDivider,
                    styles.metaCellBottomDivider,
                  ]}
                >
                  Date
                </Text>
                <Text style={[styles.metaCell, styles.metaCellBottomDivider]}>
                  {dateStr}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text
                  style={[
                    styles.metaCell,
                    styles.metaCellLabel,
                    styles.metaCellDivider,
                  ]}
                >
                  Estimate #
                </Text>
                <Text style={styles.metaCell}>{q.quote_number || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer + Job boxes */}
        <View style={styles.boxesRow}>
          <View style={styles.box}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxHeaderText}>Customer Name</Text>
            </View>
            <View style={styles.boxBody}>
              <Text style={styles.boxBodyText}>{q.customer_name}</Text>
              {q.customer_phone ? (
                <Text style={styles.boxBodyText}>{q.customer_phone}</Text>
              ) : null}
              {q.customer_email ? (
                <Text style={styles.boxBodyText}>{q.customer_email}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.box}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxHeaderText}>Job Location</Text>
            </View>
            <View style={styles.boxBody}>
              {q.job_address ? (
                <Text style={styles.boxBodyText}>{q.job_address}</Text>
              ) : (
                <Text style={styles.boxBodyText}>—</Text>
              )}
            </View>
          </View>
        </View>

        {/* Items table */}
        <View style={styles.itemsTable}>
          <View style={styles.itemsHeaderRow}>
            <Text style={[styles.itemsHeaderCell, styles.cellDescription, { textAlign: 'center' }]}>
              Description
            </Text>
            <Text style={[styles.itemsHeaderCell, styles.cellHeaderQty]}>Qty</Text>
            <Text style={[styles.itemsHeaderCell, styles.cellHeaderRate]}>Rate</Text>
            <Text style={[styles.itemsHeaderCell, styles.cellHeaderTotal]}>Total</Text>
          </View>

          {rows.map((row, i) => (
            <View key={i} style={styles.itemsRow}>
              <Text style={[styles.itemsCell, styles.cellDescription]}>
                {row.description}
              </Text>
              <Text style={[styles.itemsCell, styles.cellQty]}>
                {row.qty ?? ''}
              </Text>
              <Text style={[styles.itemsCell, styles.cellRate]}>
                {row.rate ?? ''}
              </Text>
              <Text style={[styles.itemsCell, styles.cellTotal]}>
                {row.total ?? ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Bottom row: scope/notes left, totals right */}
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
                <Text style={styles.totalsValue}>{fmtMoney(q.subtotal)}</Text>
              </View>
            ) : null}
            {q.tax_enabled && q.tax_amount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({q.tax_pct}%)</Text>
                <Text style={styles.totalsValue}>{fmtMoney(q.tax_amount)}</Text>
              </View>
            ) : null}
            {q.markup_amount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Profit ({q.markup_pct}%)</Text>
                <Text style={styles.totalsValue}>{fmtMoney(q.markup_amount)}</Text>
              </View>
            ) : null}

            <View style={styles.totalRowBox}>
              <Text style={styles.totalLabelLg}>Total</Text>
              <View style={styles.totalValueBox}>
                <Text style={styles.totalValueText}>{fmtMoney(q.final_total)}</Text>
              </View>
            </View>

            {showDeposit ? (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>
                    Deposit Due ({q.deposit_pct}%)
                  </Text>
                  <Text style={styles.totalsValue}>
                    {fmtMoney(q.deposit_amount)}
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

        {/* Disclaimer footer */}
        {terms.length > 0 ? (
          <View style={styles.disclaimerFooter}>
            {terms.map((t, i) => (
              <Text key={i} style={styles.disclaimerLine}>
                {t}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  )
}
