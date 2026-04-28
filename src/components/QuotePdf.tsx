import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { Quote, QuoteRoom, QuoteLineItem, CompanySettings } from '@/lib/types'
import { flooringTypeLabel } from '@/lib/flooringLabels'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  estimateTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  estimateDate: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: '#0f172a',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginVertical: 8,
  },
  heavyDivider: {
    borderTopWidth: 2,
    borderTopColor: '#0f172a',
    marginVertical: 8,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  lineLabel: {
    color: '#475569',
    fontSize: 10,
  },
  lineValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  depositBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  depositLabel: {
    fontSize: 10,
    color: '#1d4ed8',
    fontFamily: 'Helvetica-Bold',
  },
  depositValue: {
    fontSize: 10,
    color: '#1d4ed8',
    fontFamily: 'Helvetica-Bold',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#475569',
  },
  balanceValue: {
    fontSize: 10,
    color: '#475569',
  },
  notesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    padding: 10,
    marginTop: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
  },
  itemsTableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginTop: 4,
    marginBottom: 2,
  },
  itemsTableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemsTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemsTableCell: {
    fontSize: 9.5,
    color: '#0f172a',
  },
  scopeBox: {
    backgroundColor: '#fef3c7',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    borderRadius: 4,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  scopeTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  scopeText: {
    fontSize: 10,
    color: '#0f172a',
    lineHeight: 1.5,
  },
  termsList: {
    marginTop: 4,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  termBullet: {
    fontSize: 9,
    color: '#475569',
    marginRight: 6,
    width: 8,
  },
  termText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.45,
    flex: 1,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    height: 24,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signatureNameCol: {
    flex: 3,
  },
  signatureDateCol: {
    flex: 1,
  },
})

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
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

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            {settings?.logo_url && (
              <Image
                src={settings.logo_url}
                style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }}
              />
            )}
            <View>
              <Text style={styles.companyName}>
                {settings?.company_name || 'Flooring Company'}
              </Text>
              {settings?.phone && (
                <Text style={styles.companyDetail}>{settings.phone}</Text>
              )}
              {settings?.email && (
                <Text style={styles.companyDetail}>{settings.email}</Text>
              )}
              {settings?.website && (
                <Text style={styles.companyDetail}>{settings.website}</Text>
              )}
            </View>
          </View>
          <View>
            <Text style={styles.estimateTitle}>ESTIMATE</Text>
            <Text style={styles.estimateDate}>
              Date: {new Date(q.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.estimateDate}>Valid for {q.valid_days} days</Text>
          </View>
        </View>

        {/* Customer & Project Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer & Project</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{q.customer_name}</Text>
            </View>
            {q.customer_phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{q.customer_phone}</Text>
              </View>
            )}
            {q.customer_email && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{q.customer_email}</Text>
              </View>
            )}
            {q.job_address && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Job Address</Text>
                <Text style={styles.infoValue}>{q.job_address}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Flooring Type</Text>
              <Text style={styles.infoValue}>
                {flooringTypeLabel(q.flooring_type, q.section_flooring_types)}
              </Text>
            </View>
            {q.wood_species && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Wood Species</Text>
                <Text style={styles.infoValue}>{q.wood_species}</Text>
              </View>
            )}
            {q.finish_type && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Finish</Text>
                <Text style={styles.infoValue}>{q.finish_type}</Text>
              </View>
            )}
            {q.stair_count != null && q.stair_count > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Stairs</Text>
                <Text style={styles.infoValue}>{q.stair_count} stairs</Text>
              </View>
            )}
          </View>
        </View>

        {/* Measurements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Base Square Footage</Text>
              <Text style={styles.infoValue}>{q.base_sqft.toLocaleString()} sqft</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Waste Factor</Text>
              <Text style={styles.infoValue}>{q.waste_pct}%</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Adjusted Square Footage</Text>
              <Text style={styles.infoValue}>{q.adjusted_sqft.toFixed(0)} sqft</Text>
            </View>
          </View>

          {rooms && rooms.length > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.infoLabel, { marginBottom: 4 }]}>Room Details</Text>
              {rooms.map((room, i) => (
                <View key={room.id} style={[styles.lineRow, { paddingVertical: 2 }]}>
                  <Text style={styles.lineLabel}>{room.name || `Room ${i + 1}`}</Text>
                  <Text style={styles.lineLabel}>
                    {room.length} × {room.width} ft = {room.sqft.toFixed(0)} sqft
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimate Breakdown</Text>

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>
              Material ({q.adjusted_sqft.toFixed(0)} sqft × ${q.material_cost_per_sqft}/sqft)
            </Text>
            <Text style={styles.lineValue}>{fmt(q.material_total)}</Text>
          </View>

          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>
              Labor ({q.adjusted_sqft.toFixed(0)} sqft × ${q.labor_cost_per_sqft}/sqft)
            </Text>
            <Text style={styles.lineValue}>{fmt(q.labor_total)}</Text>
          </View>

          {q.removal_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Removal Fee</Text>
              <Text style={styles.lineValue}>{fmt(q.removal_fee)}</Text>
            </View>
          )}
          {q.furniture_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Furniture Moving</Text>
              <Text style={styles.lineValue}>{fmt(q.furniture_fee)}</Text>
            </View>
          )}
          {q.stairs_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>
                Stairs{q.stair_count ? ` (${q.stair_count})` : ''}
              </Text>
              <Text style={styles.lineValue}>{fmt(q.stairs_fee)}</Text>
            </View>
          )}
          {q.quarter_round_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Quarter Round / Moldings</Text>
              <Text style={styles.lineValue}>{fmt(q.quarter_round_fee)}</Text>
            </View>
          )}
          {q.reducers_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Reducers / Saddles</Text>
              <Text style={styles.lineValue}>{fmt(q.reducers_fee)}</Text>
            </View>
          )}
          {q.delivery_fee > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Delivery Fee</Text>
              <Text style={styles.lineValue}>{fmt(q.delivery_fee)}</Text>
            </View>
          )}
          {q.custom_fee_amount > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>{q.custom_fee_label || 'Other'}</Text>
              <Text style={styles.lineValue}>{fmt(q.custom_fee_amount)}</Text>
            </View>
          )}
          {(() => {
            const ex = (q.extras_json || {}) as Record<string, number>
            const lines: { label: string; value: number }[] = []
            if (ex.subfloor_prep > 0) lines.push({ label: 'Subfloor Prep', value: ex.subfloor_prep })
            if (ex.underlayment_per_sqft > 0) lines.push({ label: `Underlayment ($${ex.underlayment_per_sqft}/sqft)`, value: ex.underlayment_per_sqft * q.adjusted_sqft })
            if (ex.transition_qty > 0 && ex.transition_unit > 0) lines.push({ label: `Transition Strips (${ex.transition_qty} × $${ex.transition_unit})`, value: ex.transition_qty * ex.transition_unit })
            if (ex.floor_protection > 0) lines.push({ label: 'Floor Protection', value: ex.floor_protection })
            if (ex.disposal_fee > 0) lines.push({ label: 'Disposal / Dump Fee', value: ex.disposal_fee })
            return lines.map((it, i) => (
              <View key={i} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{it.label}</Text>
                <Text style={styles.lineValue}>{fmt(it.value)}</Text>
              </View>
            ))
          })()}

          {/* Additional line items table */}
          {lineItems.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Additional Line Items</Text>
              <View style={styles.itemsTableHeader}>
                <Text style={[styles.itemsTableHeaderCell, { flex: 5 }]}>Description</Text>
                <Text style={[styles.itemsTableHeaderCell, { flex: 1, textAlign: 'right' }]}>Qty</Text>
                <Text style={[styles.itemsTableHeaderCell, { flex: 2, textAlign: 'right' }]}>Rate</Text>
                <Text style={[styles.itemsTableHeaderCell, { flex: 2, textAlign: 'right' }]}>Total</Text>
              </View>
              {lineItems.map((li) => {
                const qty = Number(li.qty) || 0
                const rate = Number(li.unit_price) || 0
                const total = Number(li.total) || qty * rate
                return (
                  <View key={li.id} style={styles.itemsTableRow}>
                    <Text style={[styles.itemsTableCell, { flex: 5 }]}>{li.description || '—'}</Text>
                    <Text style={[styles.itemsTableCell, { flex: 1, textAlign: 'right' }]}>{qty}</Text>
                    <Text style={[styles.itemsTableCell, { flex: 2, textAlign: 'right' }]}>{fmt(rate)}</Text>
                    <Text style={[styles.itemsTableCell, { flex: 2, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{fmt(total)}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Scope of Work / Exclusions — prominent block above the totals */}
          {q.scope_of_work && q.scope_of_work.trim() && (
            <View style={styles.scopeBox}>
              <Text style={styles.scopeTitle}>Scope of Work / Exclusions</Text>
              <Text style={styles.scopeText}>{q.scope_of_work.trim()}</Text>
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.lineRow}>
            <Text style={[styles.lineLabel, { fontFamily: 'Helvetica-Bold' }]}>Subtotal</Text>
            <Text style={styles.lineValue}>{fmt(q.subtotal)}</Text>
          </View>

          {q.tax_enabled && q.tax_amount > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Tax ({q.tax_pct}%)</Text>
              <Text style={styles.lineValue}>{fmt(q.tax_amount)}</Text>
            </View>
          )}
          {q.markup_amount > 0 && (
            <View style={styles.lineRow}>
              <Text style={styles.lineLabel}>Profit ({q.markup_pct}%)</Text>
              <Text style={styles.lineValue}>{fmt(q.markup_amount)}</Text>
            </View>
          )}

          <View style={styles.heavyDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{fmt(q.final_total)}</Text>
          </View>

          <View style={styles.depositBox}>
            <View style={styles.depositRow}>
              <Text style={styles.depositLabel}>Deposit Due ({q.deposit_pct}%)</Text>
              <Text style={styles.depositValue}>{fmt(q.deposit_amount)}</Text>
            </View>
            <View style={styles.depositRow}>
              <Text style={styles.balanceLabel}>Remaining Balance</Text>
              <Text style={styles.balanceValue}>{fmt(remainingBalance)}</Text>
            </View>
          </View>
        </View>

        {/* Terms & Disclaimers */}
        {terms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms &amp; Disclaimers</Text>
            <View style={styles.termsList}>
              {terms.map((t, i) => (
                <View key={i} style={styles.termItem}>
                  <Text style={styles.termBullet}>{'\u2022'}</Text>
                  <Text style={styles.termText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Payment Terms */}
        {settings?.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Terms</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{settings.payment_terms}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {q.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{q.notes}</Text>
            </View>
          </View>
        )}

        {/* Signature block */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureRow}>
              <View style={styles.signatureNameCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Customer Signature</Text>
              </View>
              <View style={styles.signatureDateCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureRow}>
              <View style={styles.signatureNameCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Authorized Representative</Text>
              </View>
              <View style={styles.signatureDateCol}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This estimate is valid for {q.valid_days} days from the date issued.
          </Text>
          <Text style={styles.footerText}>
            {settings?.company_name || 'Flooring Company'}
            {settings?.website ? ` · ${settings.website}` : ''} — Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  )
}
