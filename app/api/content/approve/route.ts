import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { schedulePost } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { postId, scheduledAt } = await req.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    await supabaseAdmin
      .from('content_queue')
      .update({ status: 'approved' })
      .eq('id', postId)

    if (scheduledAt) {
      await schedulePost(postId, scheduledAt)
    }

    log('API_APPROVE', 'success', `Post ${postId} approved${scheduledAt ? ` → scheduled for ${scheduledAt}` : ''}`)
    return NextResponse.json({ ok: true, postId, scheduledAt })
  } catch (error: any) {
    log('API_APPROVE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
