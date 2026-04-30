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
      model: openai('o4-mini'),
      maxOutputTokens: 16384,
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
        },
      },
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
              text: `You are an expert flooring take-off estimator. You receive ONE raster image (one PDF page): a floor plan, finish schedule, or measurement sheet.

STEP 1 — IS THIS PAGE RELEVANT TO FLOORING?
Relevant YES if ANY of:
- Architectural floor plan with room outlines (dimensions optional but preferred)
- Room/finish schedule TABLE listing rooms with sq ft or dimensions
- Flooring material notes tied to numbered rooms or labels

Relevant YES even if many small rooms (baths, closets, halls) or if the sheet mixes bedroom + bath blocks.

Relevant NO only for non-layout trades with no enumerable rooms: pure roof/framing/HVAC schematic, electrical-only, site plan, fence detail, elevation with no floor areas, cover sheet/index, notes-only.

If NOT relevant: return exactly: { "rooms": [], "totalSqft": 0, "notes": "", "isFlooringPage": false, "pageType": "<short label>" }

STEP 2 — EXTRACT EVERY ROOM-SIZED SPACE (critical)
Goal: completeness. Missing a bathroom or half-bath on a residential plan is a failure.

Procedure (do this mentally before writing JSON):
A) Scan the image in a grid (top-left to bottom-right). List every DISTINCT space that has OR should have flooring: BR, BDRM, MASTER, SUITE, KIT, LR, DR, FAM, DEN, OFFICE, LAUNDRY, MECH, UTILITY, HALL, FOYER, ENTRY, PANTRY, WIC, CLOSET, STOR, MUDROOM, GAR (if interior finish implied), decks only if labeled as finished interior (usually skip exterior decks).
B) Bathrooms — NEVER skip these. Match ANY label: BATH, FULL BATH, SHR (shower room), POWDER, 1/2 BATH, HALF BATH, WC, REST, ENS, ENSUITE, PR, MASTER BATH, HALL BATH, JACK & JILL (split into separate bath entries if two closed toilet/bath zones with different dimensions; if one shared wet area, one row is OK but prefer separate if dimensions differ).
C) Nested spaces: If "MASTER SUITE" encloses bedroom + bathroom polygons, output ONE row per closed polygon that has its own label OR its own rectangular outline, not one combined row unless only a single dimension covers the whole suite.
D) Dimensions: US plans use feet + inches. Superscripts and small raised numbers are INCHES (e.g. 12'6" x 10'3" → lengthFt 12 lengthIn 6, widthFt 10 widthIn 3). Dimension strings along one wall often apply to that segment; infer the perpendicular from opposite wall if shown. If ONLY one L×W pair exists inside a labeled room bubble, use it for that room.
E) Tables: If a ROOM SCHEDULE / FINISH PLAN table exists, add one JSON room per DATA ROW (merge with plan if same name; if table has sqft only, convert to equivalent L×W only if implied, else use rough square assumption: sqrt(sqft) for both dimensions in feet as last resort and note in "notes").
F) sqft field: (lengthFt + lengthIn/12) * (widthFt + widthIn/12), rounded to one decimal. totalSqft = sum of room sqfts you output.

SELF-CHECK before returning: Count labeled bedrooms and bathrooms visible. Your "rooms" array should include AT LEAST every full bath and half bath you can see boundaries or labels for. If you listed 3 baths visually and only output 2, fix it.

Return ONLY valid JSON (no markdown, no code fences):
{
  "isFlooringPage": true,
  "pageType": "Floor plan",
  "rooms": [
    {
      "name": "string (use plan label e.g. Hall Bath, Powder Room)",
      "section": "Main Floor or Upstairs etc.",
      "lengthFt": 0,
      "lengthIn": 0,
      "widthFt": 0,
      "widthIn": 0,
      "sqft": 0.0
    }
  ],
  "totalSqft": 0.0,
  "notes": "string"
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
