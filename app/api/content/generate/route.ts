export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/modules/module2-content-brain'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientId, platforms, contentType, topic } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    log('API_CONTENT_GENERATE', 'info', `Generating content for client ${clientId}`)

    const results = await generateContent({
      clientId,
      platforms: platforms || ['facebook'],
      contentType: contentType || 'regular',
      topic,
    })

    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    log('API_CONTENT_GENERATE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
