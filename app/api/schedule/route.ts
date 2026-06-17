export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { publishScheduledPost } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function GET() {
  try {
    const { data: posts } = await supabaseAdmin
      .from('content_queue')
      .select('id, post_code, client_id, platforms, content_type, scheduled_at, status, copy_vi, copy_en')
      .in('status', ['scheduled', 'approved'])
      .order('scheduled_at', { ascending: true })

    return NextResponse.json({ ok: true, posts: posts || [] })
  } catch (error: any) {
    log('API_SCHEDULE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const result = await publishScheduledPost(postId)
    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    log('API_SCHEDULE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
