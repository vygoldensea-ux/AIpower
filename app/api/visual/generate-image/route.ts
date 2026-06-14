import { NextRequest, NextResponse } from 'next/server'
import { generateVisual } from '@/lib/modules/module3-visual-engine'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    log('API_VISUAL_GENERATE', 'info', `Generating visual for post ${postId}`)
    await generateVisual(postId)

    return NextResponse.json({ ok: true, postId })
  } catch (error: any) {
    log('API_VISUAL_GENERATE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
