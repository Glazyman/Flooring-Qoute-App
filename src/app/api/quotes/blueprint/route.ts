import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { isAdminUser } from '@/lib/admin'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = isAdminUser(user)

  // Gate AI blueprint scan on Pro tier (admins bypass)
  if (!isAdmin) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (membership) {
      const { data: company } = await supabase
        .from('companies')
        .select('subscription_status, stripe_price_id')
        .eq('id', membership.company_id)
        .single()

      const isSubscribed =
        company?.subscription_status === 'active' ||
        company?.subscription_status === 'trialing'

      const proPriceIds = new Set([
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
      ].filter(Boolean))

      const companyPriceId = company?.stripe_price_id ?? null
      const isOnPro = isSubscribed && companyPriceId !== null && proPriceIds.has(companyPriceId)

      if (!isOnPro) {
        return NextResponse.json(
          { error: 'AI blueprint scanning requires a Pro plan. Please upgrade.' },
          { status: 403 }
        )
      }
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const { text } = await generateText({
      model: openai('o3'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: 'text',
              text: `You are a FLOORING estimator. You will be shown a single page from a construction document set.

STEP 1 — DETERMINE RELEVANCE:
First decide if this page is relevant to FLOORING work. A page IS relevant if it shows:
- A floor plan with room dimensions (room outlines with feet/inches measurements)
- A measurement/take-off sheet listing rooms with dimensions or sqft
- Material schedules that reference flooring (hardwood, LVT/LVP, vinyl, tile, carpet, laminate, engineered, etc.)
- Pages with headers like "FLOORING PLAN", "FINISH SCHEDULE", "ROOM FINISH", "HARDWOOD", "FLOOR FINISH"

A page is NOT relevant (and you must return zero rooms) if it shows:
- Roofing plans, framing/structural drawings, electrical/plumbing/HVAC, fence layouts, exterior elevations,
  site plans, foundation plans, demolition plans, painting schedules, cabinet/millwork, landscaping,
  cover sheets, index/sheet list pages, general notes only, or any non-flooring trade.

If the page is NOT a flooring page: return { "rooms": [], "totalSqft": 0, "notes": "", "isFlooringPage": false, "pageType": "<short description, e.g. 'Roofing plan' or 'Cover sheet'>" }

STEP 2 — EXTRACT ROOMS (only if relevant):
- Measurements are in feet and inches. Superscript/raised numbers are inches (e.g. "17³" = 17 ft 3 in, "7x4⁶" = 7 ft × 4 ft 6 in).
- Calculate sqft as: (lengthFt + lengthIn/12) × (widthFt + widthIn/12), round to 1 decimal.
- Group rooms by area: Upstairs, Downstairs, Kitchen, Foyer, or Other.
- If you see column headers like UPSTAIRS, DOWNSTAIRS, KITCHEN on the sheet, use those.

Return ONLY valid JSON in this exact format (no markdown, no code block):
{
  "isFlooringPage": true,
  "pageType": "Floor plan",
  "rooms": [
    {
      "name": "Room name or empty string",
      "section": "Upstairs",
      "lengthFt": 17,
      "lengthIn": 3,
      "widthFt": 17,
      "widthIn": 3,
      "sqft": 297.0
    }
  ],
  "totalSqft": 297.0,
  "notes": "Any notes from the sheet, or empty string"
}`,
            },
          ],
        },
      ],
    })

    // Parse the JSON response
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Blueprint analysis error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    )
  }
}
