import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdfDocument } from '@/components/QuotePdf'
import type { Quote, QuoteRoom, CompanySettings } from '@/lib/types'
import React from 'react'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: membership } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return new NextResponse('No company', { status: 404 })

  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .eq('company_id', membership.company_id)
    .single()

  if (!quote) return new NextResponse('Not found', { status: 404 })

  const { data: rooms } = await supabase
    .from('quote_rooms')
    .select('*')
    .eq('quote_id', id)
    .order('id')

  const { data: settings } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', membership.company_id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotePdfDocument as any, {
    quote: quote as Quote,
    rooms: (rooms as QuoteRoom[]) || [],
    settings: settings as CompanySettings | null,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer: Buffer = await (renderToBuffer as any)(element)

  const safeCustomerName = (quote as Quote).customer_name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="estimate-${safeCustomerName}.pdf"`,
    },
  })
}
