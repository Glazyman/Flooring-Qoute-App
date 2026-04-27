import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

const RoomSchema = z.object({
  rooms: z.array(
    z.object({
      name: z.string().describe('Room name, e.g. "Living Room", "Master Bedroom"'),
      section: z.string().describe('Section of house: Upstairs, Downstairs, Kitchen, Foyer, or Other'),
      lengthFt: z.number().describe('Length in whole feet'),
      lengthIn: z.number().describe('Length remaining inches (0-11)'),
      widthFt: z.number().describe('Width in whole feet'),
      widthIn: z.number().describe('Width remaining inches (0-11)'),
      sqft: z.number().describe('Calculated square footage'),
      notes: z.string().optional().describe('Any notes about this room'),
    })
  ),
  totalSqft: z.number().describe('Total square footage of all rooms'),
  notes: z.string().optional().describe('Any general notes found on the blueprint or measurement sheet'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your environment variables.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: RoomSchema,
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
              text: `You are a flooring estimator assistant. Analyze this floor plan or measurement sheet and extract all room dimensions.

Rules:
- Measurements are in feet and inches. Superscript numbers or numbers after a dash represent inches (e.g. "17³" or "17-3" means 17 feet 3 inches).
- For each room, calculate sqft as: (lengthFt + lengthIn/12) × (widthFt + widthIn/12), rounded to nearest whole number.
- Group rooms by section: Upstairs, Downstairs, Kitchen, Foyer, or Other.
- If measurements are written as "LxW=sqft" (e.g. "17x17³=289"), use the sqft value shown.
- If you see a hand-written measurement sheet with columns like "UPSTAIRS", "DOWNSTAIRS", "KITCHEN", organize accordingly.
- Extract any notes (e.g. "2 back rooms not getting wood", stair count, special materials).
- Sum all sqft for totalSqft.

Be precise with the measurements you can read. If a number is unclear, make your best interpretation.`,
            },
          ],
        },
      ],
    })

    return NextResponse.json(object)
  } catch (err) {
    console.error('Blueprint analysis error:', err)
    return NextResponse.json(
      { error: 'Failed to analyze image. Make sure it is a clear photo of a floor plan or measurement sheet.' },
      { status: 500 }
    )
  }
}
