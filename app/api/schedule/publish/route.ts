import { NextRequest, NextResponse } from 'next/server'
import { publishScheduledPost } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const result = await publishScheduledPost(postId)
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    log('API_SCHEDULE_PUBLISH', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
